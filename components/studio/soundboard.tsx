"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Zap,
  Music,
  Bell,
  Mic,
  Radio,
  Clock,
  AlertCircle,
  Trash2,
  Upload,
  Download,
  Settings,
  RotateCcw,
  FastForward,
  Rewind,
  Repeat
} from "lucide-react"

type Asset = {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  type: "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT"
  url: string
  description?: string
  tags?: string
  uploadedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

interface SoundEffect {
  id: string
  name: string
  category: 'jingle' | 'transition' | 'effect' | 'voice' | 'music'
  duration: number
  volume: number
  file: string
  hotkey?: string
  loop?: boolean
  fadeIn?: number
  fadeOut?: number
  color?: string
  tags?: string[]
  asset?: Asset
}

interface SoundboardProps {
  isLive: boolean
  onSoundPlay: (sound: SoundEffect) => void
  onSoundStop: (soundId: string) => void
}

export function Soundboard({ isLive, onSoundPlay, onSoundStop }: SoundboardProps) {
  const [sounds, setSounds] = useState<SoundEffect[]>([
    {
      id: 'jingle1',
      name: 'Station ID',
      category: 'jingle',
      duration: 15,
      volume: 85,
      hotkey: 'F1',
      fadeIn: 0,
      fadeOut: 1,
      color: 'bg-blue-500',
      tags: ['station', 'id', 'branding']
    },
    {
      id: 'jingle2',
      name: 'News Intro',
      category: 'jingle',
      duration: 8,
      volume: 80,
      hotkey: 'F2',
      fadeIn: 0,
      fadeOut: 0.5,
      color: 'bg-red-500',
      tags: ['news', 'intro']
    },
    {
      id: 'transition1',
      name: 'Swoosh',
      category: 'transition',
      duration: 3,
      volume: 70,
      hotkey: 'F3',
      fadeIn: 0,
      fadeOut: 0,
      color: 'bg-green-500',
      tags: ['transition', 'swoosh']
    },
    {
      id: 'transition2',
      name: 'Whoosh Down',
      category: 'transition',
      duration: 2,
      volume: 75,
      hotkey: 'F4',
      fadeIn: 0,
      fadeOut: 0,
      color: 'bg-green-600',
      tags: ['transition', 'whoosh', 'down']
    },
    {
      id: 'effect1',
      name: 'Applause',
      category: 'effect',
      duration: 12,
      volume: 65,
      hotkey: 'F5',
      fadeIn: 0,
      fadeOut: 2,
      color: 'bg-yellow-500',
      tags: ['applause', 'crowd', 'positive']
    },
    {
      id: 'effect2',
      name: 'Air Horn',
      category: 'effect',
      duration: 4,
      volume: 90,
      hotkey: 'F6',
      fadeIn: 0,
      fadeOut: 0,
      color: 'bg-orange-500',
      tags: ['horn', 'attention', 'loud']
    },
    {
      id: 'voice1',
      name: 'Coming Up Next',
      category: 'voice',
      duration: 6,
      volume: 80,
      hotkey: 'F7',
      fadeIn: 0,
      fadeOut: 0.5,
      color: 'bg-purple-500',
      tags: ['voice', 'announcement', 'next']
    },
    {
      id: 'voice2',
      name: 'Stay Tuned',
      category: 'voice',
      duration: 4,
      volume: 80,
      hotkey: 'F8',
      fadeIn: 0,
      fadeOut: 0.5,
      color: 'bg-purple-600',
      tags: ['voice', 'announcement', 'stay']
    },
    {
      id: 'music1',
      name: 'Bed Track 1',
      category: 'music',
      duration: 180,
      volume: 40,
      hotkey: 'F9',
      loop: true,
      fadeIn: 2,
      fadeOut: 3,
      color: 'bg-indigo-500',
      tags: ['bed', 'background', 'music']
    },
    {
      id: 'music2',
      name: 'Upbeat Underscore',
      category: 'music',
      duration: 120,
      volume: 45,
      hotkey: 'F10',
      loop: true,
      fadeIn: 1.5,
      fadeOut: 2,
      color: 'bg-indigo-600',
      tags: ['underscore', 'upbeat', 'background']
    }
  ])

  const [playingSounds, setPlayingSounds] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [masterVolume, setMasterVolume] = useState(75)
  const [searchTerm, setSearchTerm] = useState('')
  const [soundProgress, setSoundProgress] = useState<{ [key: string]: number }>({})

  // Asset management
  const [audioAssets, setAudioAssets] = useState<Asset[]>([])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    name: "",
    description: "",
    category: 'effect' as SoundEffect['category'],
    tags: ""
  })
  const [isUploading, setIsUploading] = useState(false)

  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({})
  const progressIntervals = useRef<{ [key: string]: NodeJS.Timeout }>({})

  const categories = [
    { value: 'all', label: 'All Sounds', icon: Zap },
    { value: 'jingle', label: 'Jingles', icon: Radio },
    { value: 'transition', label: 'Transitions', icon: FastForward },
    { value: 'effect', label: 'Effects', icon: Bell },
    { value: 'voice', label: 'Voice', icon: Mic },
    { value: 'music', label: 'Music Beds', icon: Music }
  ]

  const filteredSounds = sounds.filter(sound => {
    const matchesCategory = selectedCategory === 'all' || sound.category === selectedCategory
    const matchesSearch = sound.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sound.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const handleSoundPlay = (sound: SoundEffect) => {
    if (!isLive) return

    setPlayingSounds(prev => new Set([...prev, sound.id]))
    setSoundProgress(prev => ({ ...prev, [sound.id]: 0 }))

    // Start progress tracking
    progressIntervals.current[sound.id] = setInterval(() => {
      setSoundProgress(prev => {
        const newProgress = (prev[sound.id] || 0) + (100 / sound.duration)
        if (newProgress >= 100) {
          handleSoundStop(sound.id)
          return { ...prev, [sound.id]: 100 }
        }
        return { ...prev, [sound.id]: newProgress }
      })
    }, 1000)

    onSoundPlay(sound)

    // Auto-stop after duration if not looping
    if (!sound.loop) {
      setTimeout(() => {
        handleSoundStop(sound.id)
      }, sound.duration * 1000)
    }
  }

  const handleSoundStop = (soundId: string) => {
    setPlayingSounds(prev => {
      const newSet = new Set(prev)
      newSet.delete(soundId)
      return newSet
    })

    if (progressIntervals.current[soundId]) {
      clearInterval(progressIntervals.current[soundId])
      delete progressIntervals.current[soundId]
    }

    setSoundProgress(prev => ({ ...prev, [soundId]: 0 }))
    onSoundStop(soundId)
  }

  const handleStopAll = () => {
    playingSounds.forEach(soundId => {
      handleSoundStop(soundId)
    })
  }

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category)
    return cat ? cat.icon : Zap
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Professional Soundboard
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={playingSounds.size > 0 ? "destructive" : "outline"}>
              {playingSounds.size} Playing
            </Badge>
            {playingSounds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStopAll}
              >
                <Square className="h-4 w-4 mr-2" />
                Stop All
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <span className="text-sm font-medium">Master:</span>
            <Slider
              value={[masterVolume]}
              onValueChange={(value) => setMasterVolume(value[0])}
              max={100}
              step={1}
              className="w-24"
            />
            <span className="text-sm text-slate-500 w-8">{masterVolume}%</span>
          </div>

          <div className="flex-1">
            <Input
              placeholder="Search sounds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => {
                const Icon = category.icon
                return (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {category.label}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Sound Grid */}
        <ScrollArea className="h-96">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredSounds.map((sound) => {
              const isPlaying = playingSounds.has(sound.id)
              const progress = soundProgress[sound.id] || 0
              const Icon = getCategoryIcon(sound.category)

              return (
                <div key={sound.id} className="relative">
                  <Button
                    variant="outline"
                    className={`w-full h-24 p-3 flex flex-col items-center justify-center space-y-1 relative overflow-hidden transition-all ${
                      isPlaying 
                        ? 'border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-105' 
                        : 'hover:bg-slate-50'
                    } ${!isLive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => isPlaying ? handleSoundStop(sound.id) : handleSoundPlay(sound)}
                    disabled={!isLive}
                  >
                    {/* Progress Background */}
                    {isPlaying && (
                      <div 
                        className="absolute inset-0 bg-blue-100 transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    )}

                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center space-y-1">
                      <div className="flex items-center gap-1">
                        <Icon className="h-4 w-4" />
                        {isPlaying ? (
                          <Square className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium leading-tight">
                          {sound.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDuration(sound.duration)}
                        </div>
                      </div>
                    </div>

                    {/* Hotkey Badge */}
                    {sound.hotkey && (
                      <Badge 
                        variant="secondary" 
                        className="absolute top-1 right-1 text-xs h-4 px-1"
                      >
                        {sound.hotkey}
                      </Badge>
                    )}

                    {/* Loop Indicator */}
                    {sound.loop && (
                      <Repeat className="absolute bottom-1 right-1 h-3 w-3 text-slate-400" />
                    )}

                    {/* Volume Indicator */}
                    <div className="absolute bottom-1 left-1 text-xs text-slate-400">
                      {sound.volume}%
                    </div>
                  </Button>

                  {/* Progress Bar */}
                  {isPlaying && (
                    <Progress 
                      value={progress} 
                      className="absolute -bottom-1 left-0 right-0 h-1"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>

        {/* Quick Access Buttons */}
        <div className="grid grid-cols-5 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!isLive}
            onClick={() => {
              const stationId = sounds.find(s => s.id === 'jingle1')
              if (stationId) handleSoundPlay(stationId)
            }}
          >
            <Radio className="h-4 w-4 mr-1" />
            ID
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            disabled={!isLive}
            onClick={() => {
              const transition = sounds.find(s => s.category === 'transition')
              if (transition) handleSoundPlay(transition)
            }}
          >
            <FastForward className="h-4 w-4 mr-1" />
            Trans
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            disabled={!isLive}
            onClick={() => {
              const applause = sounds.find(s => s.id === 'effect1')
              if (applause) handleSoundPlay(applause)
            }}
          >
            <Bell className="h-4 w-4 mr-1" />
            FX
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            disabled={!isLive}
            onClick={() => {
              const voice = sounds.find(s => s.category === 'voice')
              if (voice) handleSoundPlay(voice)
            }}
          >
            <Mic className="h-4 w-4 mr-1" />
            Voice
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleStopAll}
            disabled={playingSounds.size === 0}
          >
            <Square className="h-4 w-4 mr-1" />
            Stop
          </Button>
        </div>

        {/* Currently Playing */}
        {playingSounds.size > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Currently Playing:</h4>
            <div className="space-y-1">
              {Array.from(playingSounds).map(soundId => {
                const sound = sounds.find(s => s.id === soundId)
                if (!sound) return null
                
                const progress = soundProgress[soundId] || 0
                const Icon = getCategoryIcon(sound.category)
                
                return (
                  <div key={soundId} className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                    <Icon className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{sound.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSoundStop(soundId)}
                          className="h-6 w-6 p-0"
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      </div>
                      <Progress value={progress} className="h-1 mt-1" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}