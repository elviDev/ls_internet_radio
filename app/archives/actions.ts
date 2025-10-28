"use server";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/prisma";

export interface ArchiveData {
  id: string;
  title: string;
  host: string;
  guests?: string;
  image: string;
  duration: string;
  date: string;
  category: string;
  description: string;
  type: "podcast" | "broadcast" | "audiobook";
  downloadUrl?: string;
  audioFile?: string;
  playCount?: number;
  isDownloadable?: boolean;
  isFeatured?: boolean;
}

export async function getArchives(filters?: {
  search?: string;
  type?: string;
  category?: string;
  sortBy?: "date" | "title" | "duration" | "popularity";
  page?: number;
  limit?: number;
}) {
  try {
    const {
      search = "",
      type = "all",
      category = "all",
      sortBy = "date",
      page = 1,
      limit = 20,
    } = filters || {};

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {
      status: "ACTIVE", // Only show active archives to users
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
    if (type !== "all") {
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
    if (category !== "all") {
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

    // Build query parameters for API call
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
    });

    if (search) queryParams.set("search", search);
    if (type !== "all") queryParams.set("type", type);
    if (category !== "all") queryParams.set("category", category);

    // Fetch from public API
    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/archives?${queryParams}`;
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    // Transform API data to match the ArchiveData interface
    const transformedArchives: ArchiveData[] = data.archives.map((archive: any) => ({
      id: archive.id,
      title: archive.title,
      host: archive.host,
      guests: archive.guests || undefined,
      image: archive.coverImage || "/placeholder.svg?height=400&width=400&text=Archive",
      duration: archive.duration ? `${Math.floor(archive.duration / 60)} min` : "Unknown",
      date: new Date(archive.archivedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      category: archive.category || "General",
      description: archive.description || "",
      type: archive.type as "podcast" | "broadcast" | "audiobook",
      downloadUrl: archive.downloadUrl || undefined,
      audioFile: archive.audioFile || undefined,
      playCount: archive.playCount,
      isDownloadable: archive.isDownloadable,
      isFeatured: archive.isFeatured,
    }));

    return {
      success: true,
      data: transformedArchives,
      pagination: data.pagination,
    };
  } catch (error) {
    console.error("Error fetching archives:", error);
    return {
      success: false,
      error: "Failed to fetch archives",
    };
  }
}

export async function getArchiveById(id: string) {
  try {
    // Fetch from public API - use relative URL for server-side calls
    const apiUrl = process.env.NODE_ENV === 'development' 
      ? `http://localhost:3000/api/archives/${id}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/api/archives/${id}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Ensure fresh data
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: "Archive not found",
        };
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const archive = await response.json();

    // Transform API data to match the expected interface
    const transformedArchive: ArchiveData & {
      transcript?: string;
      tags?: string[];
      metadata?: any;
    } = {
      id: archive.id,
      title: archive.title,
      host: archive.host,
      guests: archive.guests || undefined,
      image: archive.coverImage || "/placeholder.svg?height=400&width=400&text=Archive",
      duration: archive.duration ? `${Math.floor(archive.duration / 60)} min` : "Unknown",
      date: new Date(archive.archivedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short", 
        day: "numeric",
      }),
      category: archive.category || "General",
      description: archive.description || "",
      type: archive.type as "podcast" | "broadcast" | "audiobook",
      downloadUrl: archive.downloadUrl || undefined,
      audioFile: archive.audioFile || undefined,
      playCount: archive.playCount,
      isDownloadable: archive.isDownloadable,
      isFeatured: archive.isFeatured,
      transcript: archive.transcript || undefined,
      tags: archive.tags || [],
      metadata: archive.metadata || {
        quality: "HD",
        fileSize: archive.fileSize ? `${Math.round(archive.fileSize / (1024 * 1024))}MB` : "Unknown",
        format: "MP3",
      },
    };

    return {
      success: true,
      data: transformedArchive,
    };
  } catch (error) {
    console.error("Error fetching archive:", error);
    return {
      success: false,
      error: "Failed to fetch archive details",
    };
  }
}

