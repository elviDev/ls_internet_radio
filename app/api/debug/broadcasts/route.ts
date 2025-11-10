import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get all broadcasts to debug
    const allBroadcasts = await prisma.liveBroadcast.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        startTime: true,
        endTime: true,
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 10
    })

    return NextResponse.json({
      total: allBroadcasts.length,
      broadcasts: allBroadcasts,
      liveCount: allBroadcasts.filter(b => b.status === 'LIVE').length,
      readyCount: allBroadcasts.filter(b => b.status === 'READY').length,
    })
  } catch (error) {
    console.error("Error fetching debug broadcasts:", error)
    return NextResponse.json(
      { error: "Failed to fetch broadcasts" },
      { status: 500 }
    )
  }
}