"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Radio,
  RadioIcon as RadioOff,
  ArrowLeft,
  Activity,
  Users,
  Clock,
  Signal,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Headphones,
  Mic,
  Settings,
  BarChart3,
  MessageSquare,
  Music,
  Monitor,
  Wifi,
  Volume2,
  Play,
  Pause,
  Square
} from "lucide-react"
import { toast } from "sonner"

// Import our custom studio components
import { MixingBoard } from "@/components/studio/mixing-board"
import { AudioPlayer } from "@/components/studio/audio-player"
import { Soundboard } from "@/components/studio/soundboard"
import { AnalyticsDashboard } from "@/components/studio/analytics-dashboard"
import { EnhancedChat } from "@/components/studio/enhanced-chat"

type Broadcast = {
  id: string
  title: string
  slug: string
  description: string
  status: "LIVE" | "SCHEDULED" | "ENDED"
  startTime: string
  endTime?: string
  streamUrl?: string
  hostUser: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  banner?: {
    id: string
    url: string
    originalName: string
    type: string
  }
  staff: BroadcastStaff[]
  guests: BroadcastGuest[]
}

type BroadcastStaff = {
  id: string
  role: "HOST" | "CO_HOST" | "PRODUCER" | "SOUND_ENGINEER" | "GUEST" | "MODERATOR"
  user: {
    id: string
    firstName: string
    lastName: string
    username: string
    email: string
    profileImage?: string
  }
  isActive: boolean
}

type BroadcastGuest = {
  id: string
  name: string
  title?: string
  role: string
}

type StreamStatus = {
  isConnected: boolean
  quality: number
  bitrate: number
  latency: number
  dropped: number
  errors: string[]
}

type StudioMetrics = {
  cpuUsage: number
  memoryUsage: number
  networkStatus: 'excellent' | 'good' | 'poor' | 'offline'
  audioLevels: {
    input: number
    output: number
    peak: number
  }
}

