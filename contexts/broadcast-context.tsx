"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { UnifiedAudioSystem, UnifiedAudioListener } from '@/lib/unified-audio-system'
import { RealtimeClient } from '@/lib/realtime-client'

interface StreamQualityMetrics {
  bitrate: number
  latency: number
  packetLoss: number
  jitter: number
}

interface ReceiverQualityMetrics {
  bufferHealth: number
  audioDropouts: number
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor'
}

interface BroadcastContextType {
  // Broadcaster (Studio) State
  isStreaming: boolean
  isBroadcaster: boolean
  audioLevel: number
  streamQuality: StreamQualityMetrics | null
  startBroadcast: (broadcastId: string) => Promise<void>
  stopBroadcast: () => Promise<void>
  
  // Listener (Public) State  
  isListening: boolean
  isConnected: boolean
  receiverQuality: ReceiverQualityMetrics | null
  joinBroadcast: (broadcastId: string) => Promise<void>
  leaveBroadcast: () => void
  
  // Shared Audio Controls
  volume: number
  isMuted: boolean
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
  
  // Connection State
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'failed'
  error: string | null
}

const BroadcastContext = createContext<BroadcastContextType | null>(null)

export function useBroadcast() {
  const context = useContext(BroadcastContext)
  if (!context) {
    throw new Error('useBroadcast must be used within a BroadcastProvider')
  }
  return context
}

interface BroadcastProviderProps {
  children: React.ReactNode
  userId?: string
  isBroadcaster?: boolean
}

