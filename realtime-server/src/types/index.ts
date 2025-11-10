export interface BroadcastSession {
  broadcastId: string
  broadcaster: string | null
  broadcasterInfo: BroadcasterInfo
  listeners: Set<string>
  audioSources: Map<string, AudioSourceInfo>
  callQueue: CallRequest[]
  activeCalls: Map<string, ActiveCall>
  isLive: boolean
  stats: BroadcastStats
}

export interface BroadcasterInfo {
  username: string
  stationName: string
  [key: string]: any
}

export interface AudioSourceInfo {
  id: string
  type: 'host' | 'guest' | 'caller' | 'music' | 'effects'
  name: string
  volume: number
  isMuted: boolean
  isActive: boolean
  priority: number
  socketId: string
  addedAt: Date
}

export interface CallRequest {
  callId: string
  callerId: string
  callerName: string
  callerLocation: string
  requestTime: Date
  status: 'pending' | 'accepted' | 'rejected'
}

export interface ActiveCall extends CallRequest {
  acceptTime: Date
  socketId: string
}

export interface BroadcastStats {
  startTime: Date
  peakListeners: number
  totalCalls: number
  totalMessages: number
}

export interface ConnectionInfo {
  broadcastId: string | null
  role: 'broadcaster' | 'listener' | 'caller' | null
  connectionTime: Date
  lastActivity: Date
}

export interface ChatMessage {
  id: string
  userId: string
  username: string
  content: string
  messageType: 'user' | 'system' | 'announcement'
  role: string
  avatar?: string
  timestamp: Date
  socketId: string
  likes: number
  likedBy: string[]
  reactions: Record<string, number>
  isEdited: boolean
  isDeleted: boolean
  isPinned: boolean
  replyTo?: string
}

export interface ChatRoom {
  messages: ChatMessage[]
  users: Map<string, ChatUser>
  typingUsers: Map<string, TypingInfo>
  settings: ChatSettings
  stats: ChatStats
}

export interface ChatUser {
  id: string
  userId: string
  username: string
  role: string
  avatar?: string
  joinedAt: Date
  lastActivity: Date
  messageCount: number
  isTyping: boolean
  isMuted: boolean
  isBanned: boolean
  lastMessageTime?: number
}

export interface TypingInfo {
  username: string
  startTime: Date
}

export interface ChatSettings {
  slowMode: number
  maxMessageLength: number
  allowEmojis: boolean
  moderationEnabled: boolean
}

export interface ChatStats {
  totalMessages: number
  totalUsers: number
  createdAt: Date
}

export interface ServerStats {
  activeBroadcasts: number
  totalConnections: number
  totalListeners: number
  totalCalls: number
  uptime: number
}