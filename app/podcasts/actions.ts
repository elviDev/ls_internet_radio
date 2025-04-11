"use server"

import { searchPodcasts, getPodcastEpisodes, getTopPodcasts } from "@/lib/podcast-api"

export async function fetchPodcastSearch(searchTerm: string) {
  try {
    const results = await searchPodcasts(searchTerm)
    return { success: true, data: results }
  } catch (error) {
    console.error("Error in fetchPodcastSearch:", error)
    return { success: false, error: "Failed to search podcasts" }
  }
}

export async function fetchPodcastEpisodes(podcastId: string) {
  try {
    const { podcast, episodes } = await getPodcastEpisodes(podcastId)
    return { success: true, data: { podcast, episodes } }
  } catch (error) {
    console.error("Error in fetchPodcastEpisodes:", error)
    return { success: false, error: "Failed to fetch podcast episodes" }
  }
}

export async function fetchTopPodcasts(genreId?: number) {
  try {
    const results = await getTopPodcasts(genreId)
    return { success: true, data: results }
  } catch (error) {
    console.error("Error in fetchTopPodcasts:", error)
    return { success: false, error: "Failed to fetch top podcasts" }
  }
}

// Client-side state management functions (these will be called from client components)
// These are server actions but they're just simulating persistence
// In a real app, these would interact with a database

export type FavoritePodcast = {
  id: string
  title: string
  image: string
  artist: string
}

// This is just a simulation - in a real app this would be stored in a database
const favorites = new Map<string, FavoritePodcast>()

export async function toggleFavoritePodcast(podcast: FavoritePodcast) {
  if (favorites.has(podcast.id)) {
    favorites.delete(podcast.id)
    return { success: true, isFavorite: false }
  } else {
    favorites.set(podcast.id, podcast)
    return { success: true, isFavorite: true }
  }
}

export async function checkIsFavorite(podcastId: string) {
  return { success: true, isFavorite: favorites.has(podcastId) }
}

export async function getFavoritePodcasts() {
  return { success: true, data: Array.from(favorites.values()) }
}
