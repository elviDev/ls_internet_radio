'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Phone, 
  PhoneCall, 
  Users, 
  Radio,
  Settings,
  Activity
} from 'lucide-react'
import { StudioController, HostConfig, GuestConfig } from '@/lib/studio-controller'
import { AudioMetrics } from '@/lib/unified-audio-system'

interface UnifiedStudioInterfaceProps {
  broadcastId: string
  stationName: string
  onGoLive?: () => Promise<void>
  onEndBroadcast?: () => Promise<void>
  isLive?: boolean
  broadcast?: {
    hostUser: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
    staff: Array<{
      id: string
      role: string
      user: {
        id: string
        firstName: string
        lastName: string
        username: string
        email: string
      }
      isActive: boolean
    }>
    guests: Array<{
      id: string
      name: string
      title?: string
      role: string
    }>
  }
}

export function UnifiedStudioInterface({ broadcastId, stationName, broadcast, onGoLive, onEndBroadcast, isLive: propIsLive }: UnifiedStudioInterfaceProps) {
  const [studioController, setStudioController] = useState<StudioController | null>(null)
  const [isLive, setIsLive] = useState(propIsLive || false)
  
  // Sync with prop changes
  useEffect(() => {
    if (propIsLive !== undefined) {
      setIsLive(propIsLive)
    }
  }, [propIsLive])
  const [hosts, setHosts] = useState<HostConfig[]>([])
  const [guests, setGuests] = useState<GuestConfig[]>([])
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set())
  
  // Initialize hosts and guests from broadcast data immediately
  useEffect(() => {
    if (broadcast) {
      // Add main host
      const mainHost: HostConfig = {
        id: broadcast.hostUser.id,
        name: `${broadcast.hostUser.firstName} ${broadcast.hostUser.lastName}`,
        role: 'main',
        volume: 1.0
      }
      
      // Only add staff with HOST or CO_HOST roles as hosts
      const staffHosts: HostConfig[] = broadcast.staff
        .filter(staff => staff.role === 'HOST' || staff.role === 'CO_HOST')
        .map(staff => ({
          id: staff.user.id,
          name: `${staff.user.firstName} ${staff.user.lastName}`,
          role: 'co-host',
          volume: 0.9
        }))
      
      // Add actual guests from broadcast
      const broadcastGuests: GuestConfig[] = broadcast.guests.map(guest => ({
        id: guest.id,
        name: guest.name,
        type: 'guest',
        volume: 0.8
      }))
      
      const allHosts = [mainHost, ...staffHosts]
      
      setHosts(allHosts)
      setGuests(broadcastGuests)
      
      console.log('🎙️ Loaded hosts:', allHosts.length, 'guests:', broadcastGuests.length)
    }
  }, [broadcast])
  
  // Add hosts to StudioController when it becomes available
  useEffect(() => {
    if (studioController && hosts.length > 0) {
      hosts.forEach(async (host) => {
        try {
          await studioController.addHost(host)
        } catch (error) {
          console.error(`Failed to add host ${host.name}:`, error)
        }
      })
    }
  }, [studioController, hosts])
  
  // Add guests to StudioController when it becomes available
  useEffect(() => {
    if (studioController && guests.length > 0) {
      guests.forEach(async (guest) => {
        try {
          await studioController.addGuest(guest)
        } catch (error) {
          console.error(`Failed to add guest ${guest.name}:`, error)
        }
      })
    }
  }, [studioController, guests])
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

  // Initialize studio controller
  useEffect(() => {
    const initializeStudio = async () => {
      try {
        const controller = new StudioController({
          broadcastId,
          stationName,
          maxHosts: 4,
          maxGuests: 6,
          maxCallers: 3
        })

        // Set up event handlers
        controller.onBroadcastStateChange = (state) => {
          const newIsLive = state === 'live'
          setIsLive(newIsLive)
          console.log('🎙️ Studio broadcast state changed:', newIsLive)
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
        
        console.log('🎙️ Studio interface initialized')
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
  }, [broadcastId, stationName])



  // Start broadcast
  const startBroadcast = useCallback(async () => {
    if (onGoLive) {
      await onGoLive()
    } else if (studioController) {
      try {
        await studioController.startBroadcast()
      } catch (error) {
        console.error('Failed to start broadcast:', error)
      }
    }
  }, [studioController, onGoLive])

  // Stop broadcast
  const stopBroadcast = useCallback(async () => {
    if (onEndBroadcast) {
      await onEndBroadcast()
    } else if (studioController) {
      studioController.stopBroadcast()
    }
  }, [studioController, onEndBroadcast])

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
  const toggleMute = useCallback((sourceId: string) => {
    const isMuted = mutedUsers.has(sourceId)
    if (isMuted) {
      setMutedUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(sourceId)
        return newSet
      })
    } else {
      setMutedUsers(prev => new Set(prev).add(sourceId))
    }
    
    if (studioController) {
      studioController.muteSource(sourceId, !isMuted)
    }
  }, [studioController, mutedUsers])

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
          <p>Initializing Studio System...</p>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            {!isLive ? (
              <Button onClick={startBroadcast}>
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

      {/* Hosts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Hosts ({hosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {hosts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-3">
                {broadcast ? 'Loading broadcast team...' : 'No hosts configured for this broadcast.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {hosts.map((host) => (
                <div key={host.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mic className="h-4 w-4" />
                    <div>
                      <p className="font-medium">{host.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{host.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={host.role === 'main' ? 'default' : 'secondary'}>
                      {host.role === 'main' ? 'Main' : 'Co-Host'}
                    </Badge>
                    <Button
                      size="sm"
                      variant={mutedUsers.has(host.id) ? "destructive" : "outline"}
                      onClick={() => toggleMute(host.id)}
                    >
                      {mutedUsers.has(host.id) ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guests Section */}
      <Card>
        <CardHeader>
          <CardTitle>Guests ({guests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {guests.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No guests assigned to this broadcast.
            </p>
          ) : (
            <div className="space-y-3">
              {guests.map((guest) => (
                <div key={guest.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4" />
                    <div>
                      <p className="font-medium">{guest.name}</p>
                      <p className="text-sm text-muted-foreground">Guest</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Guest</Badge>
                    <Button
                      size="sm"
                      variant={mutedUsers.has(guest.id) ? "destructive" : "outline"}
                      onClick={() => toggleMute(guest.id)}
                      title={mutedUsers.has(guest.id) ? "Unmute guest" : "Mute guest"}
                    >
                      {mutedUsers.has(guest.id) ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                      disabled={guests.length >= 6}
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