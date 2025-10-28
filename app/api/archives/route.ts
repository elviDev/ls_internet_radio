import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const category = searchParams.get("category") || "";
    const sortBy = searchParams.get("sortBy") || "date";

    const skip = (page - 1) * limit;

    // Build where clause for filtering (only show active archives to public)
    const where: any = {
      status: "ACTIVE",
    };

    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { host: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    // Add type filter
    if (type && type !== "all") {
      const typeMap: Record<string, string> = {
        podcasts: "PODCAST",
        broadcasts: "BROADCAST",
        audiobooks: "AUDIOBOOK",
        interviews: "INTERVIEW",
      };
      if (typeMap[type]) {
        where.type = typeMap[type];
      }
    }

    // Add category filter
    if (category && category !== "all") {
      where.category = category;
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sortBy) {
      case "title":
        orderBy = { title: "asc" };
        break;
      case "duration":
        orderBy = { duration: "desc" };
        break;
      case "popularity":
        orderBy = { playCount: "desc" };
        break;
      case "date":
      default:
        orderBy = { archivedDate: "desc" };
        break;
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
            },
          },
          _count: {
            select: {
              comments: true,
              favorites: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.archive.count({ where }),
    ]);

    // Transform data for public consumption
    const transformedArchives = archives.map((archive) => ({
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
      originalAirDate: archive.originalAirDate,
      archivedDate: archive.archivedDate,
      isDownloadable: archive.isDownloadable,
      isFeatured: archive.isFeatured,
      isExclusive: archive.isExclusive,
      accessLevel: archive.accessLevel,
      tags: archive.tags ? JSON.parse(archive.tags) : [],
      metadata: archive.metadata ? JSON.parse(archive.metadata) : null,
      transcript: archive.transcript,
      createdAt: archive.createdAt,
      updatedAt: archive.updatedAt,
      stats: {
        commentsCount: archive._count.comments,
        favoritesCount: archive._count.favorites,
      },
    }));

    // Calculate basic stats for public display
    const stats = {
      totalArchives: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };

    const response = {
      archives: transformedArchives,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching public archives:", error);
    return NextResponse.json(
      { error: "Failed to fetch archives" },
      { status: 500 }
    );
  }
}