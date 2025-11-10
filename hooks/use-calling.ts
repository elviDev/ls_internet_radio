"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { WebRTCCaller } from '@/lib/webrtc-client'
import { RealtimeClient } from '@/lib/realtime-client'
import { toast } from 'sonner'

interface CallRequest {
  callId: string
  callerName: string
  callerLocation: string
  requestTime: Date
  status: 'pending' | 'accepted' | 'rejected' | 'ended'
}

interface UseCallingOptions {
  broadcastId: string
  callerInfo?: {
    name: string
    location?: string
  }
  autoConnect?: boolean
}

export function useCalling({ broadcastId, callerInfo, autoConnect = true }: UseCallingOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [callStatus, setCallStatus] = useState<'idle' | 'requesting' | 'pending' | 'active' | 'ended'>('idle')
  const [callId, setCallId] = useState<string | null>(null)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  const realtimeClient = useRef<RealtimeClient | null>(null)
  const caller = useRef<WebRTCCaller | null>(null)

  // Initialize connection
  useEffect(() => {
    if (!broadcastId || !autoConnect) return

    // Initialize realtime client
    realtimeClient.current = new RealtimeClient(
      process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3002'
    )

    // Setup event listeners
    const socket = realtimeClient.current.getSocket()
    
    socket.on('connect', () => {
      setIsConnected(true)
      setError(null)
      console.log('🔗 Connected to calling service')
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      setCallStatus('idle')
      console.log('❌ Disconnected from calling service')
    })

    socket.on('error', (err: any) => {
      setError(`Connection error: ${err.message}`)
      console.error('❌ Socket error:', err)
    })

    return () => {
      if (realtimeClient.current) {
        realtimeClient.current.disconnect()
      }
    }
  }, [broadcastId, autoConnect])

  // Initialize caller when connected
  useEffect(() => {
    if (isConnected && realtimeClient.current && !caller.current) {
      const socket = realtimeClient.current.getSocket()
      caller.current = new WebRTCCaller(socket, broadcastId)

      // Setup caller event handlers
      caller.current.on('call-pending', (data: any) => {
        setCallStatus('pending')
        setCallId(data.callId)
        setQueuePosition(data.position)
        toast.info(`📞 Call request sent! Position in queue: ${data.position}`)
      })

      caller.current.on('call-accepted', (data: any) => {
        setCallStatus('active')
        setIsCallActive(true)
        setQueuePosition(null)
        toast.success('✅ Call accepted! You are now live on air!')
      })

      caller.current.on('call-rejected', (data: any) => {
        setCallStatus('ended')
        setCallId(null)
        setQueuePosition(null)
        setIsCallActive(false)
        toast.error(`❌ Call rejected: ${data.reason || 'Unknown reason'}`)
      })

      caller.current.on('call-ended', (data: any) => {
        setCallStatus('ended')
        setCallId(null)
        setQueuePosition(null)
        setIsCallActive(false)
        setLocalStream(null)
        toast.info('🔚 Call ended')
      })

      caller.current.on('call-timeout', (data: any) => {
        setCallStatus('ended')
        setCallId(null)
        setQueuePosition(null)
        setIsCallActive(false)
        toast.warning('⏰ Call request timed out')
      })

      caller.current.on('call-error', (data: any) => {
        setError(data.error)
        setCallStatus('idle')
        setCallId(null)
        setIsCallActive(false)
        toast.error(`❌ Call error: ${data.error}`)
      })
    }
  }, [isConnected, broadcastId])

  // Request to call the radio station
  const requestCall = useCallback(async (customCallerInfo?: { name: string, location?: string }) => {
    if (!caller.current || !isConnected) {
      setError('Not connected to calling service')
      return false
    }

    if (callStatus !== 'idle') {
      setError('Call already in progress')
      return false
    }

    try {
      setCallStatus('requesting')
      setError(null)

      const info = customCallerInfo || callerInfo || { name: 'Anonymous Caller' }
      caller.current.requestCall(info)

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(`Failed to request call: ${errorMessage}`)
      setCallStatus('idle')
      return false
    }
  }, [caller, isConnected, callStatus, callerInfo])

  // End the current call
  const endCall = useCallback(() => {
    if (caller.current && callId) {
      caller.current.endCall()
      setCallStatus('ended')
      setCallId(null)
      setQueuePosition(null)
      setIsCallActive(false)
      setLocalStream(null)
    }
  }, [caller, callId])

  // Get microphone access (called automatically when call is accepted)
  const getMicrophoneAccess = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        },
        video: false
      })
      
      setLocalStream(stream)
      return stream
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Microphone access denied'
      setError(`Failed to access microphone: ${errorMessage}`)
      throw error
    }
  }, [])

  // Check if microphone is available
  const checkMicrophoneAvailability = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(device => device.kind === 'audioinput')
      return audioInputs.length > 0
    } catch (error) {
      console.warn('Failed to check microphone availability:', error)
      return false
    }
  }, [])

  // Get call statistics
  const getCallStats = useCallback(() => {
    if (!caller.current) return null
    return caller.current.getCallStatus()
  }, [caller])

  // Manually connect (if autoConnect is false)
  const connect = useCallback(() => {
    if (!realtimeClient.current && broadcastId) {
      realtimeClient.current = new RealtimeClient(
        process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3002'
      )
    }
  }, [broadcastId])

  // Manually disconnect
  const disconnect = useCallback(() => {
    if (caller.current && isCallActive) {
      endCall()
    }
    
    if (realtimeClient.current) {
      realtimeClient.current.disconnect()
      realtimeClient.current = null
    }
    
    caller.current = null
    setIsConnected(false)
    setCallStatus('idle')
  }, [endCall, isCallActive])

  return {
    // Connection state
    isConnected,
    error,
    
    // Call state
    callStatus,
    callId,
    queuePosition,
    isCallActive,
    localStream,
    
    // Actions
    requestCall,
    endCall,
    getMicrophoneAccess,
    checkMicrophoneAvailability,
    connect,
    disconnect,
    
    // Utils
    getCallStats,
    
    // Status helpers
    canCall: isConnected && callStatus === 'idle',
    isInQueue: callStatus === 'pending',
    isLiveOnAir: callStatus === 'active' && isCallActive
  }
}

