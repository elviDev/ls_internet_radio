"use server";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/prisma";

export async function fetchAudiobookSearch(searchTerm: string) {
  try {
    const results = await prisma.audiobook.findMany({
      where: {
        AND: [
          { status: "PUBLISHED" },
          {
            OR: [
              { title: { contains: searchTerm, mode: "insensitive" } },
              { description: { contains: searchTerm, mode: "insensitive" } },
              { narrator: { contains: searchTerm, mode: "insensitive" } },
              { author: { 
                OR: [
                  { firstName: { contains: searchTerm, mode: "insensitive" } },
                  { lastName: { contains: searchTerm, mode: "insensitive" } }
                ]
              }},
              { genre: { name: { contains: searchTerm, mode: "insensitive" } } }
            ]
          }
        ]
      },
      include: {
        author: { select: { firstName: true, lastName: true } },
        genre: { select: { name: true } },
        chapters: {
          where: { status: "PUBLISHED" },
          select: { id: true, duration: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Transform to match expected format
    const formattedResults = results.map((audiobook: any) => ({
      id: audiobook.id,
      title: audiobook.title,
      author: `${audiobook.author.firstName} ${audiobook.author.lastName}`,
      narrator: audiobook.narrator,
      coverImage: audiobook.coverImage || "/placeholder.svg?height=400&width=300",
      genre: audiobook.genre?.name,
      description: audiobook.description,
      chapterCount: audiobook.chapters.length,
      totalDuration: audiobook.chapters.reduce((total: number, chapter: any) => total + (chapter.duration || 0), 0)
    }));

    return { success: true, data: formattedResults };
  } catch (error) {
    console.error("Error in fetchAudiobookSearch:", error);
    return { success: false, error: "Failed to search audiobooks" };
  }
}

export async function fetchAudiobookDetails(audiobookId: string) {
  try {
    const audiobook = await prisma.audiobook.findUnique({
      where: { id: audiobookId },
      include: {
        author: { select: { firstName: true, lastName: true } },
        genre: { select: { name: true } },
        chapters: {
          where: { status: "PUBLISHED" },
          orderBy: { trackNumber: "asc" },
          include: {
            comments: {
              include: {
                user: { select: { name: true, profileImage: true } }
              },
              orderBy: { createdAt: "desc" }
            }
          }
        }
      }
    });

    if (!audiobook) {
      return { success: false, error: "Audiobook not found" };
    }

    // Transform to match expected format
    const transformedAudiobook = {
      id: audiobook.id,
      title: audiobook.title,
      author: `${audiobook.author.firstName} ${audiobook.author.lastName}`,
      narrator: audiobook.narrator,
      description: audiobook.description,
      coverImage: audiobook.coverImage || "/placeholder.svg?height=400&width=300",
      genre: audiobook.genre?.name,
      duration: audiobook.duration,
      releaseDate: audiobook.releaseDate,
      isExplicit: audiobook.isExplicit,
      chapters: audiobook.chapters.map((chapter: any) => ({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        duration: chapter.duration,
        trackNumber: chapter.trackNumber,
        audioFile: chapter.audioFile,
        transcript: chapter.transcript,
        comments: chapter.comments.map((comment: any) => ({
          id: comment.id,
          author: comment.user.name || "Anonymous",
          authorImage: comment.user.profileImage,
          content: comment.content,
          date: comment.createdAt
        }))
      }))
    };

    return { success: true, data: transformedAudiobook };
  } catch (error) {
    console.error("Error in fetchAudiobookDetails:", error);
    return { success: false, error: "Failed to fetch audiobook details" };
  }
}

export async function fetchTopAudiobooks(genreId?: string) {
  try {
    const whereCondition: any = { status: "PUBLISHED" };
    if (genreId) {
      whereCondition.genreId = genreId;
    }

    const results = await prisma.audiobook.findMany({
      where: whereCondition,
      include: {
        author: { select: { firstName: true, lastName: true } },
        genre: { select: { name: true } },
        chapters: {
          where: { status: "PUBLISHED" },
          select: { id: true, duration: true }
        },
        _count: {
          select: { favorites: true }
        }
      },
      orderBy: [
        { favorites: { _count: "desc" } },
        { createdAt: "desc" }
      ],
      take: 20
    });

    // Transform to match expected format
    const formattedResults = results.map((audiobook: any) => ({
      id: audiobook.id,
      title: audiobook.title,
      author: `${audiobook.author.firstName} ${audiobook.author.lastName}`,
      narrator: audiobook.narrator,
      coverImage: audiobook.coverImage || "/placeholder.svg?height=400&width=300",
      genre: audiobook.genre?.name,
      description: audiobook.description,
      chapterCount: audiobook.chapters.length,
      totalDuration: audiobook.chapters.reduce((total: number, chapter: any) => total + (chapter.duration || 0), 0),
      favoriteCount: audiobook._count.favorites
    }));

    return { success: true, data: formattedResults };
  } catch (error) {
    console.error("Error in fetchTopAudiobooks:", error);
    return { success: false, error: "Failed to fetch top audiobooks" };
  }
}

export type FavoriteAudiobook = {
  id: string;
  title: string;
  image: string;
  author: string;
};

export async function toggleFavoriteAudiobook(audiobook: FavoriteAudiobook) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return {
        success: false,
        error: "Authentication required",
        authRequired: true,
      };
    }

    // Check if audiobook exists
    const dbAudiobook = await prisma.audiobook.findUnique({
      where: { id: audiobook.id }
    });

    if (!dbAudiobook) {
      return { success: false, error: "Audiobook not found" };
    }

    // Determine if this is a regular user or staff member
    const isStaff = session.role && session.role !== 'USER';
    
    // Check if already favorited
    const whereClause = isStaff 
      ? { staffId_audiobookId: { staffId: session.id, audiobookId: audiobook.id } }
      : { userId_audiobookId: { userId: session.id, audiobookId: audiobook.id } };

    const existingFavorite = await prisma.favorite.findUnique({
      where: whereClause
    });

    if (existingFavorite) {
      // Remove from favorites
      await prisma.favorite.delete({
        where: whereClause
      });
      return { success: true, isFavorite: false };
    } else {
      // Add to favorites
      const createData = isStaff 
        ? { staffId: session.id, audiobookId: audiobook.id }
        : { userId: session.id, audiobookId: audiobook.id };

      await prisma.favorite.create({
        data: createData
      });
      return { success: true, isFavorite: true };
    }
  } catch (error) {
    console.error("Error in toggleFavoriteAudiobook:", error);
    return { success: false, error: "Failed to toggle favorite status" };
  }
}

export async function checkIsFavorite(audiobookId: string) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: true, isFavorite: false };
    }

    // Determine if this is a regular user or staff member
    const isStaff = session.role && session.role !== 'USER';
    
    const whereClause = isStaff 
      ? { staffId_audiobookId: { staffId: session.id, audiobookId: audiobookId } }
      : { userId_audiobookId: { userId: session.id, audiobookId: audiobookId } };

    const favorite = await prisma.favorite.findUnique({
      where: whereClause
    });

    return { success: true, isFavorite: !!favorite };
  } catch (error) {
    console.error("Error in checkIsFavorite:", error);
    return { success: false, error: "Failed to check favorite status" };
  }
}

