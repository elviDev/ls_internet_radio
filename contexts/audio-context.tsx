"use client"

import { createContext, useContext, useRef, useState, useEffect, ReactNode } from 'react'

interface Track {
  id: string
  title: string
  artist: string
  duration: number
  assetUrl?: string
  genre?: string
  bpm?: number
}

interface AudioContextType {
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  volume: number
  isMuted: boolean
  gain: number
  eq: { low: number; mid: number; high: number }
  peak: number
  play: () => void
  pause: () => void
  setTrack: (track: Track) => void
  setVolume: (volume: number) => void
  setGain: (gain: number) => void
  setEQ: (eq: { low: number; mid: number; high: number }) => void
  toggleMute: () => void
  seek: (time: number) => void
}

const AudioContext = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolumeState] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  const [gain, setGainState] = useState(45)
  const [eq, setEQState] = useState({ low: 55, mid: 50, high: 48 })
  const [peak, setPeak] = useState(0)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const eqNodesRef = useRef<{ low: BiquadFilterNode; mid: BiquadFilterNode; high: BiquadFilterNode } | null>(null)

  // Initialize audio element and Web Audio API
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.preload = 'metadata'
    audioRef.current.crossOrigin = 'anonymous'
    
    const audio = audioRef.current

    // Initialize Web Audio API for advanced processing
    const initWebAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // Create audio nodes
        const source = audioContextRef.current.createMediaElementSource(audio)
        gainNodeRef.current = audioContextRef.current.createGain()
        analyserRef.current = audioContextRef.current.createAnalyser()
        
        // Create EQ filters
        const lowFilter = audioContextRef.current.createBiquadFilter()
        const midFilter = audioContextRef.current.createBiquadFilter()
        const highFilter = audioContextRef.current.createBiquadFilter()
        
        lowFilter.type = 'lowshelf'
        lowFilter.frequency.value = 320
        midFilter.type = 'peaking'
        midFilter.frequency.value = 1000
        midFilter.Q.value = 1
        highFilter.type = 'highshelf'
        highFilter.frequency.value = 3200
        
        eqNodesRef.current = { low: lowFilter, mid: midFilter, high: highFilter }
        
        // Connect audio chain
        source.connect(lowFilter)
        lowFilter.connect(midFilter)
        midFilter.connect(highFilter)
        highFilter.connect(gainNodeRef.current)
        gainNodeRef.current.connect(analyserRef.current)
        analyserRef.current.connect(audioContextRef.current.destination)
        
        // Configure analyser
        analyserRef.current.fftSize = 256
      }
    }

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(Math.floor(audio.currentTime))
    })

    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      setCurrentTime(0)
    })

    audio.addEventListener('loadedmetadata', () => {
      console.log('Audio loaded:', currentTrack?.title)
    })

    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e)
      setIsPlaying(false)
    })

    audio.addEventListener('play', () => {
      initWebAudio()
    })

    return () => {
      audio.pause()
      audio.src = ''
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack?.assetUrl) {
      audioRef.current.src = currentTrack.assetUrl
      audioRef.current.load()
      setCurrentTime(0)
    }
  }, [currentTrack])

  // Update volume and gain
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : (volume * gain) / 10000
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : (volume * gain) / 10000
    }
  }, [volume, gain, isMuted])

  // Update EQ
  useEffect(() => {
    if (eqNodesRef.current) {
      const { low, mid, high } = eqNodesRef.current
      low.gain.value = (eq.low - 50) * 0.3 // -15dB to +15dB
      mid.gain.value = (eq.mid - 50) * 0.3
      high.gain.value = (eq.high - 50) * 0.3
    }
  }, [eq])

  // Peak monitoring
  useEffect(() => {
    if (!analyserRef.current || !isPlaying) return

    const updatePeak = () => {
      const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount)
      analyserRef.current!.getByteFrequencyData(dataArray)
      const peak = Math.max(...dataArray)
      setPeak((peak / 255) * 100)
    }

    const intervalId = setInterval(updatePeak, 50)
    return () => clearInterval(intervalId)
  }, [isPlaying])

  const play = async () => {
    if (!audioRef.current || !currentTrack?.assetUrl) return
    
    try {
      await audioRef.current.play()
      setIsPlaying(true)
    } catch (error) {
      console.error('Play error:', error)
    }
  }

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const setTrack = (track: Track) => {
    setCurrentTrack(track)
  }

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume)
    setIsMuted(false)
  }

  const setGain = (newGain: number) => {
    setGainState(newGain)
  }

  const setEQ = (newEQ: { low: number; mid: number; high: number }) => {
    setEQState(newEQ)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  return (
    <AudioContext.Provider value={{
      currentTrack,
      isPlaying,
      currentTime,
      volume,
      isMuted,
      gain,
      eq,
      peak,
      play,
      pause,
      setTrack,
      setVolume,
      setGain,
      setEQ,
      toggleMute,
      seek
    }}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider')
  }
  return context
}