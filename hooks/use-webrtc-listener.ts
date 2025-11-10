import { useState, useEffect, useRef } from 'react'
import { WebRTCListener } from '@/lib/webrtc-client'
import { RealtimeClient } from '@/lib/realtime-client'

export function useWebRTCListener(broadcastId: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  const realtimeClient = useRef<RealtimeClient | null>(null)
  const listener = useRef<WebRTCListener | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Initialize realtime client
    realtimeClient.current = new RealtimeClient()
    
    // Setup event listeners
    realtimeClient.current.onBroadcastEnded(() => {
      setIsListening(false)
      setAudioStream(null)
    })

    return () => {
      if (realtimeClient.current) {
        realtimeClient.current.disconnect()
      }
    }
  }, [])

  const startListening = () => {
    try {
      if (!realtimeClient.current) {
        throw new Error('Realtime client not initialized')
      }

      // Create WebRTC listener
      listener.current = new WebRTCListener(
        realtimeClient.current.getSocket(),
        broadcastId,
        (stream) => {
          setAudioStream(stream)
          setIsListening(true)
          
          // Auto-play audio
          if (audioRef.current) {
            audioRef.current.srcObject = stream
            audioRef.current.play().catch(console.error)
          }
        }
      )

      listener.current.startListening()
      setIsConnected(true)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const stopListening = () => {
    if (listener.current) {
      listener.current.stopListening()
      listener.current = null
    }
    setIsListening(false)
    setAudioStream(null)
  }

  return {
    isConnected,
    isListening,
    audioStream,
    error,
    startListening,
    stopListening,
    audioRef,
    realtimeClient: realtimeClient.current
  }
}