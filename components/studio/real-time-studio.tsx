"use client"

import { useEffect, useState } from 'react'
import { useWebSocket } from '@/hooks/use-websocket'
import { useAudioStream } from '@/hooks/use-audio-stream'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Radio, Mic, Users, Signal, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface RealTimeStudioProps {
  broadcastId: string
  userId: string
  isLive: boolean
  onGoLive: () => Promise<void>
  onEndBroadcast: () => Promise<void>
}

export function RealTimeStudio({ 
  broadcastId, 
  userId, 
  isLive, 
  onGoLive, 
  onEndBroadcast 
}: RealTimeStudioProps) {
  const [streamStatus, setStreamStatus] = useState({
    isConnected: false,
    quality: 0,
    bitrate: 0,
    latency: 0
  })

  const { 
    isConnected: wsConnected, 
    listenerCount, 
    sendChatMessage, 
    sendStreamStatus 
  } = useWebSocket({
    broadcastId,
    userId,
    onListenerUpdate: (data) => {
      console.log('Listener update:', data)
    },
    onChatMessage: (data) => {
      console.log('New chat message:', data)
    }
  })

  const {
    isInitialized: audioInitialized,
    isRecording,
    audioLevels,
    error: audioError,
    initializeAudio,
    startRecording,
    stopRecording
  } = useAudioStream()

  // Initialize audio when component mounts
  useEffect(() => {
    initializeAudio()
  }, [])

  // Update stream status when live
  useEffect(() => {
    if (isLive && isRecording) {
      const interval = setInterval(() => {
        const status = {
          isConnected: true,
          quality: 95 + Math.random() * 5,
          bitrate: 320 + Math.random() * 32 - 16,
          latency: 150 + Math.random() * 100
        }
        setStreamStatus(status)
        sendStreamStatus(status)
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [isLive, isRecording, sendStreamStatus])

  const handleGoLive = async () => {
    try {
      if (!audioInitialized) {
        await initializeAudio()
      }

      // Start audio recording
      await startRecording()

      // Start stream via API
      const response = await fetch('/api/stream/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          broadcastId,
          streamConfig: {
            quality: 'HD',
            bitrate: 320,
            sampleRate: 44100
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Stream started:', data)
        await onGoLive()
        toast.success('🎙️ Stream started successfully!')
      } else {
        throw new Error('Failed to start stream')
      }
    } catch (error) {
      console.error('Error starting stream:', error)
      toast.error('Failed to start stream')
    }
  }

  const handleEndBroadcast = async () => {
    try {
      // Stop audio recording
      stopRecording()

      // Stop stream via API
      const response = await fetch('/api/stream/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broadcastId })
      })

      if (response.ok) {
        await onEndBroadcast()
        toast.success('📻 Broadcast ended successfully')
      } else {
        throw new Error('Failed to stop stream')
      }
    } catch (error) {
      console.error('Error stopping stream:', error)
      toast.error('Failed to stop stream')
    }
  }

  const sendTestMessage = () => {
    sendChatMessage('Test message from studio', 'host')
    toast.success('Test message sent!')
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Signal className="h-5 w-5" />
            Real-Time Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${audioInitialized ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Audio: {audioInitialized ? 'Ready' : 'Not Ready'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">{listenerCount} Listeners</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              <span className="text-sm">Stream: {streamStatus.isConnected ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Levels */}
      {audioInitialized && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Audio Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Input Level</span>
                  <span>{Math.round(audioLevels.input)}%</span>
                </div>
                <Progress value={audioLevels.input} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Output Level</span>
                  <span>{Math.round(audioLevels.output)}%</span>
                </div>
                <Progress value={audioLevels.output} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Peak Level</span>
                  <span>{Math.round(audioLevels.peak)}%</span>
                </div>
                <Progress 
                  value={audioLevels.peak} 
                  className={`h-2 ${audioLevels.peak > 90 ? 'bg-red-200' : ''}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stream Quality */}
      {isLive && (
        <Card>
          <CardHeader>
            <CardTitle>Stream Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{streamStatus.quality.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Quality</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.round(streamStatus.bitrate)}</div>
                <div className="text-sm text-muted-foreground">kbps</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.round(streamStatus.latency)}</div>
                <div className="text-sm text-muted-foreground">ms latency</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Broadcast Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {!isLive ? (
              <Button 
                onClick={handleGoLive}
                disabled={!audioInitialized || !wsConnected}
                className="bg-green-600 hover:bg-green-700"
              >
                <Radio className="h-4 w-4 mr-2" />
                Go Live
              </Button>
            ) : (
              <Button 
                onClick={handleEndBroadcast}
                variant="destructive"
              >
                <Radio className="h-4 w-4 mr-2" />
                End Broadcast
              </Button>
            )}
            
            <Button 
              onClick={sendTestMessage}
              variant="outline"
              disabled={!wsConnected}
            >
              Send Test Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {audioError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Audio Error: {audioError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}