export async function searchArchives(query: string) {
  try {
    return await getArchives({ search: query });
  } catch (error) {
    console.error("Error searching archives:", error);
    return {
      success: false,
      error: "Failed to search archives",
    };
  }
}

export async function getFeaturedArchives() {
  try {
    const result = await getArchives();
    if (result.success) {
      const featuredArchives = result.data?.filter((archive) => archive.isFeatured);
      return {
        success: true,
        data: featuredArchives,
      };
    }
    return result;
  } catch (error) {
    console.error("Error fetching featured archives:", error);
    return {
      success: false,
      error: "Failed to fetch featured archives",
    };
  }
}

export async function getArchiveCategories() {
  try {
    // Fetch all archives and extract unique categories
    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/archives?limit=1000`;
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const categories = [...new Set(
      data.archives
        .map((archive: any) => archive.category)
        .filter((category: string) => Boolean(category))
    )].sort();

    return {
      success: true,
      data: categories,
    };
  } catch (error) {
    console.error("Error fetching archive categories:", error);
    return {
      success: false,
      error: "Failed to fetch categories",
    };
  }
}

export async function toggleArchiveFavorite(archiveId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Authentication required",
        authRequired: true,
      };
    }

    // Check if archive exists and is active
    const archive = await prisma.archive.findFirst({
      where: {
        id: archiveId,
        status: "ACTIVE",
      },
    });

    if (!archive) {
      return {
        success: false,
        error: "Archive not found",
      };
    }

    // Check if favorite already exists
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        archiveId,
        OR: [
          { userId: user.id },
          { staffId: user.id },
        ],
      },
    });

    let isFavorite: boolean;

    if (existingFavorite) {
      // Remove favorite
      await prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });
      isFavorite = false;
    } else {
      // Add favorite
      await prisma.favorite.create({
        data: {
          archiveId,
          // Use userId if user is a regular user, staffId if staff
          ...(user.role ? { staffId: user.id } : { userId: user.id }),
        },
      });
      isFavorite = true;
    }

    return {
      success: true,
      isFavorite,
    };
  } catch (error) {
    console.error("Error toggling archive favorite:", error);
    return {
      success: false,
      error: "Failed to toggle favorite status",
    };
  }
}

export async function trackArchivePlay(archiveId: string) {
  try {
    // Track play via API
    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/archives/${archiveId}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'track_play' }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: "Archive not found",
        };
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error tracking archive play:", error);
    return {
      success: false,
      error: "Failed to track play",
    };
  }
}

export async function saveArchiveProgress(archiveId: string, position: number) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Authentication required",
        authRequired: true,
      };
    }

    // Check if archive exists and is active
    const archive = await prisma.archive.findFirst({
      where: {
        id: archiveId,
        status: "ACTIVE",
      },
    });

    if (!archive) {
      return {
        success: false,
        error: "Archive not found",
      };
    }

    // Upsert playback progress
    await prisma.playbackProgress.upsert({
      where: {
        ...(user.role 
          ? { staffId_archiveId: { staffId: user.id, archiveId } }
          : { userId_archiveId: { userId: user.id, archiveId } }
        ),
      },
      update: {
        position,
        updatedAt: new Date(),
      },
      create: {
        archiveId,
        position,
        ...(user.role ? { staffId: user.id } : { userId: user.id }),
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error saving archive progress:", error);
    return {
      success: false,
      error: "Failed to save progress",
    };
  }
}

export async function getArchiveProgress(archiveId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: true,
        data: { position: 0 },
      };
    }

    // Find saved progress for this user and archive
    const progress = await prisma.playbackProgress.findFirst({
      where: {
        archiveId,
        OR: [
          { userId: user.id },
          { staffId: user.id },
        ],
      },
    });

    return {
      success: true,
      data: { position: progress?.position || 0 },
    };
  } catch (error) {
    console.error("Error getting archive progress:", error);
    return {
      success: false,
      error: "Failed to get progress",
    };
  }
}