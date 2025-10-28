import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { staffOnly } from "@/lib/auth/staffOnly";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await staffOnly(user);
    const resolvedParams = await params;

    const archive = await prisma.archive.findUnique({
      where: { id: resolvedParams.id },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        curatedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        podcast: {
          select: {
            id: true,
            title: true,
          },
        },
        audiobook: {
          select: {
            id: true,
            title: true,
          },
        },
        broadcast: {
          select: {
            id: true,
            title: true,
          },
        },
        episode: {
          select: {
            id: true,
            title: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        favorites: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            staff: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        _count: {
          select: {
            comments: true,
            favorites: true,
            playbackProgress: true,
            bookmarks: true,
            reviews: true,
          },
        },
      },
    });

    if (!archive) {
      return NextResponse.json({ error: "Archive not found" }, { status: 404 });
    }

    // Parse JSON fields
    const response = {
      ...archive,
      tags: archive.tags ? JSON.parse(archive.tags) : [],
      metadata: archive.metadata ? JSON.parse(archive.metadata) : null,
      qualityVariants: archive.qualityVariants ? JSON.parse(archive.qualityVariants) : [],
      stats: {
        commentsCount: archive._count.comments,
        favoritesCount: archive._count.favorites,
        progressCount: archive._count.playbackProgress,
        bookmarksCount: archive._count.bookmarks,
        reviewsCount: archive._count.reviews,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching archive:", error);
    return NextResponse.json(
      { error: "Failed to fetch archive" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await staffOnly(user);
    const resolvedParams = await params;

    const data = await request.json();

    // Check if archive exists
    const existingArchive = await prisma.archive.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingArchive) {
      return NextResponse.json({ error: "Archive not found" }, { status: 404 });
    }

    const {
      title,
      description,
      host,
      guests,
      category,
      type,
      status,
      duration,
      fileSize,
      audioFile,
      downloadUrl,
      coverImage,
      thumbnailImage,
      originalAirDate,
      isDownloadable,
      isFeatured,
      isExclusive,
      accessLevel,
      tags,
      metadata,
      transcript,
      transcriptFile,
      qualityVariants,
      // Relations
      podcastId,
      audiobookId,
      broadcastId,
      episodeId,
    } = data;

    // Generate new slug if title changed
    let slug = existingArchive.slug;
    if (title && title !== existingArchive.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Ensure slug is unique
      let uniqueSlug = slug;
      let counter = 1;
      
      while (await prisma.archive.findFirst({ 
        where: { 
          slug: uniqueSlug,
          NOT: { id: resolvedParams.id }
        } 
      })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      slug = uniqueSlug;
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided
    if (title !== undefined) updateData.title = title;
    if (slug !== existingArchive.slug) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (host !== undefined) updateData.host = host;
    if (guests !== undefined) updateData.guests = guests;
    if (category !== undefined) updateData.category = category;
    if (type !== undefined) updateData.type = type.toUpperCase();
    if (status !== undefined) updateData.status = status.toUpperCase();
    if (duration !== undefined) updateData.duration = duration;
    if (fileSize !== undefined) updateData.fileSize = fileSize;
    if (audioFile !== undefined) updateData.audioFile = audioFile;
    if (downloadUrl !== undefined) updateData.downloadUrl = downloadUrl;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (thumbnailImage !== undefined) updateData.thumbnailImage = thumbnailImage;
    if (originalAirDate !== undefined) updateData.originalAirDate = originalAirDate ? new Date(originalAirDate) : null;
    if (isDownloadable !== undefined) updateData.isDownloadable = isDownloadable;
    if (isFeatured !== undefined) {
      updateData.isFeatured = isFeatured;
      updateData.curatedById = isFeatured ? user.id : null;
    }
    if (isExclusive !== undefined) updateData.isExclusive = isExclusive;
    if (accessLevel !== undefined) updateData.accessLevel = accessLevel;
    if (tags !== undefined) updateData.tags = tags ? JSON.stringify(tags) : null;
    if (metadata !== undefined) updateData.metadata = metadata ? JSON.stringify(metadata) : null;
    if (transcript !== undefined) updateData.transcript = transcript;
    if (transcriptFile !== undefined) updateData.transcriptFile = transcriptFile;
    if (qualityVariants !== undefined) updateData.qualityVariants = qualityVariants ? JSON.stringify(qualityVariants) : null;

    // Relations - handle empty strings as null to avoid foreign key constraint errors
    if (podcastId !== undefined) updateData.podcastId = podcastId === "" ? null : podcastId;
    if (audiobookId !== undefined) updateData.audiobookId = audiobookId === "" ? null : audiobookId;
    if (broadcastId !== undefined) updateData.broadcastId = broadcastId === "" ? null : broadcastId;
    if (episodeId !== undefined) updateData.episodeId = episodeId === "" ? null : episodeId;

    const archive = await prisma.archive.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        curatedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Archive updated successfully",
      archive,
    });
  } catch (error) {
    console.error("Error updating archive:", error);
    return NextResponse.json(
      { error: "Failed to update archive" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await staffOnly(user);
    const resolvedParams = await params;

    // Check if archive exists
    const existingArchive = await prisma.archive.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingArchive) {
      return NextResponse.json({ error: "Archive not found" }, { status: 404 });
    }

    // Delete related records first (if needed)
    await prisma.$transaction([
      // Delete comments
      prisma.comment.deleteMany({
        where: { archiveId: resolvedParams.id },
      }),
      // Delete favorites
      prisma.favorite.deleteMany({
        where: { archiveId: resolvedParams.id },
      }),
      // Delete playback progress
      prisma.playbackProgress.deleteMany({
        where: { archiveId: resolvedParams.id },
      }),
      // Delete bookmarks
      prisma.bookmark.deleteMany({
        where: { archiveId: resolvedParams.id },
      }),
      // Delete reviews
      prisma.review.deleteMany({
        where: { archiveId: resolvedParams.id },
      }),
      // Finally delete the archive
      prisma.archive.delete({
        where: { id: resolvedParams.id },
      }),
    ]);

    return NextResponse.json({
      message: "Archive deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting archive:", error);
    return NextResponse.json(
      { error: "Failed to delete archive" },
      { status: 500 }
    );
  }
}