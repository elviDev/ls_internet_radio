// Enhanced WebRTC signaling handler with audio bridging and calling support
const activeBroadcasts = new Map() // broadcastId -> { broadcaster, listeners, offer, audioTracks, callQueue }
const activeConnections = new Map() // socketId -> { broadcastId, role, connectionTime, audioContext }
const callQueue = new Map() // broadcastId -> [{ callerId, callerName, connectionTime, socketId }]

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🔗 WebRTC client connected:', socket.id)
    
    // Track connection metadata
    activeConnections.set(socket.id, {
      broadcastId: null,
      role: null,
      connectionTime: new Date(),
      audioContext: null
    })

    // Broadcaster joins with enhanced audio handling
    socket.on('join-as-broadcaster', (broadcastId, broadcasterInfo = {}) => {
      console.log('🎙️ Broadcaster joined:', broadcastId, broadcasterInfo)
      socket.join(`broadcast-${broadcastId}`)
      
      // Update connection metadata
      const connection = activeConnections.get(socket.id)
      if (connection) {
        connection.broadcastId = broadcastId
        connection.role = 'broadcaster'
      }
      
      // Initialize enhanced broadcast state
      activeBroadcasts.set(broadcastId, {
        broadcaster: socket.id,
        broadcasterInfo: {
          username: broadcasterInfo.username || 'Radio Host',
          stationName: broadcasterInfo.stationName || 'LS Radio',
          ...broadcasterInfo
        },
        listeners: new Set(),
        offer: null,
        isLive: true,
        audioTracks: new Map(), // Track individual audio streams
        callQueue: [],
        activeCalls: new Map(), // callerId -> { socketId, stream, startTime }
        audioMixer: null, // For mixing multiple audio sources
        stats: {
          startTime: new Date(),
          peakListeners: 0,
          totalCalls: 0,
          totalMessages: 0
        }
      })
      
      // Initialize call queue for this broadcast
      callQueue.set(broadcastId, [])
      
      socket.emit('broadcaster-ready', {
        broadcastId,
        serverTime: new Date().toISOString(),
        capabilities: ['audio-streaming', 'chat', 'phone-calls', 'call-screening']
      })
      
      console.log(`📻 Broadcast ${broadcastId} is now live`)
    })

    // Listener joins with enhanced capabilities
    socket.on('join-as-listener', (broadcastId, listenerInfo = {}) => {
      console.log('👥 Listener joined:', broadcastId, listenerInfo)
      socket.join(`broadcast-${broadcastId}`)
      
      // Update connection metadata
      const connection = activeConnections.get(socket.id)
      if (connection) {
        connection.broadcastId = broadcastId
        connection.role = 'listener'
      }
      
      const broadcast = activeBroadcasts.get(broadcastId)
      if (broadcast) {
        broadcast.listeners.add(socket.id)
        
        // Update peak listener count
        if (broadcast.listeners.size > broadcast.stats.peakListeners) {
          broadcast.stats.peakListeners = broadcast.listeners.size
        }
        
        // If broadcaster has an offer, send it to the new listener
        if (broadcast.offer) {
          socket.emit('broadcaster-offer', {
            offer: broadcast.offer,
            broadcasterInfo: broadcast.broadcasterInfo,
            stats: {
              listeners: broadcast.listeners.size,
              uptime: Date.now() - broadcast.stats.startTime.getTime()
            }
          })
        }
        
        // Notify all clients of updated listener count
        io.to(`broadcast-${broadcastId}`).emit('listener-count', {
          count: broadcast.listeners.size,
          peak: broadcast.stats.peakListeners
        })
        
        // Send current broadcast info to the new listener
        socket.emit('broadcast-info', {
          broadcastId,
          broadcasterInfo: broadcast.broadcasterInfo,
          isLive: broadcast.isLive,
          stats: {
            listeners: broadcast.listeners.size,
            uptime: Date.now() - broadcast.stats.startTime.getTime(),
            totalCalls: broadcast.stats.totalCalls
          }
        })
      }
    })

    // Enhanced WebRTC signaling with audio quality optimization
    socket.on('broadcaster-offer', (broadcastId, offer, audioConfig = {}) => {
      console.log('📡 Received broadcaster offer for:', broadcastId, {
        audioCodec: audioConfig.codec || 'opus',
        sampleRate: audioConfig.sampleRate || 48000,
        bitrate: audioConfig.bitrate || 128000
      })
      
      const broadcast = activeBroadcasts.get(broadcastId)
      if (broadcast && broadcast.broadcaster === socket.id) {
        broadcast.offer = offer
        broadcast.audioConfig = audioConfig
        
        // Enhanced offer with audio configuration
        const enhancedOffer = {
          offer,
          audioConfig: {
            codec: 'opus',
            sampleRate: 48000,
            bitrate: 128000,
            channels: 2,
            latency: 'low',
            ...audioConfig
          },
          broadcasterInfo: broadcast.broadcasterInfo,
          timestamp: new Date().toISOString()
        }
        
        // Send enhanced offer to all listeners
        socket.to(`broadcast-${broadcastId}`).emit('broadcaster-offer', enhancedOffer)
        
        console.log(`🎵 Audio stream configured for ${broadcastId}:`, enhancedOffer.audioConfig)
      }
    })

    socket.on('listener-answer', (broadcastId, answer, deviceInfo = {}) => {
      console.log('📱 Received listener answer for:', broadcastId, {
        listenerId: socket.id,
        device: deviceInfo.device || 'unknown'
      })
      
      const broadcast = activeBroadcasts.get(broadcastId)
      if (broadcast) {
        // Send answer to broadcaster with listener info
        io.to(broadcast.broadcaster).emit('listener-answer', {
          listenerId: socket.id,
          answer,
          deviceInfo: {
            userAgent: deviceInfo.userAgent,
            platform: deviceInfo.platform,
            connection: deviceInfo.connection || 'unknown',
            ...deviceInfo
          },
          timestamp: new Date().toISOString()
        })
        
        // Track the audio connection
        if (!broadcast.audioTracks.has(socket.id)) {
          broadcast.audioTracks.set(socket.id, {
            connected: true,
            deviceInfo,
            connectionTime: new Date(),
            quality: 'unknown'
          })
        }
      }
    })

    socket.on('ice-candidate', (broadcastId, candidate, targetId) => {
      console.log('🧊 ICE candidate exchange for:', broadcastId, {
        from: socket.id,
        to: targetId || 'broadcast',
        candidateType: candidate.candidate?.split(' ')[7] || 'unknown'
      })
      
      if (targetId) {
        io.to(targetId).emit('ice-candidate', {
          candidate,
          senderId: socket.id,
          timestamp: new Date().toISOString()
        })
      } else {
        // Broadcast to all in room with sender info
        socket.to(`broadcast-${broadcastId}`).emit('ice-candidate', {
          candidate,
          senderId: socket.id,
          timestamp: new Date().toISOString()
        })
      }
    })

    // Phone call functionality
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
      if (!broadcast.callQueue) broadcast.callQueue = []
      broadcast.callQueue.push(callRequest)
      
      // Notify broadcaster of incoming call
      io.to(broadcast.broadcaster).emit('incoming-call', callRequest)
      
      // Notify caller that request is pending
      socket.emit('call-pending', { callId, position: broadcast.callQueue.length })
      
      console.log(`📞 Call ${callId} added to queue for ${broadcastId}`)
    })
    
    socket.on('accept-call', (callId) => {
      console.log('✅ Accepting call:', callId)
      
      // Find the broadcast and call
      let targetBroadcast = null
      let callRequest = null
      
      for (const [broadcastId, broadcast] of activeBroadcasts.entries()) {
        if (broadcast.broadcaster === socket.id) {
          callRequest = broadcast.callQueue.find(call => call.callId === callId)
          if (callRequest) {
            targetBroadcast = broadcast
            break
          }
        }
      }
      
      if (!callRequest || !targetBroadcast) {
        socket.emit('call-error', { message: 'Call not found' })
        return
      }
      
      // Update call status
      callRequest.status = 'accepted'
      callRequest.acceptTime = new Date()
      
      // Move to active calls
      if (!targetBroadcast.activeCalls) targetBroadcast.activeCalls = new Map()
      targetBroadcast.activeCalls.set(callRequest.callerId, {
        ...callRequest,
        socketId: callRequest.callerId
      })
      
      // Remove from queue
      targetBroadcast.callQueue = targetBroadcast.callQueue.filter(call => call.callId !== callId)
      
      // Notify caller that call was accepted
      io.to(callRequest.callerId).emit('call-accepted', {
        callId,
        broadcasterId: socket.id,
        instructions: 'You are now connected to the radio station. Speak clearly!'
      })
      
      // Update stats
      targetBroadcast.stats.totalCalls++
      
      console.log(`📞 Call ${callId} accepted and moved to active calls`)
    })
    
    socket.on('reject-call', (callId, reason) => {
      console.log('❌ Rejecting call:', callId, reason)
      
      // Find and reject the call
      for (const [broadcastId, broadcast] of activeBroadcasts.entries()) {
        if (broadcast.broadcaster === socket.id) {
          const callIndex = broadcast.callQueue.findIndex(call => call.callId === callId)
          if (callIndex !== -1) {
            const callRequest = broadcast.callQueue[callIndex]
            
            // Notify caller of rejection
            io.to(callRequest.callerId).emit('call-rejected', {
              callId,
              reason: reason || 'Call declined by host'
            })
            
            // Remove from queue
            broadcast.callQueue.splice(callIndex, 1)
            break
          }
        }
      }
    })
    
    socket.on('end-call', (callId) => {
      console.log('🔚 Ending call:', callId)
      
      // Find and end the active call
      for (const [broadcastId, broadcast] of activeBroadcasts.entries()) {
        if (broadcast.activeCalls && broadcast.activeCalls.has(socket.id)) {
          const call = broadcast.activeCalls.get(socket.id)
          
          // Notify both parties
          io.to(broadcast.broadcaster).emit('call-ended', { callId: call.callId, reason: 'Call ended' })
          io.to(socket.id).emit('call-ended', { callId: call.callId, reason: 'Call ended' })
          
          // Remove from active calls
          broadcast.activeCalls.delete(socket.id)
          break
        }
      }
    })
    
    // Audio quality monitoring
    socket.on('audio-stats', (broadcastId, stats) => {
      const broadcast = activeBroadcasts.get(broadcastId)
      if (broadcast && broadcast.audioTracks.has(socket.id)) {
        const trackInfo = broadcast.audioTracks.get(socket.id)
        trackInfo.quality = stats.quality || 'unknown'
        trackInfo.lastUpdate = new Date()
        trackInfo.stats = stats
        
        // Notify broadcaster of audio quality issues
        if (stats.quality === 'poor' && broadcast.broadcaster) {
          io.to(broadcast.broadcaster).emit('audio-quality-alert', {
            listenerId: socket.id,
            quality: stats.quality,
            details: stats
          })
        }
      }
    })
    
    // Get call queue for broadcaster
    socket.on('get-call-queue', (broadcastId) => {
      const broadcast = activeBroadcasts.get(broadcastId)
      if (broadcast && broadcast.broadcaster === socket.id) {
        socket.emit('call-queue-update', {
          queue: broadcast.callQueue || [],
          activeCalls: Array.from(broadcast.activeCalls?.values() || [])
        })
      }
    })

    // Enhanced disconnect handling
    socket.on('disconnect', () => {
      console.log('❌ WebRTC client disconnected:', socket.id)
      
      const connection = activeConnections.get(socket.id)
      
      // Check if broadcaster disconnected
      for (const [broadcastId, broadcast] of activeBroadcasts.entries()) {
        if (broadcast.broadcaster === socket.id) {
          console.log('📻 Broadcaster disconnected, ending broadcast:', broadcastId)
          
          // Notify all listeners
          io.to(`broadcast-${broadcastId}`).emit('broadcast-ended', {
            reason: 'Host disconnected',
            stats: broadcast.stats,
            endTime: new Date().toISOString()
          })
          
          // End all active calls
          if (broadcast.activeCalls) {
            for (const [callerId, call] of broadcast.activeCalls.entries()) {
              io.to(callerId).emit('call-ended', {
                callId: call.callId,
                reason: 'Broadcast ended'
              })
            }
          }
          
          // Clean up
          activeBroadcasts.delete(broadcastId)
          callQueue.delete(broadcastId)
          
        } else if (broadcast.listeners.has(socket.id)) {
          // Listener disconnected
          broadcast.listeners.delete(socket.id)
          broadcast.audioTracks.delete(socket.id)
          
          // Update listener count
          io.to(`broadcast-${broadcastId}`).emit('listener-count', {
            count: broadcast.listeners.size,
            peak: broadcast.stats.peakListeners
          })
          
        } else if (broadcast.activeCalls && broadcast.activeCalls.has(socket.id)) {
          // Caller disconnected
          const call = broadcast.activeCalls.get(socket.id)
          
          // Notify broadcaster
          io.to(broadcast.broadcaster).emit('call-ended', {
            callId: call.callId,
            reason: 'Caller disconnected'
          })
          
          broadcast.activeCalls.delete(socket.id)
        }
        
        // Remove from call queue if present
        if (broadcast.callQueue) {
          broadcast.callQueue = broadcast.callQueue.filter(call => call.callerId !== socket.id)
        }
      }
      
      // Clean up connection tracking
      activeConnections.delete(socket.id)
    })
  })
  
  // Periodic cleanup and stats
  setInterval(() => {
    const now = new Date()
    
    // Clean up stale call requests (older than 5 minutes)
    for (const [broadcastId, broadcast] of activeBroadcasts.entries()) {
      if (broadcast.callQueue) {
        broadcast.callQueue = broadcast.callQueue.filter(call => {
          const age = now.getTime() - call.requestTime.getTime()
          if (age > 5 * 60 * 1000) { // 5 minutes
            // Notify caller of timeout
            io.to(call.callerId).emit('call-timeout', {
              callId: call.callId,
              reason: 'Request timed out'
            })
            return false
          }
          return true
        })
      }
    }
    
    // Emit server stats
    const stats = {
      activeBroadcasts: activeBroadcasts.size,
      totalConnections: activeConnections.size,
      totalListeners: Array.from(activeBroadcasts.values()).reduce((sum, b) => sum + b.listeners.size, 0),
      totalCalls: Array.from(activeBroadcasts.values()).reduce((sum, b) => sum + (b.activeCalls?.size || 0), 0),
      uptime: process.uptime()
    }
    
    io.emit('server-stats', stats)
  }, 30000) // Every 30 seconds
}