// Hook for radio hosts to manage incoming calls
export function useCallQueue(broadcastId: string) {
  const [callQueue, setCallQueue] = useState<CallRequest[]>([])
  const [activeCalls, setActiveCalls] = useState<CallRequest[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const realtimeClient = useRef<RealtimeClient | null>(null)

  useEffect(() => {
    if (!broadcastId) return

    // Initialize realtime client
    realtimeClient.current = new RealtimeClient(
      process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3002'
    )

    const socket = realtimeClient.current.getSocket()

    socket.on('connect', () => {
      setIsConnected(true)
      // Request current call queue
      socket.emit('get-call-queue', broadcastId)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('incoming-call', (callRequest: any) => {
      const newCall: CallRequest = {
        callId: callRequest.callId,
        callerName: callRequest.callerName,
        callerLocation: callRequest.callerLocation,
        requestTime: new Date(callRequest.requestTime),
        status: 'pending'
      }
      
      setCallQueue(prev => [...prev, newCall])
      toast.info(`📞 Incoming call from ${callRequest.callerName}`)
    })

    socket.on('call-queue-update', (data: any) => {
      setCallQueue(data.queue.map((call: any) => ({
        callId: call.callId,
        callerName: call.callerName,
        callerLocation: call.callerLocation,
        requestTime: new Date(call.requestTime),
        status: call.status
      })))
      
      setActiveCalls(data.activeCalls.map((call: any) => ({
        callId: call.callId,
        callerName: call.callerName,
        callerLocation: call.callerLocation,
        requestTime: new Date(call.requestTime),
        status: 'accepted'
      })))
    })

    return () => {
      if (realtimeClient.current) {
        realtimeClient.current.disconnect()
      }
    }
  }, [broadcastId])

  const acceptCall = useCallback((callId: string) => {
    if (realtimeClient.current) {
      realtimeClient.current.getSocket().emit('accept-call', callId)
      
      // Update local state
      setCallQueue(prev => prev.filter(call => call.callId !== callId))
      setActiveCalls(prev => {
        const call = callQueue.find(c => c.callId === callId)
        if (call) {
          return [...prev, { ...call, status: 'accepted' as const }]
        }
        return prev
      })
      
      toast.success('✅ Call accepted')
    }
  }, [callQueue])

  const rejectCall = useCallback((callId: string, reason?: string) => {
    if (realtimeClient.current) {
      realtimeClient.current.getSocket().emit('reject-call', callId, reason)
      
      // Update local state
      setCallQueue(prev => prev.filter(call => call.callId !== callId))
      
      toast.info(`❌ Call rejected${reason ? `: ${reason}` : ''}`)
    }
  }, [])

  const endCall = useCallback((callId: string) => {
    if (realtimeClient.current) {
      realtimeClient.current.getSocket().emit('end-call', callId)
      
      // Update local state
      setActiveCalls(prev => prev.filter(call => call.callId !== callId))
      
      toast.info('🔚 Call ended')
    }
  }, [])

  return {
    callQueue,
    activeCalls,
    isConnected,
    acceptCall,
    rejectCall,
    endCall,
    totalInQueue: callQueue.length,
    totalActiveCalls: activeCalls.length
  }
}