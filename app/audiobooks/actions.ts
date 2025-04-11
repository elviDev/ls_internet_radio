"use server"

import { searchAudiobooks, getAudiobookDetails, getTopAudiobooks } from "@/lib/audiobook-api"

export async function fetchAudiobookSearch(searchTerm: string) {
  try {
    const results = await searchAudiobooks(searchTerm)
    return { success: true, data: results }
  } catch (error) {
    console.error("Error in fetchAudiobookSearch:", error)
    return { success: false, error: "Failed to search audiobooks" }
  }
}

export async function fetchAudiobookDetails(audiobookId: string) {
  try {
    const audiobook = await getAudiobookDetails(audiobookId)
    return { success: true, data: audiobook }
  } catch (error) {
    console.error("Error in fetchAudiobookDetails:", error)
    return { success: false, error: "Failed to fetch audiobook details" }
  }
}

export async function fetchTopAudiobooks(category?: string) {
  try {
    const results = await getTopAudiobooks(category)
    return { success: true, data: results }
  } catch (error) {
    console.error("Error in fetchTopAudiobooks:", error)
    return { success: false, error: "Failed to fetch top audiobooks" }
  }
}

// Client-side state management functions (these will be called from client components)
// These are server actions but they're just simulating persistence
// In a real app, these would interact with a database

export type FavoriteAudiobook = {
  id: string
  title: string
  image: string
  author: string
}

// This is just a simulation - in a real app this would be stored in a database
const favorites = new Map<string, FavoriteAudiobook>()

export async function toggleFavoriteAudiobook(audiobook: FavoriteAudiobook) {
  if (favorites.has(audiobook.id)) {
    favorites.delete(audiobook.id)
    return { success: true, isFavorite: false }
  } else {
    favorites.set(audiobook.id, audiobook)
    return { success: true, isFavorite: true }
  }
}

export async function checkIsFavorite(audiobookId: string) {
  return { success: true, isFavorite: favorites.has(audiobookId) }
}

export async function getFavoriteAudiobooks() {
  return { success: true, data: Array.from(favorites.values()) }
}

// Progress tracking for audiobooks
const progress = new Map<string, { position: number; chapter: number }>()

export async function saveAudiobookProgress(audiobookId: string, position: number, chapter: number) {
  progress.set(audiobookId, { position, chapter })
  return { success: true }
}

export async function getAudiobookProgress(audiobookId: string) {
  const savedProgress = progress.get(audiobookId)
  return {
    success: true,
    data: savedProgress || { position: 0, chapter: 1 },
  }
}
