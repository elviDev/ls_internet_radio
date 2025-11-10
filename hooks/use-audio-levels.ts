"use client"

import { useState, useEffect, useRef, useCallback } from 'react'

interface AudioLevelData {
  level: number
  peak: number
  isActive: boolean
}

interface UseAudioLevelsOptions {
  channelId: string
  channelType: 'mic' | 'music' | 'effects' | 'line'
  enabled: boolean
  muted: boolean
  volume: number
}

export function useAudioLevels({ 
  channelId, 
  channelType, 
  enabled, 
  muted, 
  volume 
}: UseAudioLevelsOptions) {
  const [audioData, setAudioData] = useState<AudioLevelData>({
    level: 0,
    peak: 0,
    isActive: false
  })
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number>()
  const peakHoldRef = useRef(0)
  const peakDecayRef = useRef(0)

  const initializeMicrophone = useCallback(async () => {
    if (channelType !== 'mic') return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        } 
      })
      
      micStreamRef.current = stream
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      analyserRef.current.smoothingTimeConstant = 0.3
      
      source.connect(analyserRef.current)
      
      return true
    } catch (error) {
      // Silently handle permission denied - this is expected behavior
      if (error instanceof Error && error.name === 'NotAllowedError') {
        // User denied microphone permission - this is normal
        return false
      }
      console.warn(`Failed to initialize microphone for ${channelId}:`, error)
      return false
    }
  }, [channelId, channelType])

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || muted || !enabled) {
      setAudioData({ level: 0, peak: 0, isActive: false })
      peakDecayRef.current = Math.max(0, peakDecayRef.current - 2)
      if (enabled && !muted) {
        animationFrameRef.current = requestAnimationFrame(analyzeAudio)
      }
      return
    }

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Calculate RMS (Root Mean Square) for more accurate level detection
    let sum = 0
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i]
    }
    const rms = Math.sqrt(sum / bufferLength)
    
    // Convert to percentage and apply volume scaling
    const level = Math.min(100, (rms / 255) * 100 * (volume / 100))
    
    // Peak hold with decay
    if (level > peakHoldRef.current) {
      peakHoldRef.current = level
      peakDecayRef.current = level
    } else {
      peakDecayRef.current = Math.max(level, peakDecayRef.current - 1)
    }

    // Reset peak hold after 2 seconds
    if (peakHoldRef.current > 0) {
      setTimeout(() => {
        peakHoldRef.current = Math.max(0, peakHoldRef.current - 0.5)
      }, 100)
    }

    setAudioData({
      level: Math.round(level),
      peak: Math.round(peakDecayRef.current),
      isActive: level > 1 // Consider active if level > 1%
    })

    animationFrameRef.current = requestAnimationFrame(analyzeAudio)
  }, [muted, enabled, volume])

  useEffect(() => {
    if (enabled && channelType === 'mic') {
      initializeMicrophone().then((success) => {
        if (success) {
          analyzeAudio()
        } else {
          // No microphone available, show zero levels
          setAudioData({ level: 0, peak: 0, isActive: false })
        }
      })
    } else {
      // For non-mic channels without audio source, show zero levels
      setAudioData({ level: 0, peak: 0, isActive: false })
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [enabled, channelType, initializeMicrophone, analyzeAudio])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

  return audioData
}