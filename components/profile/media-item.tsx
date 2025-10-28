import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Play, BookOpen, Mic, Clock } from "lucide-react"

interface MediaItemProps {
  item: {
    id: string
    audiobook?: {
      id: string
      title: string
      coverImage?: string
      narrator?: string
      duration?: number
    }
    podcast?: {
      id: string
      title: string
      coverImage?: string
      host?: string
      duration?: number
    }
    position?: number
    createdAt?: string
    listenedAt?: string
  }
  showProgress?: boolean
  showDate?: boolean
  variant?: "default" | "compact"
  onPlay?: () => void
}

export function MediaItem({ 
  item, 
  showProgress = false, 
  showDate = false, 
  variant = "default",
  onPlay 
}: MediaItemProps) {
  const isAudiobook = !!item.audiobook
  const title = item.audiobook?.title || item.podcast?.title || "Unknown"
  const subtitle = item.audiobook?.narrator || item.podcast?.host || ""
  const coverImage = item.audiobook?.coverImage || item.podcast?.coverImage
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
          {isAudiobook ? <BookOpen className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{title}</p>
          {showDate && (item.createdAt || item.listenedAt) && (
            <p className="text-xs text-muted-foreground">
              {formatDate(item.createdAt || item.listenedAt || "")}
            </p>
          )}
        </div>
        {onPlay && (
          <Button size="sm" variant="ghost" onClick={onPlay}>
            <Play className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg hover:shadow-sm transition-shadow">
      <div className="relative flex-shrink-0">
        {coverImage ? (
          <img 
            src={coverImage} 
            alt={title}
            className="w-12 h-12 rounded object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
            {isAudiobook ? <BookOpen className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </div>
        )}
        {isAudiobook && (
          <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs px-1">
            Book
          </Badge>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{title}</h4>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
        
        {showProgress && typeof item.position === 'number' && (
          <div className="mt-2 space-y-1">
            <Progress value={item.position} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {item.position}% complete
            </p>
          </div>
        )}
        
        {showDate && (item.createdAt || item.listenedAt) && (
          <div className="flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {formatDate(item.createdAt || item.listenedAt || "")}
            </p>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {onPlay && (
          <Button size="sm" onClick={onPlay}>
            <Play className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}