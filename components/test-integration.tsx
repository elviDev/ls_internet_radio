"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useBroadcast } from '@/contexts/broadcast-context'
import { useChat, ChatUser } from '@/contexts/chat-context'
import { ChatWidget } from '@/components/chat/chat-widget'

export function TestIntegration() {
  const [broadcastId] = useState('test-broadcast-1')
  const [currentUser] = useState({
    id: 'user-123',
    username: 'Test User',
    role: 'listener' as const
  })

  const broadcast = useBroadcast()
  const chat = useChat()

  useEffect(() => {
    // Auto-join chat when component mounts
    if (chat.state.isConnected && !chat.state.currentBroadcast) {
      const chatUser: ChatUser = {
        id: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
        isOnline: true,
        isTyping: false,
        lastSeen: new Date(),
        messageCount: 0
      }
      chat.joinBroadcast(broadcastId, chatUser)
    }
  }, [chat.state.isConnected, chat.state.currentBroadcast])

  const handleStartBroadcast = async () => {
    try {
      await broadcast.startBroadcast(broadcastId)
    } catch (error) {
      console.error('Failed to start broadcast:', error)
    }
  }

  const handleJoinBroadcast = async () => {
    try {
      await broadcast.joinBroadcast(broadcastId)
    } catch (error) {
      console.error('Failed to join broadcast:', error)
    }
  }

  const handleSendMessage = () => {
    chat.sendMessage('Hello from test integration!')
  }

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Integration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <span>Chat:</span>
            <Badge variant={chat.state.isConnected ? 'default' : 'destructive'}>
              {chat.state.isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            <span>Broadcast:</span>
            <Badge variant={broadcast.connectionState === 'connected' ? 'default' : 'destructive'}>
              {broadcast.connectionState}
            </Badge>
          </div>

          {/* Broadcast Controls */}
          <div className="flex gap-2">
            {broadcast.isBroadcaster ? (
              <Button 
                onClick={handleStartBroadcast}
                disabled={broadcast.isStreaming}
              >
                {broadcast.isStreaming ? 'Broadcasting...' : 'Start Broadcast'}
              </Button>
            ) : (
              <Button 
                onClick={handleJoinBroadcast}
                disabled={broadcast.isListening}
              >
                {broadcast.isListening ? 'Listening...' : 'Join Broadcast'}
              </Button>
            )}
          </div>

          {/* Chat Controls */}
          <div className="flex gap-2">
            <Button 
              onClick={handleSendMessage}
              disabled={!chat.state.isConnected}
            >
              Send Test Message
            </Button>
            <Button onClick={chat.toggleChat}>
              Toggle Chat
            </Button>
          </div>

          {/* Stats */}
          <div className="text-sm text-gray-600">
            <p>Messages: {chat.state.messages.length}</p>
            <p>Users: {chat.state.users.length}</p>
            <p>Audio Level: {Math.round(broadcast.audioLevel)}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Chat Widget */}
      <ChatWidget
        broadcastId={broadcastId}
        currentUser={currentUser}
        position="bottom-right"
      />
    </div>
  )
}