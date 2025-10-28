"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  TrendingUp,
  TrendingDown,
  Globe,
  MessageSquare,
  Heart,
  Clock,
  Radio,
  Activity,
  BarChart3,
  Eye,
  MapPin,
  Smartphone,
  Monitor,
  Headphones,
  Zap,
  Signal,
  Wifi,
  Volume2
} from "lucide-react"

interface ListenerData {
  id: string
  name: string
  location: {
    city: string
    country: string
    countryCode: string
  }
  joinedAt: Date
  device: 'desktop' | 'mobile' | 'tablet'
  browser: string
  listenDuration: number
  quality: 'high' | 'medium' | 'low'
  interactions: number
  isActive: boolean
}

interface AnalyticsData {
  currentListeners: number
  peakListeners: number
  totalListeners: number
  averageListenTime: number
  chatMessages: number
  likes: number
  shares: number
  streamQuality: number
  bandwidth: number
  locations: { [country: string]: number }
  devices: { [device: string]: number }
  qualityDistribution: { [quality: string]: number }
  hourlyStats: Array<{
    hour: number
    listeners: number
    engagement: number
  }>
}

interface AnalyticsDashboardProps {
  isLive: boolean
  listeners: ListenerData[]
  onListenerUpdate?: (listeners: ListenerData[]) => void
}

