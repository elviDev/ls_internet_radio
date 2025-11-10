import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseWebSocketOptions {
  broadcastId?: string
  userId?: string
  onMessage?: (data: any) => void
  onListenerUpdate?: (data: any) => void
  onChatMessage?: (data: any) => void
}

export function useWebSocket(options: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [listenerCount, setListenerCount] = useState(0)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!options.broadcastId) return

    // Initialize socket connection to unified audio server
    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      console.log('WebSocket connected to unified audio server')

      // Join broadcast room
      socket.emit('join-broadcast', options.broadcastId, {
        userId: options.userId,
        location: { city: 'Studio', country: 'Local', countryCode: 'LC' },
        device: 'desktop',
        browser: 'Chrome'
      })
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      console.log('WebSocket disconnected')
    })

    socket.on('listener-count', (data) => {
      setListenerCount(data.count)
      options.onListenerUpdate?.(data)
    })

    socket.on('new-message', (data) => {
      options.onChatMessage?.(data)
    })

    socket.on('broadcast-info', (data) => {
      options.onMessage?.(data)
    })

    return () => {
      socket.disconnect()
    }
  }, [options.broadcastId, options.userId])

  const sendChatMessage = (message: string, messageType: string = 'user') => {
    if (socketRef.current && options.broadcastId) {
      socketRef.current.emit('send-message', options.broadcastId, {
        userId: options.userId || 'anonymous',
        username: 'Host User',
        content: message,
        messageType: messageType
      })
    }
  }

  const sendStreamStatus = (status: any) => {
    if (socketRef.current && options.broadcastId) {
      socketRef.current.emit('broadcast-audio', options.broadcastId, status)
    }
  }

  return {
    isConnected,
    listenerCount,
    sendChatMessage,
    sendStreamStatus
  }
}