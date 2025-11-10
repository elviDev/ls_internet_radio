'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { 
  Mic, 
  Volume2, 
  Phone, 
  PhoneCall, 
  Users, 
  Radio,
  Activity
} from 'lucide-react'
import { StudioController, HostConfig, GuestConfig } from '@/lib/studio-controller'
import { AudioMetrics } from '@/lib/unified-audio-system'

interface BroadcastStaff {
  id: string
  name: string
  role: 'host' | 'co-host' | 'sound-engineer' | 'producer'
  userId: string
  isOnline?: boolean
}

interface BroadcastGuest {
  id: string
  name: string
  type: 'guest' | 'caller'
  userId?: string
  isConnected?: boolean
}

interface BroadcastStudioInterfaceProps {
  broadcastId: string
  stationName: string
  staff?: BroadcastStaff[]
  guests?: BroadcastGuest[]
}

export function BroadcastStudioInterface({ 
  broadcastId, 
  stationName, 
  staff = [], 
  guests: initialGuests = [] 
}: BroadcastStudioInterfaceProps) {
  const [studioController, setStudioController] = useState<StudioController | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [connectedHosts, setConnectedHosts] = useState<HostConfig[]>([])
  const [connectedGuests, setConnectedGuests] = useState<GuestConfig[]>([])
  const [mainMicVolume, setMainMicVolume] = useState(100)
  const [guestMicVolume, setGuestMicVolume] = useState(80)
  const [audioMetrics, setAudioMetrics] = useState<AudioMetrics>({
    inputLevel: 0,
    outputLevel: 0,
    peakLevel: 0,
    activeSourceCount: 0,
    listenerCount: 0
  })
  const [callQueue, setCallQueue] = useState<any[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize studio controller and load broadcast data
  useEffect(() => {
    const initializeStudio = async () => {
      try {
        const controller = new StudioController({
          broadcastId,
          stationName,
          maxHosts: staff.length || 4,
          maxGuests: initialGuests.length + 6,
          maxCallers: 3
        })

        controller.onBroadcastStateChange = (state) => {
          setIsLive(state === 'live')
        }

        controller.onAudioMetrics = (metrics) => {
          setAudioMetrics(metrics)
        }

        controller.onCallRequest = (callData) => {
          setCallQueue(prev => [...prev, callData])
        }

        await controller.initialize()
        setStudioController(controller)
        setIsInitialized(true)
        
        console.log('🎙️ Broadcast studio initialized with existing data')
      } catch (error) {
        console.error('Failed to initialize studio:', error)
      }
    }

    initializeStudio()

    return () => {
      if (studioController) {
        studioController.cleanup()
      }
    }
  }, [broadcastId, stationName, staff, initialGuests])

  // Connect staff member to audio
  const connectStaffMember = useCallback(async (staffId: string) => {
    if (!studioController) return
    
    const staffMember = staff.find(s => s.id === staffId)
    if (!staffMember) return

    try {
      const hostConfig: HostConfig = {
        id: staffMember.id,
        name: staffMember.name,
        role: staffMember.role === 'host' ? 'main' : 'co-host',
        volume: staffMember.role === 'host' ? 1.0 : 0.9
      }

      await studioController.addHost(hostConfig)
      setConnectedHosts(prev => [...prev, hostConfig])
    } catch (error) {
      console.error(`Failed to connect ${staffMember.name}:`, error)
      if (error instanceof Error) {
        alert(error.message)
      }
    }
  }, [studioController, staff])

  // Start broadcast
  const startBroadcast = useCallback(async () => {
    if (!studioController) return

    try {
      await studioController.startBroadcast()
    } catch (error) {
      console.error('Failed to start broadcast:', error)
    }
  }, [studioController])

  // Stop broadcast
  const stopBroadcast = useCallback(() => {
    if (!studioController) return
    studioController.stopBroadcast()
  }, [studioController])

  // Handle main mic volume change
  const handleMainMicVolumeChange = useCallback((value: number[]) => {
    const volume = value[0] / 100
    setMainMicVolume(value[0])
    if (studioController) {
      studioController.setMainMicVolume(volume)
    }
  }, [studioController])

  // Handle guest mic volume change
  const handleGuestMicVolumeChange = useCallback((value: number[]) => {
    const volume = value[0] / 100
    setGuestMicVolume(value[0])
    if (studioController) {
      studioController.setGuestMicVolume(volume)
    }
  }, [studioController])

  // Mute/unmute source
  const toggleMute = useCallback((sourceId: string, currentlyMuted: boolean) => {
    if (!studioController) return
    studioController.muteSource(sourceId, !currentlyMuted)
  }, [studioController])

  // Accept call
  const acceptCall = useCallback(async (callData: any) => {
    if (!studioController) return

    try {
      await studioController.acceptCall(callData)
      setCallQueue(prev => prev.filter(call => call.callId !== callData.callId))
    } catch (error) {
      console.error('Failed to accept call:', error)
    }
  }, [studioController])

  // Reject call
  const rejectCall = useCallback((callData: any) => {
    setCallQueue(prev => prev.filter(call => call.callId !== callData.callId))
  }, [])

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading Broadcast Studio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Radio className="h-6 w-6" />
              <div>
                <CardTitle>{stationName}</CardTitle>
                <p className="text-sm text-muted-foreground">Broadcast ID: {broadcastId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={isLive ? "destructive" : "secondary"}>
                {isLive ? "LIVE" : "OFF AIR"}
              </Badge>
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {audioMetrics.listenerCount}
              </Badge>
              <Badge variant="outline">
                {staff.length} Staff • {initialGuests.length} Guests
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            {!isLive ? (
              <Button onClick={startBroadcast} disabled={connectedHosts.length === 0}>
                <Radio className="h-4 w-4 mr-2" />
                Go Live
              </Button>
            ) : (
              <Button onClick={stopBroadcast} variant="destructive">
                <Radio className="h-4 w-4 mr-2" />
                End Broadcast
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audio Levels */}
      <Card>
        <CardHeader>
          <CardTitle>Audio Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Input Level</span>
                <span>{Math.round(audioMetrics.inputLevel)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${audioMetrics.inputLevel}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Output Level</span>
                <span>{Math.round(audioMetrics.outputLevel)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${audioMetrics.outputLevel}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Master Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Master Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Main Mic Volume</label>
              <div className="flex items-center space-x-3">
                <Volume2 className="h-4 w-4" />
                <Slider
                  value={[mainMicVolume]}
                  onValueChange={handleMainMicVolumeChange}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm w-12">{mainMicVolume}%</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Guest Mic Volume</label>
              <div className="flex items-center space-x-3">
                <Volume2 className="h-4 w-4" />
                <Slider
                  value={[guestMicVolume]}
                  onValueChange={handleGuestMicVolumeChange}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm w-12">{guestMicVolume}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Section */}
      <Card>
        <CardHeader>
          <CardTitle>Broadcast Staff ({connectedHosts.length} connected / {staff.length} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {staff.map((staffMember) => {
              const isConnected = connectedHosts.some(h => h.id === staffMember.id)
              return (
                <div key={staffMember.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className="font-medium">{staffMember.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{staffMember.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={staffMember.role === 'host' ? 'default' : 'secondary'}>
                      {staffMember.role}
                    </Badge>
                    {!isConnected ? (
                      <Button
                        size="sm"
                        onClick={() => connectStaffMember(staffMember.id)}
                        disabled={!staffMember.isOnline}
                      >
                        <Mic className="h-4 w-4 mr-1" />
                        Connect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleMute(staffMember.id, false)}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Guests Section */}
      <Card>
        <CardHeader>
          <CardTitle>Broadcast Guests ({connectedGuests.length} connected / {initialGuests.length} scheduled)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {initialGuests.map((broadcastGuest) => {
              const isConnected = connectedGuests.some(g => g.id === broadcastGuest.id)
              return (
                <div key={broadcastGuest.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {broadcastGuest.type === 'caller' ? <Phone className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                    <div>
                      <p className="font-medium">{broadcastGuest.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{broadcastGuest.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={isConnected ? 'default' : 'outline'}>
                      {isConnected ? 'Connected' : 'Scheduled'}
                    </Badge>
                    {isConnected && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleMute(broadcastGuest.id, false)}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Call Queue */}
      {callQueue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Incoming Calls ({callQueue.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {callQueue.map((call) => (
                <div key={call.callId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <PhoneCall className="h-4 w-4" />
                    <div>
                      <p className="font-medium">{call.callerName}</p>
                      <p className="text-sm text-muted-foreground">{call.callerLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => acceptCall(call)}
                      disabled={connectedGuests.length >= 6}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectCall(call)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}