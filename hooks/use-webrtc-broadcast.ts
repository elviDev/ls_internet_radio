import { useState, useEffect, useRef } from 'react'
import { WebRTCBroadcaster } from '@/lib/webrtc-client'
import { RealtimeClient } from '@/lib/realtime-client'

export function useWebRTCBroadcast(broadcastId: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [listenerCount, setListenerCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const realtimeClient = useRef<RealtimeClient | null>(null)
  const broadcaster = useRef<WebRTCBroadcaster | null>(null)

  useEffect(() => {
    // Initialize realtime client
    realtimeClient.current = new RealtimeClient()
    
    // Setup event listeners
    realtimeClient.current.onBroadcasterReady(() => {
      setIsConnected(true)
    })

    realtimeClient.current.onListenerCount((data) => {
      setListenerCount(data.count)
    })

    return () => {
      if (realtimeClient.current) {
        realtimeClient.current.disconnect()
      }
    }
  }, [])

  const startBroadcast = async (audioStream: MediaStream) => {
    try {
      if (!realtimeClient.current) {
        throw new Error('Realtime client not initialized')
      }

      // Create WebRTC broadcaster
      broadcaster.current = new WebRTCBroadcaster(
        realtimeClient.current.getSocket(),
        broadcastId
      )

      const success = await broadcaster.current.startBroadcast(audioStream)
      if (success) {
        setIsBroadcasting(true)
        setError(null)
      } else {
        throw new Error('Failed to start broadcast')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsBroadcasting(false)
    }
  }

  const stopBroadcast = () => {
    if (broadcaster.current) {
      broadcaster.current.stopBroadcast()
      broadcaster.current = null
    }
    setIsBroadcasting(false)
  }

  return {
    isConnected,
    isBroadcasting,
    listenerCount,
    error,
    startBroadcast,
    stopBroadcast,
    realtimeClient: realtimeClient.current
  }
}