"use client"

import { useState, useEffect, useRef } from "react"
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
  BarChart3
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
  file?: string
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
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none')
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [crossfadeTime, setCrossfadeTime] = useState(3)
  const [autoMix, setAutoMix] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const [playlists] = useState<Playlist[]>([
    {
      id: 'morning',
      name: 'Morning Energy',
      autoPlay: true,
      shuffled: false,
      looped: true,
      tracks: [
        {
          id: '1',
          title: 'Sunrise Symphony',
          artist: 'David Chen',
          duration: 245,
          genre: 'Electronic',
          bpm: 128,
          key: 'C Major',
          intro: 15,
          outro: 20,
          energy: 8,
          mood: 'Uplifting',
          tags: ['morning', 'energetic', 'upbeat']
        },
        {
          id: '2',
          title: 'Coffee Break Jazz',
          artist: 'Sarah Martinez',
          duration: 186,
          genre: 'Jazz',
          bpm: 95,
          key: 'F Major',
          intro: 8,
          outro: 12,
          energy: 5,
          mood: 'Relaxed',
          tags: ['jazz', 'coffee', 'smooth']
        },
        {
          id: '3',
          title: 'Morning Rush',
          artist: 'Electric Vibes',
          duration: 203,
          genre: 'Pop',
          bpm: 132,
          key: 'G Major',
          intro: 12,
          outro: 15,
          energy: 9,
          mood: 'Energetic',
          tags: ['pop', 'upbeat', 'radio-friendly']
        }
      ]
    },
    {
      id: 'afternoon',
      name: 'Afternoon Grooves',
      autoPlay: false,
      shuffled: true,
      looped: false,
      tracks: [
        {
          id: '4',
          title: 'Smooth Operator',
          artist: 'Groove Masters',
          duration: 267,
          genre: 'R&B',
          bpm: 85,
          key: 'A Minor',
          intro: 10,
          outro: 18,
          energy: 6,
          mood: 'Chill',
          tags: ['rnb', 'smooth', 'groove']
        }
      ]
    },
    {
      id: 'evening',
      name: 'Evening Chill',
      autoPlay: true,
      shuffled: false,
      looped: true,
      tracks: [
        {
          id: '5',
          title: 'Sunset Dreams',
          artist: 'Ambient Collective',
          duration: 312,
          genre: 'Ambient',
          bpm: 70,
          key: 'D Minor',
          intro: 25,
          outro: 30,
          energy: 3,
          mood: 'Dreamy',
          tags: ['ambient', 'sunset', 'peaceful']
        }
      ]
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
    return () => clearInterval(interval)
  }, [isPlaying, currentTrack])

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
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
    setCurrentTrack(track)
    setCurrentTime(0)
    if (isLive) {
      setIsPlaying(true)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    setIsMuted(false)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
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
              <Badge variant={autoMix ? "default" : "outline"}>
                Auto Mix {autoMix ? 'ON' : 'OFF'}
              </Badge>
              <Badge variant="outline">
                Crossfade: {crossfadeTime}s
              </Badge>
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
              disabled={!isLive || !currentTrack}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="lg"
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={!isLive || !currentTrack}
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
              disabled={!isLive || !currentTrack}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <Button
              variant={isShuffled ? "default" : "outline"}
              size="icon"
              onClick={() => setIsShuffled(!isShuffled)}
              disabled={!isLive}
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
              disabled={!isLive}
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
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
          </div>
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
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
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

          {/* Track List */}
          <ScrollArea className="h-64">
            <div className="space-y-1">
              {filteredTracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-slate-50 ${
                    currentTrack?.id === track.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
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
                      {track.energy && (
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 h-3 rounded ${
                                i < track.energy! / 2 
                                  ? getEnergyColor(track.energy) 
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      <span className="text-sm text-slate-500">
                        {formatTime(track.duration)}
                      </span>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
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