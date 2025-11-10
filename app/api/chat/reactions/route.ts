import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId, type, emoji } = await request.json()

    if (!messageId || !type) {
      return NextResponse.json({ error: "Message ID and reaction type required" }, { status: 400 })
    }

    // Get the current message
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    let updatedMessage

    if (type === 'like') {
      // Handle likes
      const currentLikedBy = message.likedBy ? JSON.parse(message.likedBy) : []
      const userIndex = currentLikedBy.indexOf(user.id)
      
      if (userIndex === -1) {
        // Add like
        currentLikedBy.push(user.id)
        updatedMessage = await prisma.chatMessage.update({
          where: { id: messageId },
          data: {
            likes: message.likes + 1,
            likedBy: JSON.stringify(currentLikedBy)
          }
        })
      } else {
        // Remove like
        currentLikedBy.splice(userIndex, 1)
        updatedMessage = await prisma.chatMessage.update({
          where: { id: messageId },
          data: {
            likes: Math.max(0, message.likes - 1),
            likedBy: JSON.stringify(currentLikedBy)
          }
        })
      }
    } else if (type === 'emoji' && emoji) {
      // Handle emoji reactions
      const currentEmojis = message.emojis ? JSON.parse(message.emojis) : {}
      
      if (!currentEmojis[emoji]) {
        currentEmojis[emoji] = 0
      }
      
      currentEmojis[emoji] += 1
      
      updatedMessage = await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          emojis: JSON.stringify(currentEmojis)
        }
      })
    } else {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: updatedMessage,
      type,
      emoji: emoji || null
    })

  } catch (error) {
    console.error("Chat reaction error:", error)
    return NextResponse.json(
      { error: "Failed to add reaction" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')
    const emoji = searchParams.get('emoji')

    if (!messageId || !emoji) {
      return NextResponse.json({ error: "Message ID and emoji required" }, { status: 400 })
    }

    // Get the current message
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Remove emoji reaction
    const currentEmojis = message.emojis ? JSON.parse(message.emojis) : {}
    
    if (currentEmojis[emoji] && currentEmojis[emoji] > 0) {
      currentEmojis[emoji] -= 1
      
      // Remove emoji if count reaches 0
      if (currentEmojis[emoji] === 0) {
        delete currentEmojis[emoji]
      }
      
      const updatedMessage = await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          emojis: JSON.stringify(currentEmojis)
        }
      })

      return NextResponse.json({
        success: true,
        message: updatedMessage
      })
    }

    return NextResponse.json({ error: "Emoji reaction not found" }, { status: 404 })

  } catch (error) {
    console.error("Remove reaction error:", error)
    return NextResponse.json(
      { error: "Failed to remove reaction" },
      { status: 500 }
    )
  }
}