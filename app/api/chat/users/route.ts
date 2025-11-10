import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { broadcastId, action, targetUserId, duration, reason } = await request.json()

    if (!broadcastId || !action || !targetUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user is staff with moderation permissions
    if (!user.id) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    let expiresAt = null
    if (duration && action === 'timeout') {
      expiresAt = new Date(Date.now() + duration * 60 * 1000) // duration in minutes
    }

    // Create moderation action
    const moderationAction = await prisma.chatModerationAction.create({
      data: {
        broadcastId,
        targetUserId,
        moderatorId: user.id,
        actionType: action,
        reason: reason || null,
        duration: duration || null,
        expiresAt
      }
    })

    // Update user session if exists
    const userSession = await prisma.chatUserSession.findUnique({
      where: {
        broadcastId_userId: {
          broadcastId,
          userId: targetUserId
        }
      }
    })

    if (userSession) {
      let updateData: any = {}
      
      switch (action) {
        case 'mute':
          updateData.isMuted = true
          break
        case 'unmute':
          updateData.isMuted = false
          break
        case 'ban':
          updateData.isBanned = true
          updateData.leftAt = new Date()
          break
        case 'unban':
          updateData.isBanned = false
          updateData.leftAt = null
          break
        case 'timeout':
          updateData.isMuted = true
          break
      }

      await prisma.chatUserSession.update({
        where: { id: userSession.id },
        data: updateData
      })
    }

    return NextResponse.json({
      success: true,
      action: moderationAction,
      message: `User ${action}ed successfully`
    })

  } catch (error) {
    console.error("Chat user moderation error:", error)
    return NextResponse.json(
      { error: "Failed to moderate user" },
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

    // Get active users in the broadcast
    const activeUsers = await prisma.chatUserSession.findMany({
      where: { 
        broadcastId,
        isOnline: true
      },
      orderBy: { joinedAt: 'desc' }
    })

    // Get recent chat activity stats
    const recentMessages = await prisma.chatMessage.findMany({
      where: {
        broadcastId,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        userId: true,
        messageType: true,
        timestamp: true
      }
    })

    // Calculate user activity stats
    const userStats = recentMessages.reduce((acc, msg) => {
      if (!acc[msg.userId]) {
        acc[msg.userId] = { messageCount: 0, lastMessage: msg.timestamp }
      }
      acc[msg.userId].messageCount++
      if (msg.timestamp > acc[msg.userId].lastMessage) {
        acc[msg.userId].lastMessage = msg.timestamp
      }
      return acc
    }, {} as Record<string, { messageCount: number; lastMessage: Date }>)

    // Combine user sessions with stats
    const usersWithStats = activeUsers.map(user => ({
      ...user,
      stats: userStats[user.userId] || { messageCount: 0, lastMessage: user.joinedAt }
    }))

    return NextResponse.json({
      users: usersWithStats,
      totalOnline: activeUsers.length,
      totalMessages: recentMessages.length
    })

  } catch (error) {
    console.error("Get chat users error:", error)
    return NextResponse.json(
      { error: "Failed to get chat users" },
      { status: 500 }
    )
  }
}