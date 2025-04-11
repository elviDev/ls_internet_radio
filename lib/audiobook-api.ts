// Audiobook API utilities for fetching audiobook data from Google Books API

/**
 * Search for audiobooks by term
 */
export async function searchAudiobooks(term: string, limit = 20) {
  try {
    // Using Google Books API with filter for audiobooks
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(term)}+audiobook&maxResults=${limit}&filter=ebooks`,
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    // Filter results to only include items that are likely audiobooks
    // (Google Books API doesn't have a direct audiobook filter)
    const audiobooks =
      data.items?.filter((item: any) => {
        const volumeInfo = item.volumeInfo || {}
        // Look for audiobook indicators in categories, title, or description
        const categories = volumeInfo.categories || []
        const title = volumeInfo.title || ""
        const description = volumeInfo.description || ""

        return (
          categories.some(
            (category: string) => category.toLowerCase().includes("audio") || category.toLowerCase().includes("spoken"),
          ) ||
          title.toLowerCase().includes("audiobook") ||
          description.toLowerCase().includes("audiobook") ||
          description.toLowerCase().includes("narrated by")
        )
      }) || []

    return audiobooks
  } catch (error) {
    console.error("Error searching audiobooks:", error)
    throw error
  }
}

/**
 * Get audiobook details by ID
 */
export async function getAudiobookDetails(id: string) {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${id}`)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching audiobook details:", error)
    throw error
  }
}

/**
 * Get top audiobooks by category
 */
export async function getTopAudiobooks(category = "fiction", limit = 20) {
  try {
    // Using Google Books API with subject filter
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=subject:${category}+audiobook&maxResults=${limit}&orderBy=relevance`,
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    // Filter results to only include items that are likely audiobooks
    const audiobooks =
      data.items?.filter((item: any) => {
        const volumeInfo = item.volumeInfo || {}
        const categories = volumeInfo.categories || []
        const title = volumeInfo.title || ""
        const description = volumeInfo.description || ""

        return (
          categories.some(
            (category: string) => category.toLowerCase().includes("audio") || category.toLowerCase().includes("spoken"),
          ) ||
          title.toLowerCase().includes("audiobook") ||
          description.toLowerCase().includes("audiobook") ||
          description.toLowerCase().includes("narrated by")
        )
      }) || []

    return audiobooks
  } catch (error) {
    console.error("Error fetching top audiobooks:", error)
    throw error
  }
}

// Audiobook categories/genres
export const audiobookCategories = {
  Fiction: "fiction",
  Mystery: "mystery",
  "Science Fiction": "science fiction",
  Fantasy: "fantasy",
  Romance: "romance",
  Thriller: "thriller",
  Biography: "biography",
  History: "history",
  "Self-Help": "self-help",
  Business: "business",
  Children: "children",
}

// Format duration from seconds to HH:MM:SS format
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "00:00:00"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
}

// Generate sample chapters for an audiobook (since Google Books API doesn't provide chapter info)
export function generateSampleChapters(title: string, pageCount = 10) {
  const chapters = []
  const avgChapterLength = Math.floor(Math.random() * 15) + 10 // 10-25 minutes per chapter

  const chapterCount = pageCount ? Math.max(Math.ceil(pageCount / 20), 5) : 10

  for (let i = 1; i <= chapterCount; i++) {
    const chapterLength = avgChapterLength + Math.floor(Math.random() * 10) - 5 // +/- 5 minutes variation

    chapters.push({
      id: `chapter-${i}`,
      title: `Chapter ${i}`,
      duration: chapterLength * 60, // Convert to seconds
      startPosition: (i - 1) * chapterLength * 60,
    })
  }

  return chapters
}

// Generate a sample audio URL (since Google Books API doesn't provide audio files)
export function getSampleAudioUrl(id: string, chapter = 1) {
  // In a real app, this would be a real audio URL
  // For demo purposes, we'll use a sample audio file
  return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
}
