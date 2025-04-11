"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { formatDuration } from "@/lib/audiobook-api"
import { Play, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface Chapter {
  id: string
  title: string
  duration: number
  startPosition: number
}

interface ChapterListProps {
  chapters: Chapter[]
  onPlay: (chapter: Chapter) => void
  currentChapter: number
  className?: string
}

export function ChapterList({ chapters, onPlay, currentChapter, className }: ChapterListProps) {
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})

  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <div className={cn("space-y-4", className)}>
      {chapters.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No chapters found</p>
        </div>
      ) : (
        chapters.map((chapter, index) => (
          <div
            key={chapter.id}
            className={cn(
              "flex flex-col p-4 rounded-lg border transition-colors",
              index === currentChapter ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" : "hover:bg-muted",
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  size="icon"
                  variant={index === currentChapter ? "default" : "outline"}
                  className={cn(
                    "rounded-full flex-shrink-0",
                    index === currentChapter && "bg-purple-600 hover:bg-purple-700",
                  )}
                  onClick={() => onPlay(chapter)}
                >
                  <Play className="h-4 w-4" />
                  <span className="sr-only">Play {chapter.title}</span>
                </Button>
                <div>
                  <h3 className={cn("font-medium", index === currentChapter && "text-purple-700 dark:text-purple-300")}>
                    {chapter.title}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDuration(chapter.duration)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
