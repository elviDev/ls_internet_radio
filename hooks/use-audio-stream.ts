import { useEffect, useRef, useState } from 'react'
import { UnifiedAudioSystem, AudioMetrics } from '@/lib/unified-audio-system'

export function useAudioStream(broadcastId?: string) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevels, setAudioLevels] = useState({ input: 0, output: 0, peak: 0 })
  const [error, setError] = useState<string | null>(null)
  
  const audioSystemRef = useRef<UnifiedAudioSystem | null>(null)

  useEffect(() => {
    if (!broadcastId) return

    audioSystemRef.current = new UnifiedAudioSystem({
      broadcastId,
      sampleRate: 48000,
      channels: 2,
      bitrate: 128000,
      maxSources: 8
    })
    
    return () => {
      if (audioSystemRef.current) {
        audioSystemRef.current.cleanup()
      }
    }
  }, [broadcastId])

  // Audio level monitoring
  useEffect(() => {
    if (!audioSystemRef.current) return

    audioSystemRef.current.onMetricsUpdate = (metrics: AudioMetrics) => {
      setAudioLevels({
        input: metrics.inputLevel,
        output: metrics.outputLevel,
        peak: metrics.peakLevel
      })
    }
  }, [isInitialized])

  const initializeAudio = async () => {
    if (!audioSystemRef.current) return

    try {
      await audioSystemRef.current.initialize()
      setIsInitialized(true)
      setError(null)
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow microphone access to broadcast.')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to initialize audio')
      }
      setIsInitialized(false)
    }
  }

  const startRecording = async () => {
    if (!audioSystemRef.current || !isInitialized) return

    try {
      await audioSystemRef.current.startBroadcast()
      setIsRecording(true)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording')
    }
  }

  const stopRecording = () => {
    if (audioSystemRef.current) {
      audioSystemRef.current.stopBroadcast()
      setIsRecording(false)
    }
  }

  return {
    isInitialized,
    isRecording,
    audioLevels,
    error,
    initializeAudio,
    startRecording,
    stopRecording,
    audioSystem: audioSystemRef.current
  }
}