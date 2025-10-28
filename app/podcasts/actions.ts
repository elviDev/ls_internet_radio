"use server";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/prisma";

export async function fetchPodcastSearch(searchTerm: string) {
  try {
    const results = await prisma.podcast.findMany({
      where: {
        AND: [
          { status: "PUBLISHED" },
          {
            OR: [
              { title: { contains: searchTerm, mode: "insensitive" } },
              { description: { contains: searchTerm, mode: "insensitive" } },
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
        episodes: {
          where: { status: "PUBLISHED" },
          select: { id: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Transform to match expected format
    const formattedResults = results.map((podcast: any) => ({
      collectionId: podcast.id,
      collectionName: podcast.title,
      artistName: `${podcast.author.firstName} ${podcast.author.lastName}`,
      artworkUrl100: podcast.coverImage || "/placeholder.svg?height=400&width=400",
      primaryGenreName: podcast.genre?.name,
      episodeCount: podcast.episodes.length
    }));

    return { success: true, data: formattedResults };
  } catch (error) {
    console.error("Error in fetchPodcastSearch:", error);
    return { success: false, error: "Failed to search podcasts" };
  }
}

export async function fetchPodcastEpisodes(podcastId: string) {
  try {
    const podcast = await prisma.podcast.findUnique({
      where: { id: podcastId },
      include: {
        author: { select: { firstName: true, lastName: true } },
        genre: { select: { name: true } },
        episodes: {
          where: { status: "PUBLISHED" },
          orderBy: { episodeNumber: "desc" },
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

    if (!podcast) {
      return { success: false, error: "Podcast not found" };
    }

    // Transform to match expected format
    const transformedPodcast = {
      collectionId: podcast.id,
      collectionName: podcast.title,
      artistName: `${podcast.author.firstName} ${podcast.author.lastName}`,
      artworkUrl100: podcast.coverImage || "/placeholder.svg?height=400&width=400",
      primaryGenreName: podcast.genre?.name,
      description: podcast.description
    };

    const transformedEpisodes = podcast.episodes.map((episode: any) => ({
      trackId: episode.id,
      trackName: episode.title,
      description: episode.description,
      releaseDate: episode.publishedAt || episode.createdAt,
      trackTimeMillis: episode.duration * 1000,
      previewUrl: episode.audioFile,
      episodeNumber: episode.episodeNumber,
      comments: episode.comments.map((comment: any) => ({
        id: comment.id,
        author: comment.user.name || "Anonymous",
        authorImage: comment.user.profileImage,
        content: comment.content,
        date: comment.createdAt
      }))
    }));

    return { success: true, data: { podcast: transformedPodcast, episodes: transformedEpisodes } };
  } catch (error) {
    console.error("Error in fetchPodcastEpisodes:", error);
    return { success: false, error: "Failed to fetch podcast episodes" };
  }
}

export async function fetchTopPodcasts(genreId?: string) {
  try {
    const whereCondition: any = { status: "PUBLISHED" };
    if (genreId) {
      whereCondition.genreId = genreId;
    }

    const results = await prisma.podcast.findMany({
      where: whereCondition,
      include: {
        author: { select: { firstName: true, lastName: true } },
        genre: { select: { name: true } },
        episodes: {
          where: { status: "PUBLISHED" },
          select: { id: true }
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
    const formattedResults = results.map((podcast: any) => ({
      collectionId: podcast.id,
      collectionName: podcast.title,
      artistName: `${podcast.author.firstName} ${podcast.author.lastName}`,
      artworkUrl100: podcast.coverImage || "/placeholder.svg?height=400&width=400",
      primaryGenreName: podcast.genre?.name,
      episodeCount: podcast.episodes.length,
      favoriteCount: podcast._count.favorites
    }));

    return { success: true, data: formattedResults };
  } catch (error) {
    console.error("Error in fetchTopPodcasts:", error);
    return { success: false, error: "Failed to fetch top podcasts" };
  }
}

export type FavoritePodcast = {
  id: string;
  title: string;
  image: string;
  artist: string;
};

export async function toggleFavoritePodcast(podcast: FavoritePodcast) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return {
        success: false,
        error: "Authentication required",
        authRequired: true,
      };
    }

    // Check if podcast exists
    const dbPodcast = await prisma.podcast.findUnique({
      where: { id: podcast.id }
    });

    if (!dbPodcast) {
      return { success: false, error: "Podcast not found" };
    }

    // Determine if this is a regular user or staff member
    const isStaff = session.role && session.role !== 'USER';
    
    // Check if already favorited
    const whereClause = isStaff 
      ? { staffId_podcastId: { staffId: session.id, podcastId: podcast.id } }
      : { userId_podcastId: { userId: session.id, podcastId: podcast.id } };

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
        ? { staffId: session.id, podcastId: podcast.id }
        : { userId: session.id, podcastId: podcast.id };

      await prisma.favorite.create({
        data: createData
      });
      return { success: true, isFavorite: true };
    }
  } catch (error) {
    console.error("Error in toggleFavoritePodcast:", error);
    return { success: false, error: "Failed to toggle favorite status" };
  }
}

export async function checkIsFavorite(podcastId: string) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: true, isFavorite: false };
    }

    // Determine if this is a regular user or staff member
    const isStaff = session.role && session.role !== 'USER';
    
    const whereClause = isStaff 
      ? { staffId_podcastId: { staffId: session.id, podcastId: podcastId } }
      : { userId_podcastId: { userId: session.id, podcastId: podcastId } };

    const favorite = await prisma.favorite.findUnique({
      where: whereClause
    });

    return { success: true, isFavorite: !!favorite };
  } catch (error) {
    console.error("Error in checkIsFavorite:", error);
    return { success: false, error: "Failed to check favorite status" };
  }
}

export async function getFavoritePodcasts() {
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
      ? { staffId: session.id, podcastId: { not: null } }
      : { userId: session.id, podcastId: { not: null } };

    const favorites = await prisma.favorite.findMany({
      where: whereClause,
      include: {
        podcast: {
          include: {
            author: { select: { firstName: true, lastName: true } },
            genre: { select: { name: true } },
            episodes: {
              where: { status: "PUBLISHED" },
              select: { id: true }
            }
          }
        }
      }
    });

    const formattedFavorites = favorites.map((favorite: any) => ({
      collectionId: favorite.podcast.id,
      collectionName: favorite.podcast.title,
      artistName: `${favorite.podcast.author.firstName} ${favorite.podcast.author.lastName}`,
      artworkUrl100: favorite.podcast.coverImage || "/placeholder.svg?height=400&width=400",
      primaryGenreName: favorite.podcast.genre?.name,
      episodeCount: favorite.podcast.episodes.length
    }));

    return { success: true, data: formattedFavorites };
  } catch (error) {
    console.error("Error in getFavoritePodcasts:", error);
    return { success: false, error: "Failed to fetch favorite podcasts" };
  }
}

export async function addComment(episodeId: string, content: string) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return {
        success: false,
        error: "Authentication required",
        authRequired: true,
      };
    }

    // For now, comments are only supported for regular users
    // We might need to extend the Comment model to support staff later
    const isStaff = session.role && session.role !== 'USER';
    
    if (isStaff) {
      // For staff members, we'll create a comment using their name but as a regular user entry
      // This is a temporary solution - ideally we'd extend the Comment model too
      return {
        success: false,
        error: "Staff commenting is not yet supported. Please sign in with a regular user account.",
      };
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: session.id,
        podcastEpisodeId: episodeId
      },
      include: {
        user: { select: { name: true, profileImage: true } }
      }
    });

    return {
      success: true,
      data: {
        id: comment.id,
        author: comment.user.name || "Anonymous",
        authorImage: comment.user.profileImage,
        content: comment.content,
        date: comment.createdAt
      }
    };
  } catch (error) {
    console.error("Error in addComment:", error);
    return { success: false, error: "Failed to add comment" };
  }
}

export async function getEpisodeComments(episodeId: string) {
  try {
    const comments = await prisma.comment.findMany({
      where: { podcastEpisodeId: episodeId },
      include: {
        user: { select: { name: true, profileImage: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const formattedComments = comments.map((comment: any) => ({
      id: comment.id,
      author: comment.user.name || "Anonymous",
      authorImage: comment.user.profileImage,
      content: comment.content,
      date: comment.createdAt
    }));

    return { success: true, data: formattedComments };
  } catch (error) {
    console.error("Error in getEpisodeComments:", error);
    return { success: false, error: "Failed to fetch comments" };
  }
}

export async function getEpisodeTranscript(episodeId: string) {
  try {
    const episode = await prisma.podcastEpisode.findUnique({
      where: { id: episodeId },
      select: { transcript: true, transcriptFile: true }
    });

    if (!episode) {
      return { success: false, error: "Episode not found" };
    }

    // Parse transcript into segments (assuming it's formatted as JSON or structured text)
    let segments = [];
    if (episode.transcript) {
      try {
        // Try to parse as JSON first
        segments = JSON.parse(episode.transcript);
      } catch {
        // If not JSON, treat as plain text and create basic segments
        const lines = episode.transcript.split('\n').filter(line => line.trim());
        segments = lines.map((line, index) => ({
          id: `segment-${index}`,
          speaker: "Speaker",
          content: line.trim(),
          timestamp: `00:${String(index).padStart(2, '0')}:00`
        }));
      }
    }

    return { success: true, data: segments };
  } catch (error) {
    console.error("Error in getEpisodeTranscript:", error);
    return { success: false, error: "Failed to fetch transcript" };
  }
}
