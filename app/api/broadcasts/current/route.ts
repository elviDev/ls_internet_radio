import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get the current live broadcast with program information
    const liveBroadcast = await prisma.liveBroadcast.findFirst({
      where: {
        status: "LIVE",
      },
      include: {
        hostUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        banner: {
          select: {
            url: true,
            originalName: true,
          },
        },
        staff: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
        guests: true,
        // Include program/schedule information if available
        program: {
          select: {
            id: true,
            title: true,
            description: true,
            genre: true,
          }
        }
      },
      orderBy: {
        startTime: 'desc',
      },
    })

    if (!liveBroadcast) {
      // Check for any READY broadcasts that could go live
      const readyBroadcast = await prisma.liveBroadcast.findFirst({
        where: {
          status: "READY",
        },
        include: {
          hostUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      })
      
      if (readyBroadcast) {
        return NextResponse.json({ 
          isLive: false,
          upcoming: {
            id: readyBroadcast.id,
            title: readyBroadcast.title,
            description: readyBroadcast.description,
            startTime: readyBroadcast.startTime,
            host: `${readyBroadcast.hostUser.firstName} ${readyBroadcast.hostUser.lastName}`,
          },
          message: "Broadcast ready to go live" 
        })
      }
      
      return NextResponse.json({ 
        isLive: false,
        message: "No live broadcast currently active" 
      })
    }

    // Get current track information (this would typically come from your audio system)
    const currentTrack = {
      title: "Jazz Café Sessions",
      artist: "Various Artists", 
      duration: 240,
      progress: Math.floor(Math.random() * 240),
    }

    // Simulate listener count
    const listenerCount = Math.floor(Math.random() * 500) + 50

    const programInfo = {
      id: liveBroadcast.id,
      title: liveBroadcast.program?.title || liveBroadcast.title,
      description: liveBroadcast.program?.description || liveBroadcast.description,
      host: `${liveBroadcast.hostUser.firstName} ${liveBroadcast.hostUser.lastName}`,
      hostUser: liveBroadcast.hostUser,
      genre: liveBroadcast.program?.genre || "General",
      isLive: true,
      status: 'LIVE',
      startTime: liveBroadcast.startTime,
      endTime: liveBroadcast.endTime,
      currentTrack,
      listenerCount,
      staff: liveBroadcast.staff,
      guests: liveBroadcast.guests,
      banner: liveBroadcast.banner,
      streamUrl: `${process.env.NEXT_PUBLIC_REALTIME_SERVER_URL || 'http://localhost:3001'}/stream/broadcast/${liveBroadcast.id}/stream.mp3`
    }

    return NextResponse.json(programInfo)
  } catch (error) {
    console.error("Error fetching current program info:", error)
    return NextResponse.json(
      { error: "Failed to fetch current program information" },
      { status: 500 }
    )
  }
}

// Update current program information during broadcast
export async function PUT(req: Request) {
  try {
    const { broadcastId, programInfo } = await req.json()
    
    if (!broadcastId) {
      return NextResponse.json(
        { error: "Broadcast ID is required" },
        { status: 400 }
      )
    }

    // Update broadcast information
    const updatedBroadcast = await prisma.liveBroadcast.update({
      where: { id: broadcastId },
      data: {
        title: programInfo.title,
        description: programInfo.description,
        // Add any other fields that can be updated during broadcast
      }
    })

    // In a real implementation, you would also update the WebSocket server
    // to notify all connected listeners about the program info change

    return NextResponse.json({
      message: "Program information updated successfully",
      broadcast: updatedBroadcast
    })
  } catch (error) {
    console.error("Error updating program info:", error)
    return NextResponse.json(
      { error: "Failed to update program information" },
      { status: 500 }
    )
  }
}