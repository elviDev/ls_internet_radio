// WebRTC Signaling Server for Live Audio Streaming
// This handles the peer-to-peer connection setup between broadcaster and listeners

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-broadcast' | 'leave-broadcast' | 'broadcast-started' | 'broadcast-ended'
  broadcastId: string
  userId: string
  data?: any
}

export interface BroadcastSession {
  broadcastId: string
  hostId: string
  isLive: boolean
  listeners: Set<string>
  createdAt: Date
}

class WebRTCSignalingManager {
  private socket: WebSocket | null = null
  private broadcastSessions = new Map<string, BroadcastSession>()
  private messageHandlers = new Map<string, (message: SignalingMessage) => void>()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor() {
    this.connect()
  }

  private connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/ws/broadcast`
      
      this.socket = new WebSocket(wsUrl)
      
      this.socket.onopen = () => {
        console.log('WebRTC Signaling connected')
        this.reconnectAttempts = 0
      }
      
      this.socket.onmessage = (event) => {
        try {
          const message: SignalingMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Failed to parse signaling message:', error)
        }
      }
      
      this.socket.onclose = () => {
        console.log('WebRTC Signaling disconnected')
        this.attemptReconnect()
      }
      
      this.socket.onerror = (error) => {
        console.error('WebRTC Signaling error:', error)
      }
    } catch (error) {
      console.error('Failed to connect to signaling server:', error)
      this.attemptReconnect()
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connect()
      }, delay)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  private handleMessage(message: SignalingMessage) {
    const handler = this.messageHandlers.get(message.type)
    if (handler) {
      handler(message)
    }
    
    // Update broadcast sessions
    switch (message.type) {
      case 'broadcast-started':
        this.broadcastSessions.set(message.broadcastId, {
          broadcastId: message.broadcastId,
          hostId: message.userId,
          isLive: true,
          listeners: new Set(),
          createdAt: new Date()
        })
        break
        
      case 'broadcast-ended':
        this.broadcastSessions.delete(message.broadcastId)
        break
        
      case 'join-broadcast':
        const session = this.broadcastSessions.get(message.broadcastId)
        if (session) {
          session.listeners.add(message.userId)
        }
        break
        
      case 'leave-broadcast':
        const leaveSession = this.broadcastSessions.get(message.broadcastId)
        if (leaveSession) {
          leaveSession.listeners.delete(message.userId)
        }
        break
    }
  }

  public sendMessage(message: SignalingMessage) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    } else {
      console.warn('Cannot send message: WebSocket not connected')
    }
  }

  public onMessage(type: string, handler: (message: SignalingMessage) => void) {
    this.messageHandlers.set(type, handler)
  }

  public removeMessageHandler(type: string) {
    this.messageHandlers.delete(type)
  }

  public getBroadcastSession(broadcastId: string): BroadcastSession | undefined {
    return this.broadcastSessions.get(broadcastId)
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
    this.messageHandlers.clear()
    this.broadcastSessions.clear()
  }
}

// Singleton instance
let signalingManager: WebRTCSignalingManager | null = null

export function getSignalingManager(): WebRTCSignalingManager {
  if (!signalingManager) {
    signalingManager = new WebRTCSignalingManager()
  }
  return signalingManager
}

export function destroySignalingManager() {
  if (signalingManager) {
    signalingManager.disconnect()
    signalingManager = null
  }
}