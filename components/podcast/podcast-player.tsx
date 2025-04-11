"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Rewind, FastForward, Download, Share2, Heart } from "lucide-react"
import { formatDuration } from "@/lib/podcast-api"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { AuthRequiredAction } from "@/components/auth/auth-required-action"

interface PodcastPlayerProps {
  title: string
  artist: string
  audioUrl: string
  image?: string
  onFavoriteToggle?: () => void
  isFavorite?: boolean
  className?: string
}

export function PodcastPlayer({
  title,
  artist,
  audioUrl,
  image,
  onFavoriteToggle,
  isFavorite = false,
  className,
}: PodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animationRef = useRef<number>(0)

  useEffect(() => {
    const audio = new Audio(audioUrl)
    audioRef.current = audio

    const setAudioData = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      cancelAnimationFrame(animationRef.current!)
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
    }
  }, [audioUrl])

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

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = audioUrl
    link.download = `${title.replace(/\s+/g, "-").toLowerCase()}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async () => {
    try {
      // Check if Web Share API is supported and available
      if (navigator.share && window.isSecureContext) {
        await navigator.share({
          title: title,
          text: `Listen to ${title} by ${artist}`,
          url: window.location.href,
        })
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link copied",
          description: "Podcast link copied to clipboard",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)

      // Fallback if sharing or clipboard fails
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link copied",
          description: "Podcast link copied to clipboard",
          duration: 3000,
        })
      } catch (clipboardError) {
        toast({
          title: "Sharing failed",
          description: "Please manually copy the URL from your browser's address bar",
          variant: "destructive",
          duration: 3000,
        })
      }
    }
  }

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6", className)}>
      <h2 className="text-xl font-semibold mb-6">Audio Player</h2>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6">
          {error}
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium line-clamp-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{artist}</p>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download episode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Share</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share episode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AuthRequiredAction onAction={onFavoriteToggle!}>
                    <Button variant="outline" size="icon" className={cn(isFavorite && "text-red-500")}>
                      <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
                      <span className="sr-only">{isFavorite ? "Remove from favorites" : "Add to favorites"}</span>
                    </Button>
                  </AuthRequiredAction>
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
              className="rounded-full bg-brand-600 hover:bg-brand-700 h-12 w-12"
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
      </div>
    </div>
  )
}
