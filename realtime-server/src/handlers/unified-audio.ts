import { Server, Socket } from 'socket.io'
import { 
  BroadcastSession, 
  ConnectionInfo, 
  AudioSourceInfo, 
  CallRequest, 
  ActiveCall,
  BroadcasterInfo 
} from '../types'
import { broadcastAudioData } from '../routes/stream'

const activeBroadcasts = new Map<string, BroadcastSession>()
const activeConnections = new Map<string, ConnectionInfo>()

class BroadcastManager {
  constructor(
    public broadcastId: string,
    public broadcasterInfo: BroadcasterInfo
  ) {}

  createSession(): BroadcastSession {
    return {
      broadcastId: this.broadcastId,
      broadcaster: null,
      broadcasterInfo: this.broadcasterInfo,
      listeners: new Set(),
      audioSources: new Map(),
      callQueue: [],
      activeCalls: new Map(),
      isLive: false,
      stats: {
        startTime: new Date(),
        peakListeners: 0,
        totalCalls: 0,
        totalMessages: 0
      }
    }
  }

  addAudioSource(sourceId: string, sourceInfo: Omit<AudioSourceInfo, 'id' | 'addedAt'>): void {
    const broadcast = activeBroadcasts.get(this.broadcastId)
    if (!broadcast) return

    broadcast.audioSources.set(sourceId, {
      id: sourceId,
      addedAt: new Date(),
      ...sourceInfo
    })
    console.log(`🎤 Added audio source ${sourceId} to broadcast ${this.broadcastId}`)
  }

  removeAudioSource(sourceId: string): void {
    const broadcast = activeBroadcasts.get(this.broadcastId)
    if (!broadcast) return

    broadcast.audioSources.delete(sourceId)
    console.log(`🔇 Removed audio source ${sourceId} from broadcast ${this.broadcastId}`)
  }

  updateAudioSource(sourceId: string, updates: Partial<AudioSourceInfo>): void {
    const broadcast = activeBroadcasts.get(this.broadcastId)
    if (!broadcast) return

    const source = broadcast.audioSources.get(sourceId)
    if (source) {
      Object.assign(source, updates)
      console.log(`🎛️ Updated audio source ${sourceId}:`, updates)
    }
  }

  addListener(socketId: string): void {
    const broadcast = activeBroadcasts.get(this.broadcastId)
    if (!broadcast) return

    broadcast.listeners.add(socketId)
    if (broadcast.listeners.size > broadcast.stats.peakListeners) {
      broadcast.stats.peakListeners = broadcast.listeners.size
    }
  }

  removeListener(socketId: string): void {
    const broadcast = activeBroadcasts.get(this.broadcastId)
    if (!broadcast) return

    broadcast.listeners.delete(socketId)
  }

  getStats() {
    const broadcast = activeBroadcasts.get(this.broadcastId)
    if (!broadcast) return null

    return {
      broadcastId: this.broadcastId,
      isLive: broadcast.isLive,
      listeners: broadcast.listeners.size,
      peakListeners: broadcast.stats.peakListeners,
      audioSources: broadcast.audioSources.size,
      activeCalls: broadcast.activeCalls.size,
      callQueue: broadcast.callQueue.length,
      uptime: Date.now() - broadcast.stats.startTime.getTime()
    }
  }
}

