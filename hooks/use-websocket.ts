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

    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      transports: ['websocket', 'polling']
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      console.log('WebSocket connected')

      // Join broadcast room
      socket.emit('join-broadcast', options.broadcastId, {
        userId: options.userId,
        location: { city: 'Test City', country: 'Test Country', countryCode: 'TC' },
        device: 'desktop',
        browser: 'Chrome'
      })
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      console.log('WebSocket disconnected')
    })

    socket.on('listener-count-update', (data) => {
      setListenerCount(data.count)
      options.onListenerUpdate?.(data)
    })

    socket.on('new-chat-message', (data) => {
      options.onChatMessage?.(data)
    })

    socket.on('stream-status-update', (data) => {
      options.onMessage?.(data)
    })

    return () => {
      socket.disconnect()
    }
  }, [options.broadcastId, options.userId])

  const sendChatMessage = (message: string, messageType: string = 'user') => {
    if (socketRef.current && options.broadcastId) {
      socketRef.current.emit('chat-message', {
        broadcastId: options.broadcastId,
        userId: options.userId || 'anonymous',
        username: 'Host User',
        content: message,
        type: messageType
      })
    }
  }

  const sendStreamStatus = (status: any) => {
    if (socketRef.current && options.broadcastId) {
      socketRef.current.emit('stream-status', options.broadcastId, status)
    }
  }

  return {
    isConnected,
    listenerCount,
    sendChatMessage,
    sendStreamStatus
  }
}