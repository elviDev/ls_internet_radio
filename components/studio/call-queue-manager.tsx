"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useCallQueue } from "@/hooks/use-calling"
import { toast } from "sonner"
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Check,
  X,
  Clock,
  MapPin,
  User,
  Mic,
  Volume2,
  MoreVertical,
  MessageSquare
} from "lucide-react"

interface CallQueueManagerProps {
  broadcastId: string
  isLive: boolean
}

export function CallQueueManager({ broadcastId, isLive }: CallQueueManagerProps) {
  const [selectedCall, setSelectedCall] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const {
    callQueue,
    activeCalls,
    isConnected,
    acceptCall,
    rejectCall,
    endCall,
    totalInQueue,
    totalActiveCalls
  } = useCallQueue(broadcastId)

  const handleAcceptCall = (callId: string) => {
    acceptCall(callId)
    toast.success("Call accepted! Caller is now live on air.")
  }

  const handleRejectCall = (callId: string, reason?: string) => {
    rejectCall(callId, reason)
    setShowRejectDialog(false)
    setSelectedCall(null)
    setRejectReason("")
    toast.info("Call request rejected")
  }

  const handleEndActiveCall = (callId: string) => {
    endCall(callId)
    toast.info("Call ended")
  }

  const formatCallDuration = (startTime: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000)
    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatWaitTime = (requestTime: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - requestTime.getTime()) / 1000)
    if (diff < 60) return `${diff}s`
    const minutes = Math.floor(diff / 60)
    return `${minutes}m`
  }

  if (!isLive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Phone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Call queue is only available during live broadcasts</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Call Queue Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Queue</p>
                <p className="text-2xl font-bold">{totalInQueue}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Calls</p>
                <p className="text-2xl font-bold">{totalActiveCalls}</p>
              </div>
              <PhoneCall className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connection</p>
                <p className="text-sm font-medium">
                  {isConnected ? "Connected" : "Disconnected"}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Calls */}
      {activeCalls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-green-500" />
              Active Calls ({activeCalls.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-3">
                {activeCalls.map((call) => (
                  <div
                    key={call.callId}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-green-500 text-white">
                          {call.callerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{call.callerName}</p>
                          <Badge variant="default" className="bg-red-500 text-xs">
                            🔴 LIVE
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span>{call.callerLocation}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>{formatCallDuration(call.requestTime)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleEndActiveCall(call.callId)}
                      >
                        <PhoneOff className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Call Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Call Queue ({totalInQueue})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {callQueue.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No callers in queue</p>
              <p className="text-sm text-gray-400">
                Listeners can call in using the call-in widget
              </p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {callQueue.map((call, index) => (
                  <div
                    key={call.callId}
                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-medium text-blue-600">
                          #{index + 1}
                        </span>
                      </div>
                      
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {call.callerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <p className="font-medium">{call.callerName}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span>{call.callerLocation}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>Waiting {formatWaitTime(call.requestTime)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAcceptCall(call.callId)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      
                      <Dialog 
                        open={showRejectDialog && selectedCall === call.callId}
                        onOpenChange={(open) => {
                          setShowRejectDialog(open)
                          if (!open) {
                            setSelectedCall(null)
                            setRejectReason("")
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCall(call.callId)
                              setShowRejectDialog(true)
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Reject Call from {call.callerName}</DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="reason">Reason (Optional)</Label>
                              <Textarea
                                id="reason"
                                placeholder="Let the caller know why their call was rejected..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowRejectDialog(false)
                                  setSelectedCall(null)
                                  setRejectReason("")
                                }}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleRejectCall(call.callId, rejectReason.trim() || undefined)}
                                className="flex-1"
                              >
                                Reject Call
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                // Accept all calls (could be dangerous, maybe add confirmation)
                callQueue.forEach(call => acceptCall(call.callId))
              }}
              disabled={callQueue.length === 0}
            >
              Accept All
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                // Reject all calls with a generic message
                callQueue.forEach(call => 
                  rejectCall(call.callId, "Thank you for calling! We're not taking calls at this time.")
                )
              }}
              disabled={callQueue.length === 0}
              className="text-red-600 hover:text-red-700"
            >
              Reject All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}