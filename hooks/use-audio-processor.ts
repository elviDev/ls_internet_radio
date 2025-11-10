"use client"

import { useState, useEffect, useRef, useCallback } from 'react'

interface AudioChannel {
  id: string
  type: "mic" | "music" | "effects" | "line"
  volume: number
  gain: number
  muted: boolean
  solo: boolean
  eq: {
    low: number
    mid: number
    high: number
  }
  effects: {
    reverb: number
    echo: number
    chorus: number
  }
}

interface AudioProcessorState {
  masterVolume: number
  channels: AudioChannel[]
  limiterThreshold: number
  noiseGate: number
}

export function useAudioProcessor(initialState: AudioProcessorState) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const masterLimiterRef = useRef<DynamicsCompressorNode | null>(null)
  const masterAnalyserRef = useRef<AnalyserNode | null>(null)
  const broadcastDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const channelNodesRef = useRef<Map<string, {
    source?: MediaStreamAudioSourceNode
    gain: GainNode
    eq: {
      low: BiquadFilterNode
      mid: BiquadFilterNode
      high: BiquadFilterNode
    }
    compressor: DynamicsCompressorNode
    limiter: DynamicsCompressorNode
    stream?: MediaStream
  }>>(new Map())
  
  const [isInitialized, setIsInitialized] = useState(false)
  const [audioState, setAudioState] = useState(initialState)
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [broadcastStream, setBroadcastStream] = useState<MediaStream | null>(null)

  // Initialize Web Audio API
  const initializeAudio = useCallback(async () => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Resume AudioContext if suspended (required for user gesture)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }
      
      // Create master processing chain
      masterGainRef.current = audioContextRef.current.createGain()
      masterLimiterRef.current = audioContextRef.current.createDynamicsCompressor()
      masterAnalyserRef.current = audioContextRef.current.createAnalyser()
      
      // Configure master limiter
      masterLimiterRef.current.threshold.value = -((100 - initialState.limiterThreshold) * 0.6)
      masterLimiterRef.current.knee.value = 0
      masterLimiterRef.current.ratio.value = 20
      masterLimiterRef.current.attack.value = 0.001
      masterLimiterRef.current.release.value = 0.01
      
      // Configure master analyser
      masterAnalyserRef.current.fftSize = 512
      masterAnalyserRef.current.smoothingTimeConstant = 0.8
      
      // Create broadcast destination for streaming
      broadcastDestinationRef.current = audioContextRef.current.createMediaStreamDestination()
      
      // Connect master chain: gain -> limiter -> analyser -> broadcast destination
      masterGainRef.current.connect(masterLimiterRef.current)
      masterLimiterRef.current.connect(masterAnalyserRef.current)
      masterAnalyserRef.current.connect(broadcastDestinationRef.current)
      // NOTE: Not connecting to speakers to prevent microphone feedback
      
      // Set initial master volume
      masterGainRef.current.gain.value = initialState.masterVolume / 100
      
      setIsInitialized(true)
      return true
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
      return false
    }
  }, [initialState.masterVolume])

  // Create audio processing chain for a channel
  const createChannelChain = useCallback(async (channel: AudioChannel) => {
    if (!audioContextRef.current || !masterGainRef.current) return null

    const ctx = audioContextRef.current
    
    // Create nodes
    const gainNode = ctx.createGain()
    const lowEQ = ctx.createBiquadFilter()
    const midEQ = ctx.createBiquadFilter()
    const highEQ = ctx.createBiquadFilter()
    const compressor = ctx.createDynamicsCompressor()
    const limiter = ctx.createDynamicsCompressor()

    // Configure EQ filters
    lowEQ.type = 'lowshelf'
    lowEQ.frequency.value = 320
    midEQ.type = 'peaking'
    midEQ.frequency.value = 1000
    midEQ.Q.value = 1
    highEQ.type = 'highshelf'
    highEQ.frequency.value = 3200

    // Configure compressor
    compressor.threshold.value = -24
    compressor.knee.value = 30
    compressor.ratio.value = 12
    compressor.attack.value = 0.003
    compressor.release.value = 0.25

    // Configure limiter
    limiter.threshold.value = -6
    limiter.knee.value = 0
    limiter.ratio.value = 20
    limiter.attack.value = 0.001
    limiter.release.value = 0.01

    // Set initial values
    gainNode.gain.value = (channel.volume / 100) * (channel.gain / 100)
    lowEQ.gain.value = (channel.eq.low - 50) * 0.3
    midEQ.gain.value = (channel.eq.mid - 50) * 0.3
    highEQ.gain.value = (channel.eq.high - 50) * 0.3

    const chainNodes = {
      gain: gainNode,
      eq: { low: lowEQ, mid: midEQ, high: highEQ },
      compressor,
      limiter
    }

    // Connect the chain: source -> gain -> EQ -> compressor -> limiter -> master
    const connectChain = (sourceNode: AudioNode) => {
      sourceNode.connect(gainNode)
      gainNode.connect(lowEQ)
      lowEQ.connect(midEQ)
      midEQ.connect(highEQ)
      highEQ.connect(compressor)
      compressor.connect(limiter)
      limiter.connect(masterGainRef.current!)
    }

    // Handle microphone input
    if (channel.type === 'mic') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
            sampleRate: 48000
          } 
        })
        
        const source = ctx.createMediaStreamSource(stream)
        connectChain(source)
        
        channelNodesRef.current.set(channel.id, {
          ...chainNodes,
          source,
          stream
        })
      } catch (error) {
        console.error(`Failed to get microphone for ${channel.id}:`, error)
      }
    } else {
      // For other channel types, store the chain without source
      channelNodesRef.current.set(channel.id, chainNodes)
    }

    return chainNodes
  }, [])

  // Update channel parameters
  const updateChannel = useCallback((channelId: string, updates: Partial<AudioChannel>) => {
    const nodes = channelNodesRef.current.get(channelId)
    if (!nodes) return

    setAudioState(prev => ({
      ...prev,
      channels: prev.channels.map(ch => 
        ch.id === channelId ? { ...ch, ...updates } : ch
      )
    }))

    // Apply updates to audio nodes
    if (updates.volume !== undefined || updates.gain !== undefined) {
      const channel = audioState.channels.find(ch => ch.id === channelId)
      if (channel) {
        const volume = updates.volume ?? channel.volume
        const gain = updates.gain ?? channel.gain
        nodes.gain.gain.setTargetAtTime((volume / 100) * (gain / 100), 0, 0.01)
      }
    }

    if (updates.muted !== undefined) {
      nodes.gain.gain.setTargetAtTime(updates.muted ? 0 : nodes.gain.gain.value, 0, 0.01)
    }

    if (updates.eq) {
      if (updates.eq.low !== undefined) {
        nodes.eq.low.gain.setTargetAtTime((updates.eq.low - 50) * 0.3, 0, 0.01)
      }
      if (updates.eq.mid !== undefined) {
        nodes.eq.mid.gain.setTargetAtTime((updates.eq.mid - 50) * 0.3, 0, 0.01)
      }
      if (updates.eq.high !== undefined) {
        nodes.eq.high.gain.setTargetAtTime((updates.eq.high - 50) * 0.3, 0, 0.01)
      }
    }
  }, [audioState.channels])

  // Update master volume
  const updateMasterVolume = useCallback((volume: number) => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume / 100, 0, 0.01)
    }
    setAudioState(prev => ({ ...prev, masterVolume: volume }))
  }, [])

  // Update limiter threshold
  const updateLimiterThreshold = useCallback((threshold: number) => {
    if (masterLimiterRef.current) {
      masterLimiterRef.current.threshold.setTargetAtTime(-((100 - threshold) * 0.6), 0, 0.01)
    }
    setAudioState(prev => ({ ...prev, limiterThreshold: threshold }))
  }, [])

  // Update noise gate (applied per channel)
  const updateNoiseGate = useCallback((gate: number) => {
    setAudioState(prev => ({ ...prev, noiseGate: gate }))
    // Apply noise gate to all channels
    channelNodesRef.current.forEach((nodes, channelId) => {
      // Noise gate implementation would go here
    })
  }, [])

  // Get master analyser data
  const getMasterAnalyserData = useCallback(() => {
    if (!masterAnalyserRef.current) return new Uint8Array(0)
    
    const bufferLength = masterAnalyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    masterAnalyserRef.current.getByteFrequencyData(dataArray)
    return dataArray
  }, [])

  // Start broadcasting the mixed audio
  const startBroadcast = useCallback((onAudioData: (data: string) => void) => {
    if (!broadcastDestinationRef.current || isBroadcasting) return false

    try {
      const stream = broadcastDestinationRef.current.stream
      setBroadcastStream(stream)
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64data = reader.result as string
            onAudioData(base64data.split(',')[1]) // Remove data URL prefix
          }
          reader.readAsDataURL(event.data)
        }
      }

      mediaRecorder.start(200) // 200ms chunks for low latency
      mediaRecorderRef.current = mediaRecorder
      setIsBroadcasting(true)
      
      return true
    } catch (error) {
      console.error('Failed to start broadcast:', error)
      return false
    }
  }, [isBroadcasting])

  // Stop broadcasting
  const stopBroadcast = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    mediaRecorderRef.current = null
    setBroadcastStream(null)
    setIsBroadcasting(false)
  }, [])

  // Get broadcast stream for external use
  const getBroadcastStream = useCallback(() => {
    return broadcastDestinationRef.current?.stream || null
  }, [])

  // Initialize audio processing for all channels
  useEffect(() => {
    if (isInitialized) {
      audioState.channels.forEach(channel => {
        if (!channelNodesRef.current.has(channel.id)) {
          createChannelChain(channel)
        }
      })
    }
  }, [isInitialized, audioState.channels, createChannelChain])

  // Cleanup
  useEffect(() => {
    return () => {
      channelNodesRef.current.forEach(nodes => {
        if (nodes.stream) {
          nodes.stream.getTracks().forEach(track => track.stop())
        }
      })
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [])

  return {
    isInitialized,
    audioState,
    isBroadcasting,
    broadcastStream,
    initializeAudio,
    updateChannel,
    updateMasterVolume,
    updateLimiterThreshold,
    updateNoiseGate,
    getMasterAnalyserData,
    startBroadcast,
    stopBroadcast,
    getBroadcastStream,
    getChannelAnalyser: (channelId: string) => {
      const nodes = channelNodesRef.current.get(channelId)
      if (nodes && audioContextRef.current) {
        const analyser = audioContextRef.current.createAnalyser()
        nodes.limiter.connect(analyser)
        return analyser
      }
      return null
    }
  }
}