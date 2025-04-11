"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { formatDuration } from "@/lib/podcast-api"
import { Play, Download, Share2, Clock, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Episode {
  trackId: string
  trackName: string
  description: string
  releaseDate: string
  trackTimeMillis?: number
  previewUrl?: string
  artworkUrl60?: string
}

interface EpisodeListProps {
  episodes: Episode[]
  onPlay: (episode: Episode) => void
  className?: string
}

export function EpisodeList({ episodes, onPlay, className }: EpisodeListProps) {
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleShare = async (episode: Episode) => {
    try {
      // Check if Web Share API is supported and available
      if (navigator.share && window.isSecureContext) {
        await navigator.share({
          title: episode.trackName,
          text: episode.description,
          url: window.location.href,
        })
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link copied",
          description: "Episode link copied to clipboard",
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
          description: "Episode link copied to clipboard",
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

  const handleDownload = (episode: Episode) => {
    if (!episode.previewUrl) {
      toast({
        title: "Download unavailable",
        description: "This episode doesn't have a downloadable preview",
        variant: "destructive",
      })
      return
    }

    const link = document.createElement("a")
    link.href = episode.previewUrl
    link.download = `${episode.trackName.replace(/\s+/g, "-").toLowerCase()}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {episodes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No episodes found</p>
        </div>
      ) : (
        episodes.map((episode) => (
          <div key={episode.trackId} className="flex flex-col p-4 rounded-lg hover:bg-muted transition-colors border">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full flex-shrink-0"
                  onClick={() => onPlay(episode)}
                >
                  <Play className="h-4 w-4" />
                  <span className="sr-only">Play {episode.trackName}</span>
                </Button>
                <div>
                  <h3 className="font-medium">{episode.trackName}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(episode.releaseDate)}
                    </div>
                    {episode.trackTimeMillis && (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDuration(episode.trackTimeMillis / 1000)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(episode)}
                  disabled={!episode.previewUrl}
                >
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleShare(episode)}>
                  <Share2 className="h-4 w-4" />
                  <span className="sr-only">Share</span>
                </Button>
              </div>
            </div>

            {episode.description && (
              <div className="mt-2">
                <p
                  className={cn(
                    "text-sm text-muted-foreground",
                    !expandedDescriptions[episode.trackId] && "line-clamp-2",
                  )}
                >
                  {episode.description}
                </p>
                <Button
                  variant="link"
                  className="text-xs p-0 h-auto mt-1"
                  onClick={() => toggleDescription(episode.trackId)}
                >
                  {expandedDescriptions[episode.trackId] ? "Show less" : "Show more"}
                </Button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
