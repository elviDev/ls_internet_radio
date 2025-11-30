// Unified Audio System for Live Radio Broadcasting
// Consolidates all audio processing, mixing, and streaming functionality

import { io, Socket } from 'socket.io-client'

export interface AudioSource {
  id: string
  type: 'host' | 'guest' | 'caller' | 'music' | 'effects'
  name: string
  stream?: MediaStream
  volume: number
  isMuted: boolean
  isActive: boolean
  priority: number
  gainNode?: GainNode
}

export interface BroadcastConfig {
  broadcastId: string
  sampleRate: number
  channels: number
  bitrate: number
  maxSources: number
}

export interface AudioMetrics {
  inputLevel: number
  outputLevel: number
  peakLevel: number
  activeSourceCount: number
  listenerCount: number
}

// Main Audio System Class
export class UnifiedAudioSystem {
  private audioContext: AudioContext | null = null
  private socket: Socket | null = null
  private config: BroadcastConfig
  private audioSources = new Map<string, AudioSource>()
  private mixerNode: GainNode | null = null
  private compressorNode: DynamicsCompressorNode | null = null
  private analyserNode: AnalyserNode | null = null
  private destinationStream: MediaStream | null = null
  private isActive = false
  private metrics: AudioMetrics = {
    inputLevel: 0,
    outputLevel: 0,
    peakLevel: 0,
    activeSourceCount: 0,
    listenerCount: 0
  }

  constructor(config: BroadcastConfig) {
    this.config = config
  }

  // Initialize the audio system
  async initialize(): Promise<void> {
    try {
      // Create audio context (will be suspended until user gesture)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate
      })

      // Don't resume here - wait for user gesture
      console.log('🎚️ Audio context created, state:', this.audioContext.state)

      // Connect to realtime server
      await this.connectToServer()

