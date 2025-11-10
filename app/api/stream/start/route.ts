import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { broadcastId, streamConfig } = await request.json()

    // Validate broadcast exists and user has permission
    const broadcast = await prisma.liveBroadcast.findUnique({
      where: { id: broadcastId },
      include: { hostUser: true }
    })

    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 })
    }

    if (broadcast.hostUser.id !== user.id) {
      return NextResponse.json({ error: "Not authorized for this broadcast" }, { status: 403 })
    }

    // Generate stream URL and key
    const streamKey = `stream_${broadcastId}_${Date.now()}`
    const streamUrl = `ws://localhost:3001/stream/${streamKey}`

    // Update broadcast status
    await prisma.liveBroadcast.update({
      where: { id: broadcastId },
      data: { 
        status: 'LIVE',
        startTime: new Date()
      }
    })

    return NextResponse.json({
      streamKey,
      streamUrl,
      status: 'LIVE',
      message: "Stream started successfully"
    })

  } catch (error) {
    console.error("Stream start error:", error)
    return NextResponse.json(
      { error: "Failed to start stream" },
      { status: 500 }
    )
  }
}