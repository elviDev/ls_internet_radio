import { io, Socket } from 'socket.io-client'

export class SimpleBroadcaster {
  private socket: Socket | null = null
  private mediaRecorder: MediaRecorder | null = null
  private stream: MediaStream | null = null

  async startBroadcast(broadcastId: string) {
    // Get microphone
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    // Connect to server
    this.socket = io()
    this.socket.emit('join-as-broadcaster', broadcastId)
    
    // Start recording and streaming
    this.mediaRecorder = new MediaRecorder(this.stream)
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && this.socket) {
        const reader = new FileReader()
        reader.onloadend = () => {
          const audioData = (reader.result as string).split(',')[1]
          this.socket!.emit('broadcast-audio', broadcastId, audioData)
        }
        reader.readAsDataURL(event.data)
      }
    }
    this.mediaRecorder.start(100) // Send every 100ms
  }

  stopBroadcast() {
    this.mediaRecorder?.stop()
    this.stream?.getTracks().forEach(track => track.stop())
    this.socket?.disconnect()
  }
}

export class SimpleListener {
  private socket: Socket | null = null
  private audioContext: AudioContext | null = null

  async startListening(broadcastId: string) {
    this.audioContext = new AudioContext()
    this.socket = io()
    
    this.socket.emit('join-broadcast', broadcastId)
    
    this.socket.on('audio-stream', async (audioData: string) => {
      try {
        const binaryString = atob(audioData)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        
        const audioBuffer = await this.audioContext!.decodeAudioData(bytes.buffer)
        const source = this.audioContext!.createBufferSource()
        source.buffer = audioBuffer
        source.connect(this.audioContext!.destination)
        source.start()
      } catch (error) {
        console.error('Audio playback error:', error)
      }
    })
  }

  stopListening() {
    this.socket?.disconnect()
    this.audioContext?.close()
  }
}