// Audio Receiver for Live Broadcast Listening
// This handles receiving and playing live audio streams via WebRTC

export interface ReceiverQualityMetrics {
  packetsReceived: number
  packetsLost: number
  jitter: number
  audioLevel: number
  connectionState: RTCPeerConnectionState
}

export class AudioReceiver {
  private peerConnection: RTCPeerConnection | null = null
  private audioElement: (HTMLAudioElement & { playsInline?: boolean }) | null = null
  private audioContext: AudioContext | null = null
  private analyserNode: AnalyserNode | null = null
  private gainNode: GainNode | null = null
  private audioLevels: Uint8Array | null = null
  private isReceiving = false
  private qualityMonitorInterval: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3

  constructor() {
    this.createAudioElement()
  }

  private createAudioElement(): void {
    this.audioElement = document.createElement('audio')
    this.audioElement.autoplay = true
    this.audioElement.controls = false
    this.audioElement.playsInline = true
    
    // Add to DOM but keep hidden
    this.audioElement.style.display = 'none'
    document.body.appendChild(this.audioElement)
  }

  async initializeReceiver(): Promise<void> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Audio receiver is only available in browser environment')
      }

      // Create audio context for audio processing
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) {
        throw new Error('Web Audio API is not supported in this browser')
      }

      this.audioContext = new AudioContext()

      // Resume audio context if suspended (required for some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
      
      // Check for WebRTC support
      if (!window.RTCPeerConnection) {
        throw new Error('WebRTC is not supported in this browser')
      }

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })

      // Handle incoming audio stream
      this.peerConnection.ontrack = (event) => {
        console.log('Received remote audio stream')
        if (this.audioElement && event.streams[0]) {
          this.audioElement.srcObject = event.streams[0]
          this.setupAudioProcessing(event.streams[0])
        }
      }

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignalingMessage?.({
            type: 'ice-candidate',
            data: event.candidate
          })
        }
      }

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState
        console.log('Connection state changed:', state)
        
        if (state === 'connected') {
          this.isReceiving = true
          this.reconnectAttempts = 0
          this.startQualityMonitoring()
          this.onConnectionStateChange?.('connected')
        } else if (state === 'disconnected' || state === 'failed') {
          this.isReceiving = false
          this.stopQualityMonitoring()
          this.onConnectionStateChange?.('disconnected')
          
          // Attempt to reconnect
          this.attemptReconnect()
        }
      }

      console.log('Audio receiver initialized')
    } catch (error) {
      console.error('Failed to initialize audio receiver:', error)
      throw error
    }
  }

  private setupAudioProcessing(stream: MediaStream): void {
    if (!this.audioContext) return

    try {
      // Create audio processing chain for monitoring
      const sourceNode = this.audioContext.createMediaStreamSource(stream)
      this.gainNode = this.audioContext.createGain()
      this.analyserNode = this.audioContext.createAnalyser()

      // Configure analyser
      this.analyserNode.fftSize = 256
      this.analyserNode.smoothingTimeConstant = 0.8
      this.audioLevels = new Uint8Array(this.analyserNode.frequencyBinCount)

      // Connect nodes (but don't connect to destination to avoid echo)
      sourceNode.connect(this.gainNode).connect(this.analyserNode)

      console.log('Audio processing setup completed')
    } catch (error) {
      console.error('Failed to setup audio processing:', error)
    }
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    await this.peerConnection.setRemoteDescription(offer)
    
    const answer = await this.peerConnection.createAnswer()
    await this.peerConnection.setLocalDescription(answer)
    
    return answer
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.peerConnection) {
      await this.peerConnection.addIceCandidate(candidate)
    }
  }

  private startQualityMonitoring(): void {
    if (!this.peerConnection) return

    this.qualityMonitorInterval = setInterval(async () => {
      try {
        const stats = await this.peerConnection!.getStats()
        let metrics: Partial<ReceiverQualityMetrics> = {
          connectionState: this.peerConnection!.connectionState
        }

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
            metrics.packetsReceived = report.packetsReceived || 0
            metrics.packetsLost = report.packetsLost || 0
            metrics.jitter = report.jitter || 0
          }
        })

        // Get current audio level
        metrics.audioLevel = this.getAudioLevel()

        this.onQualityUpdate?.(metrics as ReceiverQualityMetrics)
      } catch (error) {
        console.error('Failed to get receiver stats:', error)
      }
    }, 2000)
  }

  private stopQualityMonitoring(): void {
    if (this.qualityMonitorInterval) {
      clearInterval(this.qualityMonitorInterval)
      this.qualityMonitorInterval = null
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = 1000 * Math.pow(2, this.reconnectAttempts - 1)
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.onReconnectAttempt?.()
      }, delay)
    } else {
      console.error('Max reconnection attempts reached')
      this.onConnectionError?.('Max reconnection attempts exceeded')
    }
  }

  getAudioLevel(): number {
    if (!this.analyserNode || !this.audioLevels) return 0

    this.analyserNode.getByteFrequencyData(this.audioLevels as Uint8Array)
    
    // Calculate average level
    let sum = 0
    for (let i = 0; i < this.audioLevels.length; i++) {
      sum += this.audioLevels[i]
    }
    
    return (sum / this.audioLevels.length) / 255 * 100
  }

  setVolume(volume: number): void {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume / 100))
    }
    
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(volume / 100, this.audioContext?.currentTime || 0)
    }
  }

  mute(muted: boolean): void {
    if (this.audioElement) {
      this.audioElement.muted = muted
    }
  }

  isConnected(): boolean {
    return this.peerConnection?.connectionState === 'connected'
  }

  isPlaying(): boolean {
    return this.audioElement ? !this.audioElement.paused : false
  }

  async play(): Promise<void> {
    if (this.audioElement) {
      try {
        await this.audioElement.play()
      } catch (error) {
        console.error('Failed to play audio:', error)
        throw error
      }
    }
  }

  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause()
    }
  }

  disconnect(): void {
    this.isReceiving = false
    this.stopQualityMonitoring()

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.srcObject = null
      document.body.removeChild(this.audioElement)
      this.audioElement = null
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
      this.audioContext = null
    }

    console.log('Audio receiver disconnected')
  }

  // Callback functions
  public sendSignalingMessage?: (message: any) => void
  public onQualityUpdate?: (metrics: ReceiverQualityMetrics) => void
  public onConnectionStateChange?: (state: 'connected' | 'disconnected') => void
  public onReconnectAttempt?: () => void
  public onConnectionError?: (error: string) => void
}