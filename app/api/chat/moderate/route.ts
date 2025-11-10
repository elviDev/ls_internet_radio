import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is staff with moderation permissions
    if (!user.id) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { messageId, action, reason } = await request.json()

    if (!messageId || !action) {
      return NextResponse.json({ error: "Message ID and action required" }, { status: 400 })
    }

    // Update the message based on action
    let updateData: any = {}
    
    switch (action) {
      case 'hide':
      case 'delete':
        updateData = {
          isModerated: true,
          moderationReason: reason || 'Message removed by moderator',
          moderatedBy: user.id,
          moderatedAt: new Date()
        }
        break
      case 'pin':
        updateData = { isPinned: true }
        break
      case 'unpin':
        updateData = { isPinned: false }
        break
      case 'highlight':
        updateData = { isHighlighted: true }
        break
      case 'unhighlight':
        updateData = { isHighlighted: false }
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const moderatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: updateData
    })

    // Create moderation action record
    await prisma.chatModerationAction.create({
      data: {
        broadcastId: moderatedMessage.broadcastId,
        messageId: messageId,
        targetUserId: moderatedMessage.userId,
        moderatorId: user.id,
        actionType: action,
        reason: reason || null
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: moderatedMessage,
      action: action
    })

  } catch (error) {
    console.error("Chat moderation error:", error)
    return NextResponse.json(
      { error: "Failed to moderate message" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const broadcastId = searchParams.get('broadcastId')

    if (!broadcastId) {
      return NextResponse.json({ error: "Broadcast ID required" }, { status: 400 })
    }

    // Get moderation actions for the broadcast
    const moderationActions = await prisma.chatModerationAction.findMany({
      where: { 
        broadcastId,
        isActive: true 
      },
      include: {
        message: true,
        moderator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json(moderationActions)

  } catch (error) {
    console.error("Get moderation actions error:", error)
    return NextResponse.json(
      { error: "Failed to get moderation actions" },
      { status: 500 }
    )
  }
}