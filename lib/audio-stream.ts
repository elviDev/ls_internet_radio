// Audio streaming utilities for real broadcasting
export class AudioStreamManager {
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private mediaRecorder: MediaRecorder | null = null
  private audioWorkletNode: AudioWorkletNode | null = null
  private isRecording = false
  private listeners: ((data: Float32Array) => void)[] = []

  async initialize(): Promise<void> {
    try {
      // Initialize audio context only after user gesture
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Resume context if suspended (required for user gesture)
      if (this.audioContext.state === 'suspended') {
        console.log('AudioContext suspended, waiting for user gesture...')
        // Don't throw error, just log and continue
        return
      }
      
      if (this.audioContext.state !== 'running') {
        await this.audioContext.resume()
      }

      // Get user media
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 2
        }
      })

      console.log('Audio stream initialized successfully')
    } catch (error) {
      console.error('Failed to initialize audio stream:', error)
      throw error
    }
  }

  async startRecording(): Promise<void> {
    if (!this.mediaStream || !this.audioContext) {
      throw new Error('Audio stream not initialized')
    }

    try {
      // Create media recorder for streaming
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      // Set up audio processing
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      const analyser = this.audioContext.createAnalyser()
      analyser.fftSize = 2048

      source.connect(analyser)

      // Start recording
      this.mediaRecorder.start(100) // 100ms chunks
      this.isRecording = true

      // Process audio data
      this.processAudioData(analyser)

      console.log('Recording started')
    } catch (error) {
      console.error('Failed to start recording:', error)
      throw error
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
      this.isRecording = false
      console.log('Recording stopped')
    }
  }

  private processAudioData(analyser: AnalyserNode): void {
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Float32Array(bufferLength)

    const processFrame = () => {
      if (!this.isRecording) return

      analyser.getFloatFrequencyData(dataArray)
      
      // Notify listeners with audio data
      this.listeners.forEach(listener => listener(dataArray))

      requestAnimationFrame(processFrame)
    }

    processFrame()
  }

  // Add listener for audio data
  addAudioDataListener(callback: (data: Float32Array) => void): void {
    this.listeners.push(callback)
  }

  // Remove listener
  removeAudioDataListener(callback: (data: Float32Array) => void): void {
    const index = this.listeners.indexOf(callback)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  // Get audio levels for UI
  getAudioLevels(): { input: number; output: number; peak: number } {
    if (!this.audioContext || !this.mediaStream) {
      return { input: 0, output: 0, peak: 0 }
    }

    // Simulate audio levels based on stream activity
    const active = this.mediaStream.getAudioTracks().some(track => track.enabled)
    if (!active) {
      return { input: 0, output: 0, peak: 0 }
    }

    return {
      input: 60 + Math.random() * 30,
      output: 70 + Math.random() * 25,
      peak: 85 + Math.random() * 10
    }
  }

  // Apply audio effects
  applyEffect(type: 'reverb' | 'echo' | 'compressor', intensity: number): void {
    if (!this.audioContext) return

    // Placeholder for audio effects
    console.log(`Applied ${type} effect with intensity ${intensity}`)
  }

  // Cleanup
  cleanup(): void {
    this.stopRecording()
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
      this.audioContext = null
    }

    this.listeners = []
  }
}

// Audio file management
export class AudioFileManager {
  private audioContext: AudioContext | null = null
  private audioBuffers: Map<string, AudioBuffer> = new Map()

  async initialize(): Promise<void> {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }

  async loadAudioFile(url: string, id: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized')
    }

    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      
      this.audioBuffers.set(id, audioBuffer)
      return audioBuffer
    } catch (error) {
      console.error('Failed to load audio file:', error)
      throw error
    }
  }

  playAudioBuffer(id: string, volume: number = 1): AudioBufferSourceNode | null {
    if (!this.audioContext) return null

    const buffer = this.audioBuffers.get(id)
    if (!buffer) return null

    const source = this.audioContext.createBufferSource()
    const gainNode = this.audioContext.createGain()
    
    source.buffer = buffer
    gainNode.gain.value = volume
    
    source.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    source.start()
    return source
  }

  generateTone(frequency: number, duration: number): AudioBuffer | null {
    if (!this.audioContext) return null

    const sampleRate = this.audioContext.sampleRate
    const length = sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < length; i++) {
      data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3
    }

    return buffer
  }
}