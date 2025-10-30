import { useEffect, useRef, useState } from 'react'
import { AudioStreamManager } from '@/lib/audio-stream'

export function useAudioStream() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevels, setAudioLevels] = useState({ input: 0, output: 0, peak: 0 })
  const [error, setError] = useState<string | null>(null)
  
  const streamManagerRef = useRef<AudioStreamManager | null>(null)

  useEffect(() => {
    streamManagerRef.current = new AudioStreamManager()
    
    return () => {
      if (streamManagerRef.current) {
        streamManagerRef.current.cleanup()
      }
    }
  }, [])

  const initializeAudio = async () => {
    if (!streamManagerRef.current) return

    try {
      await streamManagerRef.current.initialize()
      setIsInitialized(true)
      setError(null)

      // Set up audio level monitoring
      const updateLevels = () => {
        if (streamManagerRef.current) {
          const levels = streamManagerRef.current.getAudioLevels()
          setAudioLevels(levels)
        }
      }

      const interval = setInterval(updateLevels, 100)
      return () => clearInterval(interval)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize audio')
      setIsInitialized(false)
    }
  }

  const startRecording = async () => {
    if (!streamManagerRef.current || !isInitialized) return

    try {
      await streamManagerRef.current.startRecording()
      setIsRecording(true)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording')
    }
  }

  const stopRecording = () => {
    if (streamManagerRef.current) {
      streamManagerRef.current.stopRecording()
      setIsRecording(false)
    }
  }

  const applyEffect = (type: 'reverb' | 'echo' | 'compressor', intensity: number) => {
    if (streamManagerRef.current) {
      streamManagerRef.current.applyEffect(type, intensity)
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
    applyEffect
  }
}