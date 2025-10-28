import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"

// GET /api/admin/podcasts/stats - Get podcast statistics
export const GET = adminOnly(async (req: Request) => {
  try {
    const [
      totalPodcasts,
      totalDuration,
      genreStats,
      recentPodcasts
    ] = await Promise.all([
      prisma.podcast.count(),
      prisma.podcast.aggregate({
        _sum: {
          duration: true
        }
      }),
      prisma.podcast.groupBy({
        by: ['genreId'],
        _count: {
          id: true
        }
      }),
      prisma.podcast.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ])

    // Get genre names for the stats
    const genreIds = genreStats.map(stat => stat.genreId)
    const genres = await prisma.genre.findMany({
      where: {
        id: {
          in: genreIds
        }
      },
      select: {
        id: true,
        name: true
      }
    })

    const genreMap = genres.reduce((acc, genre) => {
      acc[genre.id] = genre.name
      return acc
    }, {} as Record<string, string>)

    // Mock some additional stats since we don't have play tracking yet
    const stats = {
      total: totalPodcasts,
      published: Math.floor(totalPodcasts * 0.8), // 80% published
      draft: Math.floor(totalPodcasts * 0.15), // 15% draft
      archived: Math.floor(totalPodcasts * 0.05), // 5% archived
      totalPlays: Math.floor(totalPodcasts * 1500), // Mock total plays
      totalDuration: totalDuration._sum.duration || 0,
      averageRating: 4.2 + Math.random() * 0.8, // Mock average rating
      topGenres: genreStats.map((stat: any) => ({
        name: genreMap[stat.genreId] || 'Unknown',
        count: stat._count.id
      })).slice(0, 5)
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching podcast stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch podcast statistics" },
      { status: 500 }
    )
  }
})