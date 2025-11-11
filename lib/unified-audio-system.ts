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

    this.socket.on('server-stats', (stats: any) => {
      console.log('🖥️ Server stats:', stats)
    })
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
      // Ensure audio context is running
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Setup audio processing if not done yet
      if (!this.mixerNode) {
        this.setupAudioProcessing()
      }

      if (!this.destinationStream) {
        throw new Error('Audio processing not initialized')
      }

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
      console.log('📻 Broadcast started successfully')
    } catch (error) {
      console.error('Failed to start broadcast:', error)
      throw error
    }
  }

  private async startAudioStreaming(): Promise<void> {
    if (!this.destinationStream || !this.socket) return

    try {
      // Create media recorder for streaming
      const mediaRecorder = new MediaRecorder(this.destinationStream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: this.config.bitrate
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.socket?.connected) {
          const reader = new FileReader()
          reader.onloadend = () => {
            const audioData = (reader.result as string).split(',')[1]
            this.socket!.emit('broadcast-audio', this.config.broadcastId, {
              audio: audioData,
              timestamp: Date.now(),
              metrics: this.metrics
            })
          }
          reader.readAsDataURL(event.data)
        }
      }

      mediaRecorder.start(100) // 100ms chunks for low latency
      console.log('🎵 Audio streaming started')
    } catch (error) {
      console.error('Failed to start audio streaming:', error)
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

// Audio Listener Class for receiving broadcasts
export class UnifiedAudioListener {
  private socket: Socket | null = null
  private audioContext: AudioContext | null = null
  private audioElement: HTMLAudioElement | null = null
  private isListening = false

  constructor(private broadcastId: string) {}

  async startListening(): Promise<void> {
    try {
      // Create audio element first
      this.audioElement = document.createElement('audio')
      this.audioElement.autoplay = true
      this.audioElement.controls = false
      this.audioElement.style.display = 'none'
      document.body.appendChild(this.audioElement)

      // Create audio context (will be suspended until user gesture)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Resume on user gesture (this call triggers it)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Connect to server with stable settings
      this.socket = io('http://localhost:3001', {
        transports: ['websocket'],
        timeout: 15000,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 3000,
        forceNew: false
      })
      
      await new Promise((resolve) => {
        this.socket!.on('connect', () => {
          console.log('🔗 Listener connected to server')
          resolve(true)
        })
        this.socket!.on('connect_error', (error) => {
          console.warn('Server connection failed:', error)
          resolve(true) // Continue without server
        })
        setTimeout(() => resolve(true), 3000) // Don't wait too long
      })

      // Join broadcast as listener if connected
      if (this.socket?.connected) {
        console.log('🎧 Joining broadcast as listener:', this.broadcastId)
        this.socket.emit('join-broadcast', this.broadcastId)
        
        // Completely ignore WebRTC audio streams to prevent encoding errors
        this.socket.off('audio-stream')
        
        // Use HTTP stream directly
        setTimeout(() => this.tryHttpStream(), 1000) // Small delay to ensure server is ready
      } else {
        console.log('🎧 Socket not connected, using HTTP stream directly')
        this.tryHttpStream()
      }

      this.isListening = true
      console.log('🎧 Started listening to broadcast')
    } catch (error) {
      console.error('Failed to start listening:', error)
      throw error
    }
  }


  
  private async validateAudioStream(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      const contentType = response.headers.get('content-type')
      return response.ok && (contentType?.includes('audio/') || contentType?.includes('application/octet-stream'))
    } catch {
      return false
    }
  }

  private tryHttpStream(): void {
    if (!this.audioElement || !this.broadcastId) return
    
    const streamUrl = `${process.env.NEXT_PUBLIC_REALTIME_SERVER_URL || 'http://localhost:3001'}/stream/broadcast/${this.broadcastId}/stream.mp3`
    
    // Only set stream URL if not already set
    if (this.audioElement.src !== streamUrl) {
      console.log('🎵 Setting HTTP stream:', streamUrl)
      
      // Add event listeners to debug what's happening
      this.audioElement.onloadstart = () => console.log('🔄 Audio loading started')
      this.audioElement.oncanplay = () => console.log('✅ Audio can play')
      this.audioElement.onplay = () => console.log('▶️ Audio started playing')
      this.audioElement.onerror = (e) => console.error('❌ Audio error:', e)
      this.audioElement.onabort = () => console.log('⏹️ Audio aborted')
      this.audioElement.onstalled = () => console.log('⏸️ Audio stalled')
      
      // Validate stream before setting
      this.validateAudioStream(streamUrl).then(isValid => {
        if (isValid && this.audioElement) {
          console.log('✅ Stream validation passed, setting source')
          this.audioElement.src = streamUrl
          this.audioElement.play().catch(error => {
            console.error('❌ HTTP stream play failed:', error)
          })
        } else {
          console.warn('❌ Invalid audio stream, skipping')
        }
      }).catch(error => {
        console.error('❌ Stream validation failed:', error)
      })
    }
  }

  stopListening(): void {
    this.isListening = false

    if (this.socket) {
      this.socket.disconnect()
    }

    if (this.audioElement) {
      document.body.removeChild(this.audioElement)
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }

    console.log('🔇 Stopped listening')
  }

  setVolume(volume: number): void {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume / 100))
    }
  }

  setMuted(muted: boolean): void {
    if (this.audioElement) {
      this.audioElement.muted = muted
    }
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