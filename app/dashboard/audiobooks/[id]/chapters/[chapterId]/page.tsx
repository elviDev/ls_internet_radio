"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Edit, 
  Trash, 
  Download, 
  Share, 
  Eye,
  Clock,
  Calendar,
  User,
  Users,
  MessageSquare,
  Heart,
  Star,
  TrendingUp,
  BarChart3,
  FileText,
  Upload,
  Save,
  X,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  CheckCircle,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Chapter = {
  id: string
  title: string
  description: string | null
  audioFile: string
  duration: number
  trackNumber: number
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  playCount: number
  transcript: string | null
  createdAt: string
  updatedAt: string
  audiobook: {
    id: string
    title: string
    narrator: string
  }
}

export default function ChapterDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const audiobookId = params.id as string
  const chapterId = params.chapterId as string

  useEffect(() => {
    if (audiobookId && chapterId) {
      fetchChapter()
    }
  }, [audiobookId, chapterId])

  const fetchChapter = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/audiobooks/${audiobookId}/chapters/${chapterId}`)
      if (!response.ok) throw new Error('Failed to fetch chapter')
      
      const data = await response.json()
      setChapter(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch chapter details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/audiobooks/${audiobookId}/chapters/${chapterId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete chapter')
      
      toast({
        title: "Success",
        description: "Chapter deleted successfully"
      })
      router.push(`/dashboard/audiobooks/${audiobookId}/chapters`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete chapter",
        variant: "destructive"
      })
    }
  }

  const handleStatusChange = async (status: string) => {
    try {
      const response = await fetch(`/api/admin/audiobooks/${audiobookId}/chapters/${chapterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (!response.ok) throw new Error('Failed to update status')
      
      setChapter(prev => prev ? { ...prev, status: status as any } : null)
      toast({
        title: "Success",
        description: `Chapter ${status.toLowerCase()} successfully`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update chapter status",
        variant: "destructive"
      })
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800 border-green-200'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading chapter...</p>
        </div>
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Chapter not found</h2>
          <p className="text-muted-foreground mb-4">The chapter you're looking for doesn't exist.</p>
          <Button onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters`)}>
            Back to Chapters
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Chapter {chapter.trackNumber}: {chapter.title}</h1>
            <Badge className={getStatusColor(chapter.status)}>
              {chapter.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            From "{chapter.audiobook.title}" • Narrated by {chapter.audiobook.narrator}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters/${chapterId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Chapter
          </Button>
          {chapter.status === 'DRAFT' && (
            <Button onClick={() => handleStatusChange('PUBLISHED')}>
              <Play className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
          {chapter.status === 'PUBLISHED' && (
            <Button variant="outline" onClick={() => handleStatusChange('ARCHIVED')}>
              <Pause className="h-4 w-4 mr-2" />
              Archive
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "Chapter {chapter.trackNumber}: {chapter.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chapter Player */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Chapter {chapter.trackNumber}: {chapter.title}</h2>
                  {chapter.description && (
                    <p className="text-muted-foreground">{chapter.description}</p>
                  )}
                </div>
                
                {/* Audio Player Controls */}
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Button 
                      size="icon" 
                      variant="outline"
                      onClick={() => audioRef.current && (audioRef.current.currentTime -= 10)}
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      className="h-12 w-12"
                      onClick={() => {
                        if (audioRef.current) {
                          if (isPlaying) {
                            audioRef.current.pause()
                          } else {
                            audioRef.current.play()
                          }
                        }
                      }}
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button 
                      size="icon" 
                      variant="outline"
                      onClick={() => audioRef.current && (audioRef.current.currentTime += 10)}
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={() => {
                          if (audioRef.current) {
                            const newMuted = !isMuted
                            audioRef.current.muted = newMuted
                            setIsMuted(newMuted)
                          }
                        }}
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-100"
                        style={{ width: `${(currentTime / audioDuration) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatDuration(currentTime)}</span>
                      <span>{formatDuration(chapter.duration)}</span>
                    </div>
                  </div>
                  
                  {/* Hidden audio element for actual playback */}
                  <audio
                    ref={audioRef}
                    className="hidden"
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  >
                    <source src={chapter.audioFile} />
                    Your browser does not support the audio element.
                  </audio>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Chapter Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Title</Label>
                    <p className="text-sm text-muted-foreground mt-1">{chapter.title}</p>
                  </div>
                  
                  {chapter.description && (
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-muted-foreground mt-1">{chapter.description}</p>
                    </div>
                  )}
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium">Chapter Number</Label>
                      <p className="text-sm text-muted-foreground mt-1">#{chapter.trackNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Duration</Label>
                      <p className="text-sm text-muted-foreground mt-1">{formatDuration(chapter.duration)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(chapter.status)} variant="outline">
                          {chapter.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Play Count</Label>
                      <p className="text-sm text-muted-foreground mt-1">{chapter.playCount} plays</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Created</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(chapter.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Updated</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(chapter.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transcript" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Transcript
                      </CardTitle>
                      <CardDescription>
                        Chapter transcript for accessibility and searchability
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters/${chapterId}/transcript/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Transcript
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {chapter.transcript ? (
                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                          {chapter.transcript}
                        </pre>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>Transcript available</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No transcript available</h3>
                      <p className="text-muted-foreground mb-4">
                        Add a transcript to improve accessibility and searchability
                      </p>
                      <Button 
                        onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters/${chapterId}/transcript/edit`)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Add Transcript
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chapter Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Plays</span>
                </div>
                <span className="font-semibold">{chapter.playCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Duration</span>
                </div>
                <span className="font-semibold">{formatDuration(chapter.duration)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Transcript</span>
                </div>
                <span className="font-semibold">{chapter.transcript ? "Available" : "None"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Chapter Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chapter Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Chapter:</span>
                <span className="font-medium">#{chapter.trackNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{formatDuration(chapter.duration)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">{new Date(chapter.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Status:</span>
                <Badge className={getStatusColor(chapter.status)} variant="outline">
                  {chapter.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters/${chapterId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Chapter
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters/${chapterId}/transcript/edit`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Edit Transcript
              </Button>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Audio
              </Button>
              <Button variant="outline" className="w-full">
                <Share className="h-4 w-4 mr-2" />
                Share Chapter
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}