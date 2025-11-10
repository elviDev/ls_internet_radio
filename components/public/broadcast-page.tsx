"use client"

import { useState, useEffect, useRef } from "react"
import { UnifiedAudioListener } from "@/lib/unified-audio-system"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChatWidget } from "@/components/chat/chat-widget"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Users,
  Radio,
  Heart,
  Share2,
  MessageSquare,
  Calendar
} from "lucide-react"

interface Broadcast {
  id: string
  title: string
  description: string
  status: "LIVE" | "SCHEDULED" | "ENDED"
  startTime: string
  hostUser: {
    firstName: string
    lastName: string
    profileImage?: string
  }
  banner?: {
    url: string
  }
  currentListeners: number
  totalListeners: number
}

interface BroadcastPageProps {
  broadcast: Broadcast
  userId?: string
  username?: string
}

export function BroadcastPage({ broadcast, userId, username }: BroadcastPageProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const audioListenerRef = useRef<UnifiedAudioListener | null>(null)

  const handlePlayPause = async () => {
    if (!isPlaying) {
      // Start listening
      try {
        if (!audioListenerRef.current) {
          audioListenerRef.current = new UnifiedAudioListener(broadcast.id)
        }
        await audioListenerRef.current.startListening()
        setIsPlaying(true)
      } catch (error) {
        console.error('Failed to start listening:', error)
      }
    } else {
      // Stop listening
      if (audioListenerRef.current) {
        audioListenerRef.current.stopListening()
        setIsPlaying(false)
      }
    }
  }

  const toggleMute = () => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    if (audioListenerRef.current) {
      audioListenerRef.current.setVolume(newMuted ? 0 : volume)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getStatusBadge = () => {
    switch (broadcast.status) {
      case 'LIVE':
        return (
          <Badge variant="destructive" className="animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full mr-2" />
            LIVE
          </Badge>
        )
      case 'SCHEDULED':
        return <Badge variant="outline">Scheduled</Badge>
      case 'ENDED':
        return <Badge variant="secondary">Ended</Badge>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                {broadcast.banner && (
                  <div className="mb-6">
                    <img
                      src={broadcast.banner.url}
                      alt={broadcast.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {broadcast.title}
                    </h1>
                    {getStatusBadge()}
                  </div>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {broadcast.description}
                  </p>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={broadcast.hostUser.profileImage} />
                      <AvatarFallback>
                        {broadcast.hostUser.firstName.charAt(0)}
                        {broadcast.hostUser.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">
                        {broadcast.hostUser.firstName} {broadcast.hostUser.lastName}
                      </p>
                      <p className="text-sm text-gray-500">Radio Host</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audio Player */}
            {broadcast.status === 'LIVE' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="h-5 w-5" />
                    Live Audio Stream
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      onClick={handlePlayPause}
                      size="lg"
                      className="h-16 w-16 rounded-full"
                    >
                      {isPlaying ? (
                        <Pause className="h-8 w-8" />
                      ) : (
                        <Play className="h-8 w-8 ml-1" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const newVolume = parseInt(e.target.value)
                        setVolume(newVolume)
                        if (audioListenerRef.current && !isMuted) {
                          audioListenerRef.current.setVolume(newVolume)
                        }
                      }}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500 w-12">
                      {isMuted ? 0 : volume}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Interact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? 'Liked' : 'Like'}
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                
                <Button variant="outline" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Join Chat
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Listeners</span>
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {broadcast.currentListeners}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Started</span>
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatTime(broadcast.startTime)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      {broadcast.status === 'LIVE' && username && userId && (
        <ChatWidget
          broadcastId={broadcast.id}
          currentUser={{
            id: userId,
            username: username,
            role: 'listener'
          }}
          position="bottom-right"
        />
      )}
    </div>
  )
}