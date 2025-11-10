"use client"

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

export interface ChatMessage {
  id: string
  broadcastId: string
  userId: string
  username: string
  userAvatar?: string
  content: string
  messageType: 'user' | 'host' | 'moderator' | 'system' | 'announcement'
  timestamp: Date
  likes: number
  dislikes: number
  isLiked: boolean
  isDisliked: boolean
  isPinned: boolean
  isHighlighted: boolean
  replyTo?: string
  emojis: { [emoji: string]: number }
  isModerated: boolean
  moderationReason?: string
  isEdited?: boolean
}

export interface ChatUser {
  id: string
  username: string
  avatar?: string
  role: 'listener' | 'host' | 'moderator' | 'admin'
  isOnline: boolean
  isTyping: boolean
  lastSeen: Date
  messageCount: number
}

export interface TypingIndicator {
  userId: string
  username: string
  broadcastId: string
  timestamp: Date
}

interface ChatState {
  messages: ChatMessage[]
  users: ChatUser[]
  typingUsers: TypingIndicator[]
  currentBroadcast: string | null
  isConnected: boolean
  unreadCount: number
  isChatOpen: boolean
  isMinimized: boolean
  currentUser: ChatUser | null
  bannedUsers: Set<string>
  mutedUsers: Set<string>
  isBroadcastLive: boolean
  broadcastInfo: {
    id: string | null
    title: string | null
    startTime: Date | null
  }
  chatSettings: {
    slowMode: number
    autoModeration: boolean
    allowEmojis: boolean
    maxMessageLength: number
  }
}

type ChatAction =
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_CURRENT_BROADCAST'; payload: string }
  | { type: 'SET_CURRENT_USER'; payload: ChatUser }
  | { type: 'SET_BROADCAST_LIVE'; payload: boolean }
  | { type: 'SET_BROADCAST_INFO'; payload: { id: string; title: string; startTime: Date } }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } }
  | { type: 'DELETE_MESSAGE'; payload: string }
  | { type: 'ADD_USER'; payload: ChatUser }
  | { type: 'UPDATE_USER'; payload: { id: string; updates: Partial<ChatUser> } }
  | { type: 'REMOVE_USER'; payload: string }
  | { type: 'SET_USER_TYPING'; payload: { userId: string; username: string; isTyping: boolean } }
  | { type: 'CLEAR_TYPING'; payload: string }
  | { type: 'INCREMENT_UNREAD' }
  | { type: 'CLEAR_UNREAD' }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'MINIMIZE_CHAT' }
  | { type: 'MAXIMIZE_CHAT' }
  | { type: 'BAN_USER'; payload: string }
  | { type: 'UNBAN_USER'; payload: string }
  | { type: 'MUTE_USER'; payload: string }
  | { type: 'UNMUTE_USER'; payload: string }
  | { type: 'UPDATE_CHAT_SETTINGS'; payload: Partial<ChatState['chatSettings']> }

