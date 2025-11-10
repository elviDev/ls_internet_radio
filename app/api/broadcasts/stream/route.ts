import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"

// GET /api/broadcasts/stream - Get streaming information for a broadcast
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const broadcastId = searchParams.get("broadcastId")
    
    if (!broadcastId) {
      return NextResponse.json(
        { error: "Broadcast ID is required" },
        { status: 400 }
      )
    }

    // Get broadcast information
    const broadcast = await prisma.liveBroadcast.findUnique({
      where: { id: broadcastId },
      include: {
        hostUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!broadcast) {
      return NextResponse.json(
        { error: "Broadcast not found" },
        { status: 404 }
      )
    }

    // Check if broadcast is live
    const isLive = broadcast.status === "LIVE"
    
    return NextResponse.json({
      broadcastId: broadcast.id,
      title: broadcast.title,
      isLive,
      host: broadcast.hostUser,
      startTime: broadcast.startTime,
      endTime: broadcast.endTime,
      streamUrl: broadcast.streamUrl,
      // WebRTC signaling endpoint
      signalingUrl: `/api/broadcasts/stream/signaling?broadcastId=${broadcastId}`
    })
  } catch (error) {
    console.error("Error fetching broadcast stream info:", error)
    return NextResponse.json(
      { error: "Failed to fetch broadcast stream information" },
      { status: 500 }
    )
  }
}

// POST /api/broadcasts/stream - Start streaming for a broadcast
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { broadcastId } = await req.json()
    
    if (!broadcastId) {
      return NextResponse.json(
        { error: "Broadcast ID is required" },
        { status: 400 }
      )
    }

    // Verify user is the host of this broadcast
    const broadcast = await prisma.liveBroadcast.findUnique({
      where: { id: broadcastId },
      include: {
        hostUser: true
      }
    })

    if (!broadcast) {
      return NextResponse.json(
        { error: "Broadcast not found" },
        { status: 404 }
      )
    }

    if (broadcast.hostId !== user.id) {
      return NextResponse.json(
        { error: "Only the host can start streaming" },
        { status: 403 }
      )
    }

    // Update broadcast status to LIVE
    const updatedBroadcast = await prisma.liveBroadcast.update({
      where: { id: broadcastId },
      data: {
        status: "LIVE",
        startTime: broadcast.startTime || new Date()
      }
    })

    // TODO: Create broadcast session in WebSocket server
    // This would typically notify the WebSocket server to start accepting connections
    
    return NextResponse.json({
      message: "Streaming started successfully",
      broadcast: updatedBroadcast,
      streamId: `stream_${broadcastId}_${Date.now()}`
    })
  } catch (error) {
    console.error("Error starting broadcast stream:", error)
    return NextResponse.json(
      { error: "Failed to start broadcast stream" },
      { status: 500 }
    )
  }
}

// DELETE /api/broadcasts/stream - Stop streaming for a broadcast  
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const broadcastId = searchParams.get("broadcastId")
    
    if (!broadcastId) {
      return NextResponse.json(
        { error: "Broadcast ID is required" },
        { status: 400 }
      )
    }

    // Verify user is the host of this broadcast
    const broadcast = await prisma.liveBroadcast.findUnique({
      where: { id: broadcastId },
      include: {
        hostUser: true
      }
    })

    if (!broadcast) {
      return NextResponse.json(
        { error: "Broadcast not found" },
        { status: 404 }
      )
    }

    if (broadcast.hostId !== user.id) {
      return NextResponse.json(
        { error: "Only the host can stop streaming" },
        { status: 403 }
      )
    }

    // Update broadcast status to ENDED
    const updatedBroadcast = await prisma.liveBroadcast.update({
      where: { id: broadcastId },
      data: {
        status: "ENDED",
        endTime: new Date()
      }
    })

    // TODO: End broadcast session in WebSocket server
    // This would typically notify the WebSocket server to close all connections
    
    return NextResponse.json({
      message: "Streaming stopped successfully",
      broadcast: updatedBroadcast
    })
  } catch (error) {
    console.error("Error stopping broadcast stream:", error)
    return NextResponse.json(
      { error: "Failed to stop broadcast stream" },
      { status: 500 }
    )
  }
}