// Audio bridge handler for mixing multiple audio sources (studio + calls)
const EventEmitter = require('events')

class AudioBridge extends EventEmitter {
  constructor(broadcastId) {
    super()
    this.broadcastId = broadcastId
    this.audioSources = new Map() // sourceId -> { stream, volume, gain, isActive }
    this.mixedStream = null
    this.isActive = false
    this.config = {
      sampleRate: 48000,
      channels: 2,
      bitrate: 128000,
      bufferSize: 256
    }
  }

  // Add an audio source (studio microphone, phone call, music, etc.)
  addAudioSource(sourceId, sourceInfo) {
    console.log(`🎤 Adding audio source ${sourceId} to bridge ${this.broadcastId}:`, sourceInfo)
    
    this.audioSources.set(sourceId, {
      id: sourceId,
      type: sourceInfo.type || 'unknown', // 'studio', 'call', 'music', 'effects'
      volume: sourceInfo.volume || 1.0,
      gain: sourceInfo.gain || 1.0,
      isActive: true,
      isMuted: false,
      priority: sourceInfo.priority || 0, // Higher priority sources get preference
      stream: null,
      audioContext: null,
      gainNode: null,
      addedAt: new Date()
    })

    this.emit('source-added', { sourceId, broadcastId: this.broadcastId })
    this._updateMix()
  }

  // Remove an audio source
  removeAudioSource(sourceId) {
    if (this.audioSources.has(sourceId)) {
      const source = this.audioSources.get(sourceId)
      
      // Clean up audio nodes
      if (source.gainNode) {
        source.gainNode.disconnect()
      }
      
      this.audioSources.delete(sourceId)
      console.log(`🔇 Removed audio source ${sourceId} from bridge ${this.broadcastId}`)
      
      this.emit('source-removed', { sourceId, broadcastId: this.broadcastId })
      this._updateMix()
    }
  }

  // Update source properties
  updateAudioSource(sourceId, updates) {
    if (this.audioSources.has(sourceId)) {
      const source = this.audioSources.get(sourceId)
      Object.assign(source, updates)
      
      // Apply real-time updates to audio nodes
      if (source.gainNode) {
        if (updates.volume !== undefined) {
          source.gainNode.gain.setTargetAtTime(
            updates.volume * (source.isMuted ? 0 : 1), 
            0, 
            0.01
          )
        }
      }
      
      console.log(`🎛️ Updated audio source ${sourceId}:`, updates)
      this.emit('source-updated', { sourceId, updates, broadcastId: this.broadcastId })
    }
  }

  // Set audio stream for a source
  setAudioStream(sourceId, stream) {
    if (this.audioSources.has(sourceId)) {
      const source = this.audioSources.get(sourceId)
      source.stream = stream
      
      console.log(`🎵 Audio stream connected for source ${sourceId}`)
      this.emit('stream-connected', { sourceId, broadcastId: this.broadcastId })
      this._updateMix()
    }
  }

  // Mute/unmute a source
  muteSource(sourceId, muted = true) {
    this.updateAudioSource(sourceId, { isMuted: muted })
    console.log(`${muted ? '🔇' : '🔊'} Source ${sourceId} ${muted ? 'muted' : 'unmuted'}`)
  }

  // Get mixed audio stream for broadcasting
  getMixedStream() {
    return this.mixedStream
  }

  // Get all active sources
  getActiveSources() {
    return Array.from(this.audioSources.entries())
      .filter(([_, source]) => source.isActive)
      .map(([id, source]) => ({
        id,
        type: source.type,
        volume: source.volume,
        isActive: source.isActive,
        isMuted: source.isMuted,
        priority: source.priority
      }))
  }

  // Update the audio mix
  _updateMix() {
    // This is a simplified representation
    // In a real implementation, you would use Web Audio API or a media server
    const activeSources = Array.from(this.audioSources.values())
      .filter(source => source.isActive && !source.isMuted && source.stream)

    console.log(`🎚️ Updating audio mix for ${this.broadcastId}: ${activeSources.length} active sources`)
    
    this.emit('mix-updated', { 
      activeSourceCount: activeSources.length,
      broadcastId: this.broadcastId,
      sources: activeSources.map(s => ({ id: s.id, type: s.type, volume: s.volume }))
    })
  }

  // Start the audio bridge
  start() {
    this.isActive = true
    console.log(`🌉 Audio bridge started for broadcast ${this.broadcastId}`)
    this.emit('bridge-started', { broadcastId: this.broadcastId })
  }

  // Stop the audio bridge
  stop() {
    this.isActive = false
    
    // Clean up all sources
    for (const [sourceId, source] of this.audioSources.entries()) {
      if (source.gainNode) {
        source.gainNode.disconnect()
      }
    }
    
    this.audioSources.clear()
    this.mixedStream = null
    
    console.log(`🛑 Audio bridge stopped for broadcast ${this.broadcastId}`)
    this.emit('bridge-stopped', { broadcastId: this.broadcastId })
  }

