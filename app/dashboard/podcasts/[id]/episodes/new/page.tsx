"use client"

import { useState, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  Search
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const episodeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT")
})

type EpisodeFormData = z.infer<typeof episodeSchema>

type Asset = {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  type: "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT"
  url: string
  description?: string
  tags?: string
  uploadedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

type Podcast = {
  id: string
  title: string
  host: string
}

export default function NewEpisodePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [podcast, setPodcast] = useState<Podcast | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioPreview, setAudioPreview] = useState<string | null>(null)
  const [audioDuration, setAudioDuration] = useState<number>(0)
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null)
  const [transcript, setTranscript] = useState("")
  const [transcriptOption, setTranscriptOption] = useState<"manual" | "upload" | "none">("none")
  
  // Asset management
  const [audioAssets, setAudioAssets] = useState<Asset[]>([])
  const [selectedAudioAssetId, setSelectedAudioAssetId] = useState("")
  const [isAudioAssetDialogOpen, setIsAudioAssetDialogOpen] = useState(false)
  const [audioAssetSearchQuery, setAudioAssetSearchQuery] = useState("")
  const [uploadingNewAsset, setUploadingNewAsset] = useState(false)

  const form = useForm<EpisodeFormData>({
    resolver: zodResolver(episodeSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "DRAFT"
    }
  })

  useEffect(() => {
    if (params.id) {
      fetchPodcast()
      fetchAssets()
    }
  }, [params.id])

  const fetchPodcast = async () => {
    try {
      const response = await fetch(`/api/admin/podcasts/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPodcast(data)
      }
    } catch (error) {
      console.error('Failed to fetch podcast:', error)
      toast({
        title: "Error",
        description: "Failed to fetch podcast details",
        variant: "destructive"
      })
    }
  }

  const fetchAssets = async () => {
    try {
      const audioResponse = await fetch('/api/admin/assets?type=AUDIO&perPage=50')
      
      if (audioResponse.ok) {
        const audioData = await audioResponse.json()
        setAudioAssets(audioData.assets || [])
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  }

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('audio/')) {
        setAudioFile(file)
        setSelectedAudioAssetId("")
        const url = URL.createObjectURL(file)
        setAudioPreview(url)
        
        // Get audio duration
        const audio = new Audio(url)
        audio.addEventListener('loadedmetadata', () => {
          setAudioDuration(audio.duration)
        })
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an audio file",
          variant: "destructive"
        })
      }
    }
  }

  const handleTranscriptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === 'text/plain' || file.type === 'text/vtt' || file.name.endsWith('.srt')) {
        setTranscriptFile(file)
        
        // Read file content and set as manual transcript
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          setTranscript(content)
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

  const handleAudioAssetSelect = (assetId: string) => {
    setSelectedAudioAssetId(assetId)
    setAudioFile(null)
    const selectedAsset = audioAssets.find(asset => asset.id === assetId)
    if (selectedAsset) {
      setAudioPreview(selectedAsset.url)
      
      // Calculate duration from the audio file
      const audio = new Audio(selectedAsset.url)
      audio.addEventListener('loadedmetadata', () => {
        setAudioDuration(audio.duration)
      })
      audio.addEventListener('error', () => {
        console.error('Failed to load audio for duration calculation')
        setAudioDuration(0)
      })
    }
    setIsAudioAssetDialogOpen(false)
  }

  const uploadNewAudioAsset = async (file: File): Promise<void> => {
    setUploadingNewAsset(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('description', `Episode audio asset`)
    formData.append('tags', `podcast,episode,audio`)

    try {
      const response = await fetch('/api/admin/assets/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const newAsset = await response.json()
        setAudioAssets([newAsset, ...audioAssets])
        handleAudioAssetSelect(newAsset.id)
        toast({
          title: "Success",
          description: "Audio asset uploaded successfully"
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload asset')
      }
    } catch (error) {
      console.error('Error uploading asset:', error)
      toast({
        title: "Error",
        description: "Failed to upload audio asset",
        variant: "destructive"
      })
    } finally {
      setUploadingNewAsset(false)
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

  const onSubmit = async (data: EpisodeFormData) => {
    if (!audioFile && !selectedAudioAssetId) {
      toast({
        title: "Missing audio",
        description: "Please select an audio file for the episode",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      
      // Add form data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })
      
      // Add audio file or asset ID
      if (selectedAudioAssetId) {
        formData.append('audioAssetId', selectedAudioAssetId)
      } else if (audioFile) {
        formData.append('audioFile', audioFile)
      }

      // Add duration if we have it
      if (audioDuration > 0) {
        formData.append('duration', Math.floor(audioDuration).toString())
      }

      // Add transcript based on option
      if (transcriptOption === "manual" && transcript.trim()) {
        formData.append('transcript', transcript.trim())
      } else if (transcriptOption === "upload" && transcriptFile) {
        formData.append('transcriptFile', transcriptFile)
        if (transcript.trim()) {
          formData.append('transcript', transcript.trim())
        }
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(`/api/admin/podcasts/${params.id}/episodes`, {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create episode')
      }

      const episode = await response.json()
      
      toast({
        title: "Success",
        description: `Episode "${data.title}" created successfully!`
      })

      router.push(`/dashboard/podcasts/${params.id}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create episode",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  if (!podcast) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Episode</h1>
          <p className="text-muted-foreground">Add a new episode to "{podcast.title}"</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    Episode Information
                  </CardTitle>
                  <CardDescription>
                    Enter the basic details for your episode
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional description of the episode content
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Audio Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileAudio className="h-5 w-5" />
                    Audio File
                  </CardTitle>
                  <CardDescription>
                    Upload the audio file for this episode
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Audio File *</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      {(audioFile || selectedAudioAssetId) ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                              <FileAudio className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">
                                {selectedAudioAssetId ? 
                                  audioAssets.find(asset => asset.id === selectedAudioAssetId)?.originalName || "Selected Asset" :
                                  audioFile?.name || ""
                                }
                              </p>
                              <div className="flex gap-4 text-sm text-muted-foreground">
                                <span>
                                  {selectedAudioAssetId ? 
                                    "From asset library" :
                                    audioFile ? `${(audioFile.size / (1024 * 1024)).toFixed(2)} MB` : ""
                                  }
                                </span>
                                {audioDuration > 0 && (
                                  <span>{formatDuration(audioDuration)}</span>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setAudioFile(null)
                                setAudioPreview(null)
                                setSelectedAudioAssetId("")
                                setAudioDuration(0)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {audioPreview && (
                            <audio controls className="w-full">
                              <source src={audioPreview} />
                              Your browser does not support the audio element.
                            </audio>
                          )}
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                          <FileAudio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Choose audio file</p>
                            <p className="text-xs text-muted-foreground">
                              Supported formats: MP3, WAV, M4A, OGG
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 mt-4">
                            <Dialog open={isAudioAssetDialogOpen} onOpenChange={setIsAudioAssetDialogOpen}>
                              <DialogTrigger asChild>
                                <Button type="button" variant="outline" className="flex-1">
                                  <Search className="h-4 w-4 mr-2" />
                                  Choose from Assets
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>Select Audio File</DialogTitle>
                                  <DialogDescription>
                                    Choose an audio file from your asset library or upload a new one
                                  </DialogDescription>
                                </DialogHeader>
                                <Tabs defaultValue="existing" className="w-full">
                                  <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="existing">Existing Assets</TabsTrigger>
                                    <TabsTrigger value="upload">Upload New</TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="existing" className="space-y-4">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        placeholder="Search audio assets..."
                                        value={audioAssetSearchQuery}
                                        onChange={(e) => setAudioAssetSearchQuery(e.target.value)}
                                        className="pl-9"
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                                      {audioAssets
                                        .filter(asset => 
                                          asset.originalName.toLowerCase().includes(audioAssetSearchQuery.toLowerCase()) ||
                                          asset.description?.toLowerCase().includes(audioAssetSearchQuery.toLowerCase())
                                        )
                                        .map((asset) => (
                                          <div
                                            key={asset.id}
                                            className={`border rounded-lg p-4 cursor-pointer hover:bg-muted transition-colors ${
                                              selectedAudioAssetId === asset.id ? 'border-primary bg-primary/10' : ''
                                            }`}
                                            onClick={() => setSelectedAudioAssetId(asset.id)}
                                          >
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                                <FileAudio className="h-5 w-5 text-muted-foreground" />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{asset.originalName}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                  {asset.description || 'No description'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                  {(asset.size / (1024 * 1024)).toFixed(2)} MB
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                    {audioAssets.length === 0 && (
                                      <div className="text-center py-8">
                                        <FileAudio className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">No audio assets found</p>
                                      </div>
                                    )}
                                  </TabsContent>
                                  <TabsContent value="upload" className="space-y-4">
                                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                                      <FileAudio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                      <div className="space-y-2 mb-4">
                                        <p className="text-sm font-medium">Upload new audio file</p>
                                        <p className="text-xs text-muted-foreground">
                                          This will be saved to your asset library for future use
                                        </p>
                                      </div>
                                      <Input
                                        type="file"
                                        accept="audio/*"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0]
                                          if (file) {
                                            await uploadNewAudioAsset(file)
                                          }
                                        }}
                                        disabled={uploadingNewAsset}
                                      />
                                      {uploadingNewAsset && (
                                        <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                                      )}
                                    </div>
                                  </TabsContent>
                                </Tabs>
                                <DialogFooter>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setIsAudioAssetDialogOpen(false)
                                      setAudioAssetSearchQuery("")
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      if (selectedAudioAssetId) {
                                        handleAudioAssetSelect(selectedAudioAssetId)
                                      }
                                      setIsAudioAssetDialogOpen(false)
                                      setAudioAssetSearchQuery("")
                                    }}
                                    disabled={!selectedAudioAssetId}
                                  >
                                    Use Selected Audio
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <div className="relative flex-1">
                              <Input
                                type="file"
                                accept="audio/*"
                                onChange={handleAudioUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                              <Button type="button" variant="outline" className="w-full pointer-events-none">
                                <Upload className="h-4 w-4 mr-2" />
                                Upload New Audio
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {isSubmitting && uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transcript */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Transcript
                  </CardTitle>
                  <CardDescription>
                    Add a transcript for better accessibility and searchability
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <Label>Transcript Option</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <Button
                        type="button"
                        variant={transcriptOption === "none" ? "default" : "outline"}
                        onClick={() => {
                          setTranscriptOption("none")
                          setTranscript("")
                          setTranscriptFile(null)
                        }}
                        className="h-auto flex-col gap-2 p-4"
                      >
                        <X className="h-5 w-5" />
                        <span className="text-sm">No Transcript</span>
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
                        <span className="text-sm">Write Manually</span>
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
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
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
                                setTranscript("")
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
                      
                      {transcript && (
                        <div className="space-y-2">
                          <Label>Preview</Label>
                          <div className="border rounded-lg p-3 bg-muted/50 max-h-40 overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap font-mono">
                              {transcript.slice(0, 500)}
                              {transcript.length > 500 && "..."}
                            </pre>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            File content preview. You can edit this after uploading if needed.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Publishing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Publishing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Drafts are only visible to staff members
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-3">
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Creating..." : "Create Episode"}
                    </Button>
                    <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
                      Cancel
                    </Button>
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
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Podcast:</span>
                    <span className="font-medium">{podcast.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Host:</span>
                    <span className="font-medium">{podcast.host}</span>
                  </div>
                  {audioDuration > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{formatDuration(audioDuration)}</span>
                    </div>
                  )}
                  {transcriptOption !== "none" && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Transcript:</span>
                      <span className="font-medium">
                        {transcriptOption === "manual" ? "Manual entry" : "File upload"}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}