import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { broadcastId, message, messageType = 'user', replyTo, userAvatar } = await request.json()

    // Create chat message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        broadcastId,
        userId: user.id,
        username: user.firstName + ' ' + user.lastName,
        userAvatar: userAvatar || null,
        content: message,
        messageType,
        replyTo: replyTo || null,
        timestamp: new Date()
      }
    })

    return NextResponse.json(chatMessage)

  } catch (error) {
    console.error("Chat message error:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const broadcastId = searchParams.get('broadcastId')

    if (!broadcastId) {
      return NextResponse.json({ error: "Broadcast ID required" }, { status: 400 })
    }

    const messages = await prisma.chatMessage.findMany({
      where: { broadcastId },
      include: {
        replyToMessage: {
          select: {
            id: true,
            username: true,
            content: true
          }
        },
        moderator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { timestamp: 'asc' },
      take: 100
    })

    return NextResponse.json(messages)

  } catch (error) {
    console.error("Get chat messages error:", error)
    return NextResponse.json(
      { error: "Failed to get messages" },
      { status: 500 }
    )
  }
}