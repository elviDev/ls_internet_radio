// Simple Audio Bridge using Socket.IO for live broadcasting
import { io, Socket } from 'socket.io-client'

export class AudioBroadcaster {
  private socket: Socket | null = null
  private mediaRecorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private isRecording = false
  private programInfo: any = null
  private onAudioDataCallback: ((data: string) => void) | null = null

  constructor(private broadcastId: string, programInfo?: any) {
    this.programInfo = programInfo
  }

  async startBroadcasting(audioStream?: MediaStream): Promise<void> {
    try {
      console.log('Starting audio broadcasting for:', this.broadcastId)

      // Connect to Socket.IO server
      this.socket = io('http://localhost:3001')
      
      await new Promise((resolve, reject) => {
        this.socket!.on('connect', () => resolve(undefined))
        this.socket!.on('connect_error', (err: any) => reject(err))
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      })

      console.log('Connected to Socket.IO server')

      // Join as broadcaster with program info
      this.socket.emit('join-as-broadcaster', this.broadcastId, {
        timestamp: new Date(),
        socketId: this.socket.id
      }, this.programInfo)

      // Use provided audio stream (from studio mixer) or get microphone
      if (audioStream) {
        this.stream = audioStream
        console.log('Using provided audio stream from studio mixer')
      } else {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000
          }
        })
        console.log('Got microphone access')
      }

      // Set up media recorder
      this.setupMediaRecorder()
      
      console.log('Audio broadcasting started successfully')

    } catch (error) {
      console.error('Failed to start broadcasting:', error)
      this.cleanup()
      throw error
    }
  }

  private setupMediaRecorder(): void {
    if (!this.stream || !this.socket) return

    try {
      // Use WebM with Opus codec for better compression
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      })

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.socket?.connected) {
          // Convert blob to base64 for transmission
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64data = reader.result as string
            const audioData = {
              audio: base64data.split(',')[1], // Remove data:audio/webm;base64, prefix
              timestamp: Date.now(),
              type: 'audio/webm',
              programInfo: this.programInfo
            }
            
            this.socket!.emit('broadcast-audio', this.broadcastId, audioData)
            
            // Call external callback if provided
            if (this.onAudioDataCallback) {
              this.onAudioDataCallback(audioData.audio)
            }
          }
          reader.readAsDataURL(event.data)
        }
      }

      this.mediaRecorder.onerror = (error) => {
        console.error('MediaRecorder error:', error)
      }

      // Record in small chunks for real-time streaming
      this.mediaRecorder.start(200) // 200ms chunks for low latency
      this.isRecording = true
      
      console.log('MediaRecorder started')

    } catch (error) {
      console.error('Failed to setup MediaRecorder:', error)
      throw error
    }
  }

  stopBroadcasting(): void {
    console.log('Stopping audio broadcasting')
    
    this.isRecording = false

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }

    if (this.socket) {
      this.socket.emit('leave-as-broadcaster', this.broadcastId)
      this.socket.disconnect()
    }

    this.cleanup()
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    this.mediaRecorder = null
    this.socket = null
  }

  // Update program information during broadcast
  updateProgramInfo(programInfo: any): void {
    this.programInfo = programInfo
    if (this.socket) {
      this.socket.emit('update-program-info', this.broadcastId, programInfo)
    }
  }

  // Set callback for audio data (for external processing)
  setAudioDataCallback(callback: (data: string) => void): void {
    this.onAudioDataCallback = callback
  }

  isActive(): boolean {
    return this.isRecording
  }

  getProgramInfo(): any {
    return this.programInfo
  }
}

export class AudioListener {
  private socket: Socket | null = null
  private audioContext: AudioContext | null = null
  private isListening = false

  constructor(private broadcastId: string) {}

  async startListening(): Promise<void> {
    try {
      console.log('Starting audio listening for:', this.broadcastId)

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Connect to Socket.IO server
      this.socket = io('http://localhost:3001')
      
      await new Promise<void>((resolve, reject) => {
        this.socket!.on('connect', () => resolve())
        this.socket!.on('connect_error', (err: any) => reject(err))
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      })

      console.log('Connected to Socket.IO server')

      // Join broadcast room as listener
      this.socket.emit('join-broadcast', this.broadcastId, {
        device: 'web',
        browser: navigator.userAgent,
        timestamp: new Date()
      })

      // Listen for audio streams with program info
      this.socket.on('audio-stream', (audioData) => {
        this.playAudioData(audioData)
        
        // Handle program info updates
        if (audioData.programInfo) {
          this.handleProgramInfoUpdate(audioData.programInfo)
        }
      })

      // Listen for program info updates
      this.socket.on('program-info-update', (programInfo) => {
        this.handleProgramInfoUpdate(programInfo)
      })

      this.socket.on('broadcast-started', () => {
        console.log('Broadcast started')
      })

      this.socket.on('broadcast-ended', () => {
        console.log('Broadcast ended')
      })

      this.isListening = true
      console.log('Audio listening started successfully')

    } catch (error) {
      console.error('Failed to start listening:', error)
      this.cleanup()
      throw error
    }
  }

  private async playAudioData(audioData: any): Promise<void> {
    if (!this.audioContext || !audioData.audio) return

    try {
      // Convert base64 back to blob
      const binaryString = atob(audioData.audio)
      const bytes = new Uint8Array(binaryString.length)
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const blob = new Blob([bytes], { type: audioData.type || 'audio/webm' })
      const arrayBuffer = await blob.arrayBuffer()
      
      // Decode and play audio
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      
      const source = this.audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.audioContext.destination)
      source.start()

    } catch (error) {
      console.error('Error playing audio data:', error)
    }
  }

  stopListening(): void {
    console.log('Stopping audio listening')
    
    this.isListening = false

    if (this.socket) {
      this.socket.disconnect()
    }

    this.cleanup()
  }

  private cleanup(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
    
    this.audioContext = null
    this.socket = null
  }

  private handleProgramInfoUpdate(programInfo: any): void {
    // Emit custom event for program info updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('programInfoUpdate', {
        detail: programInfo
      }))
    }
  }

  // Get current program info
  getCurrentProgramInfo(): Promise<any> {
    return new Promise((resolve) => {
      if (this.socket) {
        this.socket.emit('get-program-info', this.broadcastId, (programInfo: any) => {
          resolve(programInfo)
        })
      } else {
        resolve(null)
      }
    })
  }

  isActive(): boolean {
    return this.isListening
  }
}