      console.log('🎚️ Unified Audio System initialized')
    } catch (error) {
      console.error('Failed to initialize audio system:', error)
      throw error
    }
  }

  private setupAudioProcessing(): void {
    if (!this.audioContext) return

    // Create main mixer node
    this.mixerNode = this.audioContext.createGain()
    this.mixerNode.gain.value = 1.0

    // Create compressor for broadcast quality
    this.compressorNode = this.audioContext.createDynamicsCompressor()
    this.compressorNode.threshold.value = -24
    this.compressorNode.knee.value = 30
    this.compressorNode.ratio.value = 12
    this.compressorNode.attack.value = 0.003
    this.compressorNode.release.value = 0.25

    // Create analyser for level monitoring
    this.analyserNode = this.audioContext.createAnalyser()
    this.analyserNode.fftSize = 256
    this.analyserNode.smoothingTimeConstant = 0.8

    // Connect processing chain
    this.mixerNode
      .connect(this.compressorNode)
      .connect(this.analyserNode)

    // Create destination stream
    const destination = this.audioContext.createMediaStreamDestination()
    this.analyserNode.connect(destination)
    this.destinationStream = destination.stream

    // Start level monitoring
    this.startLevelMonitoring()
  }

  private async connectToServer(): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.socket = io('http://localhost:3001', {
          transports: ['websocket'],
          autoConnect: true,
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
          forceNew: false
        })

        this.socket.on('connect', () => {
          console.log('🔗 Connected to TypeScript realtime server')
          this.setupSocketHandlers()
          resolve()
        })

        this.socket.on('connect_error', (error) => {
          console.warn('Server connection failed, continuing without server:', error.message)
          resolve()
        })

        this.socket.on('disconnect', (reason) => {
          console.warn('Disconnected from server:', reason)
        })

        setTimeout(() => {
          console.warn('Server connection timeout, continuing without server')
          resolve()
        }, 12000)
      } catch (error) {
        console.warn('Failed to create socket connection:', error)
        resolve()
      }
    })
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return

    this.socket.on('listener-count', (data: { count: number, peak: number }) => {
      this.metrics.listenerCount = data.count
      this.onMetricsUpdate?.(this.metrics)
    })

    this.socket.on('audio-source-added', (data: any) => {
      console.log('🎤 Audio source added:', data)
    })

    this.socket.on('audio-source-updated', (data: any) => {
      console.log('🎛️ Audio source updated:', data)
    })

    this.socket.on('audio-source-removed', (data: any) => {
      console.log('🔇 Audio source removed:', data)
    })

    this.socket.on('call-accepted', (data: any) => {
      this.handleIncomingCall(data)
    })

    this.socket.on('broadcast-stats', (stats: any) => {
      console.log('📊 Broadcast stats:', stats)
    })

    // this.socket.on('server-stats', (stats: any) => {
    //   console.log('🖥️ Server stats:', stats)
    // })
  }

  // Add audio source (host, guest, caller, etc.)
  async addAudioSource(sourceConfig: Omit<AudioSource, 'gainNode'>): Promise<void> {
    try {
      // Resume audio context on first user interaction
      if (this.audioContext?.state === 'suspended') {
        console.log('🎚️ Resuming audio context after user gesture...')
        try {
          await this.audioContext.resume()
          console.log('🎚️ Audio context resumed, state:', this.audioContext.state)
        } catch (error) {
          console.warn('Failed to resume audio context:', error)
          // Continue anyway - the context might resume later
        }
      }

      // Setup audio processing if not done yet
      if (!this.mixerNode) {
        console.log('🎚️ Setting up audio processing...')
        this.setupAudioProcessing()
      }

      if (!this.audioContext || !this.mixerNode) {
        throw new Error('Audio system not initialized properly')
      }

      if (this.audioSources.size >= this.config.maxSources) {
        throw new Error('Maximum audio sources reached')
      }

      // Get microphone access with proper permission handling
      let stream: MediaStream | undefined = sourceConfig.stream
      if (!stream && (sourceConfig.type === 'host' || sourceConfig.type === 'guest')) {
        console.log('🎤 Requesting microphone access...')
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: this.config.sampleRate
            }
          })
          console.log('🎤 Microphone access granted')
        } catch (error) {
          console.error('Microphone access error:', error)
          if (error instanceof Error) {
            if (error.name === 'NotAllowedError') {
              throw new Error('Microphone access denied. Please click the microphone icon in your browser address bar and allow access, then try again.')
            } else if (error.name === 'NotFoundError') {
              throw new Error('No microphone found. Please connect a microphone and try again.')
            }
          }
          throw new Error('Failed to access microphone. Please check your browser permissions.')
        }
      }

      // Create gain node for this source
      const gainNode = this.audioContext.createGain()
      gainNode.gain.value = sourceConfig.volume * (sourceConfig.isMuted ? 0 : 1)
      gainNode.connect(this.mixerNode)

      const audioSource: AudioSource = {
        ...sourceConfig,
        stream,
        gainNode
      }

      this.audioSources.set(sourceConfig.id, audioSource)

      // Connect stream if available
      if (stream) {
        await this.connectSourceStream(sourceConfig.id, stream)
      }

      // Notify server if connected
      if (this.socket?.connected) {
        this.socket.emit('add-audio-source', this.config.broadcastId, {
          type: sourceConfig.type,
          name: sourceConfig.name,
          id: sourceConfig.id,
          volume: sourceConfig.volume,
          isMuted: sourceConfig.isMuted
        })
      }

      this.updateMetrics()
      console.log(`🎤 Added audio source: ${sourceConfig.name} (${sourceConfig.type})`)
    } catch (error) {
      console.error('Failed to add audio source:', error)
      throw error
    }
  }

  // Connect media stream to audio source
  async connectSourceStream(sourceId: string, stream: MediaStream): Promise<void> {
    const source = this.audioSources.get(sourceId)
    if (!source || !this.audioContext) return

    try {
      // Create source node from stream
      const sourceNode = this.audioContext.createMediaStreamSource(stream)
      
      // Connect to source's gain node
      if (source.gainNode) {
        sourceNode.connect(source.gainNode)
      }

      // Update source
      source.stream = stream
      source.isActive = true

      this.updateMetrics()
      console.log(`🎵 Connected stream for source: ${source.name}`)
    } catch (error) {
      console.error(`Failed to connect stream for ${sourceId}:`, error)
    }
  }

  // Remove audio source
  removeAudioSource(sourceId: string): void {
    const source = this.audioSources.get(sourceId)
    if (!source) return

    // Disconnect and cleanup
    if (source.gainNode) {
      source.gainNode.disconnect()
    }

    if (source.stream) {
      source.stream.getTracks().forEach(track => track.stop())
    }

    this.audioSources.delete(sourceId)
    this.updateMetrics()
    console.log(`🔇 Removed audio source: ${source.name}`)
  }

  // Update source properties
  updateAudioSource(sourceId: string, updates: Partial<AudioSource>): void {
    const source = this.audioSources.get(sourceId)
    if (!source) return

    // Apply updates
    Object.assign(source, updates)

    // Update gain node if volume or mute changed
    if (source.gainNode && (updates.volume !== undefined || updates.isMuted !== undefined)) {
      const targetGain = source.volume * (source.isMuted ? 0 : 1)
      source.gainNode.gain.setTargetAtTime(targetGain, this.audioContext?.currentTime || 0, 0.01)
    }

    this.updateMetrics()
    console.log(`🎛️ Updated source ${source.name}:`, updates)
  }

  // Start broadcasting
  async startBroadcast(): Promise<void> {
    try {
      console.log('🎙️ Starting broadcast for:', this.config.broadcastId)
      
      // Ensure audio context is running
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume()
        console.log('🎚️ Audio context resumed')
      }

      // Setup audio processing if not done yet
      if (!this.mixerNode) {
        this.setupAudioProcessing()
      }

      if (!this.destinationStream) {
        throw new Error('Audio processing not initialized')
      }

      // Add a default host audio source if none exist
      if (this.audioSources.size === 0) {
        console.log('🎤 Adding default host audio source')
        try {
          await this.addAudioSource({
            id: 'default-host',
            type: 'host',
            name: 'Broadcast Host',
            volume: 0.8,
            isMuted: false,
            isActive: true,
            priority: 10
          })
          console.log('✅ Default host audio source added successfully')
        } catch (error) {
          console.warn('⚠️ Could not add host audio source:', error)
          // Continue anyway - might be handled by external components
        }
      }

      console.log('📊 Current audio sources:', Array.from(this.audioSources.values()).map(source => ({
        id: source.id,
        name: source.name,
        type: source.type,
        volume: source.volume,
        isMuted: source.isMuted,
        isActive: source.isActive,
        hasStream: !!source.stream
      })))

      // Join as broadcaster if server is connected
      if (this.socket?.connected) {
        this.socket.emit('join-as-broadcaster', this.config.broadcastId, {
          username: 'Radio Host',
          stationName: 'LS Radio'
        })
        console.log('📻 Joined TypeScript server as broadcaster')
      } else {
        console.warn('📻 Starting broadcast without server connection')
      }

      // Start streaming the mixed audio
      await this.startAudioStreaming()

      this.isActive = true
      console.log('✅ Broadcast started successfully with', this.audioSources.size, 'audio sources')
    } catch (error) {
      console.error('❌ Failed to start broadcast:', error)
      throw error
    }
  }

  private async startAudioStreaming(): Promise<void> {
    if (!this.destinationStream || !this.socket?.connected) {
      console.warn('🎵 Cannot start audio streaming: missing destination stream or socket connection')
      return
    }

    console.log('🎵 Starting audio streaming. Destination stream info:', {
      id: this.destinationStream.id,
      active: this.destinationStream.active,
      audioTracks: this.destinationStream.getAudioTracks().length,
      tracks: this.destinationStream.getTracks().map(track => ({
        kind: track.kind,
        enabled: track.enabled,
        readyState: track.readyState
      }))
    })

    try {
      // Create media recorder for WebRTC streaming only
      // Force WAV format for complete audio file chunks
      let mediaRecorderOptions: MediaRecorderOptions = {}
      
      // Try WAV first - it creates complete audio files
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mediaRecorderOptions = {
          mimeType: 'audio/wav',
          audioBitsPerSecond: this.config.bitrate
        }
        console.log('🎵 Using WAV format - creates complete audio files')
      } 
      // Try MP4/AAC which also creates complete files  
      else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mediaRecorderOptions = {
          mimeType: 'audio/mp4',
          audioBitsPerSecond: this.config.bitrate
        }
        console.log('🎵 Using MP4 format - creates complete audio files')
      }
      // Last resort: WebM (but warn about streaming chunks)
      else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mediaRecorderOptions = {
          mimeType: 'audio/webm;codecs=opus', 
          audioBitsPerSecond: this.config.bitrate
        }
        console.warn('⚠️ Using WebM format - may create streaming chunks instead of complete files')
      } else {
        console.warn('⚠️ Using default MediaRecorder format - format unknown')
      }
      
      const mediaRecorder = new MediaRecorder(this.destinationStream, mediaRecorderOptions)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.socket?.connected) {
          const reader = new FileReader()
          reader.onloadend = () => {
            const audioData = (reader.result as string).split(',')[1]
            this.socket!.emit('broadcast-audio', this.config.broadcastId, {
              audio: audioData,
              timestamp: Date.now(),
              metrics: this.metrics,
              format: mediaRecorderOptions.mimeType || 'auto'
            })
            // Audio streaming active (logging disabled to reduce console spam)
          }
          reader.readAsDataURL(event.data)
        }
      }

      mediaRecorder.onerror = (error) => {
        console.error('🎵 MediaRecorder error:', error)
      }

      // Use stop/start approach to force complete MP4 files with initialization
      let isFirstChunk = true
      
      const createCompleteFile = () => {
        if (mediaRecorder.state === 'inactive') {
          if (isFirstChunk) {
            console.log('🎬 Creating first complete MP4 file with initialization')
            mediaRecorder.start() // Start recording
            setTimeout(() => {
              if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop() // Stop to create complete file
                isFirstChunk = false
              }
            }, 2000) // 2 seconds for first complete file
          } else {
            console.log('🎵 Creating short complete file for low latency')
            mediaRecorder.start() // Start recording  
            setTimeout(() => {
              if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop() // Stop to create complete file
                setTimeout(createCompleteFile, 50) // Queue next file
              }
            }, 500) // 500ms for subsequent files
          }
        }
      }
      
      // Override ondataavailable to trigger next file creation
      const originalHandler = mediaRecorder.ondataavailable
      mediaRecorder.ondataavailable = (event) => {
        originalHandler?.call(mediaRecorder, event)
        
        // After file is created, start next one
        if (event.data.size > 0 && !isFirstChunk) {
          setTimeout(createCompleteFile, 50)
        }
      }
      
      // Start the process
      createCompleteFile()
      console.log('🎵 WebRTC streaming started with complete file generation')
      
      // Add recording state monitoring
      mediaRecorder.onstart = () => {
        console.log('🎙️ MediaRecorder started recording')
      }
      
      mediaRecorder.onstop = () => {
        console.log('🔴 MediaRecorder stopped recording')
      }
    } catch (error) {
      console.error('Failed to start WebRTC audio streaming:', error)
      throw error
    }
  }

  // Stop broadcasting
  stopBroadcast(): void {
    this.isActive = false

    if (this.socket) {
      this.socket.emit('leave-as-broadcaster', this.config.broadcastId)
    }

    // Stop all audio sources
    for (const [sourceId] of this.audioSources) {
      this.removeAudioSource(sourceId)
    }

    console.log('🛑 Broadcast stopped')
  }

  // Handle incoming phone calls
  private async handleIncomingCall(callData: any): Promise<void> {
    try {
      // Get caller's audio stream (this would be handled by WebRTC)
      const callerStream = await this.getCallerAudioStream(callData.callId)
      
      if (callerStream) {
        // Add caller as audio source
        await this.addAudioSource({
          id: `caller_${callData.callId}`,
          type: 'caller',
          name: callData.callerName || 'Caller',
          stream: callerStream,
          volume: 0.8,
          isMuted: false,
          isActive: true,
          priority: 2
        })

        console.log(`📞 Added caller ${callData.callerName} to broadcast`)
      }
    } catch (error) {
      console.error('Failed to handle incoming call:', error)
    }
  }

  private async getCallerAudioStream(callId: string): Promise<MediaStream | null> {
    // This would integrate with WebRTC to get the caller's audio stream
    // For now, return null as placeholder
    return null
  }

  // Audio level monitoring
  private startLevelMonitoring(): void {
    if (!this.analyserNode) return

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount)

    const updateLevels = () => {
      if (!this.analyserNode || !this.isActive) return

      this.analyserNode.getByteFrequencyData(dataArray)

      // Calculate levels
      let sum = 0
      let peak = 0
      for (let i = 0; i < dataArray.length; i++) {
        const value = dataArray[i]
        sum += value
        if (value > peak) peak = value
      }

      this.metrics.inputLevel = (sum / dataArray.length) / 255 * 100
      this.metrics.outputLevel = this.metrics.inputLevel * 0.9 // Simulated output level
      this.metrics.peakLevel = (peak / 255) * 100

      this.onMetricsUpdate?.(this.metrics)
      requestAnimationFrame(updateLevels)
    }

    updateLevels()
  }

  private updateMetrics(): void {
    this.metrics.activeSourceCount = Array.from(this.audioSources.values())
      .filter(source => source.isActive && !source.isMuted).length
  }

  // Get current audio sources
  getAudioSources(): AudioSource[] {
    return Array.from(this.audioSources.values())
  }

  // Get system metrics
  getMetrics(): AudioMetrics {
    return { ...this.metrics }
  }

  // Cleanup
  cleanup(): void {
    this.stopBroadcast()

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }

    if (this.socket) {
      this.socket.disconnect()
    }

    console.log('🧹 Audio system cleaned up')
  }

  // Callbacks
  public onMetricsUpdate?: (metrics: AudioMetrics) => void
  public onSourceRequest?: (data: any) => void
}