  // Get bridge statistics
  getStats() {
    return {
      broadcastId: this.broadcastId,
      isActive: this.isActive,
      totalSources: this.audioSources.size,
      activeSources: Array.from(this.audioSources.values()).filter(s => s.isActive).length,
      config: this.config,
      sources: this.getActiveSources()
    }
  }
}

// Audio bridge manager for handling multiple broadcasts
class AudioBridgeManager {
  constructor() {
    this.bridges = new Map() // broadcastId -> AudioBridge
  }

  // Create or get a bridge for a broadcast
  getBridge(broadcastId) {
    if (!this.bridges.has(broadcastId)) {
      const bridge = new AudioBridge(broadcastId)
      this.bridges.set(broadcastId, bridge)
      
      // Clean up bridge when it stops
      bridge.on('bridge-stopped', () => {
        this.bridges.delete(broadcastId)
      })
      
      console.log(`🌉 Created new audio bridge for broadcast ${broadcastId}`)
    }
    
    return this.bridges.get(broadcastId)
  }

  // Remove a bridge
  removeBridge(broadcastId) {
    if (this.bridges.has(broadcastId)) {
      const bridge = this.bridges.get(broadcastId)
      bridge.stop()
      this.bridges.delete(broadcastId)
      console.log(`🗑️ Removed audio bridge for broadcast ${broadcastId}`)
    }
  }

  // Get all active bridges
  getActiveBridges() {
    return Array.from(this.bridges.entries()).map(([id, bridge]) => ({
      broadcastId: id,
      stats: bridge.getStats()
    }))
  }

  // Get manager statistics
  getStats() {
    return {
      totalBridges: this.bridges.size,
      activeBridges: Array.from(this.bridges.values()).filter(b => b.isActive).length,
      bridges: this.getActiveBridges()
    }
  }
}

// Socket.IO handler for audio bridge management
module.exports = (io) => {
  const bridgeManager = new AudioBridgeManager()

  io.on('connection', (socket) => {
    console.log('🎚️ Audio bridge client connected:', socket.id)

    // Create or join audio bridge
    socket.on('join-audio-bridge', (broadcastId, sourceInfo) => {
      const bridge = bridgeManager.getBridge(broadcastId)
      const sourceId = `${sourceInfo.type}_${socket.id}`
      
      bridge.addAudioSource(sourceId, {
        ...sourceInfo,
        socketId: socket.id
      })
      
      socket.join(`audio-bridge-${broadcastId}`)
      socket.emit('audio-bridge-joined', {
        broadcastId,
        sourceId,
        bridgeStats: bridge.getStats()
      })
    })

    // Update audio source settings
    socket.on('update-audio-source', (broadcastId, sourceId, updates) => {
      const bridge = bridgeManager.getBridge(broadcastId)
      bridge.updateAudioSource(sourceId, updates)
      
      // Notify all clients in the bridge
      io.to(`audio-bridge-${broadcastId}`).emit('audio-source-updated', {
        broadcastId,
        sourceId,
        updates
      })
    })

    // Mute/unmute audio source
    socket.on('mute-audio-source', (broadcastId, sourceId, muted) => {
      const bridge = bridgeManager.getBridge(broadcastId)
      bridge.muteSource(sourceId, muted)
      
      io.to(`audio-bridge-${broadcastId}`).emit('audio-source-muted', {
        broadcastId,
        sourceId,
        muted
      })
    })

    // Set audio stream for source
    socket.on('set-audio-stream', (broadcastId, sourceId, streamInfo) => {
      const bridge = bridgeManager.getBridge(broadcastId)
      // In real implementation, you would handle the actual audio stream
      bridge.setAudioStream(sourceId, streamInfo)
      
      io.to(`audio-bridge-${broadcastId}`).emit('audio-stream-connected', {
        broadcastId,
        sourceId,
        streamInfo
      })
    })

    // Get bridge statistics
    socket.on('get-bridge-stats', (broadcastId) => {
      const bridge = bridgeManager.getBridge(broadcastId)
      socket.emit('bridge-stats', bridge.getStats())
    })

    // Get all bridges statistics (admin only)
    socket.on('get-all-bridges-stats', () => {
      socket.emit('all-bridges-stats', bridgeManager.getStats())
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('🎚️ Audio bridge client disconnected:', socket.id)
      
      // Remove audio sources for this socket from all bridges
      for (const bridge of bridgeManager.bridges.values()) {
        const sourcesToRemove = []
        
        for (const [sourceId, source] of bridge.audioSources.entries()) {
          if (source.socketId === socket.id) {
            sourcesToRemove.push(sourceId)
          }
        }
        
        sourcesToRemove.forEach(sourceId => {
          bridge.removeAudioSource(sourceId)
          
          // Notify other clients
          io.to(`audio-bridge-${bridge.broadcastId}`).emit('audio-source-removed', {
            broadcastId: bridge.broadcastId,
            sourceId
          })
        })
      }
    })
  })

  // Periodic stats broadcast
  setInterval(() => {
    const stats = bridgeManager.getStats()
    io.emit('audio-bridge-manager-stats', stats)
  }, 30000) // Every 30 seconds

  return bridgeManager
}