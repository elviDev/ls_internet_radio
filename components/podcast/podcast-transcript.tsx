"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface TranscriptSegment {
  id: string
  speaker: string
  content: string
  timestamp: string
}

interface PodcastTranscriptProps {
  segments: TranscriptSegment[]
  onJumpToTimestamp?: (timestamp: string) => void
  isLoading?: boolean
  className?: string
}

export function PodcastTranscript({ segments, onJumpToTimestamp, isLoading = false, className }: PodcastTranscriptProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isFullTranscript, setIsFullTranscript] = useState(false)

  const filteredSegments = searchTerm
    ? segments.filter(
        (segment) =>
          segment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          segment.speaker.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : segments

  const displaySegments = isFullTranscript ? filteredSegments : filteredSegments.slice(0, 5)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is already handled by the filter above
  }

  const handleTimestampClick = (timestamp: string) => {
    if (onJumpToTimestamp) {
      onJumpToTimestamp(timestamp)
    }
  }

  return (
    <div className={className}>
      <h2 className="text-xl font-semibold mb-6">Transcript</h2>

      <form onSubmit={handleSearch} className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search transcript..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
            <p className="text-muted-foreground mt-2">Loading transcript...</p>
          </div>
        ) : displaySegments.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            {searchTerm ? "No matching segments found" : segments.length === 0 ? "No transcript available for this episode" : "No transcript available"}
          </p>
        ) : (
          displaySegments.map((segment) => (
            <div key={segment.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs px-2 py-0 h-auto hover:bg-muted"
                  onClick={() => handleTimestampClick(segment.timestamp)}
                >
                  {segment.timestamp}
                </Button>
                <span className="font-medium">{segment.speaker}:</span>
              </div>
              <p className="text-sm text-muted-foreground pl-[72px]">{segment.content}</p>
            </div>
          ))
        )}

        {filteredSegments.length > 5 && !isFullTranscript && (
          <div className="pt-4">
            <Button variant="outline" className="w-full" onClick={() => setIsFullTranscript(true)}>
              View Full Transcript ({filteredSegments.length} segments)
            </Button>
          </div>
        )}

        {isFullTranscript && filteredSegments.length > 5 && (
          <div className="pt-4">
            <Button variant="outline" className="w-full" onClick={() => setIsFullTranscript(false)}>
              Show Less
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
