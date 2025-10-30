// WebSocket server for real-time studio features
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'

export interface ChatMessage {
  id: string
  userId: string
  username: string
  content: string
  timestamp: Date
  type: 'user' | 'host' | 'moderator' | 'system' | 'announcement'
  broadcastId: string
}

export interface ListenerData {
  id: string
  broadcastId: string
  joinedAt: Date
  location: {
    city: string
    country: string
    countryCode: string
  }
  device: 'desktop' | 'mobile' | 'tablet'
  browser: string
}

export class StudioWebSocketServer {
  private io: SocketIOServer
  private listeners: Map<string, ListenerData> = new Map()
  private chatMessages: Map<string, ChatMessage[]> = new Map()

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' ? false : '*',
        methods: ['GET', 'POST']
      }
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      // Join broadcast room
      socket.on('join-broadcast', (broadcastId: string, userInfo: Partial<ListenerData>) => {
        socket.join(`broadcast-${broadcastId}`)
        
        const listener: ListenerData = {
          id: socket.id,
          broadcastId,
          joinedAt: new Date(),
          location: userInfo.location || { city: 'Unknown', country: 'Unknown', countryCode: 'XX' },
          device: userInfo.device || 'desktop',
          browser: userInfo.browser || 'Unknown'
        }
        
        this.listeners.set(socket.id, listener)
        this.broadcastListenerUpdate(broadcastId)
      })

      // Handle chat messages
      socket.on('chat-message', (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        const chatMessage: ChatMessage = {
          ...message,
          id: Date.now().toString(),
          timestamp: new Date()
        }

        if (!this.chatMessages.has(message.broadcastId)) {
          this.chatMessages.set(message.broadcastId, [])
        }
        
        this.chatMessages.get(message.broadcastId)!.push(chatMessage)
        
        // Broadcast to all listeners in the room
        this.io.to(`broadcast-${message.broadcastId}`).emit('new-chat-message', chatMessage)
      })

      // Handle stream status updates
      socket.on('stream-status', (broadcastId: string, status: any) => {
        socket.to(`broadcast-${broadcastId}`).emit('stream-status-update', status)
      })

      // Handle analytics updates
      socket.on('analytics-update', (broadcastId: string, analytics: any) => {
        socket.to(`broadcast-${broadcastId}`).emit('analytics-data', analytics)
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        const listener = this.listeners.get(socket.id)
        if (listener) {
          this.listeners.delete(socket.id)
          this.broadcastListenerUpdate(listener.broadcastId)
        }
        console.log('Client disconnected:', socket.id)
      })
    })
  }

  private broadcastListenerUpdate(broadcastId: string) {
    const broadcastListeners = Array.from(this.listeners.values())
      .filter(l => l.broadcastId === broadcastId)
    
    this.io.to(`broadcast-${broadcastId}`).emit('listener-count-update', {
      count: broadcastListeners.length,
      listeners: broadcastListeners
    })
  }

  // Public methods for external use
  public sendChatMessage(broadcastId: string, message: ChatMessage) {
    if (!this.chatMessages.has(broadcastId)) {
      this.chatMessages.set(broadcastId, [])
    }
    
    this.chatMessages.get(broadcastId)!.push(message)
    this.io.to(`broadcast-${broadcastId}`).emit('new-chat-message', message)
  }

  public getListenerCount(broadcastId: string): number {
    return Array.from(this.listeners.values())
      .filter(l => l.broadcastId === broadcastId).length
  }

  public getChatMessages(broadcastId: string): ChatMessage[] {
    return this.chatMessages.get(broadcastId) || []
  }
}