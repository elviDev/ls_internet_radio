"use server";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  searchPodcasts,
  getPodcastEpisodes,
  getTopPodcasts,
} from "@/lib/podcast-api";
import { prisma } from "@/lib/prisma";

export async function fetchPodcastSearch(searchTerm: string) {
  try {
    const results = await searchPodcasts(searchTerm);
    return { success: true, data: results };
  } catch (error) {
    console.error("Error in fetchPodcastSearch:", error);
    return { success: false, error: "Failed to search podcasts" };
  }
}

export async function fetchPodcastEpisodes(podcastId: string) {
  try {
    const { podcast, episodes } = await getPodcastEpisodes(podcastId);
    return { success: true, data: { podcast, episodes } };
  } catch (error) {
    console.error("Error in fetchPodcastEpisodes:", error);
    return { success: false, error: "Failed to fetch podcast episodes" };
  }
}

export async function fetchTopPodcasts(genreId?: number) {
  try {
    const results = await getTopPodcasts(genreId);
    return { success: true, data: results };
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
    //   const session = await getCurrentUser();
    //   if (!session) {
    //     return {
    //       success: false,
    //       error: "Authentication required",
    //       authRequired: true,
    //     };
    //   }
    //   const userData = await prisma.user.findUnique({
    //     where: { id: session.id },
    //     include: { podcasts: true },
    //   });
    //   if (!userData) {
    //     return { success: false, error: "User data not found" };
    //   }
    //   // Check if podcast exists in database, if not create it
    //   let dbPodcast = await prisma.podcast.findFirst({
    //     where: { externalId: podcast.id },
    //   });
    //   if (!dbPodcast) {
    //     dbPodcast = await prisma.podcast.create({
    //       data: {
    //         title: podcast.title,
    //         author: podcast.artist,
    //         imageUrl: podcast.image,
    //         externalId: podcast.id,
    //       },
    //     });
    //   }
    //   // Check if podcast is already in favorites
    //   const isFavorite = userData.podcasts.some(
    //     (p: any) => p.id === dbPodcast!.id
    //   );
    //   if (isFavorite) {
    //     // Remove from favorites
    //     await prisma.userData.update({
    //       where: { id: userData.id },
    //       data: {
    //         podcasts: {
    //           disconnect: { id: dbPodcast!.id },
    //         },
    //       },
    //     });
    //     return { success: true, isFavorite: false };
    //   } else {
    //     // Add to favorites
    //     await prisma.userData.update({
    //       where: { id: userData.id },
    //       data: {
    //         podcasts: {
    //           connect: { id: dbPodcast!.id },
    //         },
    //       },
    //     });
    return { success: true, isFavorite: true };
    // }
  } catch (error) {
    console.error("Error in toggleFavoritePodcast:", error);
    return { success: false, error: "Failed to toggle favorite status" };
  }
}

export async function checkIsFavorite(podcastId: string) {
  try {
    //   const session = await getCurrentSession();
    //   if (!session) {
    //     return { success: true, isFavorite: false };
    //   }
    //   const dbPodcast = await prisma.podcast.findFirst({
    //     where: { externalId: podcastId },
    //   });
    //   if (!dbPodcast) {
    //     return { success: true, isFavorite: false };
    //   }
    //   const userData = await prisma.userData.findUnique({
    //     where: { userId: session.id },
    //     include: { podcasts: true },
    //   });
    //   if (!userData) {
    //     return { success: true, isFavorite: false };
    //   }
    //   const isFavorite = userData.podcasts.some(
    //     (p: any) => p.id === dbPodcast.id
    //   );
    return { success: true, isFavorite: false };
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

    //   const userData = await prisma.user.findUnique({
    //     where: { userId: session.id },
    //     include: { podcasts: true },
    //   });

    //   if (!userData) {
    //     return { success: true, data: [] };
    //   }

    //   const favorites = userData.podcasts.map((podcast: any) => ({
    //     id: podcast.externalId || podcast.id,
    //     title: podcast.title,
    //     image: podcast.imageUrl || "",
    //     artist: podcast.author,
    //   }));

    return { success: true, data: [] };
  } catch (error) {
    console.error("Error in getFavoritePodcasts:", error);
    return { success: false, error: "Failed to fetch favorite podcasts" };
  }
}
