// Unified Audio Handler - Consolidates all audio processing functionality
// Handles broadcasting, mixing, WebRTC signaling, and call management

const activeBroadcasts = new Map() // broadcastId -> BroadcastSession
const activeConnections = new Map() // socketId -> ConnectionInfo
const callQueues = new Map() // broadcastId -> CallQueue[]

class BroadcastSession {
  constructor(broadcastId, broadcasterInfo) {
    this.broadcastId = broadcastId
    this.broadcaster = null
    this.broadcasterInfo = broadcasterInfo
    this.listeners = new Set()
    this.audioSources = new Map() // sourceId -> AudioSourceInfo
    this.callQueue = []
    this.activeCalls = new Map()
    this.isLive = false
    this.stats = {
      startTime: new Date(),
      peakListeners: 0,
      totalCalls: 0,
      totalMessages: 0
    }
  }

  addAudioSource(sourceId, sourceInfo) {
    this.audioSources.set(sourceId, {
      id: sourceId,
      type: sourceInfo.type,
      name: sourceInfo.name,
      volume: sourceInfo.volume || 1.0,
      isMuted: sourceInfo.isMuted || false,
      isActive: sourceInfo.isActive || true,
      priority: sourceInfo.priority || 5,
      socketId: sourceInfo.socketId,
      addedAt: new Date()
    })
    console.log(`🎤 Added audio source ${sourceId} to broadcast ${this.broadcastId}`)
  }

  removeAudioSource(sourceId) {
    if (this.audioSources.has(sourceId)) {
      this.audioSources.delete(sourceId)
      console.log(`🔇 Removed audio source ${sourceId} from broadcast ${this.broadcastId}`)
    }
  }

  updateAudioSource(sourceId, updates) {
    if (this.audioSources.has(sourceId)) {
      const source = this.audioSources.get(sourceId)
      Object.assign(source, updates)
      console.log(`🎛️ Updated audio source ${sourceId}:`, updates)
    }
  }

  addListener(socketId, listenerInfo) {
    this.listeners.add(socketId)
    if (this.listeners.size > this.stats.peakListeners) {
      this.stats.peakListeners = this.listeners.size
    }
  }

  removeListener(socketId) {
    this.listeners.delete(socketId)
  }

  getStats() {
    return {
      broadcastId: this.broadcastId,
      isLive: this.isLive,
      listeners: this.listeners.size,
      peakListeners: this.stats.peakListeners,
      audioSources: this.audioSources.size,
      activeCalls: this.activeCalls.size,
      callQueue: this.callQueue.length,
      uptime: Date.now() - this.stats.startTime.getTime()
    }
  }
}

