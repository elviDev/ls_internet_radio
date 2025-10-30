"use client"

import { useState, useEffect, useRef } from "react"
import { useAudioAssets } from "@/hooks/use-audio-assets"
import { useAudio } from "@/contexts/audio-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Music,
  Clock,
  Search,
  List,
  Radio,
  Upload,
  Download,
  Trash2,
  Heart,
  MoreHorizontal,
  BarChart3,
  Plus,
  X,
  Edit,
  PlayCircle
} from "lucide-react"

interface Track {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  genre?: string
  bpm?: number
  key?: string
  intro?: number
  outro?: number
  energy?: number
  mood?: string
  tags?: string[]
  assetId?: string
  assetUrl?: string
  waveform?: number[]
}

interface Playlist {
  id: string
  name: string
  tracks: Track[]
  autoPlay: boolean
  shuffled: boolean
  looped: boolean
}

interface AudioPlayerProps {
  isLive: boolean
  onTrackChange: (track: Track | null) => void
  onPlaylistChange: (playlist: Playlist) => void
}

export function AudioPlayer({ isLive, onTrackChange, onPlaylistChange }: AudioPlayerProps) {
  // Use global audio context
  const {
    currentTrack,
    isPlaying,
    currentTime,
    volume,
    isMuted,
    play,
    pause,
    setTrack,
    setVolume: setGlobalVolume,
    toggleMute
  } = useAudio()
  const [isShuffled, setIsShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none')
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [crossfadeTime, setCrossfadeTime] = useState(3)
  const [autoMix, setAutoMix] = useState(false)
  const [draggedTrack, setDraggedTrack] = useState<Track | null>(null)
  const [crossfadeActive, setCrossfadeActive] = useState(false)
  const [showAssetBrowser, setShowAssetBrowser] = useState(false)
  const [assetSearch, setAssetSearch] = useState('')
  const [selectedAssetType, setSelectedAssetType] = useState('')

  const audioRef = useRef<HTMLAudioElement>(null)
  const nextAudioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { assets, loading, fetchAssets, uploadAsset } = useAudioAssets()
  const progressRef = useRef<HTMLDivElement>(null)
  const [showAddTrack, setShowAddTrack] = useState(false)
  const [newTrack, setNewTrack] = useState({
    title: '',
    artist: '',
    duration: 180,
    genre: '',
    bpm: 120,
    audioFile: null as File | null
  })

  const [playlists, setPlaylists] = useState<Playlist[]>([
    {
      id: 'main',
      name: 'Main Playlist',
      autoPlay: true,
      shuffled: false,
      looped: true,
      tracks: []
    }
  ])

  const getCurrentPlaylist = () => {
    return playlists.find(p => p.id === selectedPlaylist)
  }

  const filteredTracks = getCurrentPlaylist()?.tracks.filter(track =>
    track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.genre?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  useEffect(() => {
    if (currentTrack) {
      onTrackChange(currentTrack)
    }
  }, [currentTrack, onTrackChange])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && currentTrack) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1
          if (newTime >= currentTrack.duration) {
            handleNext()
            return 0
          }
          return newTime
        })
      }, 1000)
    }
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isPlaying, currentTrack])

  const handlePlay = () => {
    play()
  }

  const handlePause = () => {
    pause()
  }

  const handleNext = () => {
    const playlist = getCurrentPlaylist()
    if (!playlist || !currentTrack) return

    const currentIndex = playlist.tracks.findIndex(t => t.id === currentTrack.id)
    let nextIndex = currentIndex + 1

    if (nextIndex >= playlist.tracks.length) {
      if (repeatMode === 'all' || playlist.looped) {
        nextIndex = 0
      } else {
        setIsPlaying(false)
        return
      }
    }

    setCurrentTrack(playlist.tracks[nextIndex])
    setCurrentTime(0)
  }

  const handlePrevious = () => {
    const playlist = getCurrentPlaylist()
    if (!playlist || !currentTrack) return

    const currentIndex = playlist.tracks.findIndex(t => t.id === currentTrack.id)
    let prevIndex = currentIndex - 1

    if (prevIndex < 0) {
      if (repeatMode === 'all' || playlist.looped) {
        prevIndex = playlist.tracks.length - 1
      } else {
        return
      }
    }

    setCurrentTrack(playlist.tracks[prevIndex])
    setCurrentTime(0)
  }

  const handleTrackSelect = (track: Track) => {
    if (crossfadeActive && currentTrack && crossfadeTime > 0) {
      // Start crossfade
      startCrossfade(track)
    } else {
      // Use global audio context
      setTrack(track)
    }
  }

  const startCrossfade = (nextTrack: Track) => {
    if (!audioRef.current || !nextAudioRef.current) return
    
    setCrossfadeActive(true)
    
    // Load next track
    if (nextTrack.assetUrl) {
      nextAudioRef.current.src = nextTrack.assetUrl
      nextAudioRef.current.load()
      nextAudioRef.current.volume = 0
      nextAudioRef.current.play()
    }
    
    // Crossfade animation
    const fadeSteps = crossfadeTime * 10 // 10 steps per second
    let step = 0
    
    const fadeInterval = setInterval(() => {
      step++
      const progress = step / fadeSteps
      
      if (audioRef.current && nextAudioRef.current) {
        audioRef.current.volume = (volume / 100) * (1 - progress)
        nextAudioRef.current.volume = (volume / 100) * progress
      }
      
      if (step >= fadeSteps) {
        clearInterval(fadeInterval)
        
        // Switch audio elements
        const tempRef = audioRef.current
        audioRef.current = nextAudioRef.current
        nextAudioRef.current = tempRef
        
        if (nextAudioRef.current) {
          nextAudioRef.current.pause()
          nextAudioRef.current.currentTime = 0
        }
        
        setCurrentTrack(nextTrack)
        setCurrentTime(0)
        setCrossfadeActive(false)
      }
    }, 100)
  }

  const handleVolumeChange = (value: number[]) => {
    setGlobalVolume(value[0])
  }

  const handleToggleMute = () => {
    toggleMute()
  }

  const handleFileUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      if (file.type.startsWith('audio/')) {
        try {
          const asset = await uploadAsset(file, {
            title: file.name.replace(/\.[^/.]+$/, ''),
            artist: 'Unknown Artist',
            genre: 'Unknown',
            audioType: 'music'
          })
          
          const metadata = asset.tags ? JSON.parse(asset.tags) : {}
          const track: Track = {
            id: Date.now().toString() + Math.random(),
            title: metadata.title || asset.description || asset.originalName,
            artist: metadata.artist || 'Unknown Artist',
            duration: metadata.duration || 180,
            genre: metadata.genre || 'Unknown',
            bpm: 120,
            energy: Math.floor(Math.random() * 10) + 1,
            mood: 'Custom',
            tags: ['uploaded'],
            assetId: asset.id,
            assetUrl: asset.url
          }
          
          const playlist = getCurrentPlaylist()
          if (playlist) {
            setPlaylists(prev => prev.map(p => 
              p.id === playlist.id 
                ? { ...p, tracks: [...p.tracks, track] }
                : p
            ))
            onPlaylistChange(playlist)
          }
        } catch (error) {
          console.error('Failed to upload audio file:', error)
          // Continue with other files
        }
      }
    }
  }

  const handleAssetSelect = (asset: any) => {
    const metadata = asset.tags ? JSON.parse(asset.tags) : {}
    const track: Track = {
      id: Date.now().toString() + Math.random(),
      title: metadata.title || asset.description || asset.originalName,
      artist: metadata.artist || 'Unknown Artist',
      duration: metadata.duration || 180,
      genre: metadata.genre || 'Unknown',
      bpm: 120,
      energy: Math.floor(Math.random() * 10) + 1,
      mood: 'Custom',
      tags: [metadata.audioType || 'music'],
      assetId: asset.id,
      assetUrl: asset.url
    }
    
    const playlist = getCurrentPlaylist()
    if (playlist) {
      setPlaylists(prev => prev.map(p => 
        p.id === playlist.id 
          ? { ...p, tracks: [...p.tracks, track] }
          : p
      ))
      onPlaylistChange(playlist)
    }
    setShowAssetBrowser(false)
  }

  const searchAssets = async () => {
    await fetchAssets({
      search: assetSearch,
      type: selectedAssetType || undefined
    })
  }

  useEffect(() => {
    if (showAssetBrowser) {
      fetchAssets()
    }
  }, [showAssetBrowser, fetchAssets])

  // Initialize with main playlist selected
  useEffect(() => {
    if (!selectedPlaylist && playlists.length > 0) {
      setSelectedPlaylist(playlists[0].id)
    }
  }, [playlists, selectedPlaylist])

  // Clean up tracks without audio
  const cleanupTracks = () => {
    const playlist = getCurrentPlaylist()
    if (playlist) {
      const validTracks = playlist.tracks.filter(track => track.assetUrl)
      setPlaylists(prev => prev.map(p => 
        p.id === playlist.id 
          ? { ...p, tracks: validTracks }
          : p
      ))
    }
  }

  // Test audio playback
  const testTrackAudio = (track: Track) => {
    if (!track.assetUrl) {
      console.error('Track has no audio file:', track.title)
      return false
    }
    
    const audio = new Audio(track.assetUrl)
    audio.addEventListener('canplay', () => {
      console.log('Audio can play:', track.title)
    })
    audio.addEventListener('error', (e) => {
      console.error('Audio error for', track.title, ':', e)
    })
    
    return true
  }

  const handleAddTrack = async () => {
    if (!newTrack.audioFile || !newTrack.title) return
    
    try {
      // Upload the audio file first
      const asset = await uploadAsset(newTrack.audioFile, {
        title: newTrack.title,
        artist: newTrack.artist || 'Unknown Artist',
        genre: newTrack.genre || 'Unknown',
        audioType: 'music'
      })
      
      // Create track with audio file reference
      const track: Track = {
        id: Date.now().toString(),
        title: newTrack.title,
        artist: newTrack.artist || 'Unknown Artist',
        duration: newTrack.duration,
        genre: newTrack.genre || 'Unknown',
        bpm: newTrack.bpm,
        energy: Math.floor(Math.random() * 10) + 1,
        mood: 'Custom',
        tags: [newTrack.genre?.toLowerCase() || 'music'],
        assetId: asset.id,
        assetUrl: asset.url
      }

      const playlist = getCurrentPlaylist()
      if (playlist) {
        setPlaylists(prev => prev.map(p => 
          p.id === playlist.id 
            ? { ...p, tracks: [...p.tracks, track] }
            : p
        ))
        onPlaylistChange(playlist)
      }

      setNewTrack({ title: '', artist: '', duration: 180, genre: '', bpm: 120, audioFile: null })
      setShowAddTrack(false)
    } catch (error) {
      console.error('Failed to create track:', error)
    }
  }

  const handleDragStart = (track: Track) => {
    setDraggedTrack(track)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (!draggedTrack) return
    
    const playlist = getCurrentPlaylist()
    if (!playlist) return
    
    const draggedIndex = playlist.tracks.findIndex(t => t.id === draggedTrack.id)
    const newTracks = [...playlist.tracks]
    
    // Remove dragged track
    newTracks.splice(draggedIndex, 1)
    
    // Insert at new position
    newTracks.splice(targetIndex, 0, draggedTrack)
    
    setPlaylists(prev => prev.map(p => 
      p.id === playlist.id 
        ? { ...p, tracks: newTracks }
        : p
    ))
    
    setDraggedTrack(null)
    onPlaylistChange({ ...playlist, tracks: newTracks })
  }

  const handleRemoveTrack = (trackId: string) => {
    const playlist = getCurrentPlaylist()
    if (playlist) {
      setPlaylists(prev => prev.map(p => 
        p.id === playlist.id 
          ? { ...p, tracks: p.tracks.filter(t => t.id !== trackId) }
          : p
      ))
      onPlaylistChange(playlist)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getEnergyColor = (energy?: number) => {
    if (!energy) return 'bg-gray-400'
    if (energy >= 8) return 'bg-red-500'
    if (energy >= 6) return 'bg-yellow-500'
    if (energy >= 4) return 'bg-blue-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      {/* Main Player */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Professional Audio Player
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={autoMix ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoMix(!autoMix)}
              >
                Auto Mix {autoMix ? 'ON' : 'OFF'}
              </Button>
              <Badge variant="outline">
                Crossfade: {crossfadeTime}s
              </Badge>
              {crossfadeActive && (
                <Badge variant="destructive" className="animate-pulse">
                  Crossfading...
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Track Display */}
          {currentTrack ? (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">{currentTrack.title}</h3>
                  <p className="text-slate-600">{currentTrack.artist}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{currentTrack.genre}</Badge>
                    {currentTrack.bpm && (
                      <Badge variant="outline">{currentTrack.bpm} BPM</Badge>
                    )}
                    {currentTrack.key && (
                      <Badge variant="outline">{currentTrack.key}</Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Energy:</span>
                    <div className="flex items-center gap-1">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-4 rounded ${
                            i < (currentTrack.energy || 0) 
                              ? getEnergyColor(currentTrack.energy) 
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    Mood: {currentTrack.mood || 'Unknown'}
                  </div>
                  <div className="flex items-center gap-1">
                    {currentTrack.tags?.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-slate-600">
                    Duration: {formatTime(currentTrack.duration)}
                  </div>
                  {currentTrack.intro && (
                    <div className="text-sm text-slate-600">
                      Intro: {currentTrack.intro}s
                    </div>
                  )}
                  {currentTrack.outro && (
                    <div className="text-sm text-slate-600">
                      Outro: {currentTrack.outro}s
                    </div>
                  )}
                </div>
              </div>

              {/* Waveform Visualization */}
              <div className="mt-4">
                <div className="relative h-16 bg-slate-200 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-end justify-center">
                    {[...Array(50)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-blue-400 mx-px transition-all duration-75"
                        style={{
                          height: `${Math.random() * 60 + 20}%`,
                          opacity: i < (currentTime / currentTrack.duration) * 50 ? 1 : 0.3
                        }}
                      />
                    ))}
                  </div>
                  <div 
                    className="absolute top-0 w-1 bg-red-500 h-full"
                    style={{ left: `${(currentTime / currentTrack.duration) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>-{formatTime(currentTrack.duration - currentTime)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No track selected
            </div>
          )}

          {/* Player Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={!currentTrack} // Always enabled for testing
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="lg"
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={!currentTrack} // Always enabled for testing
              className="h-12 w-12 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={!currentTrack} // Always enabled for testing
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <Button
              variant={isShuffled ? "default" : "outline"}
              size="icon"
              onClick={() => setIsShuffled(!isShuffled)}
              disabled={false} // Always enabled for testing
            >
              <Shuffle className="h-4 w-4" />
            </Button>

            <Button
              variant={repeatMode !== 'none' ? "default" : "outline"}
              size="icon"
              onClick={() => setRepeatMode(
                repeatMode === 'none' ? 'all' : 
                repeatMode === 'all' ? 'one' : 'none'
              )}
              disabled={false} // Always enabled for testing
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleMute}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-sm text-slate-500 w-12">
              {isMuted ? 0 : volume}%
            </span>
          </div>

          {/* Crossfade Control */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Crossfade:</span>
            <Slider
              value={[crossfadeTime]}
              onValueChange={(value) => setCrossfadeTime(value[0])}
              max={10}
              min={0}
              step={0.5}
              className="flex-1 max-w-32"
            />
            <span className="text-sm text-slate-500">{crossfadeTime}s</span>
            <Button
              variant={crossfadeActive ? "default" : "outline"}
              size="sm"
              onClick={() => setCrossfadeActive(!crossfadeActive)}
            >
              {crossfadeActive ? 'Crossfade ON' : 'Crossfade OFF'}
            </Button>
          </div>

          {/* Crossfade Audio Element */}
          <audio ref={nextAudioRef} preload="none" />
        </CardContent>
      </Card>

      {/* Playlist Manager */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Playlist Manager
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select playlist" />
                </SelectTrigger>
                <SelectContent>
                  {playlists.map(playlist => (
                    <SelectItem key={playlist.id} value={playlist.id}>
                      {playlist.name} ({playlist.tracks.length} tracks)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAssetBrowser(true)}
              >
                <Music className="h-4 w-4 mr-2" />
                Browse Library
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Quick Upload
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setShowAddTrack(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Track
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={cleanupTracks}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clean Up
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search tracks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Asset Browser */}
          {showAssetBrowser && (
            <div className="mb-4 p-4 border rounded-lg bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Browse Audio Assets</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAssetBrowser(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Search assets..."
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  className="flex-1"
                />
                <Select value={selectedAssetType || undefined} onValueChange={(value) => setSelectedAssetType(value || '')}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="music">Music</SelectItem>
                    <SelectItem value="jingle">Jingle</SelectItem>
                    <SelectItem value="effect">Effect</SelectItem>
                    <SelectItem value="voice">Voice</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={searchAssets} disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <ScrollArea className="h-48">
                {loading ? (
                  <div className="text-center py-4">Loading assets...</div>
                ) : (
                  <div className="space-y-1">
                    {assets.map(asset => (
                      <div
                        key={asset.id}
                        className="p-2 border rounded cursor-pointer hover:bg-slate-100"
                        onClick={() => handleAssetSelect(asset)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{asset.description || asset.originalName}</p>
                            <p className="text-xs text-slate-600">{asset.filename}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs">
                              Audio
                            </Badge>
                            <p className="text-xs text-slate-500">
                              {(asset.size / 1024 / 1024).toFixed(1)}MB
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Add Track Form */}
          {showAddTrack && (
            <div className="mb-4 p-4 border rounded-lg bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Create Track from Audio File</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddTrack(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 border-2 border-dashed border-slate-300 rounded-lg text-center">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0]
                        setNewTrack(prev => ({
                          ...prev,
                          title: file.name.replace(/\.[^/.]+$/, ''),
                          audioFile: file
                        }))
                      }
                    }}
                    className="hidden"
                    id="track-audio-upload"
                  />
                  <label htmlFor="track-audio-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-600">
                      {newTrack.audioFile ? newTrack.audioFile.name : 'Click to select audio file'}
                    </p>
                  </label>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Track Title"
                    value={newTrack.title}
                    onChange={(e) => setNewTrack(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Input
                    placeholder="Artist"
                    value={newTrack.artist}
                    onChange={(e) => setNewTrack(prev => ({ ...prev, artist: e.target.value }))}
                  />
                  <Input
                    placeholder="Genre"
                    value={newTrack.genre}
                    onChange={(e) => setNewTrack(prev => ({ ...prev, genre: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="BPM"
                    value={newTrack.bpm}
                    onChange={(e) => setNewTrack(prev => ({ ...prev, bpm: parseInt(e.target.value) || 120 }))}
                  />
                </div>
              </div>
              
              <div className="mt-3 flex justify-end">
                <Button 
                  onClick={handleAddTrack} 
                  size="sm"
                  disabled={!newTrack.audioFile || !newTrack.title}
                >
                  Create Track
                </Button>
              </div>
            </div>
          )}

          {/* Track List */}
          <ScrollArea className="h-64">
            <div className="space-y-1">
              {filteredTracks.map((track, index) => (
                <div
                  key={track.id}
                  draggable
                  onDragStart={() => handleDragStart(track)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-slate-50 ${
                    currentTrack?.id === track.id ? 'bg-blue-50 border-blue-200' : ''
                  } ${draggedTrack?.id === track.id ? 'opacity-50' : ''}`}
                  onClick={() => handleTrackSelect(track)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500 w-6">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{track.title}</p>
                          <p className="text-sm text-slate-600">{track.artist}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!track.assetUrl && (
                        <Badge variant="destructive" className="text-xs">
                          No Audio
                        </Badge>
                      )}
                      {track.assetUrl && (
                        <Badge variant="outline" className="text-xs">
                          ✓ Audio
                        </Badge>
                      )}
                      <span className="text-sm text-slate-500">
                        {formatTime(track.duration)}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (testTrackAudio(track)) {
                            console.log('✅ Audio file accessible')
                          }
                        }}
                        className="text-blue-600 hover:text-blue-700"
                        title="Test Audio"
                      >
                        <PlayCircle className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveTrack(track.id)
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}