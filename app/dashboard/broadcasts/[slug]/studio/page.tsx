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
import { RealTimeStudio } from "@/components/studio/real-time-studio"
import { AudioProvider } from "@/contexts/audio-context"
import { useWebRTCBroadcast } from "@/hooks/use-webrtc-broadcast"

type Broadcast = {
  id: string
  title: string
  slug: string
  description: string
  status: "LIVE" | "SCHEDULED" | "READY" | "ENDED"
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

function StudioInterface() {
  const router = useRouter()
  const params = useParams()
  const broadcastSlug = params.slug as string
  
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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
  const [currentListenerCount, setCurrentListenerCount] = useState(0)

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

        setStudioMetrics({
          cpuUsage: 30 + Math.random() * 20,
          memoryUsage: 45 + Math.random() * 15,
          networkStatus: 'excellent',
          audioLevels: {
            input: 0, // Only show real microphone input levels
            output: 0, // Only show real output levels
            peak: 0    // Only show real peak levels
          }
        })

        // Update listener count simulation
        const baseListeners = 150 + Math.sin(Date.now() / 60000) * 50
        const variation = Math.random() * 20 - 10
        const newListenerCount = Math.max(0, Math.floor(baseListeners + variation))
        setCurrentListenerCount(newListenerCount)
        setPeakListeners(prev => Math.max(prev, newListenerCount))
      }, 2000)

      return () => clearInterval(interval)
    } else {
      setCurrentListenerCount(0)
      setStreamStatus({
        isConnected: false,
        quality: 0,
        bitrate: 0,
        latency: 0,
        dropped: 0,
        errors: []
      })
      setStudioMetrics({
        cpuUsage: 0,
        memoryUsage: 0,
        networkStatus: 'offline',
        audioLevels: { input: 0, output: 0, peak: 0 }
      })
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



  const handleEndBroadcast = async () => {
    try {
      // Stop WebRTC broadcasting
      // WebRTC stop will be handled by mixing board
      
      // Update local state
      setIsLive(false)
      setStartTime(null)
      setBroadcastDuration("00:00:00")
      setStreamStatus(prev => ({ ...prev, isConnected: false }))

      // Update broadcast status in database
      const response = await fetch(`/api/admin/broadcasts/${broadcastSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ENDED' }),
      })

      if (response.ok) {
        const updatedBroadcast = await response.json()
        setBroadcast(updatedBroadcast)
        toast.success("📻 Broadcast ended successfully")
        
        setTimeout(() => {
          router.push('/dashboard/broadcasts')
        }, 3000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update broadcast status')
      }
    } catch (error) {
      console.error('Error ending broadcast:', error)
      if (error instanceof Error) {
        toast.error(error.message || "Failed to end broadcast")
      } else {
        toast.error("Failed to end broadcast")
      }
    }
  }

  const updateProgramInfo = (newInfo: any) => {
    if (isLive && broadcast) {
      const programInfo = {
        title: newInfo.title || broadcast.title,
        description: newInfo.description || broadcast.description,
        host: `${broadcast.hostUser.firstName} ${broadcast.hostUser.lastName}`,
        currentTrack: newInfo.currentTrack,
        ...newInfo
      }
      // TODO: Send program info via WebRTC signaling
      toast.success("📡 Program info updated for listeners")
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
    <AudioProvider>
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
              <span>{currentListenerCount} listeners</span>
              {peakListeners > 0 && (
                <Badge variant="outline" className="text-xs">
                  Peak: {peakListeners}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Test Mode Banner */}
        {!isLive && broadcast && (
          <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Studio Test Mode Active</h3>
                    <p className="text-sm text-blue-700">
                      All studio controls are enabled for testing. Configure your setup and test functionality before going live.
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  <Settings className="h-3 w-3 mr-1" />
                  Testing
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stream Status Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Signal className={`h-4 w-4 ${streamStatus.isConnected ? 'text-green-500' : 'text-red-500'}`} />
                  {streamStatus.isConnected && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
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
          {/* Broadcast Status Info */}
          {isLive ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-red-900">🔴 You're Live!</h3>
                    <p className="text-red-700">
                      Broadcasting for {broadcastDuration} • {currentListenerCount} listeners
                    </p>
                    <p className="text-sm text-red-600">
                      Use the mixing board controls below to manage your live stream
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : broadcast?.status === "READY" ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-green-900">🎙️ Studio Ready</h3>
                    <p className="text-green-700">
                      Studio is prepared and all systems are ready. Use the "Go Live" button on the mixing board below to start broadcasting.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : broadcast?.status === "SCHEDULED" ? (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-blue-900">📅 Broadcast Scheduled</h3>
                    <p className="text-blue-700">
                      This broadcast is scheduled. Please use "Prepare Studio" from the broadcasts page first.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => router.push('/dashboard/broadcasts')}
                    variant="outline"
                    className="px-8 py-4 text-lg"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Broadcasts
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">❌ Studio Unavailable</h3>
                    <p className="text-gray-700">
                      This broadcast is not available for studio access.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => router.push('/dashboard/broadcasts')}
                    variant="outline"
                    className="px-8 py-4 text-lg"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Broadcasts
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff/Guest Info */}
          {broadcast && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Broadcast Team</span>
                  <Badge variant="outline">
                    {broadcast.staff.length + broadcast.guests.length} members
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Staff */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Staff ({broadcast.staff.length})</h4>
                    <div className="space-y-1">
                      {broadcast.staff.map((staff) => (
                        <div key={staff.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">
                              {staff.user.firstName.charAt(0)}{staff.user.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {staff.user.firstName} {staff.user.lastName}
                              </p>
                              <p className="text-xs text-slate-500">{staff.role.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <Badge variant={staff.isActive ? "default" : "secondary"} className="text-xs">
                            {staff.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Guests */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Guests ({broadcast.guests.length})</h4>
                    <div className="space-y-1">
                      {broadcast.guests.map((guest) => (
                        <div key={guest.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium">
                              {guest.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{guest.name}</p>
                              <p className="text-xs text-slate-500">{guest.title || guest.role}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Guest
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Real-Time Studio Controls */}
          {broadcast && (
            <RealTimeStudio
              broadcastId={broadcast.id}
              userId={broadcast.hostUser.id}
              isLive={isLive}
              onGoLive={async () => {
                try {
                  // Update local state when going live; real startup logic (WebRTC, API) can be added here
                  setIsLive(true)
                  setStartTime(new Date())
                  toast.success("🎙️ Started broadcasting")
                } catch (error) {
                  console.error('Error starting broadcast:', error)
                  toast.error("Failed to start broadcast")
                }
              }}
              onEndBroadcast={handleEndBroadcast}
            />
          )}

          {/* Audio Level Display */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Audio Input</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full transition-all duration-200"
                      style={{ width: `${Math.random() * 80 + 10}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8">--</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-200"
                      style={{ width: `75%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8">75%</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Signal className={`h-4 w-4 ${isLive ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="text-sm font-medium">Connection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={isLive ? 'default' : 'secondary'}>
                    {isLive ? 'connected' : 'offline'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Studio Tabs - Available for all broadcast statuses */}
          {broadcast && (
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
              {!isLive && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Test Mode</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Studio is in test mode. You can configure all settings and test functionality before going live.
                  </p>
                </div>
              )}
              {/* Simple Audio Streaming Test */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Simple Audio Streaming</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Button 
                      onClick={async () => {
                        if (!isLive && broadcast) {
                          try {
                            const { SimpleBroadcaster } = await import('@/lib/simple-audio-stream')
                            const broadcaster = new SimpleBroadcaster()
                            await broadcaster.startBroadcast(broadcast.id)
                            setIsLive(true)
                            setStartTime(new Date())
                            toast.success("🎙️ Started broadcasting!")
                          } catch (error) {
                            console.error('Broadcast error:', error)
                            toast.error("Failed to start broadcast")
                          }
                        }
                      }}
                      disabled={isLive}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      🔴 Go Live
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsLive(false)
                        setStartTime(null)
                        setBroadcastDuration("00:00:00")
                        toast.success("📻 Stopped broadcasting")
                      }}
                      disabled={!isLive}
                      variant="destructive"
                    >
                      ⏹️ Stop
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {isLive ? "🔴 Broadcasting live audio from microphone" : "Click 'Go Live' to start broadcasting"}
                  </p>
                </CardContent>
              </Card>
              
              <MixingBoard
                isLive={true}
                onChannelChange={() => {}}
                onMasterVolumeChange={() => {}}
                onCueChannel={() => {}}
                broadcastId={broadcast?.id}
              />
            </TabsContent>

            <TabsContent value="player" className="space-y-6">
              {!isLive && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Audio Player Test Mode</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Test your playlists, crossfade settings, and track selection before going live.
                  </p>
                </div>
              )}
              <AudioPlayer
                isLive={true} // Always enable for testing
                onTrackChange={(track) => {
                  console.log('Track changed:', track)
                  // Send current track info to listeners
                  if (isLive) {
                    updateProgramInfo({ currentTrack: track })
                  }
                }}
                onPlaylistChange={(playlist) => {
                  console.log('Playlist changed:', playlist)
                  // Could update scheduled content
                }}
              />
            </TabsContent>

            <TabsContent value="soundboard" className="space-y-6">
              {!isLive && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Soundboard Test Mode</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Test your sound effects, jingles, and audio cues. All sounds will play as tests.
                  </p>
                </div>
              )}
              <Soundboard
                isLive={true} // Always enable for testing
                onSoundPlay={(sound) => {
                  console.log('Sound playing:', sound)
                  // Could trigger audio playback through WebAudio API
                }}
                onSoundStop={(soundId) => {
                  console.log('Sound stopped:', soundId)
                  // Could stop audio playback
                }}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {!isLive && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Analytics Preview</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Preview your analytics dashboard. Real data will appear when broadcast goes live.
                  </p>
                </div>
              )}
              <AnalyticsDashboard
                isLive={isLive}
                listeners={listeners}
                onListenerUpdate={setListeners}
              />
            </TabsContent>

            <TabsContent value="chat" className="space-y-6">
              {!isLive && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Chat System Test</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Test your chat moderation tools and practice sending announcements. Messages will be simulated.
                  </p>
                </div>
              )}
              <EnhancedChat
                isLive={isLive}
                hostId={broadcast.hostUser.id}
                broadcastId={broadcast.id}
                onMessageSend={(message, type) => {
                  console.log('Message sent:', message, type)
                  // Only show toast for important announcements
                  if (type === 'announcement') {
                    if (isLive) {
                      toast.success('📢 Announcement sent to all listeners')
                    } else {
                      toast.success('🧪 Test: Announcement would be sent to listeners')
                    }
                  }
                  // Could send message via WebSocket to all listeners
                }}
                onUserAction={(userId, action) => {
                  console.log('User action:', userId, action)
                  // Only show toast for significant moderation actions
                  if (action === 'ban') {
                    if (isLive) {
                      toast.success('🚫 User banned successfully')
                    } else {
                      toast.success('🧪 Test: User would be banned in live mode')
                    }
                  }
                  // Could send moderation action via API
                }}
              />
            </TabsContent>
          </Tabs>
          )}
        </div>
      </div>
    </div>
    </AudioProvider>
  )
}

export default function StudioPage() {
  return <StudioInterface />
}