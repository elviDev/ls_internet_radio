"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { AudioBroadcaster, AudioListener } from '@/lib/audio-bridge'

interface BroadcastContextType {
  // Broadcaster (Studio) State
  isStreaming: boolean
  isBroadcaster: boolean
  audioLevel: number
  startBroadcast: (broadcastId: string) => Promise<void>
  stopBroadcast: () => Promise<void>
  
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
  const [audioStreamer, setAudioStreamer] = useState<AudioStreamer | null>(null)
  
  // Listener state
  const [isListening, setIsListening] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [receiverQuality, setReceiverQuality] = useState<ReceiverQualityMetrics | null>(null)
  const [audioReceiver, setAudioReceiver] = useState<AudioReceiver | null>(null)
  
  // Shared state
  const [volume, setVolumeState] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [currentBroadcastId, setCurrentBroadcastId] = useState<string | null>(null)
  const [signalingInterval, setSignalingInterval] = useState<NodeJS.Timeout | null>(null)

  // Audio level monitoring
  useEffect(() => {
    let interval: NodeJS.Timeout

    if ((isStreaming && audioStreamer) || (isListening && audioReceiver)) {
      interval = setInterval(() => {
        if (isStreaming && audioStreamer) {
          setAudioLevel(audioStreamer.getAudioLevel())
        } else if (isListening && audioReceiver) {
          setAudioLevel(audioReceiver.getAudioLevel())
        }
      }, 100)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isStreaming, isListening, audioStreamer, audioReceiver])

  // Signaling message polling
  useEffect(() => {
    if (currentBroadcastId && (isStreaming || isListening)) {
      let lastMessageTimestamp = 0
      
      const pollSignalingMessages = async () => {
        try {
          const response = await fetch(
            `/api/broadcasts/stream/signaling?broadcastId=${currentBroadcastId}&since=${lastMessageTimestamp}`
          )
          
          if (response.ok) {
            const data = await response.json()
            
            for (const message of data.messages) {
              lastMessageTimestamp = Math.max(lastMessageTimestamp, message.timestamp)
              
              // Handle signaling messages
              if (message.type === 'join-as-listener' && audioStreamer && isBroadcaster) {
                // Create offer for new listener
                const offer = await audioStreamer.createOffer(message.senderId)
                await fetch(`/api/broadcasts/stream/signaling?broadcastId=${currentBroadcastId}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'offer',
                    data: offer,
                    targetId: message.senderId
                  })
                })
              } else if (message.type === 'offer' && audioReceiver && !isBroadcaster) {
                const answer = await audioReceiver.handleOffer(message.data)
                await fetch(`/api/broadcasts/stream/signaling?broadcastId=${currentBroadcastId}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'answer',
                    data: answer,
                    targetId: message.senderId
                  })
                })
              } else if (message.type === 'answer' && audioStreamer && isBroadcaster) {
                await audioStreamer.handleAnswer(message.senderId, message.data)
              } else if (message.type === 'ice-candidate') {
                if (audioReceiver && message.targetId === userId) {
                  await audioReceiver.handleIceCandidate(message.data)
                } else if (audioStreamer && isBroadcaster) {
                  await audioStreamer.handleIceCandidate(message.senderId, message.data)
                }
              }
            }
          }
        } catch (error) {
          console.error('Error polling signaling messages:', error)
        }
      }
      
      const interval = setInterval(pollSignalingMessages, 1000) // Poll every second
      setSignalingInterval(interval)
      
      return () => {
        clearInterval(interval)
        setSignalingInterval(null)
      }
    }
  }, [currentBroadcastId, isStreaming, isListening, audioStreamer, audioReceiver, userId])

  // Broadcaster functions
  const startBroadcast = useCallback(async (broadcastId: string) => {
    if (!isBroadcaster) {
      throw new Error('Only broadcasters can start streaming')
    }

    try {
      setConnectionState('connecting')
      setError(null)
      
      // Initialize audio streamer
      const streamer = new AudioStreamer({
        sampleRate: 44100,
        channelCount: 2,
        bitRate: 128000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      })

      // Set up callbacks
      streamer.onQualityUpdate = (listenerId: string, metrics: StreamQualityMetrics) => {
        setStreamQuality(metrics)
      }

      streamer.sendSignalingMessage = async (message: any) => {
        try {
          await fetch(`/api/broadcasts/stream/signaling?broadcastId=${broadcastId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
          })
        } catch (error) {
          console.error('Failed to send signaling message:', error)
        }
      }

      try {
        await streamer.initializeAudio()
        setAudioStreamer(streamer)
      } catch (audioError) {
        console.error('Audio initialization failed:', audioError)
        throw audioError
      }
      
      // Start the stream
      streamer.startStreaming()
      setIsStreaming(true)
      setCurrentBroadcastId(broadcastId)
      setConnectionState('connected')
      
      // Send join-as-host message to establish signaling
      await fetch(`/api/broadcasts/stream/signaling?broadcastId=${broadcastId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'join-as-host' })
      })

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
      // Stop audio streaming
      if (audioStreamer) {
        audioStreamer.stopStreaming()
        setAudioStreamer(null)
      }

      setIsStreaming(false)
      setConnectionState('disconnected')
      setAudioLevel(0)
      setStreamQuality(null)

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
  }, [isStreaming, currentBroadcastId, audioStreamer])

  // Listener functions
  const joinBroadcast = useCallback(async (broadcastId: string) => {
    if (isBroadcaster) {
      throw new Error('Broadcasters cannot join as listeners')
    }

    try {
      setConnectionState('connecting')
      setError(null)

      // Check if broadcast is live
      const response = await fetch(`/api/broadcasts/stream?broadcastId=${broadcastId}`)
      const broadcastInfo = await response.json()

      if (!broadcastInfo.isLive) {
        throw new Error('Broadcast is not currently live')
      }

      // Initialize audio receiver
      const receiver = new AudioReceiver()

      // Set up callbacks
      receiver.onQualityUpdate = (metrics: ReceiverQualityMetrics) => {
        setReceiverQuality(metrics)
      }

      receiver.onConnectionStateChange = (state: 'connected' | 'disconnected') => {
        setIsConnected(state === 'connected')
        setConnectionState(state === 'connected' ? 'connected' : 'disconnected')
      }

      receiver.onConnectionError = (error: string) => {
        setError(error)
        setConnectionState('failed')
      }

      receiver.onReconnectAttempt = () => {
        setConnectionState('connecting')
      }

      receiver.sendSignalingMessage = async (message: any) => {
        try {
          await fetch(`/api/broadcasts/stream/signaling?broadcastId=${broadcastId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
          })
        } catch (error) {
          console.error('Failed to send signaling message:', error)
        }
      }

      try {
        await receiver.initializeReceiver()
        setAudioReceiver(receiver)
      } catch (audioError) {
        console.error('Audio receiver initialization failed:', audioError)
        throw audioError
      }
      
      // Apply current volume settings
      receiver.setVolume(volume)
      receiver.mute(isMuted)

      setIsListening(true)
      setCurrentBroadcastId(broadcastId)
      
      // Send join-as-listener message and create offer
      await fetch(`/api/broadcasts/stream/signaling?broadcastId=${broadcastId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'join-as-listener' })
      })
      
      // Start playing
      await receiver.play()

      console.log('Joined broadcast successfully')
    } catch (error) {
      console.error('Failed to join broadcast:', error)
      setError(error instanceof Error ? error.message : 'Failed to join broadcast')
      setConnectionState('failed')
      throw error
    }
  }, [isBroadcaster, volume, isMuted])

  const leaveBroadcast = useCallback(() => {
    if (!isListening) return

    try {
      if (audioReceiver) {
        audioReceiver.disconnect()
        setAudioReceiver(null)
      }

      setIsListening(false)
      setIsConnected(false)
      setConnectionState('disconnected')
      setAudioLevel(0)
      setReceiverQuality(null)
      setCurrentBroadcastId(null)

      console.log('Left broadcast successfully')
    } catch (error) {
      console.error('Failed to leave broadcast:', error)
      setError(error instanceof Error ? error.message : 'Failed to leave broadcast')
    }
  }, [isListening, audioReceiver])

  // Audio control functions
  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume)
    
    if (audioReceiver) {
      audioReceiver.setVolume(newVolume)
    }
    
    if (audioStreamer) {
      audioStreamer.setGain(newVolume / 100)
    }
  }, [audioReceiver, audioStreamer])

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted)
    
    if (audioReceiver) {
      audioReceiver.mute(muted)
    }
  }, [audioReceiver])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioStreamer) {
        audioStreamer.stopStreaming()
      }
      if (audioReceiver) {
        audioReceiver.disconnect()
      }
      if (signalingInterval) {
        clearInterval(signalingInterval)
      }
      if (currentBroadcastId) {
        // Leave broadcast on cleanup
        fetch(`/api/broadcasts/stream/signaling?broadcastId=${currentBroadcastId}`, {
          method: 'DELETE'
        }).catch(console.error)
      }
    }
  }, [audioStreamer, audioReceiver, signalingInterval, currentBroadcastId])

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