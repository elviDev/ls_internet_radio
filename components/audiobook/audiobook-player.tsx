"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Rewind,
  FastForward,
  Heart,
  SkipBack,
  SkipForward,
  Bookmark,
  Clock,
} from "lucide-react"
import { formatDuration } from "@/lib/audiobook-api"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { saveAudiobookProgress } from "@/app/audiobooks/actions"

interface AudiobookPlayerProps {
  title: string
  author: string
  audioUrl: string
  image?: string
  onFavoriteToggle?: () => void
  isFavorite?: boolean
  className?: string
  chapters: Array<{
    id: string
    title: string
    duration: number
    startPosition: number
  }>
  currentChapter: number
  onChapterChange: (chapterIndex: number) => void
  audiobookId: string
  initialPosition?: number
}

export function AudiobookPlayer({
  title,
  author,
  audioUrl,
  image,
  onFavoriteToggle,
  isFavorite = false,
  className,
  chapters,
  currentChapter,
  onChapterChange,
  audiobookId,
  initialPosition = 0,
}: AudiobookPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(initialPosition)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookmarks, setBookmarks] = useState<Array<{ position: number; label: string }>>([])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animationRef = useRef<number>()
  const progressSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Get the current chapter based on playback position
  const getCurrentChapterFromPosition = (position: number) => {
    if (!chapters || chapters.length === 0) return 0

    for (let i = chapters.length - 1; i >= 0; i--) {
      if (position >= chapters[i].startPosition) {
        return i
      }
    }

    return 0
  }

  useEffect(() => {
    const audio = new Audio(audioUrl)
    audioRef.current = audio

    const setAudioData = () => {
      setDuration(audio.duration)
      setIsLoading(false)

      // Set initial position if provided
      if (initialPosition > 0) {
        audio.currentTime = initialPosition
        setCurrentTime(initialPosition)
      }
    }

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime)

      // Check if we've moved to a new chapter
      const newChapterIndex = getCurrentChapterFromPosition(audio.currentTime)
      if (newChapterIndex !== currentChapter) {
        onChapterChange(newChapterIndex)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)

      // If there's a next chapter, move to it
      if (currentChapter < chapters.length - 1) {
        onChapterChange(currentChapter + 1)
        audio.currentTime = chapters[currentChapter + 1].startPosition
        audio.play()
        setIsPlaying(true)
      } else {
        setCurrentTime(0)
        cancelAnimationFrame(animationRef.current!)
      }
    }

    const handleError = () => {
      setError("Error loading audio file")
      setIsLoading(false)
    }

    // Event listeners
    audio.addEventListener("loadeddata", setAudioData)
    audio.addEventListener("timeupdate", setAudioTime)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    // Set initial volume
    audio.volume = volume / 100

    return () => {
      audio.pause()
      audio.removeEventListener("loadeddata", setAudioData)
      audio.removeEventListener("timeupdate", setAudioTime)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
      cancelAnimationFrame(animationRef.current!)

      // Clear progress save timer
      if (progressSaveTimerRef.current) {
        clearInterval(progressSaveTimerRef.current)
      }
    }
  }, [audioUrl, initialPosition, chapters, currentChapter, onChapterChange])

  // Set up progress saving
  useEffect(() => {
    // Save progress every 10 seconds while playing
    if (isPlaying) {
      progressSaveTimerRef.current = setInterval(() => {
        if (audioRef.current) {
          saveAudiobookProgress(audiobookId, audioRef.current.currentTime, currentChapter)
        }
      }, 10000)
    } else if (progressSaveTimerRef.current) {
      clearInterval(progressSaveTimerRef.current)
    }

    return () => {
      if (progressSaveTimerRef.current) {
        clearInterval(progressSaveTimerRef.current)
      }
    }
  }, [isPlaying, audiobookId, currentChapter])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      cancelAnimationFrame(animationRef.current!)

      // Save progress when pausing
      saveAudiobookProgress(audiobookId, audioRef.current.currentTime, currentChapter)
    } else {
      audioRef.current
        .play()
        .then(() => {
          animationRef.current = requestAnimationFrame(whilePlaying)
        })
        .catch((err) => {
          setError("Failed to play audio: " + err.message)
        })
    }

    setIsPlaying(!isPlaying)
  }

  const whilePlaying = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      animationRef.current = requestAnimationFrame(whilePlaying)
    }
  }

  const changeRange = (values: number[]) => {
    if (!audioRef.current) return

    audioRef.current.currentTime = values[0]
    setCurrentTime(values[0])

    // Check if we've moved to a new chapter
    const newChapterIndex = getCurrentChapterFromPosition(values[0])
    if (newChapterIndex !== currentChapter) {
      onChapterChange(newChapterIndex)
    }
  }

  const changeVolume = (values: number[]) => {
    setVolume(values[0])
    if (values[0] > 0 && isMuted) {
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const skipForward = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 30, duration)
  }

  const skipBackward = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0)
  }

  const goToNextChapter = () => {
    if (currentChapter >= chapters.length - 1) return

    if (audioRef.current) {
      audioRef.current.currentTime = chapters[currentChapter + 1].startPosition
      onChapterChange(currentChapter + 1)
    }
  }

  const goToPreviousChapter = () => {
    if (currentChapter <= 0) return

    if (audioRef.current) {
      audioRef.current.currentTime = chapters[currentChapter - 1].startPosition
      onChapterChange(currentChapter - 1)
    }
  }

  const addBookmark = () => {
    if (!audioRef.current) return

    const position = audioRef.current.currentTime
    const chapterTitle = chapters[currentChapter]?.title || `Chapter ${currentChapter + 1}`
    const label = `${chapterTitle} - ${formatDuration(position)}`

    setBookmarks([...bookmarks, { position, label }])

    toast({
      title: "Bookmark added",
      description: `Bookmark added at ${label}`,
      duration: 3000,
    })
  }

  const goToBookmark = (position: number) => {
    if (!audioRef.current) return

    audioRef.current.currentTime = position
    setCurrentTime(position)

    // Check if we've moved to a new chapter
    const newChapterIndex = getCurrentChapterFromPosition(position)
    if (newChapterIndex !== currentChapter) {
      onChapterChange(newChapterIndex)
    }
  }

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6", className)}>
      <h2 className="text-xl font-semibold mb-6">Audiobook Player</h2>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6">
          {error}
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium line-clamp-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{author}</p>
            <p className="text-sm font-medium text-purple-600 mt-1">
              {chapters[currentChapter]?.title || `Chapter ${currentChapter + 1}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={addBookmark}>
                    <Bookmark className="h-4 w-4" />
                    <span className="sr-only">Add bookmark</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add bookmark</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onFavoriteToggle}
                    className={cn(isFavorite && "text-red-500")}
                  >
                    <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
                    <span className="sr-only">{isFavorite ? "Remove from favorites" : "Add to favorites"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={changeRange}
            disabled={isLoading || !!error}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full" onClick={toggleMute}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isMuted ? "Unmute" : "Mute"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Slider
              value={[volume]}
              max={100}
              step={1}
              className="w-24"
              onValueChange={changeVolume}
              disabled={isLoading || !!error}
            />
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={goToPreviousChapter}
                    disabled={isLoading || !!error || currentChapter <= 0}
                  >
                    <SkipBack className="h-4 w-4" />
                    <span className="sr-only">Previous chapter</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Previous chapter</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={skipBackward}
                    disabled={isLoading || !!error}
                  >
                    <Rewind className="h-4 w-4" />
                    <span className="sr-only">Rewind 10 seconds</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rewind 10 seconds</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              size="icon"
              className="rounded-full bg-purple-600 hover:bg-purple-700 h-12 w-12"
              onClick={togglePlayPause}
              disabled={isLoading || !!error}
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current" />
              )}
              <span className="sr-only">{isLoading ? "Loading" : isPlaying ? "Pause" : "Play"}</span>
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={skipForward}
                    disabled={isLoading || !!error}
                  >
                    <FastForward className="h-4 w-4" />
                    <span className="sr-only">Forward 30 seconds</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Forward 30 seconds</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={goToNextChapter}
                    disabled={isLoading || !!error || currentChapter >= chapters.length - 1}
                  >
                    <SkipForward className="h-4 w-4" />
                    <span className="sr-only">Next chapter</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Next chapter</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPlaybackRate((prev) => {
                        const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
                        const currentIndex = rates.indexOf(prev)
                        const nextIndex = (currentIndex + 1) % rates.length
                        return rates[nextIndex]
                      })
                    }
                    disabled={isLoading || !!error}
                  >
                    {playbackRate}x
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Change playback speed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {bookmarks.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Bookmarks</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {bookmarks.map((bookmark, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => goToBookmark(bookmark.position)}
                >
                  <Clock className="h-3 w-3 mr-2" />
                  <span className="truncate">{bookmark.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
