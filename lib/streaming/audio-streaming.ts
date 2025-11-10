// Audio Streaming Infrastructure for Live Broadcasting
// This handles audio capture, processing, and streaming via WebRTC

export interface AudioStreamConfig {
  sampleRate: number
  channelCount: number
  bitRate: number
  echoCancellation: boolean
  noiseSuppression: boolean
  autoGainControl: boolean
}

export interface StreamQualityMetrics {
  bitrate: number
  packetsLost: number
  jitter: number
  roundTripTime: number
  audioLevel: number
}

export class AudioStreamer {
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private analyserNode: AnalyserNode | null = null
  private gainNode: GainNode | null = null
  private compressorNode: DynamicsCompressorNode | null = null
  private peerConnections = new Map<string, RTCPeerConnection>()
  private isStreaming = false
  private audioLevels: Float32Array | null = null
  private qualityMonitorInterval: NodeJS.Timeout | null = null

  private config: AudioStreamConfig = {
    sampleRate: 44100,
    channelCount: 2,
    bitRate: 128000,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }

  constructor(config?: Partial<AudioStreamConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  async initializeAudio(): Promise<void> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Audio streaming is only available in browser environment')
      }

      // Check for getUserMedia support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser')
      }

      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) {
        throw new Error('Web Audio API is not supported in this browser')
      }

      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
      })

      // Resume audio context if suspended (required for some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Get user media with high-quality audio settings
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: this.config.sampleRate,
            channelCount: this.config.channelCount,
            echoCancellation: this.config.echoCancellation,
            noiseSuppression: this.config.noiseSuppression,
            autoGainControl: this.config.autoGainControl,
            // Additional professional audio settings
            // latency: 0.01, // 10ms latency for real-time feel (not supported in all browsers)
            volume: 1.0
          },
          video: false
        })
      } catch (micError) {
        console.error('Microphone access error:', micError)
        if (micError instanceof Error) {
          if (micError.name === 'NotAllowedError') {
            throw new Error('Microphone access denied. Please allow microphone permissions and try again.')
          } else if (micError.name === 'NotFoundError') {
            throw new Error('No microphone found. Please connect a microphone and try again.')
          } else if (micError.name === 'OverconstrainedError') {
            throw new Error('Microphone constraints not supported. Please check your audio settings.')
          }
        }
        throw new Error('Failed to access microphone. Please check your permissions and try again.')
      }

      // Verify we got audio tracks
      const audioTracks = this.mediaStream.getAudioTracks()
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks available from microphone')
      }

      console.log('Audio tracks obtained:', audioTracks.map(track => ({
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState,
        settings: track.getSettings()
      })))

      // Set up audio processing chain
      this.setupAudioProcessing()
      
      console.log('Audio streaming initialized successfully')
    } catch (error) {
      console.error('Failed to initialize audio streaming:', error)
      
      // Clean up on error
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop())
        this.mediaStream = null
      }
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close()
        this.audioContext = null
      }
      
      throw error
    }
  }

  private setupAudioProcessing(): void {
    if (!this.audioContext || !this.mediaStream) return

    // Create audio processing chain
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream)
    this.gainNode = this.audioContext.createGain()
    this.compressorNode = this.audioContext.createDynamicsCompressor()
    this.analyserNode = this.audioContext.createAnalyser()

    // Configure compressor for broadcast quality
    this.compressorNode.threshold.setValueAtTime(-24, this.audioContext.currentTime)
    this.compressorNode.knee.setValueAtTime(30, this.audioContext.currentTime)
    this.compressorNode.ratio.setValueAtTime(12, this.audioContext.currentTime)
    this.compressorNode.attack.setValueAtTime(0.003, this.audioContext.currentTime)
    this.compressorNode.release.setValueAtTime(0.25, this.audioContext.currentTime)

    // Configure analyser for level monitoring
    this.analyserNode.fftSize = 256
    this.analyserNode.smoothingTimeConstant = 0.8
    this.audioLevels = new Float32Array(this.analyserNode.frequencyBinCount)

    // Connect the audio processing chain
    this.sourceNode
      .connect(this.gainNode)
      .connect(this.compressorNode)
      .connect(this.analyserNode)

    // Start monitoring audio levels
    this.startAudioLevelMonitoring()
  }

  private startAudioLevelMonitoring(): void {
    if (!this.analyserNode || !this.audioLevels) return

    const updateLevels = () => {
      if (this.analyserNode && this.audioLevels) {
        this.analyserNode.getFloatFrequencyData(this.audioLevels as Float32Array)
      }
      
      if (this.isStreaming) {
        requestAnimationFrame(updateLevels)
      }
    }

    updateLevels()
  }

  async createPeerConnection(listenerId: string): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    })

    // Add audio stream to peer connection
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        peerConnection.addTrack(track, this.mediaStream!)
      })
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage?.({
          type: 'ice-candidate',
          data: event.candidate,
          targetId: listenerId
        })
      }
    }

    // Monitor connection quality
    this.monitorConnectionQuality(peerConnection, listenerId)

    this.peerConnections.set(listenerId, peerConnection)
    return peerConnection
  }

  async createOffer(listenerId: string): Promise<RTCSessionDescriptionInit> {
    const peerConnection = await this.createPeerConnection(listenerId)
    
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: false
    })

    await peerConnection.setLocalDescription(offer)
    return offer
  }

  async handleAnswer(listenerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.peerConnections.get(listenerId)
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer)
    }
  }

  async handleIceCandidate(listenerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerConnection = this.peerConnections.get(listenerId)
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate)
    }
  }

  private monitorConnectionQuality(peerConnection: RTCPeerConnection, listenerId: string): void {
    const checkQuality = async () => {
      try {
        const stats = await peerConnection.getStats()
        let metrics: Partial<StreamQualityMetrics> = {}

        stats.forEach((report) => {
          if (report.type === 'outbound-rtp' && report.mediaType === 'audio') {
            metrics.bitrate = report.bytesSent * 8 / report.timestamp * 1000
            metrics.packetsLost = report.packetsLost || 0
          }
          
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            metrics.roundTripTime = report.currentRoundTripTime || 0
          }
        })

        // Emit quality metrics for monitoring
        this.onQualityUpdate?.(listenerId, metrics as StreamQualityMetrics)
      } catch (error) {
        console.error('Failed to get connection stats:', error)
      }
    }

    // Check quality every 5 seconds
    const interval = setInterval(checkQuality, 5000)
    
    // Clean up when connection closes
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'closed' || 
          peerConnection.connectionState === 'failed') {
        clearInterval(interval)
      }
    }
  }

  startStreaming(): void {
    this.isStreaming = true
    console.log('Audio streaming started')
  }

  stopStreaming(): void {
    this.isStreaming = false
    
    // Close all peer connections
    this.peerConnections.forEach((connection) => {
      connection.close()
    })
    this.peerConnections.clear()

    // Stop media tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
      this.audioContext = null
    }

    console.log('Audio streaming stopped')
  }

  getAudioLevel(): number {
    if (!this.audioLevels) return 0

    // Calculate RMS level
    let sum = 0
    for (let i = 0; i < this.audioLevels.length; i++) {
      sum += this.audioLevels[i] * this.audioLevels[i]
    }
    
    const rms = Math.sqrt(sum / this.audioLevels.length)
    // Convert to 0-100 scale
    return Math.min(100, Math.max(0, (rms + 100) * 0.8))
  }

  setGain(gain: number): void {
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(gain, this.audioContext?.currentTime || 0)
    }
  }

  removePeerConnection(listenerId: string): void {
    const connection = this.peerConnections.get(listenerId)
    if (connection) {
      connection.close()
      this.peerConnections.delete(listenerId)
    }
  }

  // Callback for sending signaling messages
  public sendSignalingMessage?: (message: any) => void
  
  // Callback for quality updates
  public onQualityUpdate?: (listenerId: string, metrics: StreamQualityMetrics) => void
}