export function AnalyticsDashboard({ isLive, listeners, onListenerUpdate }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    currentListeners: 0,
    peakListeners: 0,
    totalListeners: 0,
    averageListenTime: 0,
    chatMessages: 0,
    likes: 0,
    shares: 0,
    streamQuality: 98.5,
    bandwidth: 256,
    locations: {},
    devices: {},
    qualityDistribution: {},
    hourlyStats: []
  })

  const [realtimeListeners, setRealtimeListeners] = useState<ListenerData[]>(listeners)

  // Simulate real-time analytics
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      // Update analytics
      setAnalytics(prev => {
        const currentTime = new Date().getHours()
        const baseListeners = 150 + Math.sin(currentTime * Math.PI / 12) * 100
        const variation = Math.random() * 50 - 25
        const currentListeners = Math.max(0, Math.floor(baseListeners + variation))

        // Generate locations data
        const locations = {
          'United States': Math.floor(currentListeners * 0.35),
          'United Kingdom': Math.floor(currentListeners * 0.15),
          'Canada': Math.floor(currentListeners * 0.12),
          'Australia': Math.floor(currentListeners * 0.08),
          'Germany': Math.floor(currentListeners * 0.07),
          'France': Math.floor(currentListeners * 0.06),
          'Japan': Math.floor(currentListeners * 0.05),
          'Others': Math.floor(currentListeners * 0.12)
        }

        const devices = {
          'mobile': Math.floor(currentListeners * 0.6),
          'desktop': Math.floor(currentListeners * 0.3),
          'tablet': Math.floor(currentListeners * 0.1)
        }

        const qualityDistribution = {
          'high': Math.floor(currentListeners * 0.7),
          'medium': Math.floor(currentListeners * 0.25),
          'low': Math.floor(currentListeners * 0.05)
        }

        return {
          ...prev,
          currentListeners,
          peakListeners: Math.max(prev.peakListeners, currentListeners),
          totalListeners: prev.totalListeners + Math.floor(Math.random() * 5),
          averageListenTime: 23 + Math.random() * 10,
          chatMessages: prev.chatMessages + Math.floor(Math.random() * 3),
          likes: prev.likes + Math.floor(Math.random() * 2),
          shares: prev.shares + (Math.random() > 0.9 ? 1 : 0),
          streamQuality: 95 + Math.random() * 5,
          bandwidth: 240 + Math.random() * 32,
          locations,
          devices,
          qualityDistribution,
          hourlyStats: [
            ...prev.hourlyStats.slice(-23),
            {
              hour: currentTime,
              listeners: currentListeners,
              engagement: Math.floor(50 + Math.random() * 40)
            }
          ]
        }
      })

      // Update listener list
      setRealtimeListeners(prev => {
        const updated = prev.map(listener => ({
          ...listener,
          listenDuration: listener.listenDuration + 10,
          interactions: listener.interactions + (Math.random() > 0.8 ? 1 : 0),
          isActive: Math.random() > 0.05
        })).filter(l => l.isActive)

        // Add new listeners occasionally
        if (Math.random() > 0.7 && updated.length < analytics.currentListeners) {
          const cities = ['New York', 'London', 'Toronto', 'Sydney', 'Berlin', 'Paris', 'Tokyo', 'Los Angeles']
          const countries = ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP', 'US']
          const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge']
          const devices = ['desktop', 'mobile', 'tablet'] as const
          const qualities = ['high', 'medium', 'low'] as const

          const randomIndex = Math.floor(Math.random() * cities.length)
          const newListener: ListenerData = {
            id: Date.now().toString(),
            name: `User${Math.floor(Math.random() * 1000)}`,
            location: {
              city: cities[randomIndex],
              country: cities[randomIndex],
              countryCode: countries[randomIndex]
            },
            joinedAt: new Date(),
            device: devices[Math.floor(Math.random() * devices.length)],
            browser: browsers[Math.floor(Math.random() * browsers.length)],
            listenDuration: 0,
            quality: qualities[Math.floor(Math.random() * qualities.length)],
            interactions: 0,
            isActive: true
          }
          updated.push(newListener)
        }

        return updated.slice(0, analytics.currentListeners)
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [isLive, analytics.currentListeners])

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return Smartphone
      case 'desktop': return Monitor
      case 'tablet': return Monitor
      default: return Monitor
    }
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const hours = Math.floor(mins / 60)
    if (hours > 0) {
      return `${hours}h ${mins % 60}m`
    }
    return `${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Real-time Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{analytics.currentListeners}</div>
                <div className="text-xs text-gray-500">Live Listeners</div>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">Peak: {analytics.peakListeners}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{Math.round(analytics.averageListenTime)}</div>
                <div className="text-xs text-gray-500">Avg. Listen Time (min)</div>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+12% vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{analytics.chatMessages}</div>
                <div className="text-xs text-gray-500">Chat Messages</div>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <Heart className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-red-500">{analytics.likes} likes</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Signal className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{analytics.streamQuality.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">Stream Quality</div>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <Wifi className="h-3 w-3 text-blue-500 mr-1" />
              <span className="text-blue-500">{Math.round(analytics.bandwidth)} kbps</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="listeners" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="listeners">Live Listeners</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="quality">Stream Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="listeners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Listeners</span>
                <Badge variant="outline">{realtimeListeners.length} online</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {realtimeListeners.map((listener) => {
                    const DeviceIcon = getDeviceIcon(listener.device)
                    return (
                      <div key={listener.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <DeviceIcon className="h-5 w-5 text-gray-600" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{listener.name}</div>
                            <div className="text-xs text-gray-500">
                              {listener.location.city}, {listener.location.countryCode}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatDuration(listener.listenDuration)}
                          </div>
                          <div className={`text-xs ${getQualityColor(listener.quality)}`}>
                            {listener.quality} quality
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Geographic Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.locations).map(([country, count]) => (
                  <div key={country} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{count} listeners</span>
                        <span className="text-xs text-gray-500">
                          ({((count / analytics.currentListeners) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={(count / analytics.currentListeners) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Device & Platform Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Device Types</h4>
                  {Object.entries(analytics.devices).map(([device, count]) => {
                    const DeviceIcon = getDeviceIcon(device)
                    return (
                      <div key={device} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DeviceIcon className="h-4 w-4 text-gray-500" />
                            <span className="font-medium capitalize">{device}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{count}</span>
                            <span className="text-xs text-gray-500">
                              ({((count / analytics.currentListeners) * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <Progress 
                          value={(count / analytics.currentListeners) * 100} 
                          className="h-2"
                        />
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Top Browsers</h4>
                  {['Chrome', 'Safari', 'Firefox', 'Edge'].map((browser, index) => {
                    const count = Math.floor(analytics.currentListeners * [0.45, 0.25, 0.15, 0.15][index])
                    return (
                      <div key={browser} className="flex items-center justify-between">
                        <span className="font-medium">{browser}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{count}</span>
                          <span className="text-xs text-gray-500">
                            ({((count / analytics.currentListeners) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Stream Quality Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Stream Stability</span>
                      <span className="text-sm font-mono">{analytics.streamQuality.toFixed(1)}%</span>
                    </div>
                    <Progress value={analytics.streamQuality} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Bandwidth Usage</span>
                      <span className="text-sm font-mono">{Math.round(analytics.bandwidth)} kbps</span>
                    </div>
                    <Progress value={(analytics.bandwidth / 320) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Buffer Health</span>
                      <span className="text-sm font-mono">98.2%</span>
                    </div>
                    <Progress value={98.2} className="h-2" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Quality Distribution</h4>
                  {Object.entries(analytics.qualityDistribution).map(([quality, count]) => (
                    <div key={quality} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Volume2 className={`h-4 w-4 ${getQualityColor(quality)}`} />
                          <span className="font-medium capitalize">{quality} Quality</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{count}</span>
                          <span className="text-xs text-gray-500">
                            ({((count / analytics.currentListeners) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={(count / analytics.currentListeners) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}