const initialState: ChatState = {
  messages: [],
  users: [],
  typingUsers: [],
  currentBroadcast: null,
  isConnected: false,
  unreadCount: 0,
  isChatOpen: false,
  isMinimized: false,
  currentUser: null,
  bannedUsers: new Set(),
  mutedUsers: new Set(),
  isBroadcastLive: false,
  broadcastInfo: {
    id: null,
    title: null,
    startTime: null
  },
  chatSettings: {
    slowMode: 0,
    autoModeration: true,
    allowEmojis: true,
    maxMessageLength: 500
  }
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload }
    
    case 'SET_CURRENT_BROADCAST':
      return { 
        ...state, 
        currentBroadcast: action.payload,
        messages: [], // Clear messages when switching broadcasts
        users: [],
        typingUsers: []
      }
    
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload }
    
    case 'SET_BROADCAST_LIVE':
      return { ...state, isBroadcastLive: action.payload }
    
    case 'SET_BROADCAST_INFO':
      return { 
        ...state, 
        broadcastInfo: action.payload,
        isBroadcastLive: true
      }
    
    case 'ADD_MESSAGE':
      const newMessage = action.payload
      const isDuplicate = state.messages.some(msg => msg.id === newMessage.id)
      if (isDuplicate) return state
      
      const updatedMessages = [...state.messages, newMessage].slice(-100) // Keep last 100 messages
      const shouldIncrementUnread = !state.isChatOpen && 
        newMessage.userId !== state.currentUser?.id &&
        newMessage.messageType !== 'system'
      
      return {
        ...state,
        messages: updatedMessages,
        unreadCount: shouldIncrementUnread ? state.unreadCount + 1 : state.unreadCount
      }
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id ? { ...msg, ...action.payload.updates } : msg
        )
      }
    
    case 'DELETE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload)
      }
    
    case 'ADD_USER':
      const existingUser = state.users.find(user => user.id === action.payload.id)
      if (existingUser) return state
      
      return {
        ...state,
        users: [...state.users, action.payload]
      }
    
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id ? { ...user, ...action.payload.updates } : user
        )
      }
    
    case 'REMOVE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload),
        typingUsers: state.typingUsers.filter(typing => typing.userId !== action.payload)
      }
    
    case 'SET_USER_TYPING':
      const { userId, username, isTyping } = action.payload
      if (isTyping) {
        const existingTyping = state.typingUsers.find(t => t.userId === userId)
        if (existingTyping) return state
        
        return {
          ...state,
          typingUsers: [...state.typingUsers, {
            userId,
            username,
            broadcastId: state.currentBroadcast || '',
            timestamp: new Date()
          }]
        }
      } else {
        return {
          ...state,
          typingUsers: state.typingUsers.filter(t => t.userId !== userId)
        }
      }
    
    case 'CLEAR_TYPING':
      return {
        ...state,
        typingUsers: state.typingUsers.filter(t => t.userId !== action.payload)
      }
    
    case 'INCREMENT_UNREAD':
      return { ...state, unreadCount: state.unreadCount + 1 }
    
    case 'CLEAR_UNREAD':
      return { ...state, unreadCount: 0 }
    
    case 'TOGGLE_CHAT':
      return { 
        ...state, 
        isChatOpen: !state.isChatOpen,
        unreadCount: !state.isChatOpen ? 0 : state.unreadCount,
        isMinimized: false
      }
    
    case 'MINIMIZE_CHAT':
      return { ...state, isMinimized: true }
    
    case 'MAXIMIZE_CHAT':
      return { ...state, isMinimized: false }
    
    case 'BAN_USER':
      return {
        ...state,
        bannedUsers: new Set([...state.bannedUsers, action.payload])
      }
    
    case 'UNBAN_USER':
      const newBannedUsers = new Set(state.bannedUsers)
      newBannedUsers.delete(action.payload)
      return { ...state, bannedUsers: newBannedUsers }
    
    case 'MUTE_USER':
      return {
        ...state,
        mutedUsers: new Set([...state.mutedUsers, action.payload])
      }
    
    case 'UNMUTE_USER':
      const newMutedUsers = new Set(state.mutedUsers)
      newMutedUsers.delete(action.payload)
      return { ...state, mutedUsers: newMutedUsers }
    
    case 'UPDATE_CHAT_SETTINGS':
      return {
        ...state,
        chatSettings: { ...state.chatSettings, ...action.payload }
      }
    
    default:
      return state
  }
}

interface ChatContextType {
  state: ChatState
  socket: Socket | null
  sendMessage: (content: string, messageType?: string, replyTo?: string) => void
  sendTyping: (isTyping: boolean) => void
  joinBroadcast: (broadcastId: string, user: ChatUser) => void
  leaveBroadcast: () => void
  moderateMessage: (messageId: string, action: 'delete' | 'pin' | 'highlight') => void
  moderateUser: (userId: string, action: 'ban' | 'unban' | 'mute' | 'unmute' | 'timeout') => void
  likeMessage: (messageId: string) => void
  editMessage: (messageId: string, newContent: string) => void
  deleteMessage: (messageId: string) => void
  toggleChat: () => void
  minimizeChat: () => void
  
