"use client"

import { useState, useRef, useEffect } from "react"
import { useAudioAssets } from "@/hooks/use-audio-assets"
import { defaultRadioSounds, generateDemoAudio } from "@/lib/default-sounds"
import { AudioSequencer } from "./audio-sequencer"
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
  const [sounds, setSounds] = useState<SoundEffect[]>([])

  const [playingSounds, setPlayingSounds] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [masterVolume, setMasterVolume] = useState(75)

  // Update all playing audio volumes when master volume changes
  useEffect(() => {
    Object.entries(audioRefs.current).forEach(([soundId, audio]) => {
      if (playingSounds.has(soundId)) {
        const sound = sounds.find(s => s.id === soundId)
        if (sound) {
          audio.volume = (sound.volume / 100) * (masterVolume / 100)
        }
      }
    })
  }, [masterVolume, playingSounds, sounds])
  const [searchTerm, setSearchTerm] = useState('')
  const [soundProgress, setSoundProgress] = useState<{ [key: string]: number }>({})

  // Asset management
  const { assets, loading, fetchAssets, uploadAsset } = useAudioAssets()
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
  const audioContextRef = useRef<AudioContext | null>(null)

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

  const handleSoundPlay = async (sound: SoundEffect) => {
    try {
      // Check if sound has audio file
      if (!sound.asset?.url && !sound.file) {
        console.error('Sound has no audio file:', sound.name)
        toast.error(`No audio file for ${sound.name}`)
        return
      }

      // Initialize audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      // Create or get audio element
      if (!audioRefs.current[sound.id]) {
        const audio = new Audio()
        audio.src = sound.asset?.url || sound.file || ''
        audio.volume = (sound.volume / 100) * (masterVolume / 100)
        audio.loop = sound.loop || false
        audio.crossOrigin = 'anonymous'
        audioRefs.current[sound.id] = audio
      }

      const audio = audioRefs.current[sound.id]
      audio.volume = (sound.volume / 100) * (masterVolume / 100)
      
      setPlayingSounds(prev => new Set([...prev, sound.id]))
      setSoundProgress(prev => ({ ...prev, [sound.id]: 0 }))

      // Play the audio
      await audio.play()

      // Start progress tracking
      progressIntervals.current[sound.id] = setInterval(() => {
        if (audio.ended && !audio.loop) {
          handleSoundStop(sound.id)
          return
        }
        
        const progress = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0
        setSoundProgress(prev => ({ ...prev, [sound.id]: progress }))
        
        if (progress >= 100 && !audio.loop) {
          handleSoundStop(sound.id)
        }
      }, 100)

      // Handle audio ended event
      audio.onended = () => {
        if (!audio.loop) {
          handleSoundStop(sound.id)
        }
      }

      onSoundPlay(sound)
    } catch (error) {
      console.error('Error playing sound:', error)
      toast.error(`Failed to play ${sound.name}`)
    }
  }

  const handleSoundStop = (soundId: string) => {
    // Stop actual audio
    if (audioRefs.current[soundId]) {
      audioRefs.current[soundId].pause()
      audioRefs.current[soundId].currentTime = 0
    }

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
    // Stop all audio elements
    Object.values(audioRefs.current).forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
    
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

  // Load sounds from audio assets and add default sounds
  useEffect(() => {
    fetchAssets({ type: 'jingle,effect,voice' })
  }, [])

  // Convert assets to sound effects and add default radio sounds
  useEffect(() => {
    // Convert uploaded assets
    const assetSounds: SoundEffect[] = assets.map((asset, index) => {
      let metadata = {}
      try {
        metadata = asset.tags ? JSON.parse(asset.tags) : {}
      } catch (error) {
        // If tags is not valid JSON, treat as plain string
        metadata = { tags: asset.tags ? asset.tags.split(',') : [] }
      }
      const audioType = metadata.audioType || 'effect'
      
      return {
        id: asset.id,
        name: asset.description || asset.originalName,
        category: audioType as SoundEffect['category'],
        duration: metadata.duration || 30,
        volume: 75,
        file: asset.url,
        hotkey: `F${(index % 12) + 1}`,
        fadeIn: 0,
        fadeOut: 0.5,
        color: getCategoryColor(audioType),
        tags: metadata.tags || [audioType],
        asset
      }
    })
    
    // Add default radio sounds with generated demo audio
    const defaultSounds: SoundEffect[] = defaultRadioSounds.map(sound => ({
      ...sound,
      file: generateDemoAudio(sound)
    }))
    
    // Combine uploaded assets with default sounds
    setSounds([...defaultSounds, ...assetSounds])
  }, [assets])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'jingle': return 'bg-blue-500'
      case 'transition': return 'bg-green-500'
      case 'effect': return 'bg-yellow-500'
      case 'voice': return 'bg-purple-500'
      case 'music': return 'bg-indigo-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Audio Sequencer */}
      <AudioSequencer
        sounds={sounds}
        onSequencePlay={(sequence) => {
          console.log('Playing sequence:', sequence)
          // Handle sequence playback
        }}
        onSequenceStop={() => {
          console.log('Sequence stopped')
          // Handle sequence stop
        }}
      />
      
      {/* Traditional Soundboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Access Soundboard
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
          {loading ? (
            <div className="text-center py-8">Loading sounds...</div>
          ) : filteredSounds.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No sounds available. Upload audio files to get started.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredSounds.map((sound) => {
                const isPlaying = playingSounds.has(sound.id)
                const progress = soundProgress[sound.id] || 0
                const Icon = getCategoryIcon(sound.category)
                const hasAudio = sound.asset?.url || sound.file

                return (
                  <div key={sound.id} className="relative">
                    <Button
                      variant="outline"
                      className={`w-full h-24 p-3 flex flex-col items-center justify-center space-y-1 relative overflow-hidden transition-all ${
                        isPlaying 
                          ? 'border-2 border-blue-500 bg-blue-50 shadow-lg transform scale-105' 
                          : 'hover:bg-slate-50'
                      } ${!hasAudio ? 'opacity-50 cursor-not-allowed border-red-200' : ''}`}
                      onClick={() => {
                        if (!hasAudio) {
                          toast.error('No audio file available')
                          return
                        }
                        isPlaying ? handleSoundStop(sound.id) : handleSoundPlay(sound)
                      }}
                      disabled={!hasAudio}
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
                          {!hasAudio ? (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          ) : isPlaying ? (
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
          )}
        </ScrollArea>

        {/* Quick Access Buttons */}
        <div className="grid grid-cols-5 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const jingle = sounds.find(s => s.category === 'jingle')
              if (jingle) handleSoundPlay(jingle)
            }}
            disabled={!sounds.find(s => s.category === 'jingle')}
          >
            <Radio className="h-4 w-4 mr-1" />
            Jingle
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const transition = sounds.find(s => s.category === 'transition')
              if (transition) handleSoundPlay(transition)
            }}
            disabled={!sounds.find(s => s.category === 'transition')}
          >
            <FastForward className="h-4 w-4 mr-1" />
            Trans
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const effect = sounds.find(s => s.category === 'effect')
              if (effect) handleSoundPlay(effect)
            }}
            disabled={!sounds.find(s => s.category === 'effect')}
          >
            <Bell className="h-4 w-4 mr-1" />
            FX
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const voice = sounds.find(s => s.category === 'voice')
              if (voice) handleSoundPlay(voice)
            }}
            disabled={!sounds.find(s => s.category === 'voice')}
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

        {/* Upload Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setIsUploadDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Sound Effects
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

        {/* Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Sound Effect</DialogTitle>
              <DialogDescription>
                Upload audio files for jingles, effects, transitions, and voice clips.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sound-file">Audio File</Label>
                <Input
                  id="sound-file"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setUploadForm(prev => ({ ...prev, file, name: file.name.replace(/\.[^/.]+$/, '') }))
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="sound-name">Name</Label>
                <Input
                  id="sound-name"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Sound effect name"
                />
              </div>
              <div>
                <Label htmlFor="sound-category">Category</Label>
                <Select
                  value={uploadForm.category}
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value as SoundEffect['category'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jingle">Jingle</SelectItem>
                    <SelectItem value="transition">Transition</SelectItem>
                    <SelectItem value="effect">Effect</SelectItem>
                    <SelectItem value="voice">Voice</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sound-description">Description</Label>
                <Textarea
                  id="sound-description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the sound effect"
                />
              </div>
              <div>
                <Label htmlFor="sound-tags">Tags (comma separated)</Label>
                <Input
                  id="sound-tags"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g. applause, crowd, positive"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!uploadForm.file || !uploadForm.name) return
                    
                    setIsUploading(true)
                    try {
                      await uploadAsset(uploadForm.file, {
                        title: uploadForm.name,
                        description: uploadForm.description,
                        audioType: uploadForm.category,
                        tags: uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean)
                      })
                      
                      toast.success('Sound effect uploaded successfully')
                      setIsUploadDialogOpen(false)
                      setUploadForm({ file: null, name: '', description: '', category: 'effect', tags: '' })
                      fetchAssets({ type: 'jingle,effect,voice' })
                    } catch (error) {
                      console.error('Upload failed:', error)
                      toast.error('Failed to upload sound effect')
                    } finally {
                      setIsUploading(false)
                    }
                  }}
                  disabled={!uploadForm.file || !uploadForm.name || isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}