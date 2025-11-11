import { io, Socket } from 'socket.io-client'

export interface BroadcastInfo {
  broadcastId: string
  broadcasterInfo: {
    username: string
    stationName: string
  }
  isLive: boolean
  stats: {
    listeners: number
    uptime: number
  }
}

export interface CallRequest {
  callId: string
  callerId: string
  callerName: string
  callerLocation: string
  requestTime: Date
  status: 'pending' | 'accepted' | 'rejected'
}

export class RealtimeClient {
  private socket: Socket
  private serverUrl: string

  constructor(serverUrl = 'http://localhost:3001') {
    this.serverUrl = serverUrl
    this.socket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      forceNew: false,
      timeout: 10000
    })
    
    // Add connection debugging
    this.socket.on('connect', () => {
      console.log('🔗 RealtimeClient connected:', this.socket.id)
    })
    
    this.socket.on('disconnect', (reason) => {
      console.log('❌ RealtimeClient disconnected:', reason)
    })
    
    this.socket.on('connect_error', (error) => {
      console.error('❌ RealtimeClient connection error:', error.message)
    })
  }

  // Chat methods
  joinChat(broadcastId: string, userInfo: { username: string, role?: string, userId?: string, avatar?: string }) {
    this.socket.emit('join-chat', broadcastId, userInfo)
  }

  sendMessage(broadcastId: string, message: { content: string, messageType?: string, replyTo?: string }) {
    this.socket.emit('send-message', broadcastId, message)
  }

  sendAnnouncement(broadcastId: string, content: string, username: string) {
    this.socket.emit('send-announcement', broadcastId, {
      content,
      username,
      isStaff: true
    })
  }

  startTyping(broadcastId: string, username: string) {
    this.socket.emit('typing-start', broadcastId, username)
  }

  stopTyping(broadcastId: string, username: string) {
    this.socket.emit('typing-stop', broadcastId, username)
  }

  reactToMessage(broadcastId: string, messageId: string, reaction: string) {
    this.socket.emit('react-to-message', broadcastId, messageId, reaction)
  }

  // Broadcasting methods
  joinAsBroadcaster(broadcastId: string, broadcasterInfo?: { username?: string, stationName?: string }) {
    this.socket.emit('join-as-broadcaster', broadcastId, broadcasterInfo)
  }

  joinBroadcast(broadcastId: string, listenerInfo?: any) {
    this.socket.emit('join-broadcast', broadcastId, listenerInfo)
  }

  broadcastAudio(broadcastId: string, audioData: { audio: string, timestamp: number, metrics?: any }) {
    this.socket.emit('broadcast-audio', broadcastId, audioData)
  }

  addAudioSource(broadcastId: string, sourceInfo: {
    type: 'host' | 'guest' | 'caller' | 'music' | 'effects'
    name: string
    id?: string
    volume?: number
    isMuted?: boolean
  }) {
    this.socket.emit('add-audio-source', broadcastId, sourceInfo)
  }

  updateAudioSource(broadcastId: string, sourceId: string, updates: any) {
    this.socket.emit('update-audio-source', broadcastId, sourceId, updates)
  }

  removeAudioSource(broadcastId: string, sourceId: string) {
    this.socket.emit('remove-audio-source', broadcastId, sourceId)
  }

  // Call management
  requestCall(broadcastId: string, callerInfo: { name: string, location?: string }) {
    this.socket.emit('request-call', broadcastId, callerInfo)
  }

  acceptCall(callId: string) {
    this.socket.emit('accept-call', callId)
  }

  rejectCall(callId: string, reason?: string) {
    this.socket.emit('reject-call', callId, reason)
  }

  endCall(callId: string) {
    this.socket.emit('end-call', callId)
  }

  getCallQueue(broadcastId: string) {
    this.socket.emit('get-call-queue', broadcastId)
  }

  getBroadcastStats(broadcastId: string) {
    this.socket.emit('get-broadcast-stats', broadcastId)
  }

  // Event listeners
  onNewMessage(callback: (message: any) => void) {
    this.socket.on('new-message', callback)
  }

  onChatHistory(callback: (data: { messages: any[], settings: any, userCount: number }) => void) {
    this.socket.on('chat-history', callback)
  }

  onUserJoined(callback: (data: { user: any, userCount: number, timestamp: string }) => void) {
    this.socket.on('user-joined', callback)
  }

  onUserLeft(callback: (data: { user: any, userCount: number, timestamp: string }) => void) {
    this.socket.on('user-left', callback)
  }

  onUserTyping(callback: (data: { userId: string, username: string, timestamp: string }) => void) {
    this.socket.on('user-typing', callback)
  }

  onUserStoppedTyping(callback: (data: { userId: string, username: string, timestamp: string }) => void) {
    this.socket.on('user-stopped-typing', callback)
  }

  onBroadcasterReady(callback: (data: { broadcastId: string, capabilities: string[], serverTime: string }) => void) {
    this.socket.on('broadcaster-ready', callback)
  }

  onBroadcastInfo(callback: (info: BroadcastInfo) => void) {
    this.socket.on('broadcast-info', callback)
  }

  onListenerCount(callback: (data: { count: number, peak: number }) => void) {
    this.socket.on('listener-count', callback)
  }

  onAudioStream(callback: (data: { audio: string, timestamp: number, metrics: any, broadcasterInfo: any }) => void) {
    this.socket.on('audio-stream', callback)
  }

  onAudioSourceAdded(callback: (data: { broadcastId: string, sourceId: string, sourceInfo: any }) => void) {
    this.socket.on('audio-source-added', callback)
  }

  onAudioSourceUpdated(callback: (data: { broadcastId: string, sourceId: string, updates: any }) => void) {
    this.socket.on('audio-source-updated', callback)
  }

  onAudioSourceRemoved(callback: (data: { broadcastId: string, sourceId: string }) => void) {
    this.socket.on('audio-source-removed', callback)
  }

  onIncomingCall(callback: (call: CallRequest) => void) {
    this.socket.on('incoming-call', callback)
  }

  onCallPending(callback: (data: { callId: string, position: number }) => void) {
    this.socket.on('call-pending', callback)
  }

  onCallAccepted(callback: (data: { callId: string, broadcasterId: string, instructions: string }) => void) {
    this.socket.on('call-accepted', callback)
  }

  onCallRejected(callback: (data: { callId: string, reason: string }) => void) {
    this.socket.on('call-rejected', callback)
  }

  onCallEnded(callback: (data: { callId: string, reason: string }) => void) {
    this.socket.on('call-ended', callback)
  }

  onCallTimeout(callback: (data: { callId: string, reason: string }) => void) {
    this.socket.on('call-timeout', callback)
  }

  onCallError(callback: (data: { message: string }) => void) {
    this.socket.on('call-error', callback)
  }

  onCallQueueUpdate(callback: (data: { queue: CallRequest[], activeCalls: any[] }) => void) {
    this.socket.on('call-queue-update', callback)
  }

  onBroadcastStats(callback: (stats: any) => void) {
    this.socket.on('broadcast-stats', callback)
  }

  onBroadcastEnded(callback: (data: { reason: string, stats: any, endTime: string }) => void) {
    this.socket.on('broadcast-ended', callback)
  }

  onServerStats(callback: (stats: { activeBroadcasts: number, totalConnections: number, totalListeners: number, totalCalls: number, uptime: number }) => void) {
    this.socket.on('server-stats', callback)
  }

  onMessageError(callback: (error: { error: string }) => void) {
    this.socket.on('message-error', callback)
  }

  onAnnouncement(callback: (announcement: any) => void) {
    this.socket.on('announcement', callback)
  }

  onMessageReaction(callback: (data: { messageId: string, reaction: string, userId: string }) => void) {
    this.socket.on('message-reaction', callback)
  }

  editMessage(broadcastId: string, messageId: string, newContent: string) {
    this.socket.emit('edit-message', broadcastId, messageId, newContent)
  }

  deleteMessage(broadcastId: string, messageId: string) {
    this.socket.emit('delete-message', broadcastId, messageId)
  }

  onMessageEdited(callback: (data: { messageId: string, newContent: string, editedAt: string }) => void) {
    this.socket.on('message-edited', callback)
  }

  onMessageDeleted(callback: (data: { messageId: string, deletedBy: string, deletedAt: string }) => void) {
    this.socket.on('message-deleted', callback)
  }

  // Utility methods
  disconnect() {
    this.socket.disconnect()
  }

  isConnected() {
    return this.socket.connected
  }

  getSocket() {
    return this.socket
  }
}