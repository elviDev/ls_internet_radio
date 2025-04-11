// Podcast API utilities for fetching podcast data from iTunes/Apple Podcasts API

/**
 * Search for podcasts by term
 */
export async function searchPodcasts(term: string, limit = 20) {
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=podcast&entity=podcast&limit=${limit}`,
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return data.results
  } catch (error) {
    console.error("Error searching podcasts:", error)
    throw error
  }
}

/**
 * Get podcast episodes by podcast ID
 */
export async function getPodcastEpisodes(podcastId: string, limit = 20) {
  try {
    const response = await fetch(
      `https://itunes.apple.com/lookup?id=${podcastId}&media=podcast&entity=podcastEpisode&limit=${limit}`,
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    // First result is the podcast itself, the rest are episodes
    const podcast = data.results[0]
    const episodes = data.results.slice(1)

    return { podcast, episodes }
  } catch (error) {
    console.error("Error fetching podcast episodes:", error)
    throw error
  }
}

/**
 * Get top podcasts by genre
 */
export async function getTopPodcasts(genreId = 1310, limit = 20) {
  try {
    const response = await fetch(`https://itunes.apple.com/us/rss/toppodcasts/limit=${limit}/genre=${genreId}/json`)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return data.feed.entry
  } catch (error) {
    console.error("Error fetching top podcasts:", error)
    throw error
  }
}

// Podcast genres mapping
export const podcastGenres = {
  Arts: 1301,
  Business: 1321,
  Comedy: 1303,
  Education: 1304,
  Fiction: 1483,
  "Health & Fitness": 1307,
  History: 1487,
  News: 1489,
  Science: 1533,
  "Society & Culture": 1324,
  Sports: 1545,
  Technology: 1318,
  "True Crime": 1488,
}

// Format duration from seconds to MM:SS format
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "00:00"

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
}

// Parse RSS feed to get more episode details
export async function parseRssFeed(feedUrl: string) {
  try {
    // Use a CORS proxy for client-side requests
    const corsProxy = "https://api.allorigins.win/raw?url="
    const response = await fetch(`${corsProxy}${encodeURIComponent(feedUrl)}`)

    if (!response.ok) {
      throw new Error(`RSS feed error: ${response.status}`)
    }

    const text = await response.text()
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(text, "text/xml")

    const items = xmlDoc.querySelectorAll("item")
    const episodes = Array.from(items).map((item) => {
      const title = item.querySelector("title")?.textContent || ""
      const description = item.querySelector("description")?.textContent || ""
      const pubDate = item.querySelector("pubDate")?.textContent || ""
      const duration = item.querySelector("itunes\\:duration")?.textContent || ""
      const enclosure = item.querySelector("enclosure")
      const audioUrl = enclosure?.getAttribute("url") || ""

      return {
        title,
        description,
        pubDate,
        duration,
        audioUrl,
      }
    })

    return episodes
  } catch (error) {
    console.error("Error parsing RSS feed:", error)
    return []
  }
}
