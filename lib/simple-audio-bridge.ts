// Simple Audio Bridge for Live Broadcasting
// This handles direct audio transmission from broadcaster to listeners

export class SimpleBroadcaster {
  private mediaRecorder: MediaRecorder | null = null
  private websocket: WebSocket | null = null
  private stream: MediaStream | null = null

  constructor(private broadcastId: string) {}

  async startBroadcasting(): Promise<void> {
    try {
      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      // Create WebSocket connection
      const wsUrl = `ws://${window.location.host}/api/ws/broadcast?broadcastId=${this.broadcastId}&role=broadcaster`
      this.websocket = new WebSocket(wsUrl)

      this.websocket.onopen = () => {
        console.log('Broadcaster connected to WebSocket')
        this.setupMediaRecorder()
      }

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
        throw new Error('Failed to connect to broadcast server')
      }

    } catch (error) {
      console.error('Failed to start broadcasting:', error)
      throw error
    }
  }

  private setupMediaRecorder(): void {
    if (!this.stream || !this.websocket) return

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: 'audio/webm;codecs=opus'
    })

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && this.websocket?.readyState === WebSocket.OPEN) {
        // Send audio data to WebSocket
        this.websocket.send(event.data)
      }
    }

    // Start recording in small chunks for real-time streaming
    this.mediaRecorder.start(100) // 100ms chunks
    console.log('Started recording audio for broadcast')
  }

  stopBroadcasting(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop()
      this.mediaRecorder = null
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }

    console.log('Stopped broadcasting')
  }
}

export class SimpleListener {
  private websocket: WebSocket | null = null
  private audioContext: AudioContext | null = null
  private audioQueue: AudioBuffer[] = []
  private isPlaying = false

  constructor(private broadcastId: string) {}

  async startListening(): Promise<void> {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // Create WebSocket connection  
      const wsUrl = `ws://${window.location.host}/api/ws/broadcast?broadcastId=${this.broadcastId}&role=listener`
      this.websocket = new WebSocket(wsUrl)

      this.websocket.onopen = () => {
        console.log('Listener connected to WebSocket')
        this.isPlaying = true
      }

      this.websocket.onmessage = async (event) => {
        // Receive audio data and play it
        if (event.data instanceof Blob) {
          await this.playAudioBlob(event.data)
        }
      }

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
        throw new Error('Failed to connect to broadcast stream')
      }

    } catch (error) {
      console.error('Failed to start listening:', error)
      throw error
    }
  }

  private async playAudioBlob(blob: Blob): Promise<void> {
    if (!this.audioContext) return

    try {
      const arrayBuffer = await blob.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      
      // Create audio source and play immediately
      const source = this.audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.audioContext.destination)
      source.start()

    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  stopListening(): void {
    this.isPlaying = false

    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
      this.audioContext = null
    }

    console.log('Stopped listening')
  }

  getIsPlaying(): boolean {
    return this.isPlaying
  }
}