export async function getFavoriteAudiobooks() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return {
        success: false,
        error: "Authentication required",
        authRequired: true,
      };
    }

    // Determine if this is a regular user or staff member
    const isStaff = session.role && session.role !== 'USER';
    
    const whereClause = isStaff 
      ? { staffId: session.id, audiobookId: { not: null } }
      : { userId: session.id, audiobookId: { not: null } };

    const favorites = await prisma.favorite.findMany({
      where: whereClause,
      include: {
        audiobook: {
          include: {
            author: { select: { firstName: true, lastName: true } },
            genre: { select: { name: true } },
            chapters: {
              where: { status: "PUBLISHED" },
              select: { id: true, duration: true }
            }
          }
        }
      }
    });

    const formattedFavorites = favorites.map((favorite: any) => ({
      id: favorite.audiobook.id,
      title: favorite.audiobook.title,
      author: `${favorite.audiobook.author.firstName} ${favorite.audiobook.author.lastName}`,
      narrator: favorite.audiobook.narrator,
      coverImage: favorite.audiobook.coverImage || "/placeholder.svg?height=400&width=300",
      genre: favorite.audiobook.genre?.name,
      description: favorite.audiobook.description,
      chapterCount: favorite.audiobook.chapters.length,
      totalDuration: favorite.audiobook.chapters.reduce((total: number, chapter: any) => total + (chapter.duration || 0), 0)
    }));

    return { success: true, data: formattedFavorites };
  } catch (error) {
    console.error("Error in getFavoriteAudiobooks:", error);
    return { success: false, error: "Failed to fetch favorite audiobooks" };
  }
}

// Progress tracking for audiobooks
export async function saveAudiobookProgress(
  audiobookId: string,
  position: number,
  chapterId?: string | number | null
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return {
        success: false,
        error: "Authentication required",
        authRequired: true,
      };
    }

    // Determine if this is a regular user or staff member
    const isStaff = session.role && session.role !== 'USER';
    
    // Find existing progress
    const whereClause = isStaff 
      ? { staffId: session.id, audiobookId: audiobookId }
      : { userId: session.id, audiobookId: audiobookId };

    const existingProgress = await prisma.playbackProgress.findUnique({
      where: isStaff 
        ? { staffId_audiobookId: { staffId: session.id, audiobookId: audiobookId } }
        : { userId_audiobookId: { userId: session.id, audiobookId: audiobookId } }
    });

    const progressData = {
      position,
      chapterId: chapterId !== null && chapterId !== undefined ? String(chapterId) : null,
      updatedAt: new Date(),
    };

    if (existingProgress) {
      // Update existing progress
      await prisma.playbackProgress.update({
        where: { id: existingProgress.id },
        data: progressData,
      });
    } else {
      // Create new progress
      const createData = isStaff 
        ? { ...progressData, staffId: session.id, audiobookId }
        : { ...progressData, userId: session.id, audiobookId };

      await prisma.playbackProgress.create({
        data: createData,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error in saveAudiobookProgress:", error);
    return { success: false, error: "Failed to save progress" };
  }
}

export async function getAudiobookProgress(audiobookId: string) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return {
        success: true,
        data: { position: 0, chapterId: null },
      };
    }

    // Determine if this is a regular user or staff member
    const isStaff = session.role && session.role !== 'USER';
    
    const progress = await prisma.playbackProgress.findUnique({
      where: isStaff 
        ? { staffId_audiobookId: { staffId: session.id, audiobookId: audiobookId } }
        : { userId_audiobookId: { userId: session.id, audiobookId: audiobookId } }
    });

    return {
      success: true,
      data: progress 
        ? { position: progress.position, chapterId: progress.chapterId }
        : { position: 0, chapterId: null },
    };
  } catch (error) {
    console.error("Error in getAudiobookProgress:", error);
    return { success: false, error: "Failed to get progress" };
  }
}
