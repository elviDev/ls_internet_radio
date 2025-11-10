"use client"

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@/contexts/chat-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  MessageCircle,
  Send,
  Users,
  X,
  Minimize2,
  Maximize2,
  Settings,
  Smile,
  Heart,
  ThumbsUp,
  Reply,
  MoreVertical,
  Loader2,
  AlertCircle,
  Mic,
  Crown,
  Shield,
  Phone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ChatWidgetProps {
  broadcastId?: string
  currentUser?: {
    id: string
    username: string
    avatar?: string
    role?: 'listener' | 'host' | 'moderator' | 'admin'
  }
  isLive?: boolean
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export function ChatWidget({ 
  broadcastId, 
  currentUser,
  isLive = false,
  className,
  position = 'bottom-right' 
}: ChatWidgetProps) {
  const { 
    state, 
    sendMessage, 
    sendTyping, 
    joinBroadcast, 
    leaveBroadcast,
    toggleChat, 
    minimizeChat, 
    maximizeChat, 
    clearUnread,
    likeMessage 
  } = useChat()

  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages])

  const hasJoinedRef = useRef(false)

  // Set broadcast live status
  useEffect(() => {
    if (state.socket) {
      state.socket.emit('set-broadcast-status', { broadcastId, isLive })
    }
  }, [broadcastId, isLive, state.socket])

  // Join broadcast when component mounts
  useEffect(() => {
    console.log('🎯 ChatWidget useEffect:', { broadcastId, currentUser, isConnected: state.isConnected, hasJoined: hasJoinedRef.current, isLive })
    if (broadcastId && currentUser && state.isConnected && !hasJoinedRef.current) {
      console.log('🎯 ChatWidget joining broadcast')
      hasJoinedRef.current = true
      joinBroadcast(broadcastId, {
        id: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        role: currentUser.role || 'listener',
        isOnline: true,
        isTyping: false,
        lastSeen: new Date(),
        messageCount: 0
      })
    }
  }, [broadcastId, currentUser, state.isConnected])

  // Reset join flag when broadcast or user changes
  useEffect(() => {
    hasJoinedRef.current = false
  }, [broadcastId, currentUser?.id])

  // Clear unread when chat is opened
  useEffect(() => {
    if (state.isChatOpen && state.unreadCount > 0) {
      clearUnread()
    }
  }, [state.isChatOpen])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !state.isConnected) return

    console.log('🎯 ChatWidget sending message:', newMessage.trim())
    sendMessage(newMessage.trim(), 'user', replyTo || undefined)
    setNewMessage('')
    setReplyTo(null)
    setIsTyping(false)
    
    // Focus back to input
    inputRef.current?.focus()
  }

  const handleInputChange = (value: string) => {
    setNewMessage(value)
    
    // Handle typing indicators
    if (value.length > 0 && !isTyping) {
      setIsTyping(true)
      sendTyping(true)
    } else if (value.length === 0 && isTyping) {
      setIsTyping(false)
      sendTyping(false)
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Auto-stop typing after 3 seconds of inactivity
    if (value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        sendTyping(false)
      }, 3000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCallIn = () => {
    // TODO: Implement call-in functionality
    toast.success('Call-in feature coming soon! 📞')
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'host': return Crown
      case 'moderator': return Shield
      case 'admin': return Shield
      default: return null
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'host': return 'text-purple-600'
      case 'moderator': return 'text-blue-600'
      case 'admin': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      default:
        return 'bottom-4 right-4'
    }
  }

  const currentBroadcastMessages = state.messages.filter(
    msg => !broadcastId || msg.broadcastId === broadcastId
  )

  // Show typing users for current broadcast
  const typingUsers = state.typingUsers.filter(
    typing => !broadcastId || typing.broadcastId === broadcastId
  ).filter(typing => typing.userId !== currentUser?.id)

  if (!broadcastId || !currentUser) {
    return null
  }

  return (
    <div className={cn(
      'fixed z-50 transition-all duration-300',
      getPositionClasses(),
      className
    )}>
      {/* Chat Toggle Button (when minimized) */}
      {!state.isChatOpen && (
        <Button
          onClick={toggleChat}
          className={cn(
            "w-16 h-16 rounded-full shadow-lg relative",
            state.unreadCount > 0 && "animate-bounce"
          )}
        >
          <MessageCircle className="h-6 w-6" />
          
          {/* Unread count badge */}
          {state.unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center animate-pulse"
            >
              {state.unreadCount > 99 ? '99+' : state.unreadCount}
            </Badge>
          )}
          
          {/* Connection status indicator */}
          <div 
            className={cn(
              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
              state.isConnected ? "bg-green-500" : "bg-red-500"
            )}
          />
        </Button>
      )}

      {/* Chat Window */}
      {state.isChatOpen && (
        <Card className={cn(
          "w-80 h-96 flex flex-col shadow-2xl",
          state.isMinimized && "h-12"
        )}>
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <CardTitle className="text-sm">
                Live Chat
                {!state.isConnected && (
                  <Loader2 className="h-3 w-3 ml-1 animate-spin inline" />
                )}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {state.users.length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Call In Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCallIn}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                title="Call into the show"
              >
                <Phone className="h-3 w-3" />
              </Button>
              
              {/* Connection Status */}
              <div 
                className={cn(
                  "w-2 h-2 rounded-full",
                  state.isConnected ? "bg-green-500" : "bg-red-500"
                )}
                title={state.isConnected ? "Connected" : "Disconnected"}
              />
              
              {/* Minimize/Maximize */}
              <Button
                variant="ghost"
                size="sm"
                onClick={state.isMinimized ? maximizeChat : minimizeChat}
                className="h-6 w-6 p-0"
              >
                {state.isMinimized ? (
                  <Maximize2 className="h-3 w-3" />
                ) : (
                  <Minimize2 className="h-3 w-3" />
                )}
              </Button>
              
              {/* Close */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleChat}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>

          {/* Chat Content (when not minimized) */}
          {!state.isMinimized && (
            <>
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {!state.isConnected && (
                      <div className="text-center py-4">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                        <p className="text-sm text-gray-500">Connecting to chat...</p>
                      </div>
                    )}
                    
                    {state.isConnected && !state.isBroadcastLive && (
                      <div className="text-center py-4">
                        <MessageCircle className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">No live broadcast</p>
                        <p className="text-xs text-gray-400">Chat will be available when a broadcast starts</p>
                      </div>
                    )}
                    
                    {currentBroadcastMessages.length === 0 && state.isConnected && state.isBroadcastLive && (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs">Be the first to say something!</p>
                      </div>
                    )}

                    {currentBroadcastMessages.map((message) => {
                      const RoleIcon = getRoleIcon(message.messageType)
                      const isOwnMessage = message.userId === currentUser.id
                      
                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-2 group",
                            isOwnMessage && "flex-row-reverse"
                          )}
                        >
                          {/* Avatar */}
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={message.userAvatar} />
                            <AvatarFallback className="text-xs">
                              {message.username.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>

                          {/* Message Content */}
                          <div className={cn(
                            "flex-1 max-w-[80%]",
                            isOwnMessage && "text-right"
                          )}>
                            {/* Header */}
                            <div className={cn(
                              "flex items-center gap-1 text-xs mb-1",
                              isOwnMessage && "flex-row-reverse"
                            )}>
                              <span className={cn(
                                "font-medium",
                                getRoleColor(message.messageType)
                              )}>
                                {message.username}
                              </span>
                              {RoleIcon && (
                                <RoleIcon className={cn(
                                  "h-3 w-3",
                                  getRoleColor(message.messageType)
                                )} />
                              )}
                              <span className="text-gray-400">
                                {formatTime(message.timestamp)}
                              </span>
                            </div>

                            {/* Message Bubble */}
                            <div className={cn(
                              "rounded-lg px-3 py-2 text-sm relative",
                              message.messageType === 'announcement' && "border-l-4 border-red-500 bg-red-50",
                              message.messageType === 'system' && "bg-gray-100 text-gray-600 text-center",
                              message.isPinned && "ring-2 ring-yellow-300",
                              isOwnMessage ? "bg-blue-500 text-white" : "bg-gray-100",
                              !isOwnMessage && message.messageType === 'user' && "hover:bg-gray-200"
                            )}>
                              {/* Reply indicator */}
                              {message.replyTo && (
                                <div className="text-xs opacity-70 mb-1 italic">
                                  Replying to message...
                                </div>
                              )}
                              
                              <p className="break-words">{message.content}</p>
                              
                              {/* Message actions */}
                              {!isOwnMessage && message.messageType === 'user' && (
                                <div className="absolute -right-16 top-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg shadow-md border p-1 flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => likeMessage(message.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Heart className={cn(
                                      "h-3 w-3",
                                      message.isLiked && "fill-red-500 text-red-500"
                                    )} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setReplyTo(message.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Reply className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Likes/Reactions */}
                            {message.likes > 0 && (
                              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                                {message.likes}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Typing Indicators */}
                    {typingUsers.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 italic">
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span>
                          {typingUsers.length === 1
                            ? `${typingUsers[0].username} is typing...`
                            : `${typingUsers.length} people are typing...`
                          }
                        </span>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <Separator />

                {/* Input Area */}
                <div className="p-3 space-y-2">
                  {/* Reply indicator */}
                  {replyTo && (
                    <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                      <span className="text-xs text-gray-600">
                        Replying to message
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyTo(null)}
                        className="h-4 w-4 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      placeholder={
                        !state.isConnected 
                          ? "Connecting..." 
                          : !state.isBroadcastLive
                          ? "Chat available during live broadcasts"
                          : "Type a message..."
                      }
                      value={newMessage}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={!state.isConnected || !state.isBroadcastLive}
                      maxLength={state.chatSettings.maxMessageLength}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || !state.isConnected || !state.isBroadcastLive}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Character count */}
                  {newMessage.length > state.chatSettings.maxMessageLength * 0.8 && (
                    <div className="text-xs text-right text-gray-500">
                      {newMessage.length}/{state.chatSettings.maxMessageLength}
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      )}
    </div>
  )
}