"use server";

import {
  searchAudiobooks,
  getAudiobookDetails,
  getTopAudiobooks,
} from "@/lib/audiobook-api";
import { prisma } from "@/lib/prisma";

export async function fetchAudiobookSearch(searchTerm: string) {
  try {
    const results = await searchAudiobooks(searchTerm);
    return { success: true, data: results };
  } catch (error) {
    console.error("Error in fetchAudiobookSearch:", error);
    return { success: false, error: "Failed to search audiobooks" };
  }
}

export async function fetchAudiobookDetails(audiobookId: string) {
  try {
    const audiobook = await getAudiobookDetails(audiobookId);
    return { success: true, data: audiobook };
  } catch (error) {
    console.error("Error in fetchAudiobookDetails:", error);
    return { success: false, error: "Failed to fetch audiobook details" };
  }
}

export async function fetchTopAudiobooks(category?: string) {
  try {
    const results = await getTopAudiobooks(category);
    return { success: true, data: results };
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
    //     const session = await getCurrentSession();
    //     if (!session) {
    //       return {
    //         success: false,
    //         error: "Authentication required",
    //         authRequired: true,
    //       };
    //     }

    //     const user = await prisma.user.findUnique({
    //       where: { id: session.id },
    //       include: { audiobook: true },
    //     });

    //     if (!user) {
    //       return { success: false, error: "User data not found" };
    //     }

    //     // Check if audiobook exists in database, if not create it
    //     let dbAudiobook = await prisma.audiobook.findFirst({
    //       where: { id: audiobook.id },
    //     });

    //     if (!dbAudiobook) {
    //       dbAudiobook = await prisma.audiobook.create({
    //         data: {
    //           title: audiobook.title,
    //           author: audiobook.author,
    //           coverImage: audiobook.image,
    //           externalId: audiobook.id,
    //         },
    //       });
    //     }

    //     // Check if audiobook is already in favorites
    //     const isFavorite = user.audiobooks.some(
    //       (a: any) => a.id === dbAudiobook!.id
    //     );

    //     if (isFavorite) {
    //       // Remove from favorites
    //       await prisma.user.update({
    //         where: { id: user.id },
    //         data: {
    //           audiobooks: {
    //             disconnect: { id: dbAudiobook!.id },
    //           },
    //         },
    //       });
    //       return { success: true, isFavorite: false };
    //     } else {
    //       // Add to favorites
    //       await prisma.user.update({
    //         where: { id: user.id },
    //         data: {
    //           audiobooks: {
    //             connect: { id: dbAudiobook!.id },
    //           },
    //         },
    //       });
    return { success: true, isFavorite: true };
    //     }
  } catch (error) {
    console.error("Error in toggleFavoriteAudiobook:", error);
    return { success: false, error: "Failed to toggle favorite status" };
  }
}

export async function checkIsFavorite(audiobookId: string) {
  try {
    //     const session = await getCurrentSession();
    //     if (!session) {
    //       return { success: true, isFavorite: false };
    //     }

    //     const dbAudiobook = await prisma.audiobook.findFirst({
    //       where: { externalId: audiobookId },
    //     });

    //     if (!dbAudiobook) {
    //       return { success: true, isFavorite: false };
    //     }

    //     const user = await prisma.user.findUnique({
    //       where: { id: session.id },
    //       include: { audiobooks: true },
    //     });

    //     if (!user) {
    //       return { success: true, isFavorite: false };
    //     }

    //     const isFavorite = user.audiobooks.some(
    //       (a: any) => a.id === dbAudiobook.id
    //     );
    return { success: true, isFavorite: false };
  } catch (error) {
    console.error("Error in checkIsFavorite:", error);
    return { success: false, error: "Failed to check favorite status" };
  }
}

export async function getFavoriteAudiobooks() {
  try {
    //     const session = await getCurrentSession();
    //     if (!session) {
    //       return {
    //         success: false,
    //         error: "Authentication required",
    //         authRequired: true,
    //       };
    //     }

    //     const user = await prisma.user.findUnique({
    //       where: { id: session.id },
    //       include: { audiobooks: true },
    //     });

    //     if (!user) {
    //       return { success: true, data: [] };
    //     }

    //     const favorites = user.audiobooks.map((audiobook: any) => ({
    //       id: audiobook.externalId || audiobook.id,
    //       title: audiobook.title,
    //       image: audiobook.imageUrl || "",
    //       author: audiobook.author,
    //     }));

    return { success: true, data: [] };
  } catch (error) {
    console.error("Error in getFavoriteAudiobooks:", error);
    return { success: false, error: "Failed to fetch favorite audiobooks" };
  }
}

// Progress tracking for audiobooks
export async function saveAudiobookProgress(
  audiobookId: string,
  position: number,
  chapter: number
) {
  try {
    //     const session = await getCurrentSession();
    //     if (!session) {
    //       return {
    //         success: false,
    //         error: "Authentication required",
    //         authRequired: true,
    //       };
    //     }

    //     const user = await prisma.user.findUnique({
    //       where: { id: session.id },
    //     });

    //     if (!user) {
    //       return { success: false, error: "User data not found" };
    //     }

    //     // Find existing progress
    //     const existingProgress = await prisma.progress.findFirst({
    //       where: {
    //         id: user.id,
    //         itemId: audiobookId,
    //         itemType: "audiobook",
    //       },
    //     });

    //     if (existingProgress) {
    //       // Update existing progress
    //       await prisma.progress.update({
    //         where: { id: existingProgress.id },
    //         data: {
    //           position,
    //           chapter,
    //           updatedAt: new Date(),
    //         },
    //       });
    //     } else {
    //       // Create new progress
    //       await prisma.progress.create({
    //         data: {
    //           id: user.id,
    //           itemId: audiobookId,
    //           itemType: "audiobook",
    //           position,
    //           chapter,
    //         },
    //       });
    //     }

    return { success: true };
  } catch (error) {
    console.error("Error in saveAudiobookProgress:", error);
    return { success: false, error: "Failed to save progress" };
  }
}

export async function getAudiobookProgress(audiobookId: string) {
  try {
    //     const session = await getCurrentSession();
    //     if (!session) {
    //       return {
    //         success: true,
    //         data: { position: 0, chapter: 1 },
    //       };
    //     }

    //     const user = await prisma.user.findUnique({
    //       where: { id: session.id },
    //     });

    //     if (!user) {
    //       return {
    //         success: true,
    //         data: { position: 0, chapter: 1 },
    //       };
    //     }

    //     const progress = await prisma.progress.findFirst({
    //       where: {
    //         id: user.id,
    //         itemId: audiobookId,
    //         itemType: "audiobook",
    //       },
    //     });

    return {
      success: true,
      data: { position: 0, chapter: 1 },
    };
  } catch (error) {
    console.error("Error in getAudiobookProgress:", error);
    return { success: false, error: "Failed to get progress" };
  }
}
