"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface ChatMessage {
  id: string
  userId: string
  username: string
  userAvatar?: string
  content: string
  timestamp: Date
  type: 'user' | 'host' | 'moderator' | 'system' | 'announcement'
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
}

interface ChatUser {
  id: string
  username: string
  avatar?: string
  role: 'listener' | 'host' | 'moderator' | 'admin'
  isMuted: boolean
  isBanned: boolean
  joinedAt: Date
  messageCount: number
  violations: number
}

interface EnhancedChatProps {
  isLive: boolean
  hostId: string
  onMessageSend: (message: string, type?: string) => void
  onUserAction: (userId: string, action: string) => void
}

export function EnhancedChat({ isLive, hostId, onMessageSend, onUserAction }: EnhancedChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedMessageType, setSelectedMessageType] = useState("user")
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([])
  const [showModerationPanel, setShowModerationPanel] = useState(false)
  const [chatFilters, setChatFilters] = useState({
    showAll: true,
    showUsers: true,
    showModerators: true,
    showSystem: true,
    hideSpam: true
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [autoModeration, setAutoModeration] = useState(true)
  const [slowMode, setSlowMode] = useState(0) // seconds
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  // Initialize with some sample data
  useEffect(() => {
    const initialMessages: ChatMessage[] = [
      {
        id: '1',
        userId: 'system',
        username: 'System',
        content: '🎵 Welcome to the live broadcast! Chat is now active.',
        timestamp: new Date(Date.now() - 300000),
        type: 'system',
        likes: 0,
        dislikes: 0,
        isLiked: false,
        isDisliked: false,
        isPinned: false,
        isHighlighted: false,
        emojis: {},
        isModerated: false
      },
      {
        id: '2',
        userId: hostId,
        username: 'Radio Host',
        content: 'Good evening everyone! Thanks for tuning in tonight. We have an amazing show lined up for you!',
        timestamp: new Date(Date.now() - 240000),
        type: 'host',
        likes: 15,
        dislikes: 0,
        isLiked: false,
        isDisliked: false,
        isPinned: true,
        isHighlighted: true,
        emojis: { '🎵': 3, '👏': 8, '❤️': 5 },
        isModerated: false
      }
    ]
    setMessages(initialMessages)
    setPinnedMessage(initialMessages[1])

    const initialUsers: ChatUser[] = [
      {
        id: hostId,
        username: 'Radio Host',
        role: 'host',
        isMuted: false,
        isBanned: false,
        joinedAt: new Date(Date.now() - 300000),
        messageCount: 1,
        violations: 0
      }
    ]
    setChatUsers(initialUsers)
  }, [hostId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Simulate real-time messages
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const userMessages = [
          "Great music selection! 🎵",
          "Love this show! ❤️",
          "Can you play some jazz next?",
          "Hello from New York! 🗽",
          "This is my favorite radio station",
          "Amazing broadcast as always",
          "Perfect music for the evening 🌅",
          "Thanks for keeping us entertained! 🙏",
          "What's the name of this song?",
          "Greetings from London! 🇬🇧"
        ]

        const randomMessage = userMessages[Math.floor(Math.random() * userMessages.length)]
        const randomUser = `Listener${Math.floor(Math.random() * 1000)}`
        const userId = `user_${Date.now()}`

        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          userId,
          username: randomUser,
          content: randomMessage,
          timestamp: new Date(),
          type: 'user',
          likes: Math.floor(Math.random() * 5),
          dislikes: 0,
          isLiked: false,
          isDisliked: false,
          isPinned: false,
          isHighlighted: false,
          emojis: {},
          isModerated: false
        }

        setMessages(prev => [...prev.slice(-99), newMessage])

        // Add user if not exists
        setChatUsers(prev => {
          if (prev.some(u => u.id === userId)) return prev
          return [...prev, {
            id: userId,
            username: randomUser,
            role: 'listener',
            isMuted: false,
            isBanned: false,
            joinedAt: new Date(),
            messageCount: 1,
            violations: 0
          }]
        })
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [isLive])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isLive) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: hostId,
      username: 'Radio Host',
      content: newMessage.trim(),
      timestamp: new Date(),
      type: selectedMessageType as any,
      likes: 0,
      dislikes: 0,
      isLiked: false,
      isDisliked: false,
      isPinned: false,
      isHighlighted: selectedMessageType === 'announcement',
      emojis: {},
      isModerated: false
    }

    setMessages(prev => [...prev, message])
    onMessageSend(newMessage.trim(), selectedMessageType)
    setNewMessage("")
    chatInputRef.current?.focus()
  }

  const handleMessageAction = (messageId: string, action: 'like' | 'dislike' | 'pin' | 'delete' | 'moderate') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        switch (action) {
          case 'like':
            return {
              ...msg,
              likes: msg.isLiked ? msg.likes - 1 : msg.likes + 1,
              isLiked: !msg.isLiked,
              isDisliked: false
            }
          case 'dislike':
            return {
              ...msg,
              dislikes: msg.isDisliked ? msg.dislikes - 1 : msg.dislikes + 1,
              isDisliked: !msg.isDisliked,
              isLiked: false
            }
          case 'pin':
            setPinnedMessage(msg.isPinned ? null : msg)
            return { ...msg, isPinned: !msg.isPinned }
          case 'moderate':
            return { ...msg, isModerated: true, moderationReason: 'Inappropriate content' }
          default:
            return msg
        }
      }
      return msg
    }))
  }

  const handleUserAction = (userId: string, action: 'mute' | 'ban' | 'timeout') => {
    setChatUsers(prev => prev.map(user => {
      if (user.id === userId) {
        switch (action) {
          case 'mute':
            return { ...user, isMuted: !user.isMuted }
          case 'ban':
            return { ...user, isBanned: true }
          default:
            return user
        }
      }
      return user
    }))
    onUserAction(userId, action)
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

  const filteredMessages = messages.filter(msg => {
    if (searchTerm && !msg.content.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (!chatFilters.showSystem && msg.type === 'system') return false
    if (!chatFilters.showUsers && msg.type === 'user') return false
    if (!chatFilters.showModerators && (msg.type === 'moderator' || msg.type === 'host')) return false
    if (chatFilters.hideSpam && msg.isModerated) return false
    return true
  })

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
                onClick={() => setPinnedMessage(null)}
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
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModerationPanel(!showModerationPanel)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              {autoModeration && (
                <Badge variant="secondary">Auto-Mod</Badge>
              )}
              {slowMode > 0 && (
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {slowMode}s
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
                  <Select value={slowMode.toString()} onValueChange={(value) => setSlowMode(parseInt(value))}>
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
                    variant={autoModeration ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoModeration(!autoModeration)}
                    className="w-full h-8 text-xs"
                  >
                    {autoModeration ? 'On' : 'Off'}
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
                const RoleIcon = getRoleIcon(message.type)
                return (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg transition-colors ${getMessageTypeColor(message.type)} ${
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
                            <span className={`font-medium text-sm ${getRoleColor(message.type)}`}>
                              {message.username}
                            </span>
                            {RoleIcon && <RoleIcon className={`h-3 w-3 ${getRoleColor(message.type)}`} />}
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
                            
                            {message.type === 'user' && (
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
                                  onClick={() => handleMessageAction(message.id, 'moderate')}
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
                  placeholder={isLive ? "Send a message to listeners..." : "Test mode: Send a test message..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={false} // Always enabled for testing
                  className={selectedMessageType === 'announcement' ? 'border-red-300' : ''}
                />
                {selectedMessageType === 'announcement' && (
                  <Megaphone className="absolute right-3 top-2.5 h-4 w-4 text-red-500" />
                )}
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!isLive || !newMessage.trim()}
                className={selectedMessageType === 'announcement' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {selectedMessageType === 'announcement' && (
              <p className="text-xs text-red-600">
                This message will be highlighted and pinned automatically
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Active Users ({chatUsers.length})</span>
            <Badge variant="outline">{chatUsers.filter(u => !u.isBanned).length} active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {chatUsers.slice(0, 10).map((user) => {
                const RoleIcon = getRoleIcon(user.role)
                return (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{user.username.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{user.username}</span>
                      {RoleIcon && <RoleIcon className={`h-3 w-3 ${getRoleColor(user.role)}`} />}
                      {user.isMuted && <VolumeX className="h-3 w-3 text-red-500" />}
                      {user.isBanned && <Ban className="h-3 w-3 text-red-500" />}
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
                            {user.isMuted ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
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