  maximizeChat: () => void
  clearUnread: () => void
  updateSettings: (settings: Partial<ChatState['chatSettings']>) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const socketRef = useRef<Socket | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize WebSocket connection
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'
    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    })
    
    socketRef.current = socket

    socket.on('connect', () => {
      dispatch({ type: 'SET_CONNECTED', payload: true })
      console.log('🔗 Chat connected to server')
    })

    socket.on('disconnect', (reason) => {
      dispatch({ type: 'SET_CONNECTED', payload: false })
      console.log(`❌ Chat disconnected from server: ${reason}`)
    })

    socket.on('connect_error', (error) => {
      console.error('🚨 Chat connection error:', error)
      dispatch({ type: 'SET_CONNECTED', payload: false })
    })

    socket.on('new-message', (data: any) => {
      console.log('📨 Frontend received new-message:', data)
      const message: ChatMessage = {
        id: data.id || Date.now().toString(),
        broadcastId: data.broadcastId,
        userId: data.userId,
        username: data.username,
        userAvatar: data.userAvatar,
        content: data.content,
        messageType: data.messageType || 'user',
        timestamp: new Date(data.timestamp || Date.now()),
        likes: data.likes || 0,
        dislikes: data.dislikes || 0,
        isLiked: false,
        isDisliked: false,
        isPinned: data.isPinned || false,
        isHighlighted: data.isHighlighted || data.messageType === 'announcement',
        replyTo: data.replyTo,
        emojis: data.emojis || {},
        isModerated: data.isModerated || false,
        moderationReason: data.moderationReason
      }
      
      console.log('💬 Adding message to state:', message)
      dispatch({ type: 'ADD_MESSAGE', payload: message })
      
      // Show toast for announcements
      if (message.messageType === 'announcement') {
        toast.info(`📢 ${message.username}: ${message.content}`)
      }
    })

    socket.on('message-edited', (data: any) => {
      dispatch({ 
        type: 'UPDATE_MESSAGE', 
        payload: { 
          id: data.messageId, 
          updates: { content: data.newContent, isEdited: true } 
        } 
      })
    })

    socket.on('message-deleted', (data: any) => {
      dispatch({ type: 'DELETE_MESSAGE', payload: data.messageId })
    })

    socket.on('message-updated', (data: any) => {
      dispatch({ 
        type: 'UPDATE_MESSAGE', 
        payload: { 
          id: data.messageId, 
          updates: data.updates 
        } 
      })
    })

    socket.on('user-joined', (data: any) => {
      const user: ChatUser = {
        id: data.user.id,
        username: data.user.username,
        avatar: data.user.avatar,
        role: data.user.role || 'listener',
        isOnline: true,
        isTyping: false,
        lastSeen: new Date(),
        messageCount: 0
      }
      dispatch({ type: 'ADD_USER', payload: user })
    })

    socket.on('user-left', (data: any) => {
      dispatch({ type: 'REMOVE_USER', payload: data.user.id })
    })

    socket.on('user-typing', (data: any) => {
      dispatch({ 
        type: 'SET_USER_TYPING', 
        payload: { 
          userId: data.userId, 
          username: data.username, 
          isTyping: true 
        } 
      })
      
      // Clear typing after 3 seconds
      setTimeout(() => {
        dispatch({ type: 'CLEAR_TYPING', payload: data.userId })
      }, 3000)
    })

    socket.on('user-stopped-typing', (data: any) => {
      dispatch({ type: 'CLEAR_TYPING', payload: data.userId })
    })



    socket.on('user-moderated', (data: any) => {
      if (data.action === 'ban') {
        dispatch({ type: 'BAN_USER', payload: data.userId })
      } else if (data.action === 'mute') {
        dispatch({ type: 'MUTE_USER', payload: data.userId })
      }
    })

    socket.on('broadcast-started', (data: any) => {
      console.log('📻 Broadcast started:', data)
      dispatch({ type: 'SET_BROADCAST_LIVE', payload: true })
    })

    socket.on('broadcast-ended', (data: any) => {
      console.log('📻 Broadcast ended:', data)
      dispatch({ type: 'SET_BROADCAST_LIVE', payload: false })
    })
    
    socket.on('broadcaster-ready', (data: any) => {
      console.log('📻 Broadcaster ready:', data)
      dispatch({ type: 'SET_BROADCAST_LIVE', payload: true })
    })

    socket.on('listener-count-update', (data: any) => {
        console.log('👥 Listener count:', data.count)
    })

    return () => {
      console.log('🧹 Cleaning up chat socket connection')
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [])

  // Clean up typing indicators periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      state.typingUsers.forEach(typing => {
        if (now.getTime() - typing.timestamp.getTime() > 5000) {
          dispatch({ type: 'CLEAR_TYPING', payload: typing.userId })
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [state.typingUsers])

  const sendMessage = async (content: string, messageType = 'user', replyTo?: string) => {
    if (!socketRef.current || !state.isConnected || !state.currentBroadcast || !state.currentUser) {
      toast.error('Not connected to chat')
      return
    }

    if (!state.isBroadcastLive && messageType === 'user') {
      toast.error('Chat is only available during live broadcasts')
      return
    }

    if (content.trim().length === 0) return
    if (content.length > state.chatSettings.maxMessageLength) {
      toast.error(`Message too long. Max ${state.chatSettings.maxMessageLength} characters.`)
      return
    }

    const messageData = {
      content: content.trim(),
      messageType,
      replyTo,
      message: content.trim(),
      type: messageType,
      broadcastId: state.currentBroadcast,
      userId: state.currentUser.id,
      username: state.currentUser.username,
      userAvatar: state.currentUser.avatar,
      timestamp: new Date().toISOString()
    }

    // Persist message to database
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broadcastId: state.currentBroadcast,
          message: content.trim(),
          messageType,
          replyTo,
          userAvatar: state.currentUser.avatar
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save message')
      }
    } catch (error) {
      console.error('Error saving message:', error)
      // Continue with real-time broadcast even if persistence fails
    }

    // Broadcast via WebSocket
    if (messageType === 'announcement') {
      socketRef.current.emit('send-announcement', state.currentBroadcast, {
        content: content.trim(),
        username: state.currentUser.username,
        isStaff: true
      })
    } else {
      socketRef.current.emit('send-message', state.currentBroadcast, messageData)
    }
  }

  const sendTyping = (isTyping: boolean) => {
    if (!socketRef.current || !state.isConnected || !state.currentBroadcast || !state.currentUser) {
      return
    }

    if (isTyping) {
      socketRef.current.emit('typing-start', state.currentBroadcast, state.currentUser.username)
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing-stop', state.currentBroadcast, state.currentUser?.username)
      }, 3000)
    } else {
      socketRef.current.emit('typing-stop', state.currentBroadcast, state.currentUser.username)
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    }
  }

  const joinBroadcast = async (broadcastId: string, user: ChatUser) => {
    console.log('🎤 Joining broadcast:', { broadcastId, user })
    if (!socketRef.current) {
      console.error('❌ No socket connection available')
      return
    }

    dispatch({ type: 'SET_CURRENT_BROADCAST', payload: broadcastId })
    dispatch({ type: 'SET_CURRENT_USER', payload: user })

    // Load chat history from database
    try {
      const response = await fetch(`/api/chat?broadcastId=${broadcastId}`)
      if (response.ok) {
        const messages = await response.json()
        // Add historical messages to state
        messages.forEach((msg: any) => {
          const message: ChatMessage = {
            id: msg.id,
            broadcastId: msg.broadcastId,
            userId: msg.userId,
            username: msg.username,
            userAvatar: msg.userAvatar,
            content: msg.content,
            messageType: msg.messageType,
            timestamp: new Date(msg.timestamp),
            likes: msg.likes || 0,
            dislikes: 0,
            isLiked: msg.likedBy ? JSON.parse(msg.likedBy).includes(user.id) : false,
            isDisliked: false,
            isPinned: msg.isPinned || false,
            isHighlighted: msg.isHighlighted || false,
            replyTo: msg.replyTo,
            emojis: msg.emojis ? JSON.parse(msg.emojis) : {},
            isModerated: msg.isModerated || false,
            moderationReason: msg.moderationReason
          }
          dispatch({ type: 'ADD_MESSAGE', payload: message })
        })
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    }

    // Join chat via WebSocket
    console.log('🔗 Emitting join-chat event:', { broadcastId, userInfo: { userId: user.id, username: user.username, avatar: user.avatar, role: user.role } })
    socketRef.current.emit('join-chat', broadcastId, {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      role: user.role
    })
  }

  const leaveBroadcast = () => {
    if (!socketRef.current || !state.currentBroadcast) return

    socketRef.current.emit('leave-broadcast', state.currentBroadcast, {
      userId: state.currentUser?.id
    })

    dispatch({ type: 'SET_CURRENT_BROADCAST', payload: '' })
  }

  const moderateMessage = async (messageId: string, action: 'delete' | 'pin' | 'highlight' | 'hide') => {
    if (!state.currentUser) return

    try {
      const response = await fetch('/api/chat/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          action,
          reason: `Message ${action}ed by moderator`
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Update local state
        dispatch({ 
          type: 'UPDATE_MESSAGE', 
          payload: { 
            id: messageId, 
            updates: result.message 
          } 
        })
        
        // Also emit via WebSocket for real-time updates
        if (socketRef.current) {
          socketRef.current.emit('moderate-message', {
            messageId,
            action,
            moderatorId: state.currentUser.id,
            broadcastId: state.currentBroadcast
          })
        }
      }
    } catch (error) {
      console.error('Error moderating message:', error)
      toast.error('Failed to moderate message')
    }
  }

  const editMessage = async (messageId: string, newContent: string) => {
    if (!socketRef.current || !state.currentUser) return
    
    socketRef.current.emit('edit-message', state.currentBroadcast, messageId, newContent)
  }

  const deleteMessage = async (messageId: string) => {
    if (!socketRef.current || !state.currentUser) return
    
    socketRef.current.emit('delete-message', state.currentBroadcast, messageId)
  }

  const moderateUser = async (userId: string, action: 'ban' | 'unban' | 'mute' | 'unmute' | 'timeout', duration?: number) => {
    if (!state.currentUser || !state.currentBroadcast) return

    try {
      const response = await fetch('/api/chat/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broadcastId: state.currentBroadcast,
          action,
          targetUserId: userId,
          duration,
          reason: `User ${action}ed by moderator`
        })
      })

      if (response.ok) {
        // Update local state immediately
        if (action === 'ban') {
          dispatch({ type: 'BAN_USER', payload: userId })
        } else if (action === 'unban') {
          dispatch({ type: 'UNBAN_USER', payload: userId })
        } else if (action === 'mute') {
          dispatch({ type: 'MUTE_USER', payload: userId })
        } else if (action === 'unmute') {
          dispatch({ type: 'UNMUTE_USER', payload: userId })
        }

        // Also emit via WebSocket for real-time updates
        if (socketRef.current) {
          socketRef.current.emit('moderate-user', {
            userId,
            action,
            moderatorId: state.currentUser.id,
            broadcastId: state.currentBroadcast
          })
        }
      }
    } catch (error) {
      console.error('Error moderating user:', error)
      toast.error('Failed to moderate user')
    }
  }

  const likeMessage = async (messageId: string) => {
    if (!state.currentUser) return

    try {
      const response = await fetch('/api/chat/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          type: 'like'
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Update local state
        dispatch({ 
          type: 'UPDATE_MESSAGE', 
          payload: { 
            id: messageId, 
            updates: { 
              likes: result.message.likes,
              isLiked: JSON.parse(result.message.likedBy || '[]').includes(state.currentUser.id)
            } 
          } 
        })

        // Also emit via WebSocket for real-time updates
        if (socketRef.current) {
          socketRef.current.emit('like-message', {
            messageId,
            userId: state.currentUser.id,
            broadcastId: state.currentBroadcast
          })
        }
      }
    } catch (error) {
      console.error('Error liking message:', error)
      toast.error('Failed to like message')
    }
  }

  const toggleChat = () => {
    dispatch({ type: 'TOGGLE_CHAT' })
  }

  const minimizeChat = () => {
    dispatch({ type: 'MINIMIZE_CHAT' })
  }

  const maximizeChat = () => {
    dispatch({ type: 'MAXIMIZE_CHAT' })
  }

  const clearUnread = () => {
    dispatch({ type: 'CLEAR_UNREAD' })
  }

  const updateSettings = (settings: Partial<ChatState['chatSettings']>) => {
    dispatch({ type: 'UPDATE_CHAT_SETTINGS', payload: settings })
  }

  return (
    <ChatContext.Provider
      value={{
        state,
        socket: socketRef.current,
        sendMessage,
        sendTyping,
        joinBroadcast,
        leaveBroadcast,
        moderateMessage,
        moderateUser,
        likeMessage,
        editMessage,
        deleteMessage,
        toggleChat,
        minimizeChat,
        maximizeChat,
        clearUnread,
        updateSettings
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}