module.exports = (io) => {
  console.log('🎚️ Initializing Unified Audio Handler')

  io.on('connection', (socket) => {
    console.log('🔗 Client connected:', socket.id)
    
    activeConnections.set(socket.id, {
      broadcastId: null,
      role: null,
      connectionTime: new Date(),
      lastActivity: new Date()
    })

    // Broadcaster joins with audio system
    socket.on('join-as-broadcaster', (broadcastId, broadcasterInfo = {}) => {
      console.log('🎙️ Broadcaster joining:', broadcastId, broadcasterInfo)
      
      socket.join(`broadcast-${broadcastId}`)
      
      // Update connection info
      const connection = activeConnections.get(socket.id)
      if (connection) {
        connection.broadcastId = broadcastId
        connection.role = 'broadcaster'
      }

      // Create or get broadcast session
      let broadcast = activeBroadcasts.get(broadcastId)
      if (!broadcast) {
        broadcast = new BroadcastSession(broadcastId, {
          username: broadcasterInfo.username || 'Radio Host',
          stationName: broadcasterInfo.stationName || 'LS Radio',
          ...broadcasterInfo
        })
        activeBroadcasts.set(broadcastId, broadcast)
      }

      broadcast.broadcaster = socket.id
      broadcast.isLive = true

      // Initialize call queue
      if (!callQueues.has(broadcastId)) {
        callQueues.set(broadcastId, [])
      }

      socket.emit('broadcaster-ready', {
        broadcastId,
        capabilities: ['multi-host', 'audio-mixing', 'call-management', 'chat'],
        serverTime: new Date().toISOString()
      })

      console.log(`📻 Broadcast ${broadcastId} is now live with unified audio system`)
    })

    // Listener joins broadcast
    socket.on('join-broadcast', (broadcastId, listenerInfo = {}) => {
      console.log('👥 Listener joining:', broadcastId)
      
      socket.join(`broadcast-${broadcastId}`)
      
      const connection = activeConnections.get(socket.id)
      if (connection) {
        connection.broadcastId = broadcastId
        connection.role = 'listener'
      }

      const broadcast = activeBroadcasts.get(broadcastId)
      if (broadcast) {
        broadcast.addListener(socket.id, listenerInfo)
        
        // Send current broadcast info
        socket.emit('broadcast-info', {
          broadcastId,
          broadcasterInfo: broadcast.broadcasterInfo,
          isLive: broadcast.isLive,
          stats: broadcast.getStats()
        })

        // Notify all clients of listener count update
        io.to(`broadcast-${broadcastId}`).emit('listener-count', {
          count: broadcast.listeners.size,
          peak: broadcast.stats.peakListeners
        })
      }
    })

    // Handle audio streaming from broadcaster
    socket.on('broadcast-audio', (broadcastId, audioData) => {
      const broadcast = activeBroadcasts.get(broadcastId)
      if (broadcast && broadcast.broadcaster === socket.id) {
        // Forward audio to all listeners
        socket.to(`broadcast-${broadcastId}`).emit('audio-stream', {
          audio: audioData.audio,
          timestamp: audioData.timestamp,
          metrics: audioData.metrics,
          broadcasterInfo: broadcast.broadcasterInfo
        })
      }
    })

    // Audio source management
    socket.on('add-audio-source', (broadcastId, sourceInfo) => {
      const broadcast = activeBroadcasts.get(broadcastId)
      if (broadcast && broadcast.broadcaster === socket.id) {
        const sourceId = `${sourceInfo.type}_${sourceInfo.id || socket.id}`
        broadcast.addAudioSource(sourceId, {
          ...sourceInfo,
          socketId: socket.id
        })

        // Notify all clients in broadcast
        io.to(`broadcast-${broadcastId}`).emit('audio-source-added', {
          broadcastId,
          sourceId,
          sourceInfo
        })
      }
    })

    socket.on('update-audio-source', (broadcastId, sourceId, updates) => {
      const broadcast = activeBroadcasts.get(broadcastId)
      if (broadcast && broadcast.broadcaster === socket.id) {
        broadcast.updateAudioSource(sourceId, updates)

        io.to(`broadcast-${broadcastId}`).emit('audio-source-updated', {
          broadcastId,
          sourceId,
          updates
        })
      }
    })

    socket.on('remove-audio-source', (broadcastId, sourceId) => {
      const broadcast = activeBroadcasts.get(broadcastId)
      if (broadcast && broadcast.broadcaster === socket.id) {
        broadcast.removeAudioSource(sourceId)

        io.to(`broadcast-${broadcastId}`).emit('audio-source-removed', {
          broadcastId,
          sourceId
        })
      }
    })

    // Call management
    socket.on('request-call', (broadcastId, callerInfo) => {
      console.log('📞 Call request for broadcast:', broadcastId, callerInfo)
      
      const broadcast = activeBroadcasts.get(broadcastId)
      if (!broadcast) {
        socket.emit('call-error', { message: 'Broadcast not found' })
        return
      }

      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const callRequest = {
        callId,
        callerId: socket.id,
        callerName: callerInfo.name || 'Anonymous Caller',
        callerLocation: callerInfo.location || 'Unknown',
        requestTime: new Date(),
        status: 'pending'
      }

      // Add to call queue
      broadcast.callQueue.push(callRequest)
      
      // Notify broadcaster
      io.to(broadcast.broadcaster).emit('incoming-call', callRequest)
      
      // Notify caller
      socket.emit('call-pending', { 
        callId, 
        position: broadcast.callQueue.length 
      })

      console.log(`📞 Call ${callId} queued for broadcast ${broadcastId}`)
    })

    socket.on('accept-call', (callId) => {
      console.log('✅ Accepting call:', callId)
      
      // Find the broadcast and call
      let targetBroadcast = null
      let callRequest = null
      
      for (const [broadcastId, broadcast] of activeBroadcasts.entries()) {
        if (broadcast.broadcaster === socket.id) {
          const callIndex = broadcast.callQueue.findIndex(call => call.callId === callId)
          if (callIndex !== -1) {
            callRequest = broadcast.callQueue[callIndex]
            targetBroadcast = broadcast
            // Remove from queue
            broadcast.callQueue.splice(callIndex, 1)
            break
          }
        }
      }

      if (!callRequest || !targetBroadcast) {
        socket.emit('call-error', { message: 'Call not found' })
        return
      }

      // Move to active calls
      targetBroadcast.activeCalls.set(callRequest.callerId, {
        ...callRequest,
        status: 'active',
        acceptTime: new Date()
      })

      // Add caller as audio source
      targetBroadcast.addAudioSource(`caller_${callRequest.callerId}`, {
        type: 'caller',
        name: callRequest.callerName,
        volume: 0.8,
        isMuted: false,
        isActive: true,
        priority: 3,
        socketId: callRequest.callerId
      })

      // Notify caller
      io.to(callRequest.callerId).emit('call-accepted', {
        callId,
        broadcasterId: socket.id,
        instructions: 'You are now live on air. Speak clearly!'
      })

      // Update stats
      targetBroadcast.stats.totalCalls++

      console.log(`📞 Call ${callId} accepted and caller added to broadcast`)
    })

    socket.on('reject-call', (callId, reason) => {
      console.log('❌ Rejecting call:', callId, reason)
      
      for (const [broadcastId, broadcast] of activeBroadcasts.entries()) {
        if (broadcast.broadcaster === socket.id) {
          const callIndex = broadcast.callQueue.findIndex(call => call.callId === callId)
          if (callIndex !== -1) {
            const callRequest = broadcast.callQueue[callIndex]
            
            io.to(callRequest.callerId).emit('call-rejected', {
              callId,
              reason: reason || 'Call declined by host'
            })
            
            broadcast.callQueue.splice(callIndex, 1)
            break
          }
        }
      }
    })

    socket.on('end-call', (callId) => {
      console.log('🔚 Ending call:', callId)
      
      for (const [broadcastId, broadcast] of activeBroadcasts.entries()) {
        if (broadcast.activeCalls.has(socket.id)) {
          const call = broadcast.activeCalls.get(socket.id)
          
          // Remove caller audio source
          broadcast.removeAudioSource(`caller_${socket.id}`)
          
          // Notify both parties
          io.to(broadcast.broadcaster).emit('call-ended', { 
            callId: call.callId, 
            reason: 'Call ended' 
          })
          io.to(socket.id).emit('call-ended', { 
            callId: call.callId, 
            reason: 'Call ended' 
          })
          
          broadcast.activeCalls.delete(socket.id)
          break
        }
      }
    })

    // Get broadcast statistics
    socket.on('get-broadcast-stats', (broadcastId) => {
      const broadcast = activeBroadcasts.get(broadcastId)
      if (broadcast) {
        socket.emit('broadcast-stats', broadcast.getStats())
      }
    })

    // Get call queue
    socket.on('get-call-queue', (broadcastId) => {
      const broadcast = activeBroadcasts.get(broadcastId)
      if (broadcast && broadcast.broadcaster === socket.id) {
        socket.emit('call-queue-update', {
          queue: broadcast.callQueue,
          activeCalls: Array.from(broadcast.activeCalls.values())
        })
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id)
      
      const connection = activeConnections.get(socket.id)
      
      // Handle broadcaster disconnect
      for (const [broadcastId, broadcast] of activeBroadcasts.entries()) {
        if (broadcast.broadcaster === socket.id) {
          console.log('📻 Broadcaster disconnected, ending broadcast:', broadcastId)
          
          // Notify all listeners
          io.to(`broadcast-${broadcastId}`).emit('broadcast-ended', {
            reason: 'Host disconnected',
            stats: broadcast.getStats(),
            endTime: new Date().toISOString()
          })
          
          // End all active calls
          for (const [callerId, call] of broadcast.activeCalls.entries()) {
            io.to(callerId).emit('call-ended', {
              callId: call.callId,
              reason: 'Broadcast ended'
            })
          }
          
          // Clean up
          activeBroadcasts.delete(broadcastId)
          callQueues.delete(broadcastId)
          
        } else if (broadcast.listeners.has(socket.id)) {
          // Listener disconnected
          broadcast.removeListener(socket.id)
          
          io.to(`broadcast-${broadcastId}`).emit('listener-count', {
            count: broadcast.listeners.size,
            peak: broadcast.stats.peakListeners
          })
          
        } else if (broadcast.activeCalls.has(socket.id)) {
          // Caller disconnected
          const call = broadcast.activeCalls.get(socket.id)
          
          // Remove caller audio source
          broadcast.removeAudioSource(`caller_${socket.id}`)
          
          // Notify broadcaster
          io.to(broadcast.broadcaster).emit('call-ended', {
            callId: call.callId,
            reason: 'Caller disconnected'
          })
          
          broadcast.activeCalls.delete(socket.id)
        }
        
        // Remove from call queue if present
        broadcast.callQueue = broadcast.callQueue.filter(call => call.callerId !== socket.id)
      }
      
      activeConnections.delete(socket.id)
    })
  })

  // Periodic cleanup and stats
  setInterval(() => {
    const now = new Date()
    
    // Clean up stale call requests (older than 5 minutes)
    for (const [broadcastId, broadcast] of activeBroadcasts.entries()) {
      broadcast.callQueue = broadcast.callQueue.filter(call => {
        const age = now.getTime() - call.requestTime.getTime()
        if (age > 5 * 60 * 1000) { // 5 minutes
          io.to(call.callerId).emit('call-timeout', {
            callId: call.callId,
            reason: 'Request timed out'
          })
          return false
        }
        return true
      })
    }
    
    // Emit server stats
    const stats = {
      activeBroadcasts: activeBroadcasts.size,
      totalConnections: activeConnections.size,
      totalListeners: Array.from(activeBroadcasts.values()).reduce((sum, b) => sum + b.listeners.size, 0),
      totalCalls: Array.from(activeBroadcasts.values()).reduce((sum, b) => sum + b.activeCalls.size, 0),
      uptime: process.uptime()
    }
    
    io.emit('server-stats', stats)
  }, 30000) // Every 30 seconds

  return {
    getBroadcast: (broadcastId) => activeBroadcasts.get(broadcastId),
    getAllBroadcasts: () => Array.from(activeBroadcasts.values()),
    getStats: () => ({
      activeBroadcasts: activeBroadcasts.size,
      totalConnections: activeConnections.size
    })
  }
}