export function BroadcastProvider({ children, userId, isBroadcaster = false }: BroadcastProviderProps) {
  // Broadcaster state
  const [isStreaming, setIsStreaming] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [streamQuality, setStreamQuality] = useState<StreamQualityMetrics | null>(null)
  const [audioSystem, setAudioSystem] = useState<UnifiedAudioSystem | null>(null)
  
  // Listener state
  const [isListening, setIsListening] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [receiverQuality, setReceiverQuality] = useState<ReceiverQualityMetrics | null>(null)
  const [audioListener, setAudioListener] = useState<UnifiedAudioListener | null>(null)
  
  // Realtime client
  const [realtimeClient, setRealtimeClient] = useState<RealtimeClient | null>(null)
  
  // Shared state
  const [volume, setVolumeState] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [currentBroadcastId, setCurrentBroadcastId] = useState<string | null>(null)

  // Initialize realtime client (singleton pattern)
  useEffect(() => {
    if (!realtimeClient) {
      console.log('🔗 Initializing RealtimeClient')
      const client = new RealtimeClient('http://localhost:3001')
      setRealtimeClient(client)
      
      return () => {
        console.log('🔗 Cleaning up RealtimeClient')
        client.disconnect()
      }
    }
  }, [realtimeClient])

  // Audio level monitoring
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (audioSystem || audioListener) {
      interval = setInterval(() => {
        if (audioSystem) {
          const metrics = audioSystem.getMetrics()
          setAudioLevel(metrics.inputLevel)
        }
      }, 100)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [audioSystem, audioListener])

  // WebRTC signaling integration
  useEffect(() => {
    if (currentBroadcastId && realtimeClient) {
      // Set up WebRTC signaling event handlers
      realtimeClient.onBroadcasterReady((data) => {
        console.log('Broadcaster ready:', data)
        setConnectionState('connected')
        setIsStreaming(true)
      })

      realtimeClient.onBroadcastInfo((info) => {
        console.log('Broadcast info:', info)
        setIsConnected(info.isLive)
        if (info.isLive) {
          setIsStreaming(true)
        }
      })

      realtimeClient.onListenerCount((data) => {
        console.log('Listener count:', data.count)
      })

      realtimeClient.onBroadcastEnded((data) => {
        console.log('Broadcast ended:', data.reason)
        setIsStreaming(false)
        setIsListening(false)
        setConnectionState('disconnected')
      })
      
      // Listen for server stats to get broadcast status
      realtimeClient.onServerStats((stats) => {
        console.log('Server stats received:', stats)
        if (stats.activeBroadcasts > 0) {
          setIsStreaming(true)
          setConnectionState('connected')
        }
      })
    }
  }, [currentBroadcastId, realtimeClient])

  // Broadcaster functions
  const startBroadcast = useCallback(async (broadcastId: string) => {
    if (!isBroadcaster || !realtimeClient) {
      throw new Error('Only broadcasters can start streaming')
    }

    try {
      setConnectionState('connecting')
      setError(null)
      
      // Initialize unified audio system
      const system = new UnifiedAudioSystem({
        broadcastId,
        sampleRate: 48000,
        channels: 2,
        bitrate: 128000,
        maxSources: 8
      })

      // Set up callbacks
      system.onMetricsUpdate = (metrics) => {
        setAudioLevel(metrics.inputLevel)
      }

      await system.initialize()
      setAudioSystem(system)
      
      // Join as broadcaster via realtime client
      realtimeClient.joinAsBroadcaster(broadcastId, {
        username: 'Radio Host',
        stationName: 'LS Radio'
      })
      
      // Start the broadcast
      await system.startBroadcast()
      setIsStreaming(true)
      setCurrentBroadcastId(broadcastId)
      setConnectionState('connected')
      
      // Update stream quality metrics
      setStreamQuality({
        bitrate: 128,
        latency: 150,
        packetLoss: 0,
        jitter: 5
      })

      console.log('Broadcast started successfully')
    } catch (error) {
      console.error('Failed to start broadcast:', error)
      setError(error instanceof Error ? error.message : 'Failed to start broadcast')
      setConnectionState('failed')
      throw error
    }
  }, [isBroadcaster, realtimeClient])

  const stopBroadcast = useCallback(async () => {
    if (!isStreaming || !audioSystem) return

    try {
      audioSystem.stopBroadcast()
      setAudioSystem(null)
      setIsStreaming(false)
      setConnectionState('disconnected')
      setAudioLevel(0)
      setCurrentBroadcastId(null)
      setStreamQuality(null)
      
      console.log('Broadcast stopped successfully')
    } catch (error) {
      console.error('Failed to stop broadcast:', error)
      setError(error instanceof Error ? error.message : 'Failed to stop broadcast')
    }
  }, [isStreaming, audioSystem])

  // Listener functions
  const joinBroadcast = useCallback(async (broadcastId: string) => {
    if (isBroadcaster || !realtimeClient) {
      throw new Error('Broadcasters cannot join as listeners')
    }

    try {
      setConnectionState('connecting')
      setError(null)

      // Initialize audio listener
      const listener = new UnifiedAudioListener(broadcastId)
      await listener.startListening()
      listener.setVolume(volume)
      
      setAudioListener(listener)
      setIsListening(true)
      setIsConnected(true)
      setCurrentBroadcastId(broadcastId)
      setConnectionState('connected')
      
      // Join broadcast via realtime client
      realtimeClient.joinBroadcast(broadcastId)

      console.log('Joined broadcast successfully')
    } catch (error) {
      console.error('Failed to join broadcast:', error)
      setError(error instanceof Error ? error.message : 'Failed to join broadcast')
      setConnectionState('failed')
      throw error
    }
  }, [isBroadcaster, realtimeClient, volume])

  const leaveBroadcast = useCallback(() => {
    if (!isListening || !audioListener) return

    try {
      audioListener.stopListening()
      setAudioListener(null)
      setIsListening(false)
      setIsConnected(false)
      setConnectionState('disconnected')
      setAudioLevel(0)
      setCurrentBroadcastId(null)

      console.log('Left broadcast successfully')
    } catch (error) {
      console.error('Failed to leave broadcast:', error)
      setError(error instanceof Error ? error.message : 'Failed to leave broadcast')
    }
  }, [isListening, audioListener])

  // Audio control functions
  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume)
    
    if (audioListener) {
      audioListener.setVolume(newVolume)
    }
  }, [audioListener])

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted)
    
    if (audioListener) {
      audioListener.setMuted(muted)
    }
  }, [audioListener])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioSystem) {
        audioSystem.cleanup()
      }
      if (audioListener) {
        audioListener.stopListening()
      }
      if (realtimeClient) {
        realtimeClient.disconnect()
      }
    }
  }, [audioSystem, audioListener, realtimeClient])

  const contextValue: BroadcastContextType = {
    // Broadcaster state
    isStreaming,
    isBroadcaster,
    audioLevel,
    streamQuality,
    startBroadcast,
    stopBroadcast,
    
    // Listener state
    isListening,
    isConnected,
    receiverQuality,
    joinBroadcast,
    leaveBroadcast,
    
    // Shared audio controls
    volume,
    isMuted,
    setVolume,
    setMuted,
    
    // Connection state
    connectionState,
    error
  }

  return (
    <BroadcastContext.Provider value={contextValue}>
      {children}
    </BroadcastContext.Provider>
  )
}