export default function EnhancedBroadcastStudioPage() {
  const router = useRouter()
  const params = useParams()
  const broadcastSlug = params.slug as string
  
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPrepping, setIsPrepping] = useState(false)
  const [broadcastDuration, setBroadcastDuration] = useState("00:00:00")
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState("console")
  
  // Stream monitoring
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    isConnected: false,
    quality: 0,
    bitrate: 0,
    latency: 0,
    dropped: 0,
    errors: []
  })
  
  // Studio metrics
  const [studioMetrics, setStudioMetrics] = useState<StudioMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    networkStatus: 'offline',
    audioLevels: { input: 0, output: 0, peak: 0 }
  })

  // Analytics data
  const [listeners, setListeners] = useState<any[]>([])
  const [peakListeners, setPeakListeners] = useState(0)

  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Fetch broadcast data
  useEffect(() => {
    if (broadcastSlug) {
      fetchBroadcast()
    }
  }, [broadcastSlug])

  // Timer for live broadcast duration
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLive && startTime) {
      interval = setInterval(() => {
        const now = new Date()
        const diff = now.getTime() - startTime.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setBroadcastDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isLive, startTime])

  // Stream monitoring simulation
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setStreamStatus(prev => ({
          isConnected: true,
          quality: 95 + Math.random() * 5,
          bitrate: 320 + Math.random() * 32 - 16,
          latency: 150 + Math.random() * 100,
          dropped: prev.dropped + (Math.random() > 0.9 ? 1 : 0),
          errors: prev.errors
        }))

        setStudioMetrics(prev => ({
          cpuUsage: 30 + Math.random() * 20,
          memoryUsage: 45 + Math.random() * 15,
          networkStatus: 'excellent',
          audioLevels: {
            input: 60 + Math.random() * 30,
            output: 70 + Math.random() * 25,
            peak: 85 + Math.random() * 10
          }
        }))
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [isLive])

  const fetchBroadcast = async () => {
    try {
      const response = await fetch(`/api/admin/broadcasts/${broadcastSlug}`)
      if (response.ok) {
        const data = await response.json()
        setBroadcast(data)
        setIsLive(data.status === 'LIVE')
        if (data.status === 'LIVE') {
          setStartTime(new Date(data.startTime))
        }
      } else {
        toast.error("Failed to load broadcast")
      }
    } catch (error) {
      console.error('Error fetching broadcast:', error)
      toast.error("Error loading broadcast")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoLive = async () => {
    setIsPrepping(true)
    try {
      // Initialize audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }

      // Get user media for microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      streamRef.current = stream

      // Update broadcast status
      const response = await fetch(`/api/admin/broadcasts/${broadcastSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'LIVE' }),
      })

      if (response.ok) {
        const updatedBroadcast = await response.json()
        setBroadcast(updatedBroadcast)
        setIsLive(true)
        setStartTime(new Date())
        toast.success("🎙️ You're now LIVE!")
      } else {
        throw new Error('Failed to start broadcast')
      }
    } catch (error) {
      console.error('Error starting broadcast:', error)
      toast.error("Failed to go live. Please check your microphone permissions.")
    } finally {
      setIsPrepping(false)
    }
  }

  const handleEndBroadcast = async () => {
    try {
      // Stop media streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      
      if (audioContextRef.current) {
        await audioContextRef.current.close()
      }

      // Update broadcast status
      const response = await fetch(`/api/admin/broadcasts/${broadcastSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ENDED' }),
      })

      if (response.ok) {
        const updatedBroadcast = await response.json()
        setBroadcast(updatedBroadcast)
        setIsLive(false)
        setStreamStatus(prev => ({ ...prev, isConnected: false }))
        toast.success("📻 Broadcast ended successfully")
        
        setTimeout(() => {
          router.push('/dashboard/broadcasts')
        }, 3000)
      } else {
        throw new Error('Failed to end broadcast')
      }
    } catch (error) {
      console.error('Error ending broadcast:', error)
      toast.error("Failed to end broadcast")
    }
  }

  const getStatusIndicator = () => {
    if (isLive) {
      return (
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="h-6 w-6 text-red-500" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold text-red-600">LIVE</div>
            <div className="text-xs text-gray-500">{broadcastDuration}</div>
          </div>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2">
        <RadioOff className="h-6 w-6 text-gray-400" />
        <div>
          <div className="text-sm font-medium text-gray-600">OFF AIR</div>
          <div className="text-xs text-gray-500">Ready to broadcast</div>
        </div>
      </div>
    )
  }

  const getNetworkStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'poor': return 'text-yellow-600'
      default: return 'text-red-600'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-900 mx-auto"></div>
          <p className="text-slate-500">Loading broadcast studio...</p>
        </div>
      </div>
    )
  }

  if (!broadcast) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-300 mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Broadcast Not Found</h2>
            <p className="text-slate-500 text-center mb-6">
              The broadcast you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/dashboard/broadcasts')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Broadcasts
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-6 py-8">
        {/* Studio Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push('/dashboard/broadcasts')}
              className="hover:bg-white/80 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {broadcast.title}
              </h1>
              <p className="text-slate-500 mt-1">
                Professional Broadcasting Studio • Host: {broadcast.hostUser.firstName} {broadcast.hostUser.lastName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {getStatusIndicator()}
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span>{listeners.length} listeners</span>
            </div>
          </div>
        </div>

        {/* Stream Status Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="flex items-center gap-2">
                <Signal className={`h-4 w-4 ${streamStatus.isConnected ? 'text-green-500' : 'text-red-500'}`} />
                <div>
                  <div className="text-xs text-gray-500">Stream</div>
                  <div className="text-sm font-medium">
                    {streamStatus.isConnected ? 'Connected' : 'Offline'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-xs text-gray-500">Quality</div>
                  <div className="text-sm font-medium">{streamStatus.quality.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-xs text-gray-500">Bitrate</div>
                  <div className="text-sm font-medium">{Math.round(streamStatus.bitrate)} kbps</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <div className="text-xs text-gray-500">Latency</div>
                  <div className="text-sm font-medium">{Math.round(streamStatus.latency)}ms</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-orange-500" />
                <div>
                  <div className="text-xs text-gray-500">CPU</div>
                  <div className="text-sm font-medium">{Math.round(studioMetrics.cpuUsage)}%</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 ${getNetworkStatusColor(studioMetrics.networkStatus)}`} />
                <div>
                  <div className="text-xs text-gray-500">Network</div>
                  <div className={`text-sm font-medium capitalize ${getNetworkStatusColor(studioMetrics.networkStatus)}`}>
                    {studioMetrics.networkStatus}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Studio Interface */}
        <div className="space-y-6">
          {/* Go Live / End Broadcast Controls */}
          {!isLive ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-green-900">Ready to Go Live?</h3>
                    <p className="text-green-700">
                      All systems are ready. Click the button below to start your live broadcast.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleGoLive}
                    disabled={isPrepping}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
                  >
                    {isPrepping ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Preparing...
                      </>
                    ) : (
                      <>
                        <Radio className="h-5 w-5 mr-2" />
                        GO LIVE
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-red-900">You're Live!</h3>
                    <p className="text-red-700">
                      Broadcasting for {broadcastDuration} • {listeners.length} listeners
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleEndBroadcast}
                    variant="destructive"
                    className="px-8 py-4 text-lg"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    END BROADCAST
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Studio Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm border">
              <TabsTrigger value="console" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <Mic className="h-4 w-4 mr-2" />
                Console
              </TabsTrigger>
              <TabsTrigger value="player" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <Music className="h-4 w-4 mr-2" />
                Player
              </TabsTrigger>
              <TabsTrigger value="soundboard" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <Zap className="h-4 w-4 mr-2" />
                Soundboard
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="chat" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="console" className="space-y-6">
              <MixingBoard
                isLive={isLive}
                onChannelChange={(channelId, changes) => {
                  console.log('Channel changed:', channelId, changes)
                }}
                onMasterVolumeChange={(volume) => {
                  console.log('Master volume:', volume)
                }}
                onCueChannel={(channelId) => {
                  console.log('Cue channel:', channelId)
                }}
              />
            </TabsContent>

            <TabsContent value="player" className="space-y-6">
              <AudioPlayer
                isLive={isLive}
                onTrackChange={(track) => {
                  console.log('Track changed:', track)
                }}
                onPlaylistChange={(playlist) => {
                  console.log('Playlist changed:', playlist)
                }}
              />
            </TabsContent>

            <TabsContent value="soundboard" className="space-y-6">
              <Soundboard
                isLive={isLive}
                onSoundPlay={(sound) => {
                  console.log('Sound playing:', sound)
                  toast.success(`Playing: ${sound.name}`)
                }}
                onSoundStop={(soundId) => {
                  console.log('Sound stopped:', soundId)
                }}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsDashboard
                isLive={isLive}
                listeners={listeners}
                onListenerUpdate={setListeners}
              />
            </TabsContent>

            <TabsContent value="chat" className="space-y-6">
              <EnhancedChat
                isLive={isLive}
                hostId={broadcast.hostUser.id}
                onMessageSend={(message, type) => {
                  console.log('Message sent:', message, type)
                  if (type === 'announcement') {
                    toast.success('Announcement sent to all listeners')
                  }
                }}
                onUserAction={(userId, action) => {
                  console.log('User action:', userId, action)
                  toast.success(`User ${action}ed successfully`)
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}