export default function unifiedAudioHandler(io: Server) {
  console.log('🎚️ Initializing Unified Audio Handler')

  io.on('connection', (socket: Socket) => {
    console.log('🔗 Client connected:', socket.id)
    
    activeConnections.set(socket.id, {
      broadcastId: null,
      role: null,
      connectionTime: new Date(),
      lastActivity: new Date()
    })

    // Broadcaster joins with audio system
    socket.on('join-as-broadcaster', (broadcastId: string, broadcasterInfo: Partial<BroadcasterInfo> = {}) => {
      console.log('🎙️ Broadcaster joining:', broadcastId, broadcasterInfo)
      
      socket.join(`broadcast-${broadcastId}`)
      
      const connection = activeConnections.get(socket.id)
      if (connection) {
        connection.broadcastId = broadcastId
        connection.role = 'broadcaster'
      }

      let broadcast = activeBroadcasts.get(broadcastId)
      if (!broadcast) {
        const manager = new BroadcastManager(broadcastId, {
          username: broadcasterInfo.username || 'Radio Host',
          stationName: broadcasterInfo.stationName || 'LS Radio',
          ...broadcasterInfo
        })
        broadcast = manager.createSession()
        activeBroadcasts.set(broadcastId, broadcast)
      }

      broadcast.broadcaster = socket.id
      broadcast.isLive = true

      socket.emit('broadcaster-ready', {
        broadcastId,
        capabilities: ['multi-host', 'audio-mixing', 'call-management', 'chat'],
        serverTime: new Date().toISOString()
      })

      console.log(`📻 Broadcast ${broadcastId} is now live with unified audio system`)
    })

    // Listener joins broadcast
    socket.on('join-broadcast', (broadcastId: string, listenerInfo: any = {}) => {
      console.log(`👥 Listener ${socket.id} joining broadcast: ${broadcastId}`)
      
      socket.join(`broadcast-${broadcastId}`)
      console.log(`🏠 Socket ${socket.id} joined room: broadcast-${broadcastId}`)
      
      const connection = activeConnections.get(socket.id)
      if (connection) {
        connection.broadcastId = broadcastId
        connection.role = 'listener'
      }

      const broadcast = activeBroadcasts.get(broadcastId)
      if (broadcast) {
        const manager = new BroadcastManager(broadcastId, broadcast.broadcasterInfo)
        manager.addListener(socket.id)
        
        console.log(`📊 Broadcast ${broadcastId} now has ${broadcast.listeners.size} listeners (broadcaster: ${broadcast.broadcaster})`)
        
        socket.emit('broadcast-info', {
          broadcastId,
          broadcasterInfo: broadcast.broadcasterInfo,
          isLive: broadcast.isLive,
          stats: manager.getStats()
        })

        io.to(`broadcast-${broadcastId}`).emit('listener-count', {
          count: broadcast.listeners.size,
          peak: broadcast.stats.peakListeners
        })
      } else {
        console.warn(`⚠️ No active broadcast found for ID: ${broadcastId}`)
      }
    })

    // Handle audio streaming from broadcaster
    socket.on('broadcast-audio', (broadcastId: string, audioData: any) => {
      const broadcast = activeBroadcasts.get(broadcastId)
      if (broadcast && broadcast.broadcaster === socket.id) {
        console.log(`🎵 Relaying audio from broadcaster ${socket.id} to ${broadcast.listeners.size} listeners in room broadcast-${broadcastId}`)
        
        // Send to WebRTC listeners in the broadcast room (excluding broadcaster)
        socket.to(`broadcast-${broadcastId}`).emit('audio-stream', {
          audio: audioData.audio,
          timestamp: audioData.timestamp,
          metrics: audioData.metrics,
          broadcasterInfo: broadcast.broadcasterInfo
        })
        
        // Also send to HTTP stream listeners
        if (audioData.audio) {
          try {
            // Convert base64 to Buffer
            const audioBuffer = Buffer.from(audioData.audio, 'base64')
            broadcastAudioData(broadcastId, audioBuffer)
          } catch (error) {
            console.error('Failed to convert audio data for HTTP stream:', error)
          }
        }
        
        console.log(`📡 Audio relayed to room broadcast-${broadcastId}`)
      } else if (!broadcast) {
        console.warn(`⚠️ No broadcast found for ID: ${broadcastId}`)
      } else if (broadcast.broadcaster !== socket.id) {
        console.warn(`⚠️ Audio from non-broadcaster ${socket.id} (expected ${broadcast.broadcaster}) for broadcast ${broadcastId}`)
      }
    })

    // Audio source management
    socket.on('add-audio-source', (broadcastId: string, sourceInfo: any) => {
      const broadcast = activeBroadcasts.get(broadcastId)
      if (broadcast && broadcast.broadcaster === socket.id) {
        const sourceId = `${sourceInfo.type}_${sourceInfo.id || socket.id}`
        const manager = new BroadcastManager(broadcastId, broadcast.broadcasterInfo)
        
        manager.addAudioSource(sourceId, {
          ...sourceInfo,
          socketId: socket.id
        })

        io.to(`broadcast-${broadcastId}`).emit('audio-source-added', {
          broadcastId,
          sourceId,
          sourceInfo
        })
      }
    })

    // Call management
    socket.on('request-call', (broadcastId: string, callerInfo: any) => {
      console.log('📞 Call request for broadcast:', broadcastId, callerInfo)
      
      const broadcast = activeBroadcasts.get(broadcastId)
      if (!broadcast) {
        socket.emit('call-error', { message: 'Broadcast not found' })
        return
      }

      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const callRequest: CallRequest = {
        callId,
        callerId: socket.id,
        callerName: callerInfo.name || 'Anonymous Caller',
        callerLocation: callerInfo.location || 'Unknown',
        requestTime: new Date(),
        status: 'pending'
      }

      broadcast.callQueue.push(callRequest)
      
      if (broadcast.broadcaster) {
        io.to(broadcast.broadcaster).emit('incoming-call', callRequest)
      }
      
      socket.emit('call-pending', { 
        callId, 
        position: broadcast.callQueue.length 
      })

      console.log(`📞 Call ${callId} queued for broadcast ${broadcastId}`)
    })

    socket.on('accept-call', (callId: string) => {
      console.log('✅ Accepting call:', callId)
      
      for (const [broadcastId, broadcast] of activeBroadcasts.entries()) {
        if (broadcast.broadcaster === socket.id) {
          const callIndex = broadcast.callQueue.findIndex(call => call.callId === callId)
          if (callIndex !== -1) {
            const callRequest = broadcast.callQueue[callIndex]
            
            const activeCall: ActiveCall = {
              ...callRequest,
              status: 'accepted',
              acceptTime: new Date(),
              socketId: callRequest.callerId
            }
            
            broadcast.activeCalls.set(callRequest.callerId, activeCall)
            broadcast.callQueue.splice(callIndex, 1)

            const manager = new BroadcastManager(broadcastId, broadcast.broadcasterInfo)
            manager.addAudioSource(`caller_${callRequest.callerId}`, {
              type: 'caller',
              name: callRequest.callerName,
              volume: 0.8,
              isMuted: false,
              isActive: true,
              priority: 3,
              socketId: callRequest.callerId
            })

            io.to(callRequest.callerId).emit('call-accepted', {
              callId,
              broadcasterId: socket.id,
              instructions: 'You are now live on air. Speak clearly!'
            })

            broadcast.stats.totalCalls++
            break
          }
        }
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id)
      
      for (const [broadcastId, broadcast] of activeBroadcasts.entries()) {
        if (broadcast.broadcaster === socket.id) {
          console.log('📻 Broadcaster disconnected, ending broadcast:', broadcastId)
          
          io.to(`broadcast-${broadcastId}`).emit('broadcast-ended', {
            reason: 'Host disconnected',
            stats: new BroadcastManager(broadcastId, broadcast.broadcasterInfo).getStats(),
            endTime: new Date().toISOString()
          })
          
          for (const [callerId, call] of broadcast.activeCalls.entries()) {
            io.to(callerId).emit('call-ended', {
              callId: call.callId,
              reason: 'Broadcast ended'
            })
          }
          
          activeBroadcasts.delete(broadcastId)
          
        } else if (broadcast.listeners.has(socket.id)) {
          const manager = new BroadcastManager(broadcastId, broadcast.broadcasterInfo)
          manager.removeListener(socket.id)
          
          io.to(`broadcast-${broadcastId}`).emit('listener-count', {
            count: broadcast.listeners.size,
            peak: broadcast.stats.peakListeners
          })
        }
      }
      
      activeConnections.delete(socket.id)
    })
  })

  // Periodic cleanup and stats
  setInterval(() => {
    const now = new Date()
    
    for (const [broadcastId, broadcast] of activeBroadcasts.entries()) {
      broadcast.callQueue = broadcast.callQueue.filter(call => {
        const age = now.getTime() - call.requestTime.getTime()
        if (age > 5 * 60 * 1000) {
          io.to(call.callerId).emit('call-timeout', {
            callId: call.callId,
            reason: 'Request timed out'
          })
          return false
        }
        return true
      })
    }
    
    const stats = {
      activeBroadcasts: activeBroadcasts.size,
      totalConnections: activeConnections.size,
      totalListeners: Array.from(activeBroadcasts.values()).reduce((sum, b) => sum + b.listeners.size, 0),
      totalCalls: Array.from(activeBroadcasts.values()).reduce((sum, b) => sum + b.activeCalls.size, 0),
      uptime: process.uptime()
    }
    
    io.emit('server-stats', stats)
  }, 30000)

  return {
    getBroadcast: (broadcastId: string) => activeBroadcasts.get(broadcastId),
    getAllBroadcasts: () => Array.from(activeBroadcasts.values()),
    getStats: () => ({
      activeBroadcasts: activeBroadcasts.size,
      totalConnections: activeConnections.size
    })
  }
}