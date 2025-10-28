import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const archive = await prisma.archive.findUnique({
      where: {
        id: resolvedParams.id,
        status: "ACTIVE", // Only show active archives to public
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        curatedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            comments: true,
            favorites: true,
            playbackProgress: true,
          },
        },
      },
    });

    if (!archive) {
      return NextResponse.json({ error: "Archive not found" }, { status: 404 });
    }

    // Transform data for public consumption
    const transformedArchive = {
      id: archive.id,
      title: archive.title,
      slug: archive.slug,
      description: archive.description,
      host: archive.host || `${archive.createdBy.firstName} ${archive.createdBy.lastName}`,
      guests: archive.guests,
      category: archive.category,
      type: archive.type.toLowerCase(),
      duration: archive.duration,
      fileSize: archive.fileSize,
      playCount: archive.playCount,
      likeCount: archive.likeCount,
      shareCount: archive.shareCount,
      audioFile: archive.audioFile,
      downloadUrl: archive.isDownloadable ? archive.downloadUrl : null,
      coverImage: archive.coverImage,
      thumbnailImage: archive.thumbnailImage,
      originalAirDate: archive.originalAirDate,
      archivedDate: archive.archivedDate,
      isDownloadable: archive.isDownloadable,
      isFeatured: archive.isFeatured,
      isExclusive: archive.isExclusive,
      accessLevel: archive.accessLevel,
      tags: archive.tags ? JSON.parse(archive.tags) : [],
      metadata: archive.metadata ? JSON.parse(archive.metadata) : null,
      transcript: archive.transcript,
      transcriptFile: archive.transcriptFile,
      qualityVariants: archive.qualityVariants ? JSON.parse(archive.qualityVariants) : [],
      createdAt: archive.createdAt,
      updatedAt: archive.updatedAt,
      createdBy: {
        name: `${archive.createdBy.firstName} ${archive.createdBy.lastName}`,
      },
      curatedBy: archive.curatedBy ? {
        name: `${archive.curatedBy.firstName} ${archive.curatedBy.lastName}`,
      } : null,
      stats: {
        commentsCount: archive._count.comments,
        favoritesCount: archive._count.favorites,
        progressCount: archive._count.playbackProgress,
      },
    };

    return NextResponse.json(transformedArchive);
  } catch (error) {
    console.error("Error fetching archive:", error);
    return NextResponse.json(
      { error: "Failed to fetch archive" },
      { status: 500 }
    );
  }
}

// Track play count when archive is accessed
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { action } = await request.json();

    if (action === "track_play") {
      const archive = await prisma.archive.findUnique({
        where: {
          id: resolvedParams.id,
          status: "ACTIVE",
        },
      });

      if (!archive) {
        return NextResponse.json({ error: "Archive not found" }, { status: 404 });
      }

      // Increment play count
      await prisma.archive.update({
        where: { id: resolvedParams.id },
        data: {
          playCount: {
            increment: 1,
          },
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error tracking archive play:", error);
    return NextResponse.json(
      { error: "Failed to track play" },
      { status: 500 }
    );
  }
}