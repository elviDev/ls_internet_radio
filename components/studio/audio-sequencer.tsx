"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  Edit,
  Clock,
  Volume2,
  Layers,
  SkipForward,
  SkipBack,
  RotateCcw,
  Save,
  Upload,
  Download
} from "lucide-react"

interface SoundEffect {
  id: string
  name: string
  category: 'jingle' | 'transition' | 'effect' | 'voice' | 'music'
  duration: number
  volume: number
  file: string
  color?: string
}

interface SequenceItem {
  id: string
  soundId: string
  startTime: number // seconds from sequence start
  volume: number
  fadeIn: number
  fadeOut: number
  crossfade: number
  layer: number // 0 = main, 1+ = overlay layers
  sound?: SoundEffect
}

interface AudioSequencerProps {
  sounds: SoundEffect[]
  onSequencePlay: (sequence: SequenceItem[]) => void
  onSequenceStop: () => void
}

export function AudioSequencer({ sounds, onSequencePlay, onSequenceStop }: AudioSequencerProps) {
  const [sequence, setSequence] = useState<SequenceItem[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [zoom, setZoom] = useState(10) // pixels per second
  const [previewingSound, setPreviewingSound] = useState<string | null>(null)
  
  const timelineRef = useRef<HTMLDivElement>(null)
  const playbackRef = useRef<NodeJS.Timeout>()
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({})
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  // Calculate total sequence duration
  useEffect(() => {
    const maxEndTime = sequence.reduce((max, item) => {
      const sound = sounds.find(s => s.id === item.soundId)
      const endTime = item.startTime + (sound?.duration || 0)
      return Math.max(max, endTime)
    }, 0)
    setTotalDuration(maxEndTime)
  }, [sequence, sounds])

  const addToSequence = (soundId: string, startTime: number = currentTime) => {
    const sound = sounds.find(s => s.id === soundId)
    if (!sound) return

    const newItem: SequenceItem = {
      id: Date.now().toString(),
      soundId,
      startTime,
      volume: sound.volume,
      fadeIn: 0,
      fadeOut: 0,
      crossfade: 0,
      layer: 0,
      sound
    }

    setSequence(prev => [...prev, newItem].sort((a, b) => a.startTime - b.startTime))
    setShowAddDialog(false)
  }

  const updateSequenceItem = (itemId: string, updates: Partial<SequenceItem>) => {
    setSequence(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ))
  }

  const removeFromSequence = (itemId: string) => {
    setSequence(prev => prev.filter(item => item.id !== itemId))
    if (selectedItem === itemId) {
      setSelectedItem(null)
    }
  }

  const playSequence = async () => {
    if (sequence.length === 0) return

    setIsPlaying(true)
    setCurrentTime(0)
    
    // Schedule all audio items
    const scheduledItems = sequence.map(item => {
      const sound = sounds.find(s => s.id === item.soundId)
      if (!sound) return null

      return {
        ...item,
        sound,
        scheduledTime: item.startTime * 1000 // convert to milliseconds
      }
    }).filter(Boolean)

    // Start playback timer
    const startTime = Date.now()
    playbackRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      setCurrentTime(elapsed)

      // Check for items to play
      scheduledItems.forEach(item => {
        if (!item) return
        
        const shouldPlay = elapsed >= item.startTime && elapsed < item.startTime + 0.1
        if (shouldPlay) {
          playScheduledItem(item)
        }
      })

      // Stop when sequence ends
      if (elapsed >= totalDuration) {
        stopSequence()
      }
    }, 100)

    onSequencePlay(sequence)
  }

  const playScheduledItem = async (item: any) => {
    try {
      if (!audioRefs.current[item.id]) {
        const audio = new Audio(item.sound.file)
        audio.volume = (item.volume / 100) * (item.sound.volume / 100)
        audioRefs.current[item.id] = audio
      }

      const audio = audioRefs.current[item.id]
      
      // Apply crossfade if specified
      if (item.crossfade > 0) {
        audio.volume = 0
        audio.play()
        
        // Fade in
        const fadeSteps = item.crossfade * 10
        let step = 0
        const fadeInterval = setInterval(() => {
          step++
          const progress = step / fadeSteps
          audio.volume = ((item.volume / 100) * (item.sound.volume / 100)) * progress
          
          if (step >= fadeSteps) {
            clearInterval(fadeInterval)
          }
        }, 100)
      } else {
        await audio.play()
      }
    } catch (error) {
      console.error('Error playing scheduled item:', error)
    }
  }

  const stopSequence = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    
    if (playbackRef.current) {
      clearInterval(playbackRef.current)
    }

    // Stop all audio
    Object.values(audioRefs.current).forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })

    onSequenceStop()
  }

  const previewSound = async (sound: SoundEffect) => {
    // Stop any currently playing preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }

    if (previewingSound === sound.id) {
      setPreviewingSound(null)
      return
    }

    try {
      const audio = new Audio(sound.file)
      audio.volume = sound.volume / 100
      previewAudioRef.current = audio
      
      setPreviewingSound(sound.id)
      
      audio.addEventListener('ended', () => {
        setPreviewingSound(null)
        previewAudioRef.current = null
      })
      
      await audio.play()
    } catch (error) {
      console.error('Error previewing sound:', error)
      setPreviewingSound(null)
    }
  }

  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }
    setPreviewingSound(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getItemPosition = (item: SequenceItem) => ({
    left: item.startTime * zoom,
    width: (item.sound?.duration || 0) * zoom,
    top: item.layer * 40
  })

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickTime = clickX / zoom
    setCurrentTime(clickTime)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Audio Sequencer
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {sequence.length} items • {formatTime(totalDuration)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Sound
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={isPlaying ? stopSequence : playSequence}
              disabled={sequence.length === 0}
              className="h-10 w-10 rounded-full"
            >
              {isPlaying ? (
                <Square className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentTime(0)}
              disabled={isPlaying}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <div className="text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm">Zoom:</Label>
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={5}
              max={50}
              step={5}
              className="w-24"
            />
            <span className="text-xs text-gray-500">{zoom}px/s</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="border rounded-lg bg-gray-50 overflow-hidden">
          {/* Time ruler */}
          <div className="h-8 bg-gray-100 border-b relative">
            {Array.from({ length: Math.ceil(totalDuration) + 1 }, (_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-l border-gray-300 text-xs text-gray-600 pl-1"
                style={{ left: i * zoom }}
              >
                {formatTime(i)}
              </div>
            ))}
          </div>

          {/* Timeline tracks */}
          <div
            ref={timelineRef}
            className="relative h-64 overflow-auto cursor-crosshair"
            onClick={handleTimelineClick}
            style={{ minWidth: Math.max(800, totalDuration * zoom) }}
          >
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
              style={{ left: currentTime * zoom }}
            />

            {/* Layer guides */}
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="absolute w-full h-10 border-b border-gray-200"
                style={{ top: i * 40 }}
              >
                <div className="text-xs text-gray-400 p-1">
                  {i === 0 ? 'Main' : `Layer ${i}`}
                </div>
              </div>
            ))}

            {/* Sequence items */}
            {sequence.map((item) => {
              const position = getItemPosition(item)
              const isSelected = selectedItem === item.id
              
              return (
                <div
                  key={item.id}
                  className={`absolute h-8 rounded border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-100 shadow-lg' 
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                  style={{
                    left: position.left,
                    width: Math.max(position.width, 60),
                    top: position.top + 20
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedItem(item.id)
                  }}
                >
                  <div className="p-1 text-xs truncate">
                    <div className="font-medium">{item.sound?.name}</div>
                    <div className="text-gray-500">
                      {formatTime(item.startTime)} • {item.volume}%
                    </div>
                  </div>
                  
                  {/* Crossfade indicator */}
                  {item.crossfade > 0 && (
                    <div
                      className="absolute top-0 bottom-0 bg-yellow-200 opacity-50"
                      style={{ width: item.crossfade * zoom }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Item Properties Panel */}
        {selectedItem && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Edit Audio Item</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromSequence(selectedItem)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const item = sequence.find(i => i.id === selectedItem)
                if (!item) return null

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs">Start Time (s)</Label>
                      <Input
                        type="number"
                        value={item.startTime}
                        onChange={(e) => updateSequenceItem(item.id, { 
                          startTime: parseFloat(e.target.value) || 0 
                        })}
                        step="0.1"
                        className="h-8"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Volume (%)</Label>
                      <Input
                        type="number"
                        value={item.volume}
                        onChange={(e) => updateSequenceItem(item.id, { 
                          volume: parseInt(e.target.value) || 0 
                        })}
                        min="0"
                        max="100"
                        className="h-8"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Crossfade (s)</Label>
                      <Input
                        type="number"
                        value={item.crossfade}
                        onChange={(e) => updateSequenceItem(item.id, { 
                          crossfade: parseFloat(e.target.value) || 0 
                        })}
                        step="0.1"
                        min="0"
                        className="h-8"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Layer</Label>
                      <Select
                        value={item.layer.toString()}
                        onValueChange={(value) => updateSequenceItem(item.id, { 
                          layer: parseInt(value) 
                        })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Main</SelectItem>
                          <SelectItem value="1">Layer 1</SelectItem>
                          <SelectItem value="2">Layer 2</SelectItem>
                          <SelectItem value="3">Layer 3</SelectItem>
                          <SelectItem value="4">Layer 4</SelectItem>
                          <SelectItem value="5">Layer 5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* Add Sound Dialog */}
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open)
          if (!open) {
            stopPreview()
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Sound to Sequence</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="number"
                  value={currentTime}
                  onChange={(e) => setCurrentTime(parseFloat(e.target.value) || 0)}
                  step="0.1"
                  min="0"
                />
              </div>
              
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {sounds.map((sound) => (
                    <div
                      key={sound.id}
                      className={`p-3 border rounded transition-colors ${
                        previewingSound === sound.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{sound.name}</div>
                          <div className="text-sm text-gray-500">
                            {sound.category} • {formatTime(sound.duration)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{sound.volume}%</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              previewSound(sound)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            {previewingSound === sound.id ? (
                              <Square className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => addToSequence(sound.id, currentTime)}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>

        {/* Sequence Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSequence([])}
            disabled={sequence.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            disabled={sequence.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Sequence
          </Button>
          
          <Button
            variant="outline"
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Load Sequence
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}