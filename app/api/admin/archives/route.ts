import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { staffOnly } from "@/lib/auth/staffOnly";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await staffOnly(user);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { host: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type) {
      where.type = type.toUpperCase();
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    if (category) {
      where.category = category;
    }

    // Get archives with pagination
    const [archives, total] = await Promise.all([
      prisma.archive.findMany({
        where,
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
          _count: {
            select: {
              comments: true,
              favorites: true,
              playbackProgress: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.archive.count({ where }),
    ]);

    // Calculate statistics
    const stats = await prisma.archive.aggregate({
      _count: true,
      _sum: {
        playCount: true,
        downloadCount: true,
        fileSize: true,
      },
      _avg: {
        duration: true,
      },
    });

    const featuredCount = await prisma.archive.count({
      where: { status: "FEATURED" },
    });

    const thisMonthCount = await prisma.archive.count({
      where: {
        archivedDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    // Get most popular type
    const typeStats = await prisma.archive.groupBy({
      by: ["type"],
      _count: true,
      orderBy: {
        _count: {
          type: "desc",
        },
      },
      take: 1,
    });

    const response = {
      archives: archives.map((archive) => ({
        id: archive.id,
        title: archive.title,
        slug: archive.slug,
        description: archive.description,
        host: archive.host,
        guests: archive.guests,
        category: archive.category,
        type: archive.type,
        status: archive.status,
        duration: archive.duration,
        fileSize: archive.fileSize,
        playCount: archive.playCount,
        downloadCount: archive.downloadCount,
        likeCount: archive.likeCount,
        shareCount: archive.shareCount,
        isFeatured: archive.isFeatured,
        isDownloadable: archive.isDownloadable,
        isExclusive: archive.isExclusive,
        accessLevel: archive.accessLevel,
        coverImage: archive.coverImage,
        audioFile: archive.audioFile,
        downloadUrl: archive.downloadUrl,
        originalAirDate: archive.originalAirDate,
        archivedDate: archive.archivedDate,
        createdAt: archive.createdAt,
        updatedAt: archive.updatedAt,
        createdBy: archive.createdBy,
        curatedBy: archive.curatedBy,
        stats: {
          commentsCount: archive._count.comments,
          favoritesCount: archive._count.favorites,
          progressCount: archive._count.playbackProgress,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalArchives: stats._count || 0,
        totalPlays: stats._sum.playCount || 0,
        totalDownloads: stats._sum.downloadCount || 0,
        totalStorageUsed: stats._sum.fileSize || 0,
        averageDuration: stats._avg.duration || 0,
        featuredCount,
        thisMonthUploads: thisMonthCount,
        mostPopularType: typeStats[0]?.type || "PODCAST",
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching archives:", error);
    return NextResponse.json(
      { error: "Failed to fetch archives" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await staffOnly(user);

    const data = await request.json();

    const {
      title,
      description,
      host,
      guests,
      category,
      type,
      status = "ACTIVE",
      duration,
      fileSize,
      audioFile,
      downloadUrl,
      coverImage,
      thumbnailImage,
      originalAirDate,
      isDownloadable = true,
      isFeatured = false,
      isExclusive = false,
      accessLevel = "PUBLIC",
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

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Ensure slug is unique
    let uniqueSlug = slug;
    let counter = 1;
    
    while (await prisma.archive.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const archive = await prisma.archive.create({
      data: {
        title,
        slug: uniqueSlug,
        description,
        host,
        guests,
        category,
        type: type.toUpperCase(),
        status: status.toUpperCase(),
        duration,
        fileSize,
        audioFile,
        downloadUrl,
        coverImage,
        thumbnailImage,
        originalAirDate: originalAirDate ? new Date(originalAirDate) : null,
        isDownloadable,
        isFeatured,
        isExclusive,
        accessLevel,
        tags: tags ? JSON.stringify(tags) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        transcript,
        transcriptFile,
        qualityVariants: qualityVariants ? JSON.stringify(qualityVariants) : null,
        // Relations
        podcastId,
        audiobookId,
        broadcastId,
        episodeId,
        // Staff
        createdById: user.id,
        curatedById: isFeatured ? user.id : null,
      },
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
      message: "Archive created successfully",
      archive,
    });
  } catch (error) {
    console.error("Error creating archive:", error);
    return NextResponse.json(
      { error: "Failed to create archive" },
      { status: 500 }
    );
  }
}