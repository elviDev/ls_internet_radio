"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "@/contexts/chat-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  MessageSquare,
  Send,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Ban,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Filter,
  Search,
  Settings,
  Crown,
  Shield,
  AlertTriangle,
  Flag,
  Trash2,
  Pin,
  Megaphone,
  Smile,
  Gift,
  Star,
  Clock
} from "lucide-react"


interface EnhancedChatProps {
  isLive: boolean
  hostId: string
  broadcastId: string
  onMessageSend: (message: string, type?: string) => void
  onUserAction: (userId: string, action: string) => void
}

export function EnhancedChat({ isLive, hostId, broadcastId, onMessageSend, onUserAction }: EnhancedChatProps) {
  const {
    state,
    sendMessage,
    sendTyping,
    joinBroadcast,
    leaveBroadcast,
    moderateMessage,
    moderateUser,
    likeMessage,
    updateSettings
  } = useChat()

  const [newMessage, setNewMessage] = useState("")
  const [selectedMessageType, setSelectedMessageType] = useState("user")
  const [showModerationPanel, setShowModerationPanel] = useState(false)
  const [chatFilters, setChatFilters] = useState({
    showAll: true,
    showUsers: true,
    showModerators: true,
    showSystem: true,
    hideSpam: true
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showUserActions, setShowUserActions] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [slowMode, setSlowMode] = useState(0)
  const [autoModeration, setAutoModeration] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [chatUsers, setChatUsers] = useState<any[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Join broadcast when component mounts
  useEffect(() => {
    if (broadcastId && hostId && !state.currentBroadcast) {
      joinBroadcast(broadcastId, {
        id: hostId,
        username: 'Radio Host',
        role: 'host',
        isOnline: true,
        isTyping: false,
        lastSeen: new Date(),
        messageCount: 0
      })
    }

    return () => {
      if (state.currentBroadcast) {
        leaveBroadcast()
      }
    }
  }, [broadcastId, hostId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages])

  // Update chat settings when studio settings change
  useEffect(() => {
    updateSettings({
      slowMode: state.chatSettings.slowMode,
      autoModeration: state.chatSettings.autoModeration,
      allowEmojis: state.chatSettings.allowEmojis,
      maxMessageLength: state.chatSettings.maxMessageLength
    })
  }, [])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !state.isConnected) return

    sendMessage(newMessage.trim(), selectedMessageType)
    onMessageSend(newMessage.trim(), selectedMessageType)
    
    setNewMessage("")
    setIsTyping(false)
    sendTyping(false)
    chatInputRef.current?.focus()
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

  const handleMessageAction = (messageId: string, action: 'like' | 'dislike' | 'pin' | 'delete' | 'highlight') => {
    switch (action) {
      case 'like':
        likeMessage(messageId)
        break
      case 'pin':
      case 'delete':
      case 'highlight':
        moderateMessage(messageId, action)
        break
    }
  }

  const handleUserAction = (userId: string, action: 'mute' | 'unmute' | 'ban' | 'unban' | 'timeout') => {
    moderateUser(userId, action)
    onUserAction(userId, action)
    
    // Show confirmation toast
    const user = state.users.find(u => u.id === userId)
    if (user) {
      switch (action) {
        case 'ban':
          toast.success(`🚫 ${user.username} has been banned`)
          break
        case 'unban':
          toast.success(`✅ ${user.username} has been unbanned`)
          break
        case 'mute':
          toast.success(`🔇 ${user.username} has been muted`)
          break
        case 'unmute':
          toast.success(`🔊 ${user.username} has been unmuted`)
          break
        case 'timeout':
          toast.success(`⏰ ${user.username} has been timed out`)
          break
      }
    }
    
    setSelectedUserId(null)
    setShowUserActions(false)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'host': return Crown
      case 'moderator': return Shield
      case 'admin': return Star
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

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'host': return 'border-l-4 border-purple-500 bg-purple-50'
      case 'moderator': return 'border-l-4 border-blue-500 bg-blue-50'
      case 'system': return 'border-l-4 border-gray-500 bg-gray-50'
      case 'announcement': return 'border-l-4 border-red-500 bg-red-50'
      default: return 'border-l-4 border-transparent'
    }
  }

  const currentBroadcastMessages = state.messages.filter(
    msg => msg.broadcastId === broadcastId
  )

  const filteredMessages = currentBroadcastMessages.filter(msg => {
    if (searchTerm && !msg.content.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (!chatFilters.showSystem && msg.messageType === 'system') return false
    if (!chatFilters.showUsers && msg.messageType === 'user') return false
    if (!chatFilters.showModerators && (msg.messageType === 'moderator' || msg.messageType === 'host')) return false
    if (chatFilters.hideSpam && msg.isModerated) return false
    return true
  })

  const pinnedMessage = filteredMessages.find(msg => msg.isPinned)
  const typingUsers = state.typingUsers.filter(typing => typing.broadcastId === broadcastId)

  return (
    <div className="space-y-6">
      {/* Pinned Message */}
      {pinnedMessage && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Pin className="h-4 w-4 text-yellow-600 mt-1" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{pinnedMessage.username}</span>
                    <Badge variant="outline" className="text-xs">Pinned</Badge>
                  </div>
                  <p className="text-sm text-gray-700">{pinnedMessage.content}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMessageAction(pinnedMessage.id, 'pin')}
                className="h-6 w-6 p-0"
              >
                <Pin className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Live Chat
              <Badge variant="outline">{filteredMessages.length} messages</Badge>
              {state.isConnected ? (
                <Badge variant="default" className="bg-green-500">
                  🟢 Live
                </Badge>
              ) : (
                <Badge variant="destructive">
                  🔴 Offline
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModerationPanel(!showModerationPanel)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              {state.chatSettings.autoModeration && (
                <Badge variant="secondary">Auto-Mod</Badge>
              )}
              {state.chatSettings.slowMode > 0 && (
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {state.chatSettings.slowMode}s
                </Badge>
              )}
              {typingUsers.length > 0 && (
                <Badge variant="outline" className="animate-pulse">
                  {typingUsers.length} typing...
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Moderation Panel */}
          {showModerationPanel && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Slow Mode</label>
                  <Select value={state.chatSettings.slowMode.toString()} onValueChange={(value) => updateSettings({ ...state.chatSettings, slowMode: parseInt(value) })}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Off</SelectItem>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Auto-Moderation</label>
                  <Button
                    variant={state.chatSettings.autoModeration ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSettings({ ...state.chatSettings, autoModeration: !state.chatSettings.autoModeration })}
                    className="w-full h-8 text-xs"
                  >
                    {state.chatSettings.autoModeration ? 'On' : 'Off'}
                  </Button>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" />
                    <Input
                      placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-8 pl-7 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Filters</label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs"
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-3">
              {filteredMessages.map((message) => {
                const RoleIcon = getRoleIcon(message.messageType)
                return (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg transition-colors ${getMessageTypeColor(message.messageType)} ${
                      message.isHighlighted ? 'ring-2 ring-blue-200' : ''
                    } ${message.isModerated ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {message.username.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-medium text-sm ${getRoleColor(message.messageType)}`}>
                              {message.username}
                            </span>
                            {RoleIcon && <RoleIcon className={`h-3 w-3 ${getRoleColor(message.messageType)}`} />}
                            <span className="text-xs text-gray-500">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                            {message.isPinned && (
                              <Pin className="h-3 w-3 text-yellow-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{message.content}</p>
                          
                          {/* Emoji Reactions */}
                          {Object.keys(message.emojis).length > 0 && (
                            <div className="flex items-center gap-1 mb-2">
                              {Object.entries(message.emojis).map(([emoji, count]) => (
                                <Badge key={emoji} variant="secondary" className="text-xs h-5">
                                  {emoji} {count}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Message Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMessageAction(message.id, 'like')}
                              className="h-6 px-2 text-xs"
                            >
                              <Heart className={`h-3 w-3 mr-1 ${message.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                              {message.likes > 0 && message.likes}
                            </Button>
                            
                            {message.messageType === 'user' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMessageAction(message.id, 'pin')}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Pin className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moderateMessage(message.id, 'delete')}
                                  className="h-6 px-2 text-xs text-red-600"
                                >
                                  <Flag className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Select value={selectedMessageType} onValueChange={setSelectedMessageType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Normal</SelectItem>
                  <SelectItem value="announcement">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-3 w-3" />
                      Announcement
                    </div>
                  </SelectItem>
                  <SelectItem value="host">Host Message</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex-1 relative">
                <Input
                  ref={chatInputRef}
                  placeholder={state.isConnected ? "Send a message to listeners..." : "Connecting to chat..."}
                  value={newMessage}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={!state.isConnected}
                  className={selectedMessageType === 'announcement' ? 'border-red-300' : ''}
                />
                {selectedMessageType === 'announcement' && (
                  <Megaphone className="absolute right-3 top-2.5 h-4 w-4 text-red-500" />
                )}
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !state.isConnected}
                className={selectedMessageType === 'announcement' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              {selectedMessageType === 'announcement' && (
                <p className="text-red-600">
                  This message will be highlighted and sent to all listeners
                </p>
              )}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${state.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-gray-500">
                  {state.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Active Users ({state.users.length})</span>
            <Badge variant="outline">{state.users.filter(u => u.isOnline).length} active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {state.users.slice(0, 10).map((user) => {
                const RoleIcon = getRoleIcon(user.role)
                return (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{user.username.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{user.username}</span>
                      {RoleIcon && <RoleIcon className={`h-3 w-3 ${getRoleColor(user.role)}`} />}
                      {!user.isOnline && <VolumeX className="h-3 w-3 text-gray-400" />}
                    </div>
                    <div className="flex items-center gap-1">
                      {user.role === 'listener' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'mute')}
                            className="h-6 w-6 p-0"
                          >
                            <VolumeX className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'ban')}
                            className="h-6 w-6 p-0 text-red-600"
                          >
                            <Ban className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}