'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UnifiedAudioSystem } from '@/lib/unified-audio-system'
import { io } from 'socket.io-client'

export function ConnectionTest() {
  const [logs, setLogs] = useState<string[]>([])
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [audioStatus, setAudioStatus] = useState<'none' | 'initializing' | 'ready' | 'error'>('none')

  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `${timestamp}: ${message}`])
    console.log(message)
  }

  const testWebSocket = async () => {
    log('🔗 Testing WebSocket connection...')
    setWsStatus('connecting')

    try {
      const socket = io('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true
      })

      socket.on('connect', () => {
        log('✅ WebSocket connected successfully')
        setWsStatus('connected')
        
        // Test broadcaster join
        socket.emit('join-as-broadcaster', 'test-broadcast-123', {
          username: 'Test Host',
          stationName: 'Test Station'
        })
      })

      socket.on('broadcaster-ready', (data) => {
        log('✅ Broadcaster ready: ' + JSON.stringify(data))
      })

      socket.on('connect_error', (error) => {
        log('❌ WebSocket connection error: ' + error.message)
        setWsStatus('error')
      })

      socket.on('disconnect', (reason) => {
        log('⚠️ WebSocket disconnected: ' + reason)
        setWsStatus('disconnected')
      })

      // Auto-disconnect after 10 seconds
      setTimeout(() => {
        socket.disconnect()
        log('🔌 WebSocket test completed')
      }, 10000)

    } catch (error) {
      log('❌ WebSocket test failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
      setWsStatus('error')
    }
  }

  const testAudioSystem = async () => {
    log('🎚️ Testing Unified Audio System...')
    setAudioStatus('initializing')

    try {
      const audioSystem = new UnifiedAudioSystem({
        broadcastId: 'test-broadcast-123',
        sampleRate: 48000,
        channels: 2,
        bitrate: 128000,
        maxSources: 8
      })

      // Initialize
      await audioSystem.initialize()
      log('✅ Audio system initialized')

      // Test adding a host
      await audioSystem.addAudioSource({
        id: 'test-host',
        type: 'host',
        name: 'Test Host',
        volume: 1.0,
        isMuted: false,
        isActive: true,
        priority: 10
      })
      log('✅ Host audio source added')

      // Test starting broadcast
      await audioSystem.startBroadcast()
      log('✅ Broadcast started')
      setAudioStatus('ready')

      // Stop after 5 seconds
      setTimeout(() => {
        audioSystem.stopBroadcast()
        audioSystem.cleanup()
        log('🛑 Audio system test completed')
        setAudioStatus('none')
      }, 5000)

    } catch (error) {
      log('❌ Audio system test failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
      setAudioStatus('error')
    }
  }

  const testMicrophone = async () => {
    log('🎤 Testing microphone access...')

    try {
      // Test AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      log('✅ AudioContext created, state: ' + audioContext.state)

      if (audioContext.state === 'suspended') {
        await audioContext.resume()
        log('✅ AudioContext resumed, state: ' + audioContext.state)
      }

      // Test microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      log('✅ Microphone access granted')
      log(`📊 Audio tracks: ${stream.getAudioTracks().length}`)

      // Test audio processing
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      source.connect(analyser)
      log('✅ Audio processing chain created')

      // Stop after 3 seconds
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop())
        audioContext.close()
        log('🎤 Microphone test completed')
      }, 3000)

    } catch (error) {
      log('❌ Microphone test failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          log('❌ Microphone permission denied')
        } else if (error.name === 'NotFoundError') {
          log('❌ No microphone found')
        }
      }
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'ready':
        return 'bg-green-500'
      case 'connecting':
      case 'initializing':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connection & Audio Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Badge className={getStatusColor(wsStatus)}>
                WebSocket: {wsStatus}
              </Badge>
              <Badge className={getStatusColor(audioStatus)}>
                Audio: {audioStatus}
              </Badge>
            </div>

            <div className="flex space-x-2">
              <Button onClick={testWebSocket} disabled={wsStatus === 'connecting'}>
                Test WebSocket
              </Button>
              <Button onClick={testMicrophone}>
                Test Microphone
              </Button>
              <Button onClick={testAudioSystem} disabled={audioStatus === 'initializing'}>
                Test Audio System
              </Button>
              <Button onClick={clearLogs} variant="outline">
                Clear Logs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">Click test buttons to see logs...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}