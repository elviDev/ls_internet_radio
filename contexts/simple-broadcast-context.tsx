"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { AudioBroadcaster, AudioListener } from '@/lib/audio-bridge'

interface SimpleBroadcastContextType {
  // Broadcaster (Studio) State
  isStreaming: boolean
  isBroadcaster: boolean
  audioLevel: number
  startBroadcast: (broadcastId: string, audioStream?: MediaStream, programInfo?: any) => Promise<void>
  stopBroadcast: () => Promise<void>
  updateProgramInfo: (programInfo: any) => void
  
  // Listener (Public) State  
  isListening: boolean
  isConnected: boolean
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

const SimpleBroadcastContext = createContext<SimpleBroadcastContextType | null>(null)

export function useSimpleBroadcast() {
  const context = useContext(SimpleBroadcastContext)
  if (!context) {
    throw new Error('useSimpleBroadcast must be used within a SimpleBroadcastProvider')
  }
  return context
}

interface SimpleBroadcastProviderProps {
  children: React.ReactNode
  userId?: string
  isBroadcaster?: boolean
}

export function SimpleBroadcastProvider({ children, userId, isBroadcaster = false }: SimpleBroadcastProviderProps) {
  // Broadcaster state
  const [isStreaming, setIsStreaming] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [audioBroadcaster, setAudioBroadcaster] = useState<AudioBroadcaster | null>(null)
  
  // Listener state
  const [isListening, setIsListening] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [audioListener, setAudioListener] = useState<AudioListener | null>(null)
  
  // Shared state
  const [volume, setVolumeState] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [currentBroadcastId, setCurrentBroadcastId] = useState<string | null>(null)

  // Simulate audio levels (replace with real audio analysis)
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isStreaming || isListening) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 100)
      }, 100)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isStreaming, isListening])

  // Broadcaster functions
  const startBroadcast = useCallback(async (broadcastId: string, audioStream?: MediaStream, programInfo?: any) => {
    if (!isBroadcaster) {
      throw new Error('Only broadcasters can start streaming')
    }

    try {
      setConnectionState('connecting')
      setError(null)
      console.log('Starting broadcast for:', broadcastId)
      
      // Create and start audio broadcaster with program info
      const broadcaster = new AudioBroadcaster(broadcastId, programInfo)
      await broadcaster.startBroadcasting(audioStream)
      
      setAudioBroadcaster(broadcaster)
      setIsStreaming(true)
      setCurrentBroadcastId(broadcastId)
      setConnectionState('connected')
      setIsConnected(true)

      // Notify API that streaming has started
      await fetch('/api/broadcasts/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broadcastId })
      })

      console.log('Broadcast started successfully')
    } catch (error) {
      console.error('Failed to start broadcast:', error)
      setError(error instanceof Error ? error.message : 'Failed to start broadcast')
      setConnectionState('failed')
      throw error
    }
  }, [isBroadcaster])

  const stopBroadcast = useCallback(async () => {
    if (!isStreaming || !currentBroadcastId) return

    try {
      console.log('Stopping broadcast')
      
      // Stop audio broadcasting
      if (audioBroadcaster) {
        audioBroadcaster.stopBroadcasting()
        setAudioBroadcaster(null)
      }

      setIsStreaming(false)
      setConnectionState('disconnected')
      setIsConnected(false)
      setAudioLevel(0)

      // Notify API that streaming has stopped
      await fetch(`/api/broadcasts/stream?broadcastId=${currentBroadcastId}`, {
        method: 'DELETE'
      })

      setCurrentBroadcastId(null)
      console.log('Broadcast stopped successfully')
    } catch (error) {
      console.error('Failed to stop broadcast:', error)
      setError(error instanceof Error ? error.message : 'Failed to stop broadcast')
    }
  }, [isStreaming, currentBroadcastId, audioBroadcaster])

  // Listener functions
  const joinBroadcast = useCallback(async (broadcastId: string) => {
    if (isBroadcaster) {
      throw new Error('Broadcasters cannot join as listeners')
    }

    try {
      setConnectionState('connecting')
      setError(null)
      console.log('Joining broadcast:', broadcastId)

      // Check if broadcast is live
      const response = await fetch(`/api/broadcasts/stream?broadcastId=${broadcastId}`)
      const broadcastInfo = await response.json()

      if (!broadcastInfo.isLive) {
        throw new Error('Broadcast is not currently live')
      }

      // Create and start audio listener
      const listener = new AudioListener(broadcastId)
      await listener.startListening()

      setAudioListener(listener)
      setIsListening(true)
      setCurrentBroadcastId(broadcastId)
      setConnectionState('connected')
      setIsConnected(true)

      console.log('Joined broadcast successfully')
    } catch (error) {
      console.error('Failed to join broadcast:', error)
      setError(error instanceof Error ? error.message : 'Failed to join broadcast')
      setConnectionState('failed')
      throw error
    }
  }, [isBroadcaster])

  const leaveBroadcast = useCallback(() => {
    if (!isListening) return

    try {
      console.log('Leaving broadcast')
      
      if (audioListener) {
        audioListener.stopListening()
        setAudioListener(null)
      }

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
    // Volume control for Socket.IO audio would be handled differently
    console.log('Volume set to:', newVolume)
  }, [])

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted)
    // Mute control for Socket.IO audio would be handled differently  
    console.log('Muted set to:', muted)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioBroadcaster) {
        audioBroadcaster.stopBroadcasting()
      }
      if (audioListener) {
        audioListener.stopListening()
      }
    }
  }, [audioBroadcaster, audioListener])

  // Update program info during broadcast
  const updateProgramInfo = useCallback((programInfo: any) => {
    if (audioBroadcaster) {
      audioBroadcaster.updateProgramInfo(programInfo)
    }
  }, [audioBroadcaster])

  const contextValue: SimpleBroadcastContextType = {
    // Broadcaster state
    isStreaming,
    isBroadcaster,
    audioLevel,
    startBroadcast,
    stopBroadcast,
    updateProgramInfo,
    
    // Listener state
    isListening,
    isConnected,
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
    <SimpleBroadcastContext.Provider value={contextValue}>
      {children}
    </SimpleBroadcastContext.Provider>
  )
}