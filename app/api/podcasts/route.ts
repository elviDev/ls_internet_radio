import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/podcasts - Get podcasts for public display
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const featured = searchParams.get("featured") === "true"
    const limit = parseInt(searchParams.get("limit") || "10")
    
    const podcasts = await prisma.podcast.findMany({
      where: {
        status: "PUBLISHED" // Only show published podcasts
      },
      include: {
        author: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            profileImage: true 
          }
        },
        genre: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            episodes: true,
            favorites: true
          }
        }
      },
      orderBy: featured 
        ? [
            { favorites: { _count: "desc" } }, // Most favorited first
            { createdAt: "desc" }
          ]
        : { createdAt: "desc" },
      take: limit
    })

    // Get latest episode for each podcast
    const podcastsWithLatestEpisode = await Promise.all(
      podcasts.map(async (podcast) => {
        const latestEpisode = await prisma.podcastEpisode.findFirst({
          where: {
            podcastId: podcast.id,
            status: "PUBLISHED"
          },
          orderBy: { publishedAt: "desc" },
          select: {
            id: true,
            title: true,
            duration: true,
            publishedAt: true
          }
        })

        return {
          id: podcast.id,
          title: podcast.title,
          slug: podcast.slug,
          description: podcast.description,
          category: podcast.category,
          image: podcast.image,
          status: podcast.status,
          host: {
            name: podcast.host, // String field from schema
            author: podcast.author ? {
              id: podcast.author.id,
              name: `${podcast.author.firstName} ${podcast.author.lastName}`,
              profileImage: podcast.author.profileImage
            } : null
          },
          genre: podcast.genre,
          stats: {
            episodes: podcast._count.episodes,
            favorites: podcast._count.favorites
          },
          latestEpisode,
          createdAt: podcast.createdAt,
          updatedAt: podcast.updatedAt
        }
      })
    )

    return NextResponse.json({
      podcasts: podcastsWithLatestEpisode,
      count: podcastsWithLatestEpisode.length
    })
  } catch (error) {
    console.error("Error fetching podcasts:", error)
    return NextResponse.json(
      { error: "Failed to fetch podcasts" },
      { status: 500 }
    )
  }
}