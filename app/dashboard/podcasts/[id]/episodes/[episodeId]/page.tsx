"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Plus,
  FileAudio,
  Save,
  Eye,
  Clock,
  User,
  Tag,
  Calendar,
  Mic,
  Music,
  FileText,
  Search,
  Play,
  Pause,
  Download,
  Share,
  Edit,
  Trash,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  MessageSquare,
  Heart,
  Users,
  CheckCircle,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const episodeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT")
})

type EpisodeFormData = z.infer<typeof episodeSchema>

type Episode = {
  id: string
  title: string
  description: string | null
  episodeNumber: number
  audioFile: string
  duration: number
  publishedAt: string | null
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  transcript: string | null
  transcriptFile: string | null
  createdAt: string
  updatedAt: string
  podcast: {
    id: string
    title: string
    host: string
  }
  _count: {
    comments: number
    favorites: number
    playbackProgress: number
  }
}

type Comment = {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

export default function EpisodeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  
  // Transcript editing
  const [transcriptDialog, setTranscriptDialog] = useState(false)
  const [transcriptContent, setTranscriptContent] = useState("")
  const [transcriptOption, setTranscriptOption] = useState<"manual" | "upload" | "none">("none")
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null)
  const [isUploadingTranscript, setIsUploadingTranscript] = useState(false)

  const form = useForm<EpisodeFormData>({
    resolver: zodResolver(episodeSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "DRAFT"
    }
  })

  useEffect(() => {
    if (params.id && params.episodeId) {
      fetchEpisode()
      fetchComments()
    }
  }, [params.id, params.episodeId])

  useEffect(() => {
    if (episode) {
      form.reset({
        title: episode.title,
        description: episode.description || "",
        status: episode.status
      })
      setTranscriptContent(episode.transcript || "")
      setTranscriptOption(episode.transcript ? "manual" : "none")
      setAudioDuration(episode.duration)
    }
  }, [episode, form])

  const fetchEpisode = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/podcasts/${params.id}/episodes/${params.episodeId}`)
      if (!response.ok) throw new Error('Failed to fetch episode')
      
      const data = await response.json()
      setEpisode(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch episode details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/admin/podcasts/${params.id}/episodes/${params.episodeId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/podcasts/${params.id}/episodes/${params.episodeId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete episode')
      
      toast({
        title: "Success",
        description: "Episode deleted successfully"
      })
      router.push(`/dashboard/podcasts/${params.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete episode",
        variant: "destructive"
      })
    }
  }

  const handleStatusChange = async (status: string) => {
    try {
      const response = await fetch(`/api/admin/podcasts/${params.id}/episodes/${params.episodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (!response.ok) throw new Error('Failed to update status')
      
      setEpisode(prev => prev ? { ...prev, status: status as any } : null)
      toast({
        title: "Success",
        description: `Episode ${status.toLowerCase()} successfully`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update episode status",
        variant: "destructive"
      })
    }
  }

  const onSubmit = async (data: EpisodeFormData) => {
    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 20
        })
      }, 200)

      const response = await fetch(`/api/admin/podcasts/${params.id}/episodes/${params.episodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update episode')
      }

      const updatedEpisode = await response.json()
      setEpisode(updatedEpisode)
      setIsEditing(false)
      
      toast({
        title: "Success",
        description: "Episode updated successfully!"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update episode",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const handleTranscriptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === 'text/plain' || file.type === 'text/vtt' || file.name.endsWith('.srt')) {
        setTranscriptFile(file)
        
        // Read file content and set as transcript
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          setTranscriptContent(content)
          setTranscriptOption("upload")
        }
        reader.readAsText(file)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a text file (.txt, .vtt, .srt)",
          variant: "destructive"
        })
      }
    }
  }

  const handleTranscriptSave = async () => {
    try {
      setIsUploadingTranscript(true)
      
      const formData = new FormData()
      
      if (transcriptOption === "manual" && transcriptContent.trim()) {
        formData.append('transcript', transcriptContent.trim())
      } else if (transcriptOption === "upload" && transcriptFile) {
        formData.append('transcriptFile', transcriptFile)
        if (transcriptContent.trim()) {
          formData.append('transcript', transcriptContent.trim())
        }
      } else if (transcriptOption === "none") {
        formData.append('transcript', '')
      }

      const response = await fetch(`/api/admin/podcasts/${params.id}/episodes/${params.episodeId}`, {
        method: 'PATCH',
        body: formData
      })
      
      if (!response.ok) throw new Error('Failed to save transcript')
      
      const updatedEpisode = await response.json()
      setEpisode(updatedEpisode)
      setTranscriptDialog(false)
      
      toast({
        title: "Success",
        description: "Transcript saved successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save transcript",
        variant: "destructive"
      })
    } finally {
      setIsUploadingTranscript(false)
    }
  }

  const recalculateDuration = async () => {
    if (!episode?.audioFile) return
    
    try {
      const audio = new Audio(episode.audioFile)
      audio.addEventListener('loadedmetadata', async () => {
        const newDuration = Math.floor(audio.duration)
        
        // Update the episode duration in the database
        const response = await fetch(`/api/admin/podcasts/${params.id}/episodes/${params.episodeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration: newDuration })
        })
        
        if (response.ok) {
          const updatedEpisode = await response.json()
          setEpisode(updatedEpisode)
          setAudioDuration(newDuration)
          toast({
            title: "Success",
            description: `Duration updated to ${formatDuration(newDuration)}`
          })
        }
      })
      audio.addEventListener('error', () => {
        toast({
          title: "Error",
          description: "Failed to load audio file for duration calculation",
          variant: "destructive"
        })
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to recalculate duration",
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
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
          <p className="text-muted-foreground">Loading episode...</p>
        </div>
      </div>
    )
  }

  if (!episode) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Episode not found</h2>
          <p className="text-muted-foreground mb-4">The episode you're looking for doesn't exist.</p>
          <Button onClick={() => router.push(`/dashboard/podcasts/${params.id}`)}>
            Back to Podcast
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
            <h1 className="text-3xl font-bold tracking-tight">Episode #{episode.episodeNumber}: {episode.title}</h1>
            <Badge className={getStatusColor(episode.status)}>
              {episode.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            From "{episode.podcast.title}" • Hosted by {episode.podcast.host}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isEditing ? "destructive" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? "Cancel Edit" : "Edit Episode"}
          </Button>
          {episode.status === 'DRAFT' && (
            <Button onClick={() => handleStatusChange('PUBLISHED')}>
              <Play className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
          {episode.status === 'PUBLISHED' && (
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
                <AlertDialogTitle>Delete Episode</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "Episode #{episode.episodeNumber}: {episode.title}"? This action cannot be undone.
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
          {/* Episode Player */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Episode #{episode.episodeNumber}: {episode.title}</h2>
                  {episode.description && (
                    <p className="text-muted-foreground">{episode.description}</p>
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
                      <Slider
                        value={[volume]}
                        onValueChange={(value) => {
                          const newVolume = value[0]
                          setVolume(newVolume)
                          if (audioRef.current) {
                            audioRef.current.volume = newVolume
                          }
                        }}
                        max={1}
                        min={0}
                        step={0.1}
                        className="w-20"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress 
                      value={(currentTime / audioDuration) * 100} 
                      className="w-full cursor-pointer" 
                      onClick={(e) => {
                        if (audioRef.current) {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const percent = (e.clientX - rect.left) / rect.width
                          audioRef.current.currentTime = percent * audioDuration
                        }
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatDuration(currentTime)}</span>
                      <span>{formatDuration(episode.duration)}</span>
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
                    <source src={episode.audioFile} />
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

          {/* Edit Form */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Episode</CardTitle>
                <CardDescription>Update episode information</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Episode Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter episode title..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe this episode..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="DRAFT">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                  Draft
                                </div>
                              </SelectItem>
                              <SelectItem value="PUBLISHED">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500" />
                                  Published
                                </div>
                              </SelectItem>
                              <SelectItem value="ARCHIVED">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                                  Archived
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Upload Progress */}
                    {isSubmitting && uploadProgress > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Updating...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button type="submit" disabled={isSubmitting}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSubmitting ? "Updating..." : "Update Episode"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="details" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Episode Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Title</Label>
                    <p className="text-sm text-muted-foreground mt-1">{episode.title}</p>
                  </div>
                  
                  {episode.description && (
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-muted-foreground mt-1">{episode.description}</p>
                    </div>
                  )}
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium">Episode Number</Label>
                      <p className="text-sm text-muted-foreground mt-1">#{episode.episodeNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Duration</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">{formatDuration(episode.duration)}</p>
                        {episode.duration === 0 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={recalculateDuration}
                            className="h-6 px-2 text-xs"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Recalculate
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(episode.status)} variant="outline">
                          {episode.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Created</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(episode.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {episode.publishedAt && (
                      <div>
                        <Label className="text-sm font-medium">Published</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(episode.publishedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
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
                        Episode transcript for accessibility and searchability
                      </CardDescription>
                    </div>
                    <Dialog open={transcriptDialog} onOpenChange={setTranscriptDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Transcript
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Edit Transcript</DialogTitle>
                          <DialogDescription>
                            Update the transcript for this episode
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 overflow-y-auto max-h-[60vh]">
                          <div className="space-y-4">
                            <Label>Transcript Option</Label>
                            <div className="grid grid-cols-3 gap-4">
                              <Button
                                type="button"
                                variant={transcriptOption === "none" ? "default" : "outline"}
                                onClick={() => {
                                  setTranscriptOption("none")
                                  setTranscriptContent("")
                                  setTranscriptFile(null)
                                }}
                                className="h-auto flex-col gap-2 p-4"
                              >
                                <X className="h-5 w-5" />
                                <span className="text-sm">Remove Transcript</span>
                              </Button>
                              <Button
                                type="button"
                                variant={transcriptOption === "manual" ? "default" : "outline"}
                                onClick={() => {
                                  setTranscriptOption("manual")
                                  setTranscriptFile(null)
                                }}
                                className="h-auto flex-col gap-2 p-4"
                              >
                                <FileText className="h-5 w-5" />
                                <span className="text-sm">Edit Manually</span>
                              </Button>
                              <Button
                                type="button"
                                variant={transcriptOption === "upload" ? "default" : "outline"}
                                onClick={() => setTranscriptOption("upload")}
                                className="h-auto flex-col gap-2 p-4"
                              >
                                <Upload className="h-5 w-5" />
                                <span className="text-sm">Upload File</span>
                              </Button>
                            </div>
                          </div>

                          {transcriptOption === "manual" && (
                            <div className="space-y-2">
                              <Label htmlFor="transcript">Transcript Content</Label>
                              <Textarea
                                id="transcript"
                                placeholder="Enter the transcript content here...&#10;&#10;You can format it with timestamps like:&#10;[00:00] Speaker: Hello and welcome...&#10;[00:30] Speaker: Today we'll discuss..."
                                value={transcriptContent}
                                onChange={(e) => setTranscriptContent(e.target.value)}
                                className="min-h-[300px] font-mono text-sm"
                              />
                              <p className="text-xs text-muted-foreground">
                                Use a consistent format with timestamps for better usability. Example: [00:00] Speaker: Content
                              </p>
                            </div>
                          )}

                          {transcriptOption === "upload" && (
                            <div className="space-y-4">
                              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                                {transcriptFile ? (
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                      <FileText className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium">{transcriptFile.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {(transcriptFile.size / 1024).toFixed(2)} KB
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setTranscriptFile(null)
                                        setTranscriptContent(episode?.transcript || "")
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="text-center space-y-4">
                                    <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
                                    <div className="space-y-2">
                                      <p className="text-sm font-medium">Upload transcript file</p>
                                      <p className="text-xs text-muted-foreground">
                                        Supported formats: .txt, .vtt, .srt
                                      </p>
                                    </div>
                                    <div className="relative">
                                      <Input
                                        type="file"
                                        accept=".txt,.vtt,.srt,text/plain"
                                        onChange={handleTranscriptUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                      />
                                      <Button type="button" variant="outline" className="pointer-events-none">
                                        <Upload className="h-4 w-4 mr-2" />
                                        Choose File
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {transcriptContent && (
                                <div className="space-y-2">
                                  <Label>Content Preview</Label>
                                  <Textarea
                                    value={transcriptContent}
                                    onChange={(e) => setTranscriptContent(e.target.value)}
                                    className="min-h-[200px] font-mono text-sm"
                                    placeholder="Edit the transcript content here..."
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    You can edit the uploaded content above before saving.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setTranscriptDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleTranscriptSave} disabled={isUploadingTranscript}>
                            {isUploadingTranscript ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Transcript
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {episode.transcript ? (
                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                          {episode.transcript}
                        </pre>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>Transcript available</span>
                        {episode.transcriptFile && (
                          <>
                            <span>•</span>
                            <span>Uploaded from file</span>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No transcript available</h3>
                      <p className="text-muted-foreground mb-4">
                        Add a transcript to improve accessibility and searchability
                      </p>
                      <Button onClick={() => setTranscriptDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Transcript
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Comments ({comments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{comment.user.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No comments yet</p>
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
              <CardTitle className="text-lg">Episode Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Plays</span>
                </div>
                <span className="font-semibold">{formatNumber(episode._count.playbackProgress)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Favorites</span>
                </div>
                <span className="font-semibold">{episode._count.favorites}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Comments</span>
                </div>
                <span className="font-semibold">{episode._count.comments}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Transcript</span>
                </div>
                <span className="font-semibold">{episode.transcript ? "Available" : "None"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Episode Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Episode Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mic className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Episode:</span>
                <span className="font-medium">#{episode.episodeNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{formatDuration(episode.duration)}</span>
                {episode.duration === 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={recalculateDuration}
                    className="h-5 px-1 text-xs ml-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">{new Date(episode.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Status:</span>
                <Badge className={getStatusColor(episode.status)} variant="outline">
                  {episode.status}
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
                variant={isEditing ? "destructive" : "default"}
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? "Cancel Edit" : "Edit Episode"}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setTranscriptDialog(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Edit Transcript
              </Button>
              {episode.duration === 0 && (
                <Button variant="outline" className="w-full" onClick={recalculateDuration}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recalculate Duration
                </Button>
              )}
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Audio
              </Button>
              <Button variant="outline" className="w-full">
                <Share className="h-4 w-4 mr-2" />
                Share Episode
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}