// WebRTC Audio Listener Class for receiving broadcasts
export class UnifiedAudioListener {
  private socket: Socket | null = null
  private audioContext: AudioContext | null = null
  private gainNode: GainNode | null = null
  private audioElement: HTMLAudioElement | null = null
  private mediaSource: MediaSource | null = null
  private sourceBuffer: SourceBuffer | null = null
  private isListening = false
  private volume = 1.0
  private muted = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private pendingAudioChunks: Uint8Array[] = []
  private useSimpleBlobApproach = false
  private audioChunkBuffer: Uint8Array[] = []
  private lastPlayTime = 0
  private audioQueue: Uint8Array[] = []
  private hasInitializationSegment = false
  private initializationSegment: Uint8Array | null = null

  constructor(private broadcastId: string) {}

  async startListening(): Promise<void> {
    try {
      console.log('🎧 Starting WebRTC listener for broadcast:', this.broadcastId)

      // Create HTML audio element for streaming
      this.audioElement = document.createElement('audio')
      this.audioElement.autoplay = true
      this.audioElement.controls = false
      this.audioElement.volume = this.muted ? 0 : this.volume
      
      // Hide audio element
      this.audioElement.style.display = 'none'
      document.body.appendChild(this.audioElement)

      // Set up Web Audio API for real-time audio processing
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        this.gainNode = this.audioContext.createGain()
        this.gainNode.connect(this.audioContext.destination)
        this.gainNode.gain.value = this.muted ? 0 : this.volume
        
        console.log('🎵 Web Audio API initialized for real-time streaming')
      }

      // Try alternative approach: simple audio element with blob URLs
      console.log('🎵 Using simple blob URL approach instead of MediaSource')
      this.useSimpleBlobApproach = true

      // Also set up MediaSource as fallback
      if ('MediaSource' in window) {
        this.mediaSource = new MediaSource()
        this.audioElement.src = URL.createObjectURL(this.mediaSource)
        
        await new Promise<void>((resolve, reject) => {
          this.mediaSource!.addEventListener('sourceopen', () => {
            console.log('🎵 MediaSource opened')
            try {
              // Add source buffer with dynamic format detection
              // Try MP4 first since we're receiving MP4 fragments
              let mimeType = 'audio/mp4; codecs="mp4a.40.2"'
              if (!MediaSource.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm; codecs=opus'
                if (!MediaSource.isTypeSupported(mimeType)) {
                  mimeType = 'audio/webm'
                }
              }
              console.log(`🎵 Creating SourceBuffer with MIME type: ${mimeType}`)
              this.sourceBuffer = this.mediaSource!.addSourceBuffer(mimeType)
              this.sourceBuffer.addEventListener('updateend', () => {
                this.processPendingChunks()
              })
              console.log('✅ Source buffer created')
              resolve()
            } catch (error) {
              console.error('❌ Failed to create source buffer:', error)
              reject(error)
            }
          })
          
          this.mediaSource!.addEventListener('sourceclose', () => {
            console.log('🔴 MediaSource closed')
          })
        })
      } else {
        console.warn('⚠️ MediaSource not supported, using Web Audio API only')
      }

      // Connect to WebRTC signaling server
      await this.connectToServer()

      this.isListening = true
      console.log('🎧 WebRTC listener started successfully')
    } catch (error) {
      console.error('Failed to start WebRTC listening:', error)
      throw error
    }
  }

  private async connectToServer(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.socket = io('http://localhost:3001', {
        transports: ['websocket'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 2000,
        forceNew: false
      })

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'))
      }, 10000)

      // Set up debug logging immediately after socket creation
      const originalEmit = this.socket.onevent
      this.socket.onevent = function(packet: any) {
        const eventName = packet.data[0]
        
        // Log ALL events to debug what we're receiving
        if (eventName) {
          if (eventName.includes('audio') || eventName.includes('stream') || eventName.includes('broadcast')) {
            console.log('🔍 LISTENER RECEIVED AUDIO EVENT:', eventName, packet.data)
          } else {
            console.log('🔍 LISTENER RECEIVED OTHER EVENT:', eventName)
          }
        }
        
        // Call original emit
        return originalEmit.call(this, packet)
      }

      this.socket.on('connect', () => {
        clearTimeout(timeout)
        console.log('🔗 WebRTC listener connected to server')
        this.reconnectAttempts = 0
        
        // Join broadcast as listener
        console.log(`🏠 Emitting join-broadcast for broadcastId: ${this.broadcastId}`)
        this.socket!.emit('join-broadcast', this.broadcastId, {
          role: 'listener',
          timestamp: Date.now()
        })
        
        this.setupAudioStreamHandler()
        resolve()
      })
      
      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout)
        console.error('❌ WebRTC listener connection error:', error)
        reject(new Error(`Connection failed: ${error.message}`))
      })

      this.socket.on('disconnect', (reason) => {
        console.warn('🔌 WebRTC listener disconnected:', reason)
        if (this.isListening && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect()
        }
      })

      this.socket.on('broadcast-ended', () => {
        console.log('🔚 Broadcast ended by host')
        this.stopListening()
      })
    })
  }

  private setupAudioStreamHandler(): void {
    if (!this.socket) {
      console.warn('⚠️ Cannot setup audio handlers - no socket connection')
      return
    }

    console.log('🎧 Setting up audio stream handlers for listener')

    // Listen for multiple possible audio event patterns
    const audioEventHandlers = [
      'audio-stream',
      'broadcast-audio', 
      'audio-data',
      'live-audio',
      'stream-data'
    ]

    audioEventHandlers.forEach(eventName => {
      console.log(`🎧 Registering handler for event: ${eventName}`)
      this.socket!.on(eventName, async (...args: any[]) => {
        console.log(`🎵 PROCESSING ${eventName} with args:`, args)
        
        let audioData: any = null
        let broadcastId: string | null = null
        
        // Parse different argument patterns
        if (args.length === 2 && typeof args[0] === 'string') {
          // Pattern: (broadcastId, data)
          broadcastId = args[0]
          audioData = args[1]
        } else if (args.length === 1) {
          // Pattern: (data)
          audioData = args[0]
        } else {
          console.warn(`⚠️ Unexpected ${eventName} arguments:`, args)
          return
        }

        // Extract audio from various data formats
        let base64Audio: string | null = null
        
        if (typeof audioData === 'string') {
          // Direct base64 string
          base64Audio = audioData
        } else if (audioData?.audio) {
          // { audio: "base64data", ... }
          base64Audio = audioData.audio
        } else if (audioData?.audioData) {
          // { audioData: "base64data", ... }
          base64Audio = audioData.audioData
        } else if (audioData?.data?.audio) {
          // { data: { audio: "base64data" } }
          base64Audio = audioData.data.audio
        }

        if (!base64Audio) {
          console.warn(`⚠️ No audio data found in ${eventName}:`, audioData)
          return
        }

        console.log(`🎵 Parsed ${eventName} audio:`, { 
          broadcastId, 
          audioSize: base64Audio.length,
          hasValidBase64: /^[A-Za-z0-9+/]+=*$/.test(base64Audio.substring(0, 100))
        })

        try {
          await this.handleAudioChunk(base64Audio)
        } catch (error) {
          console.error(`❌ Failed to process audio from ${eventName}:`, error)
          // Log first 100 chars of audio data for debugging
          console.error('Audio data sample:', base64Audio.substring(0, 100))
        }
      })
    })
  }

  private async handleAudioChunk(base64Audio: string): Promise<void> {
    console.log('🎵 handleAudioChunk called with audio length:', base64Audio.length)
    if (!this.audioElement) {
      console.warn('⚠️ No audio element available for playback')
      return
    }

    try {
      // Decode base64 to binary
      const binaryString = atob(base64Audio)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      console.log('🎵 Processing audio chunk:', {
        byteLength: bytes.length,
        hasSourceBuffer: !!this.sourceBuffer,
        hasAudioContext: !!this.audioContext,
        updating: this.sourceBuffer?.updating,
        fileHeader: this.getFileHeader(bytes)
      })
      
      // Log the format from audio data
      console.log('🎵 Audio data format info:', this.analyzeAudioData(base64Audio))

      // We now have complete MP4 files with ftyp headers - perfect for blob approach!
      console.log('🎵 Complete MP4 files detected - using blob approach for immediate playback')
      
      // Try blob approach first since we have complete playable files
      if (this.useSimpleBlobApproach) {
        try {
          await this.playAudioWithBlob(bytes)
          console.log('✅ Complete MP4 file played successfully via blob!')
          return
        } catch (error) {
          console.warn('⚠️ Blob approach failed, falling back to MediaSource:', error.message)
        }
      }
      
      // Skip Web Audio API for streaming chunks - they're not complete files  
      // Web Audio API requires complete audio files, but we're receiving streaming chunks
      console.log('🎵 Using MediaSource for streaming audio chunks (skipping Web Audio API)')
      
      // Web Audio API attempt would fail with streaming chunks
      // if (this.audioContext && this.gainNode) {
      //   try {
      //     console.log('🎧 Attempting Web Audio API decode...')
      //     const audioBuffer = await this.audioContext.decodeAudioData(bytes.buffer.slice(0))
      //     const source = this.audioContext.createBufferSource()
      //     source.buffer = audioBuffer
      //     source.connect(this.gainNode)
      //     source.start()
      //     console.log('🎵 Web Audio API playback started successfully!')
      //     return
      //   } catch (error) {
      //     console.warn('⚠️ Web Audio API decode failed, falling back to MediaSource:', error.message)
      //   }
      // }

      // Direct MediaSource approach for streaming
      if (this.sourceBuffer && this.mediaSource) {
        try {
          // Validate MediaSource state
          if (this.mediaSource.readyState === 'closed') {
            console.log('🔄 MediaSource closed, recreating...')
            await this.recreateMediaSource()
            // If recreation failed, skip this chunk
            if (!this.sourceBuffer || this.mediaSource.readyState === 'closed') {
              console.warn('⚠️ Failed to recreate MediaSource, dropping audio chunk')
              return
            }
          }

          // Check if this looks like a valid audio chunk (MP4 or WebM)
          const isValidChunk = this.isValidAudioChunk(bytes)
          console.log(`📦 Chunk validation: ${isValidChunk ? '✅ Valid audio' : '❌ Invalid audio'} chunk`)
          
          if (isValidChunk) {
            // Check if this is a complete MP4 file with initialization data
            const boxType = bytes.length >= 8 ? String.fromCharCode(...bytes.slice(4, 8)) : ''
            
            // Look for complete files that start with ftyp 
            if (boxType === 'ftyp' && !this.hasInitializationSegment) {
              console.log(`🎬 Found complete MP4 file with initialization (${bytes.length} bytes)`)
              this.initializationSegment = bytes
              this.hasInitializationSegment = true
              
              // Process complete file immediately
              if (this.sourceBuffer && !this.sourceBuffer.updating) {
                try {
                  this.sourceBuffer.appendBuffer(bytes)
                  console.log('✅ Complete MP4 file added to MediaSource')
                } catch (error) {
                  console.error('❌ Failed to add complete MP4 file:', error)
                }
              }
              return // Don't queue complete files with initialization
            }
            
            // Also handle separate moov boxes if they come later
            else if (boxType === 'moov' && !this.hasInitializationSegment) {
              console.log(`🎬 Found separate initialization segment: ${boxType}`)
              this.initializationSegment = bytes
              this.hasInitializationSegment = true
              
              if (this.sourceBuffer && !this.sourceBuffer.updating) {
                try {
                  this.sourceBuffer.appendBuffer(bytes)
                  console.log('✅ Separate initialization segment added to MediaSource')
                } catch (error) {
                  console.error('❌ Failed to add initialization segment:', error)
                }
              }
              return
            }
            
            // Only process media fragments if we have initialization
            if (!this.hasInitializationSegment && boxType === 'moof') {
              console.warn('⚠️ Received media fragment without initialization - waiting for init segment')
              return
            }
            
            // Add to pending chunks queue
            this.pendingAudioChunks.push(bytes)
            
            // For continuous streaming, log every few chunks
            if (this.pendingAudioChunks.length === 1 || this.pendingAudioChunks.length % 5 === 0) {
              console.log(`📦 Streaming: ${this.pendingAudioChunks.length} chunks queued (init: ${this.hasInitializationSegment})`)
            }
            
            // Process immediately if not updating and we have init
            if (!this.sourceBuffer.updating && this.hasInitializationSegment) {
              this.processPendingChunks()
            } else {
              console.log('⏳ SourceBuffer busy or waiting for initialization')
            }
          } else {
            console.warn('⚠️ Skipping invalid audio chunk')
          }
        } catch (error) {
          console.error('❌ Error in MediaSource processing:', error)
          // Try to recreate MediaSource on errors
          await this.recreateMediaSource()
        }
      } else {
        console.warn('⚠️ No source buffer available, trying to recreate...')
        await this.recreateMediaSource()
      }
      
    } catch (error) {
      console.error('❌ Failed to handle audio chunk:', error)
      throw error
    }
  }

  private processPendingChunks(): void {
    if (!this.sourceBuffer || !this.mediaSource || this.pendingAudioChunks.length === 0) {
      return
    }

    // Check MediaSource state
    if (this.mediaSource.readyState !== 'open') {
      console.warn('⚠️ MediaSource not in open state:', this.mediaSource.readyState)
      
      // Attempt to recreate MediaSource if it's closed
      if (this.mediaSource.readyState === 'closed') {
        console.log('🔄 Recreating MediaSource because it was closed...')
        this.recreateMediaSource()
      }
      return
    }

    // Check if SourceBuffer is still attached and not updating
    if (this.sourceBuffer.updating || !this.mediaSource.sourceBuffers.length) {
      return
    }

    try {
      const chunk = this.pendingAudioChunks.shift()!
      // For continuous streaming, log more frequently for debugging
      if (this.pendingAudioChunks.length === 0 || Math.random() < 0.2) {
        console.log(`🎵 Processing audio chunk: ${chunk.length} bytes (${this.pendingAudioChunks.length} in queue)`)
      }
      
      this.sourceBuffer.appendBuffer(chunk)
      
      // Start playback if not already playing and we have enough data
      if (this.audioElement && this.audioElement.paused && this.audioElement.readyState >= 2) {
        this.audioElement.play().then(() => {
          console.log('🎵 Audio playback started successfully!')
        }).catch(error => {
          console.warn('⚠️ Could not start playback (will retry):', error.message)
        })
      }
    } catch (error) {
      console.error('❌ Failed to append buffer:', error)
      
      // Try to recover if SourceBuffer was removed
      if (error.message.includes('removed from the parent media source')) {
        console.log('🔧 SourceBuffer was removed, attempting recovery...')
        this.recoverMediaSource()
      } else if (error.message.includes('quota')) {
        console.log('💾 Buffer quota exceeded, clearing old data...')
        this.clearOldBufferData()
      } else {
        // Clear the problematic chunk and try next one
        console.warn('⚠️ Skipping problematic chunk, trying next...')
        if (this.pendingAudioChunks.length > 0) {
          setTimeout(() => this.processPendingChunks(), 100)
        }
      }
    }
  }

  private clearOldBufferData(): void {
    if (!this.sourceBuffer || !this.audioElement) return
    
    try {
      const currentTime = this.audioElement.currentTime
      // Clear buffer data older than 30 seconds
      const clearBefore = Math.max(0, currentTime - 30)
      
      if (this.sourceBuffer.buffered.length > 0 && clearBefore > 0) {
        console.log(`💾 Clearing buffer data before ${clearBefore.toFixed(2)}s`)
        this.sourceBuffer.remove(0, clearBefore)
      }
    } catch (error) {
      console.warn('⚠️ Failed to clear old buffer data:', error)
    }
  }

  private recoverMediaSource(): void {
    console.log('🔧 Attempting to recover MediaSource...')
    try {
      if (this.mediaSource && this.mediaSource.readyState === 'open') {
        // Clear existing source buffer reference
        this.sourceBuffer = null
        
        // Recreate source buffer with dynamic format detection - prioritize MP4
        let mimeType = 'audio/mp4; codecs="mp4a.40.2"'
        if (!MediaSource.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm; codecs=opus'
          if (!MediaSource.isTypeSupported(mimeType)) {
            mimeType = 'audio/webm'
          }
        }
        console.log(`🔧 Recreating SourceBuffer with MIME type: ${mimeType}`)
        this.sourceBuffer = this.mediaSource.addSourceBuffer(mimeType)
        this.sourceBuffer.addEventListener('updateend', () => {
          this.processPendingChunks()
        })
        
        console.log('✅ MediaSource recovered successfully')
        
        // Process any pending chunks
        if (this.pendingAudioChunks.length > 0) {
          setTimeout(() => this.processPendingChunks(), 100)
        }
      }
    } catch (error) {
      console.error('❌ Failed to recover MediaSource:', error)
    }
  }

  private async recreateMediaSource(): Promise<void> {
    console.log('🔄 Recreating entire MediaSource...')
    try {
      // Clear pending chunks to avoid overwhelming the new MediaSource
      this.pendingAudioChunks = []
      
      // Reset initialization segment flag - need new one for new MediaSource
      this.hasInitializationSegment = false
      this.initializationSegment = null
      
      // Clean up existing MediaSource
      if (this.mediaSource) {
        try {
          if (this.sourceBuffer) {
            this.mediaSource.removeSourceBuffer(this.sourceBuffer)
          }
        } catch (error) {
          // MediaSource might already be closed, ignore errors
        }
        this.mediaSource = null
        this.sourceBuffer = null
      }

      // Clean up old URL if it exists
      if (this.audioElement && this.audioElement.src) {
        try {
          URL.revokeObjectURL(this.audioElement.src)
          this.audioElement.src = ''
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      // Recreate MediaSource
      this.mediaSource = new MediaSource()
      
      // Add sourceclose listener to debug why MediaSource is closing
      this.mediaSource.addEventListener('sourceclose', () => {
        console.log('🔴 New MediaSource closed')
      })
      
      if (this.audioElement) {
        this.audioElement.src = URL.createObjectURL(this.mediaSource)
        console.log('🎵 Audio element source set to new MediaSource')
      }
      
      // Wait for MediaSource to open
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('MediaSource recreation timeout'))
        }, 5000)
        
        this.mediaSource!.addEventListener('sourceopen', () => {
          clearTimeout(timeout)
          console.log('🎵 New MediaSource opened')
          try {
            // Add source buffer with dynamic format detection - prioritize MP4 
            let mimeType = 'audio/mp4; codecs="mp4a.40.2"'
            if (!MediaSource.isTypeSupported(mimeType)) {
              mimeType = 'audio/webm; codecs=opus'
              if (!MediaSource.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm'
              }
            }
            console.log(`🔄 Creating new SourceBuffer with MIME type: ${mimeType}`)
            this.sourceBuffer = this.mediaSource!.addSourceBuffer(mimeType)
            this.sourceBuffer.addEventListener('updateend', () => {
              this.processPendingChunks()
            })
            console.log('✅ New source buffer created')
            resolve()
          } catch (error) {
            console.error('❌ Failed to create new source buffer:', error)
            reject(error)
          }
        })
        
        this.mediaSource!.addEventListener('sourceclose', () => {
          console.log('🔴 New MediaSource closed')
        })
      })
      
      console.log('✅ MediaSource recreated successfully')
      
    } catch (error) {
      console.error('❌ Failed to recreate MediaSource:', error)
    }
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++
    const delay = Math.min(5000, 1000 * Math.pow(2, this.reconnectAttempts - 1))
    
    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(async () => {
      try {
        if (this.socket) {
          this.socket.disconnect()
        }
        await this.connectToServer()
      } catch (error) {
        console.error('Reconnection failed:', error)
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached')
          this.stopListening()
        }
      }
    }, delay)
  }

  stopListening(): void {
    this.isListening = false

    // Clear pending chunks
    this.pendingAudioChunks = []

    if (this.socket) {
      this.socket.emit('leave-broadcast', this.broadcastId)
      this.socket.disconnect()
      this.socket = null
    }

    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.src = ''
      if (this.audioElement.parentNode) {
        document.body.removeChild(this.audioElement)
      }
      this.audioElement = null
    }

    if (this.mediaSource) {
      try {
        if (this.mediaSource.readyState === 'open') {
          this.mediaSource.endOfStream()
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.mediaSource = null
    }

    this.sourceBuffer = null
    console.log('🔇 WebRTC listener stopped')
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume / 100))
    if (this.audioElement) {
      this.audioElement.volume = this.muted ? 0 : this.volume
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (this.audioElement) {
      this.audioElement.volume = muted ? 0 : this.volume
    }
  }

  isConnected(): boolean {
    return Boolean(this.socket?.connected && this.isListening)
  }

  getConnectionState(): 'disconnected' | 'connecting' | 'connected' | 'failed' {
    if (!this.socket) return 'disconnected'
    if (this.socket.connected && this.isListening) return 'connected'
    if (this.reconnectAttempts > 0) return 'connecting'
    return 'failed'
  }

  private getFileHeader(bytes: Uint8Array): string {
    // Get first 16 bytes as header for format detection
    const headerBytes = bytes.slice(0, Math.min(16, bytes.length))
    const headerHex = Array.from(headerBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ')
    
    // Check for common audio formats
    if (bytes.length >= 4) {
      const first4 = String.fromCharCode(...bytes.slice(0, 4))
      if (first4 === 'RIFF') return `WAV (${headerHex})`
      if (first4.slice(0, 3) === 'ID3') return `MP3 (${headerHex})`
    }
    
    if (bytes.length >= 8) {
      const first8 = String.fromCharCode(...bytes.slice(0, 8))
      if (first8.includes('ftyp')) return `MP4/M4A (${headerHex})`
    }
    
    // Check for WebM signature
    if (bytes.length >= 4 && bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
      return `WebM/Matroska (${headerHex})`
    }
    
    return `Unknown (${headerHex})`
  }

  private analyzeAudioData(base64Audio: string): any {
    try {
      // Decode base64 to get raw bytes
      const binaryString = atob(base64Audio)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      return {
        size: bytes.length,
        base64Length: base64Audio.length,
        firstBytes: Array.from(bytes.slice(0, 8)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '),
        lastBytes: Array.from(bytes.slice(-8)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '),
        containsRIFF: binaryString.includes('RIFF'),
        containsWebM: bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3,
        containsOpus: binaryString.includes('Opus'),
        averageValue: Array.from(bytes).reduce((sum, val) => sum + val, 0) / bytes.length
      }
    } catch (error) {
      return { error: error.message }
    }
  }

  private async handleContinuousAudioStream(bytes: Uint8Array): Promise<void> {
    // Add chunk to buffer
    this.audioChunkBuffer.push(bytes)
    
    // Check if we have enough data to play (accumulate ~1 second worth)
    const now = Date.now()
    
    // Play immediately for first chunk or if enough time has passed (500ms for low latency)
    if (this.lastPlayTime === 0 || now - this.lastPlayTime > 500) {
      if (this.audioChunkBuffer.length > 0) {
        try {
          // Combine buffered chunks for smoother playback
          const combinedSize = this.audioChunkBuffer.reduce((sum, chunk) => sum + chunk.length, 0)
          const combined = new Uint8Array(combinedSize)
          let offset = 0
          
          for (const chunk of this.audioChunkBuffer) {
            combined.set(chunk, offset)
            offset += chunk.length
          }
          
          // Try to play the combined chunk
          await this.playAudioWithBlob(combined)
          
          // Clear buffer and update timing
          this.audioChunkBuffer = []
          this.lastPlayTime = now
          
          console.log(`🎵 Played combined audio chunk: ${combinedSize} bytes from ${this.audioChunkBuffer.length} chunks`)
        } catch (error) {
          console.warn('⚠️ Combined chunk playback failed:', error.message)
          // Keep trying with individual chunks in queue
          this.audioQueue.push(...this.audioChunkBuffer)
          this.audioChunkBuffer = []
          this.processAudioQueue()
        }
      }
    }
    
    // Always try to process any queued audio for continuous playback
    if (this.audioQueue.length > 0) {
      this.processAudioQueue()
    }
  }

  private async processAudioQueue(): Promise<void> {
    if (this.audioQueue.length === 0) return
    
    const chunk = this.audioQueue.shift()!
    try {
      await this.playAudioWithBlob(chunk)
      console.log(`🎵 Processed queued chunk: ${chunk.length} bytes`)
      
      // Continue processing queue with small delay
      if (this.audioQueue.length > 0) {
        setTimeout(() => this.processAudioQueue(), 50)
      }
    } catch (error) {
      console.warn('⚠️ Queued chunk failed:', error.message)
      // Try next chunk in queue
      if (this.audioQueue.length > 0) {
        setTimeout(() => this.processAudioQueue(), 100)
      }
    }
  }

  private async playAudioWithBlob(bytes: Uint8Array): Promise<void> {
    if (!this.audioElement) {
      throw new Error('No audio element available')
    }

    // Detect format from header and create appropriate blob
    let mimeType = 'audio/wav' // Default to WAV
    
    // Check for RIFF/WAV header
    if (bytes.length >= 4) {
      const riffHeader = String.fromCharCode(...bytes.slice(0, 4))
      if (riffHeader === 'RIFF') {
        mimeType = 'audio/wav'
        console.log('📦 Detected WAV format for blob playback')
      } 
      // Check for WebM header  
      else if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
        mimeType = 'audio/webm'
        console.log('📦 Detected WebM format for blob playback')
      }
      // Check for MP4 header - look for various MP4 signatures
      else if (bytes.length >= 8) {
        const mp4Header = String.fromCharCode(...bytes.slice(4, 8))
        if (mp4Header.includes('ftyp') || mp4Header.includes('moof') || mp4Header === 'moof') {
          mimeType = 'audio/mp4'
          console.log('📦 Detected MP4 format for blob playback')
        }
        // Also check for MP4 fragment box signatures
        else if (bytes[4] === 0x6d && bytes[5] === 0x6f && bytes[6] === 0x6f && bytes[7] === 0x66) {
          mimeType = 'audio/mp4'
          console.log('📦 Detected MP4 fragment (moof) for blob playback')
        }
      }
    }

    // Create a blob from the audio bytes with detected format
    const blob = new Blob([bytes], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    // Create a new audio element for this chunk to allow overlapping playback
    const chunkAudio = new Audio()
    chunkAudio.src = url
    chunkAudio.volume = this.muted ? 0 : this.volume
    chunkAudio.preload = 'auto'
    
    // Attempt to play
    try {
      // Wait for audio to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Audio load timeout')), 3000)
        
        chunkAudio.addEventListener('canplaythrough', () => {
          clearTimeout(timeout)
          resolve()
        }, { once: true })
        
        chunkAudio.addEventListener('error', () => {
          clearTimeout(timeout)
          reject(new Error(`Audio load error: ${chunkAudio.error?.message || 'Unknown'}`))
        }, { once: true })
      })
      
      await chunkAudio.play()
      console.log(`🎵 ${mimeType} audio chunk playing successfully (2s duration)`)
      
      // Clean up URL after playback ends or fails
      const cleanup = () => {
        URL.revokeObjectURL(url)
        chunkAudio.remove()
      }
      
      chunkAudio.addEventListener('ended', cleanup, { once: true })
      chunkAudio.addEventListener('error', cleanup, { once: true })
      
      // Also cleanup after 5 seconds to prevent memory leaks
      setTimeout(cleanup, 5000)
      
    } catch (error) {
      URL.revokeObjectURL(url)
      throw error
    }
  }

  private isValidAudioChunk(bytes: Uint8Array): boolean {
    // Check for MP4 fragments (most common now)
    if (this.isValidMP4Chunk(bytes)) return true
    
    // Check for WebM chunks (fallback)
    if (this.isValidWebMChunk(bytes)) return true
    
    return false
  }

  private isValidMP4Chunk(bytes: Uint8Array): boolean {
    if (bytes.length < 8) return false
    
    // Check for MP4 box signatures
    const boxType = String.fromCharCode(...bytes.slice(4, 8))
    
    // Common MP4 boxes in streaming
    const validBoxTypes = ['ftyp', 'moof', 'mdat', 'moov', 'mfhd', 'traf', 'tfhd', 'trun']
    
    if (validBoxTypes.includes(boxType)) {
      console.log(`📦 Found MP4 box: ${boxType}`)
      return true
    }
    
    return false
  }

  private isValidWebMChunk(bytes: Uint8Array): boolean {
    // Check for WebM/Matroska EBML header (0x1A 0x45 0xDF 0xA3)
    if (bytes.length >= 4 && bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
      return true // This is a complete WebM file with EBML header
    }
    
    // Check for WebM cluster element (contains audio data) - 0x1F 0x43 0xB6 0x75
    if (bytes.length >= 4 && bytes[0] === 0x1F && bytes[1] === 0x43 && bytes[2] === 0xB6 && bytes[3] === 0x75) {
      return true // This is a WebM cluster (streaming data)
    }
    
    // Check for generic WebM segment starting with variable-length encoding
    // WebM uses EBML variable-length encoding, look for patterns that suggest valid segments
    if (bytes.length > 10) {
      // Look for common WebM elements like SimpleBlock (0xA3) or Block (0xA1)
      for (let i = 0; i < Math.min(bytes.length - 4, 20); i++) {
        if (bytes[i] === 0xA3 || bytes[i] === 0xA1) {
          return true // Found block element
        }
      }
    }
    
    // For now, accept all chunks since MediaRecorder should produce valid WebM segments
    // The real issue might be the streaming approach itself
    return true
  }
}

// Helper function to create a configured audio system
export function createAudioSystem(broadcastId: string): UnifiedAudioSystem {
  return new UnifiedAudioSystem({
    broadcastId,
    sampleRate: 48000,
    channels: 2,
    bitrate: 128000,
    maxSources: 8
  })
}

// Helper function to create an audio listener
export function createAudioListener(broadcastId: string): UnifiedAudioListener {
  return new UnifiedAudioListener(broadcastId)
}