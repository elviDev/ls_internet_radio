import { io, Socket } from 'socket.io-client'

export class RealtimeClient {
  private socket: Socket
  private serverUrl: string

  constructor(serverUrl = 'http://localhost:3001') {
    this.serverUrl = serverUrl
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })
  }

  // Chat methods
  joinChat(broadcastId: string, userInfo: { username: string, role?: string }) {
    this.socket.emit('join-chat', broadcastId, userInfo)
  }

  sendMessage(broadcastId: string, message: { username: string, content: string, role?: string }) {
    this.socket.emit('send-message', broadcastId, message)
  }

  sendAnnouncement(broadcastId: string, content: string, username: string) {
    this.socket.emit('send-announcement', broadcastId, {
      content,
      username,
      isStaff: true
    })
  }

  onNewMessage(callback: (message: any) => void) {
    this.socket.on('new-message', callback)
  }

  onChatHistory(callback: (messages: any[]) => void) {
    this.socket.on('chat-history', callback)
  }

  onUserJoined(callback: (data: { username: string, userCount: number }) => void) {
    this.socket.on('user-joined', callback)
  }

  onUserLeft(callback: (data: { username: string, userCount: number }) => void) {
    this.socket.on('user-left', callback)
  }

  // WebRTC methods
  joinAsBroadcaster(broadcastId: string) {
    this.socket.emit('join-as-broadcaster', broadcastId)
  }

  joinAsListener(broadcastId: string) {
    this.socket.emit('join-as-listener', broadcastId)
  }

  onBroadcasterReady(callback: (broadcastId: string) => void) {
    this.socket.on('broadcaster-ready', callback)
  }

  onListenerCount(callback: (count: number) => void) {
    this.socket.on('listener-count', callback)
  }

  onBroadcastEnded(callback: () => void) {
    this.socket.on('broadcast-ended', callback)
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