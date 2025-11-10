// WebRTC client for audio streaming
export class WebRTCBroadcaster {
  private socket: any
  private peerConnection: RTCPeerConnection
  private localStream: MediaStream | null = null
  private broadcastId: string

  constructor(socket: any, broadcastId: string) {
    this.socket = socket
    this.broadcastId = broadcastId
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    })

    this.setupPeerConnection()
  }

  private setupPeerConnection() {
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', this.broadcastId, event.candidate)
      }
    }

    this.socket.on('listener-answer', async (data: { listenerId: string, answer: RTCSessionDescriptionInit }) => {
      try {
        await this.peerConnection.setRemoteDescription(data.answer)
      } catch (error) {
        console.error('Error setting remote description:', error)
      }
    })

    this.socket.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
      try {
        await this.peerConnection.addIceCandidate(candidate)
      } catch (error) {
        console.error('Error adding ICE candidate:', error)
      }
    })
  }

  async startBroadcast(audioStream: MediaStream) {
    try {
      this.localStream = audioStream
      
      // Add audio track to peer connection
      audioStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, audioStream)
      })

      // Create offer
      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)

      // Send offer to signaling server
      this.socket.emit('join-as-broadcaster', this.broadcastId)
      this.socket.emit('broadcaster-offer', this.broadcastId, offer)

      return true
    } catch (error) {
      console.error('Error starting broadcast:', error)
      return false
    }
  }

  stopBroadcast() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
    }
    this.peerConnection.close()
    this.socket.emit('leave-as-broadcaster', this.broadcastId)
  }
}

export class WebRTCListener {
  private socket: any
  private peerConnection: RTCPeerConnection
  private broadcastId: string
  private onAudioStream?: (stream: MediaStream) => void

  constructor(socket: any, broadcastId: string, onAudioStream?: (stream: MediaStream) => void) {
    this.socket = socket
    this.broadcastId = broadcastId
    this.onAudioStream = onAudioStream
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    })

    this.setupPeerConnection()
  }

  private setupPeerConnection() {
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', this.broadcastId, event.candidate)
      }
    }

    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream')
      if (this.onAudioStream && event.streams[0]) {
        this.onAudioStream(event.streams[0])
      }
    }

    this.socket.on('broadcaster-offer', async (offer: RTCSessionDescriptionInit) => {
      try {
        await this.peerConnection.setRemoteDescription(offer)
        const answer = await this.peerConnection.createAnswer()
        await this.peerConnection.setLocalDescription(answer)
        this.socket.emit('listener-answer', this.broadcastId, answer)
      } catch (error) {
        console.error('Error handling broadcaster offer:', error)
      }
    })

    this.socket.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
      try {
        await this.peerConnection.addIceCandidate(candidate)
      } catch (error) {
        console.error('Error adding ICE candidate:', error)
      }
    })
  }

  startListening() {
    this.socket.emit('join-as-listener', this.broadcastId)
  }

  stopListening() {
    this.peerConnection.close()
    this.socket.disconnect()
  }
}

// Phone caller class for users who want to call into the radio station
export class WebRTCCaller {
  private socket: any
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private broadcastId: string
  private callId: string | null = null
  private isCallActive: boolean = false
  
  constructor(socket: any, broadcastId: string) {
    this.socket = socket
    this.broadcastId = broadcastId
    this.setupCallHandlers()
  }
  
  private setupCallHandlers() {
    this.socket.on('call-pending', (data: any) => {
      console.log('📞 Call pending:', data)
      this.callId = data.callId
      this.emit('call-pending', data)
    })
    
    this.socket.on('call-accepted', async (data: any) => {
      console.log('✅ Call accepted:', data)
      this.callId = data.callId
      this.isCallActive = true
      
      try {
        // Get user microphone
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000
          },
          video: false
        })
        
        // Setup peer connection for the call
        this.peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        })
        
        // Add audio track
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!)
        })
        
        this.emit('call-accepted', data)
        
      } catch (error) {
        console.error('❌ Error setting up call:', error)
        this.emit('call-error', { error: 'Failed to access microphone' })
      }
    })
    
    this.socket.on('call-rejected', (data: any) => {
      console.log('❌ Call rejected:', data)
      this.callId = null
      this.emit('call-rejected', data)
    })
    
    this.socket.on('call-ended', (data: any) => {
      console.log('🔚 Call ended:', data)
      this.endCall()
      this.emit('call-ended', data)
    })
    
    this.socket.on('call-timeout', (data: any) => {
      console.log('⏰ Call timed out:', data)
      this.callId = null
      this.emit('call-timeout', data)
    })
    
    this.socket.on('call-error', (data: any) => {
      console.error('❌ Call error:', data)
      this.emit('call-error', data)
    })
  }
  
  // Request to call the radio station
  requestCall(callerInfo: { name: string, location?: string }) {
    console.log('📞 Requesting call to station:', callerInfo)
    this.socket.emit('request-call', this.broadcastId, callerInfo)
  }
  
  // End the current call
  endCall() {
    if (this.callId) {
      this.socket.emit('end-call', this.callId)
    }
    
    this.isCallActive = false
    this.callId = null
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
  }
  
  // Get call status
  getCallStatus() {
    return {
      callId: this.callId,
      isActive: this.isCallActive,
      hasLocalStream: !!this.localStream
    }
  }
  
  // Event emitter functionality
  private listeners: Map<string, Function[]> = new Map()
  
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }
  
  emit(event: string, data?: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => callback(data))
    }
  }
}