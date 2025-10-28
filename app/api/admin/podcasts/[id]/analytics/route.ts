import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminOnly } from "@/lib/auth/adminOnly"

// GET /api/admin/podcasts/[id]/analytics - Get podcast analytics
export const GET = adminOnly(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get("days") || "30")
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Get basic podcast info
    const podcast = await prisma.podcast.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        duration: true,
        _count: {
          select: {
            playbackProgress: true,
            favorites: true,
            comments: true,
            reviews: true
          }
        }
      }
    })

    if (!podcast) {
      return NextResponse.json(
        { error: "Podcast not found" },
        { status: 404 }
      )
    }

    // Get playback progress data for analytics
    const playbackData = await prisma.playbackProgress.findMany({
      where: {
        podcastId: id,
        updatedAt: {
          gte: startDate
        }
      },
      select: {
        position: true,
        updatedAt: true,
        userId: true
      }
    })

    // Calculate analytics
    const totalPlays = playbackData.length
    const uniqueListeners = new Set(playbackData.map(p => p.userId)).size
    const averageListenTime = playbackData.length > 0 
      ? playbackData.reduce((sum, p) => sum + p.position, 0) / playbackData.length 
      : 0
    const completionRate = playbackData.length > 0
      ? (playbackData.filter(p => p.position >= podcast.duration * 0.9).length / playbackData.length) * 100
      : 0

    // Generate mock daily plays data
    const playsByDate = Array.from({ length: days }, (_, i) => {
      const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000)
      const playsForDay = Math.floor(Math.random() * 50) + 10
      return {
        date: date.toISOString().split('T')[0],
        plays: playsForDay
      }
    })

    // Mock regional and device data
    const topRegions = [
      { region: "United States", plays: Math.floor(totalPlays * 0.4) },
      { region: "United Kingdom", plays: Math.floor(totalPlays * 0.2) },
      { region: "Canada", plays: Math.floor(totalPlays * 0.15) },
      { region: "Australia", plays: Math.floor(totalPlays * 0.1) },
      { region: "Germany", plays: Math.floor(totalPlays * 0.08) }
    ]

    const deviceTypes = [
      { type: "Mobile", count: Math.floor(totalPlays * 0.6) },
      { type: "Desktop", count: Math.floor(totalPlays * 0.25) },
      { type: "Tablet", count: Math.floor(totalPlays * 0.15) }
    ]

    const analytics = {
      totalPlays,
      uniqueListeners,
      averageListenTime,
      completionRate,
      playsByDate,
      topRegions,
      deviceTypes,
      engagement: {
        favorites: podcast._count.favorites,
        comments: podcast._count.comments,
        reviews: podcast._count.reviews,
        shares: Math.floor(Math.random() * 100) // Mock shares
      }
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching podcast analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
})