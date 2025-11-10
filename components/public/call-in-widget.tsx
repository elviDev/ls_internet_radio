"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCalling } from "@/hooks/use-calling"
import { toast } from "sonner"
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  AlertCircle,
  Clock,
  Users,
  Radio,
  User
} from "lucide-react"

interface CallInWidgetProps {
  broadcastId: string
  isLive?: boolean
  stationName?: string
  currentShow?: string
  hostName?: string
}

export function CallInWidget({
  broadcastId,
  isLive = true,
  stationName = "LS Radio",
  currentShow = "Live Show",
  hostName = "Radio Host"
}: CallInWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [callerName, setCallerName] = useState("")
  const [callerLocation, setCallerLocation] = useState("")
  const [topic, setTopic] = useState("")
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [hasCheckedMicrophone, setHasCheckedMicrophone] = useState(false)
  const [microphoneAvailable, setMicrophoneAvailable] = useState(false)

  const {
    isConnected,
    callStatus,
    queuePosition,
    isCallActive,
    localStream,
    error,
    requestCall,
    endCall,
    getMicrophoneAccess,
    checkMicrophoneAvailability,
    canCall,
    isInQueue,
    isLiveOnAir
  } = useCalling({
    broadcastId,
    callerInfo: {
      name: callerName,
      location: callerLocation
    }
  })

  // Check microphone availability on mount
  useEffect(() => {
    const checkMic = async () => {
      try {
        const available = await checkMicrophoneAvailability()
        setMicrophoneAvailable(available)
        setHasCheckedMicrophone(true)
      } catch (error) {
        console.error('Error checking microphone:', error)
        setMicrophoneAvailable(false)
        setHasCheckedMicrophone(true)
      }
    }

    checkMic()
  }, [checkMicrophoneAvailability])

  // Handle microphone muting
  useEffect(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !isMicMuted
      })
    }
  }, [isMicMuted, localStream])

  const handleCallRequest = async () => {
    if (!callerName.trim()) {
      toast.error("Please enter your name")
      return
    }

    const success = await requestCall({
      name: callerName.trim(),
      location: callerLocation.trim() || "Unknown"
    })

    if (success) {
      toast.success("Call request sent! Please wait...")
    }
  }

  const handleEndCall = () => {
    endCall()
    setIsOpen(false)
    toast.info("Call ended")
  }

  const getStatusBadge = () => {
    switch (callStatus) {
      case 'requesting':
        return <Badge variant="secondary" className="animate-pulse">Sending Request...</Badge>
      case 'pending':
        return <Badge variant="outline">Position #{queuePosition}</Badge>
      case 'active':
        return <Badge variant="default" className="bg-red-500">🔴 LIVE ON AIR</Badge>
      case 'ended':
        return <Badge variant="secondary">Call Ended</Badge>
      default:
        return null
    }
  }

  if (!isLive) {
    return (
      <div className="p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
          <Radio className="h-5 w-5" />
          <span>Station is currently offline</span>
        </div>
        <p className="text-sm text-gray-400">Call-ins are only available during live broadcasts</p>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full bg-red-600 hover:bg-red-700 text-white"
          size="lg"
          disabled={!isConnected}
        >
          <PhoneCall className="w-5 h-5 mr-2" />
          Call Into {stationName}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-red-500" />
            Call Into Live Show
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Show Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{currentShow}</h3>
                  <p className="text-sm text-gray-600">with {hostName}</p>
                </div>
                <Badge variant="default" className="bg-red-500">
                  🔴 LIVE
                </Badge>
              </div>
              
              {isConnected ? (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Connected to station
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Connecting to station...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Microphone Check */}
          {hasCheckedMicrophone && !microphoneAvailable && (
            <Alert>
              <Mic className="h-4 w-4" />
              <AlertDescription>
                Microphone access is required to call in. Please allow microphone permissions.
              </AlertDescription>
            </Alert>
          )}

          {/* Call Status */}
          {(isInQueue || isLiveOnAir) && (
            <Card className="border-2 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {getStatusBadge()}
                    {isInQueue && (
                      <p className="text-sm text-gray-600 mt-1">
                        You're in the queue. Please wait for the host to accept your call.
                      </p>
                    )}
                    {isLiveOnAir && (
                      <p className="text-sm text-red-600 mt-1 font-semibold">
                        You are now live on air! Speak clearly.
                      </p>
                    )}
                  </div>
                  
                  {isLiveOnAir && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMicMuted(!isMicMuted)}
                        className={isMicMuted ? "text-red-600" : ""}
                      >
                        {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleEndCall}
                      >
                        <PhoneOff className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Call Form */}
          {canCall && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="callerName">Your Name *</Label>
                <Input
                  id="callerName"
                  placeholder="Enter your name"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="callerLocation">Location (Optional)</Label>
                <Input
                  id="callerLocation"
                  placeholder="City, State/Country"
                  value={callerLocation}
                  onChange={(e) => setCallerLocation(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">What would you like to talk about? (Optional)</Label>
                <Input
                  id="topic"
                  placeholder="Your topic or question"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  maxLength={200}
                />
              </div>

              {/* Microphone Test */}
              {microphoneAvailable && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Microphone Test</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await getMicrophoneAccess()
                          toast.success("Microphone is working!")
                        } catch (error) {
                          toast.error("Failed to access microphone")
                        }
                      }}
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Test Mic
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Test your microphone before calling in to ensure good audio quality.
                  </p>
                </div>
              )}

              <Button
                onClick={handleCallRequest}
                disabled={!callerName.trim() || !isConnected || !microphoneAvailable}
                className="w-full bg-red-600 hover:bg-red-700"
                size="lg"
              >
                <Phone className="w-5 h-5 mr-2" />
                Request to Call In
              </Button>

              <p className="text-xs text-gray-500 text-center">
                By calling in, you agree that your voice may be broadcast live on air.
                The host will review your request before connecting you.
              </p>
            </div>
          )}

          {/* Queue Status */}
          {isInQueue && (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Waiting for host...</span>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  endCall()
                  setIsOpen(false)
                }}
                className="w-full"
              >
                Cancel Call Request
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Compact version for embedding in other components
export function CallInButton({ 
  broadcastId, 
  className = "",
  variant = "default" as any,
  size = "default" as any
}: { 
  broadcastId: string
  className?: string 
  variant?: any
  size?: any
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <PhoneCall className="w-4 h-4 mr-2" />
          Call In
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <CallInWidget broadcastId={broadcastId} />
      </DialogContent>
    </Dialog>
  )
}