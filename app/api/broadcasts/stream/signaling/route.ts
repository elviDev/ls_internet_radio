import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"

// In-memory storage for signaling messages (in production, use Redis or WebSocket server)
const signalingMessages = new Map<string, any[]>()
const activeBroadcasts = new Map<string, { hostId: string, listeners: Set<string> }>()

// POST /api/broadcasts/stream/signaling - Send signaling message
export async function POST(req: Request) {
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

    const { type, data, targetId } = await req.json()

    // Store the signaling message
    const messageKey = targetId ? `${broadcastId}_${targetId}` : broadcastId
    if (!signalingMessages.has(messageKey)) {
      signalingMessages.set(messageKey, [])
    }

    const message = {
      type,
      data,
      senderId: user.id,
      targetId,
      timestamp: Date.now()
    }

    signalingMessages.get(messageKey)!.push(message)

    // Track active broadcast participants
    if (!activeBroadcasts.has(broadcastId)) {
      activeBroadcasts.set(broadcastId, { hostId: user.id, listeners: new Set() })
    }

    const broadcast = activeBroadcasts.get(broadcastId)!
    if (type === 'offer' || type === 'join-as-host') {
      broadcast.hostId = user.id
    } else if (type === 'answer' || type === 'join-as-listener') {
      broadcast.listeners.add(user.id)
    }

    // Clean up old messages (keep only last 50 per channel)
    const messages = signalingMessages.get(messageKey)!
    if (messages.length > 50) {
      messages.splice(0, messages.length - 50)
    }

    return NextResponse.json({ 
      message: "Signaling message sent successfully",
      messageId: message.timestamp
    })
  } catch (error) {
    console.error("Error handling signaling message:", error)
    return NextResponse.json(
      { error: "Failed to process signaling message" },
      { status: 500 }
    )
  }
}

// GET /api/broadcasts/stream/signaling - Get signaling messages
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const broadcastId = searchParams.get("broadcastId")
    const since = searchParams.get("since") // timestamp
    
    if (!broadcastId) {
      return NextResponse.json(
        { error: "Broadcast ID is required" },
        { status: 400 }
      )
    }

    // Get messages for this user
    const userMessageKey = `${broadcastId}_${user.id}`
    const broadcastMessageKey = broadcastId
    
    const userMessages = signalingMessages.get(userMessageKey) || []
    const broadcastMessages = signalingMessages.get(broadcastMessageKey) || []
    
    // Filter messages since timestamp if provided
    const sinceTimestamp = since ? parseInt(since) : 0
    
    const filteredUserMessages = userMessages.filter(msg => 
      msg.timestamp > sinceTimestamp && msg.senderId !== user.id
    )
    
    const filteredBroadcastMessages = broadcastMessages.filter(msg => 
      msg.timestamp > sinceTimestamp && msg.senderId !== user.id && !msg.targetId
    )

    const allMessages = [...filteredUserMessages, ...filteredBroadcastMessages]
      .sort((a, b) => a.timestamp - b.timestamp)

    // Get broadcast info
    const broadcastInfo = activeBroadcasts.get(broadcastId)
    
    return NextResponse.json({
      messages: allMessages,
      broadcastInfo: broadcastInfo ? {
        hostId: broadcastInfo.hostId,
        listenerCount: broadcastInfo.listeners.size,
        isHost: broadcastInfo.hostId === user.id
      } : null
    })
  } catch (error) {
    console.error("Error fetching signaling messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch signaling messages" },
      { status: 500 }
    )
  }
}

// DELETE /api/broadcasts/stream/signaling - Leave broadcast
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

    // Remove user from active broadcast
    const broadcast = activeBroadcasts.get(broadcastId)
    if (broadcast) {
      broadcast.listeners.delete(user.id)
      
      // If host leaves, end the broadcast
      if (broadcast.hostId === user.id) {
        activeBroadcasts.delete(broadcastId)
        // Clean up all messages for this broadcast
        const keysToDelete = []
        for (const key of signalingMessages.keys()) {
          if (key.startsWith(broadcastId)) {
            keysToDelete.push(key)
          }
        }
        keysToDelete.forEach(key => signalingMessages.delete(key))
      }
    }

    // Clean up user-specific messages
    const userMessageKey = `${broadcastId}_${user.id}`
    signalingMessages.delete(userMessageKey)

    return NextResponse.json({ message: "Left broadcast successfully" })
  } catch (error) {
    console.error("Error leaving broadcast:", error)
    return NextResponse.json(
      { error: "Failed to leave broadcast" },
      { status: 500 }
    )
  }
}