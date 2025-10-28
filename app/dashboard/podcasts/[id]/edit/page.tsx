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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Plus,
  FileAudio,
  Image as ImageIcon,
  Save,
  Eye,
  Clock,
  User,
  Tag,
  Calendar,
  Mic,
  Users
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DatePicker } from "@/components/ui/date-picker"

const podcastSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description must be less than 2000 characters"),
  host: z.string().min(1, "Host is required"),
  guests: z.string().optional(),
  genreId: z.string().min(1, "Genre is required"),
  releaseDate: z.string().min(1, "Release date is required"),
  tags: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft")
})

type PodcastFormData = z.infer<typeof podcastSchema>

type Genre = {
  id: string
  name: string
  slug: string
}

type Staff = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

type Podcast = {
  id: string
  title: string
  description: string
  host: string
  guests?: string
  coverImage: string
  audioFile: string
  duration: number
  releaseDate: string
  genre: {
    id: string
    name: string
    slug: string
  }
  author: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export default function EditPodcastPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [genres, setGenres] = useState<Genre[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [podcast, setPodcast] = useState<Podcast | null>(null)
  const [newAudioFile, setNewAudioFile] = useState<File | null>(null)
  const [newCoverImage, setNewCoverImage] = useState<File | null>(null)
  const [selectedAssetId, setSelectedAssetId] = useState<string>("")
  const [assets, setAssets] = useState<any[]>([])
  const [audioPreview, setAudioPreview] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingAsset, setUploadingAsset] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState<number>(0)
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])

  const form = useForm<PodcastFormData>({
    resolver: zodResolver(podcastSchema),
    defaultValues: {
      title: "",
      description: "",
      host: "",
      guests: "",
      genreId: "",
      releaseDate: "",
      tags: "",
      status: "draft"
    }
  })

  useEffect(() => {
    if (params.id) {
      fetchPodcast()
      fetchGenres()
      fetchStaff()
      fetchAssets()
    }
  }, [params.id])

  const fetchPodcast = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/podcasts/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch podcast')
      
      const data = await response.json()
      setPodcast(data)
      
      // Populate form with existing data
      form.reset({
        title: data.title,
        description: data.description,
        host: data.host,
        guests: data.guests || "",
        genreId: data.genre.id,
        releaseDate: new Date(data.releaseDate).toISOString().split('T')[0],
        tags: "",
        status: data.status || "draft"
      })
      
      setAudioDuration(data.duration)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch podcast details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchGenres = async () => {
    try {
      const response = await fetch('/api/genres')
      if (response.ok) {
        const data = await response.json()
        setGenres(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to fetch genres:', error)
      setGenres([])
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/admin/staff?role=HOST,CO_HOST,PRODUCER')
      if (response.ok) {
        const data = await response.json()
        setStaff(data.staff || [])
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    }
  }

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/admin/assets?type=IMAGE&perPage=50')
      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets || [])
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    }
  }

  const uploadCoverImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('description', `Cover image for podcast: ${form.getValues('title')}`)

    const response = await fetch('/api/admin/assets/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to upload cover image')
    }

    const asset = await response.json()
    return asset.id
  }

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('audio/')) {
        setNewAudioFile(file)
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setNewCoverImage(file)
        const url = URL.createObjectURL(file)
        setImagePreview(url)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        })
      }
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()]
      setTags(newTags)
      form.setValue('tags', newTags.join(', '))
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
    form.setValue('tags', newTags.join(', '))
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

  const onSubmit = async (data: PodcastFormData) => {
    setIsSubmitting(true)

    try {
      // Handle cover image upload/selection
      let coverImageId = selectedAssetId || undefined
      
      if (newCoverImage) {
        setUploadingAsset(true)
        setUploadProgress(30)
        try {
          coverImageId = await uploadCoverImage(newCoverImage)
          setUploadProgress(60)
          // Refresh assets list
          await fetchAssets()
        } catch (error) {
          throw new Error('Failed to upload cover image')
        } finally {
          setUploadingAsset(false)
        }
      }
      
      setUploadProgress(80)

      const formData = new FormData()
      
      // Add form data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })
      
      // Add new files if uploaded
      if (newAudioFile) {
        formData.append('audioFile', newAudioFile)
        formData.append('duration', audioDuration.toString())
      }
      
      // Add cover image ID if selected/uploaded
      if (coverImageId) {
        formData.append('coverImageId', coverImageId)
      }

      const response = await fetch(`/api/admin/podcasts/${params.id}`, {
        method: 'PATCH',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update podcast')
      }

      setUploadProgress(100)
      toast({
        title: "Success",
        description: `Podcast "${data.title}" updated successfully`
      })

      router.push(`/dashboard/podcasts/${params.id}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update podcast",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
      setUploadingAsset(false)
      setUploadProgress(0)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading podcast...</p>
        </div>
      </div>
    )
  }

  if (!podcast) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Podcast not found</h2>
          <p className="text-muted-foreground mb-4">The podcast you're trying to edit doesn't exist.</p>
          <Button onClick={() => router.push('/dashboard/podcasts')}>
            Back to Podcasts
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Podcast</h1>
          <p className="text-muted-foreground">Update your podcast episode details</p>
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
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Update the basic details for your podcast episode
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter podcast title..." {...field} />
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
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your podcast episode..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed description of your podcast episode
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select host" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {staff.map((member) => (
                                <SelectItem key={member.id} value={`${member.firstName} ${member.lastName}`}>
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {member.firstName} {member.lastName}
                                    <Badge variant="outline" className="text-xs">
                                      {member.role}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guests</FormLabel>
                          <FormControl>
                            <Input placeholder="Guest names (optional)" {...field} />
                          </FormControl>
                          <FormDescription>
                            Comma-separated list of guest names
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Media Files */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Media Files
                  </CardTitle>
                  <CardDescription>
                    Update audio file and cover image for your podcast
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Audio */}
                  <div className="space-y-4">
                    <Label>Current Audio File</Label>
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <div className="flex items-center gap-3">
                        <FileAudio className="h-8 w-8 text-blue-500" />
                        <div className="flex-1">
                          <p className="font-medium">Current audio file</p>
                          <p className="text-sm text-muted-foreground">
                            Duration: {formatDuration(podcast.duration)}
                          </p>
                        </div>
                      </div>
                      <audio controls className="w-full mt-3">
                        <source src={podcast.audioFile} />
                      </audio>
                    </div>
                  </div>

                  {/* New Audio Upload */}
                  <div className="space-y-4">
                    <Label>Replace Audio File (Optional)</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      {newAudioFile ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <FileAudio className="h-8 w-8 text-blue-500" />
                            <div className="flex-1">
                              <p className="font-medium">{newAudioFile.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(newAudioFile.size / (1024 * 1024)).toFixed(2)} MB
                                {audioDuration > 0 && ` • ${formatDuration(audioDuration)}`}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setNewAudioFile(null)
                                setAudioPreview(null)
                                setAudioDuration(podcast.duration)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {audioPreview && (
                            <audio controls className="w-full">
                              <source src={audioPreview} type={newAudioFile.type} />
                            </audio>
                          )}
                        </div>
                      ) : (
                        <div className="text-center">
                          <FileAudio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Upload new audio file</p>
                            <p className="text-xs text-muted-foreground">
                              Leave empty to keep current file
                            </p>
                          </div>
                          <Input
                            type="file"
                            accept="audio/*"
                            onChange={handleAudioUpload}
                            className="mt-4"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Current Cover Image */}
                  <div className="space-y-4">
                    <Label>Current Cover Image</Label>
                    {podcast.coverImage ? (
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                            <img
                              src={podcast.coverImage}
                              alt="Current cover"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Current cover image</p>
                            <p className="text-sm text-muted-foreground">Click to view full size</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No cover image set</p>
                    )}
                  </div>

                  {/* Cover Image Selection */}
                  <div className="space-y-4">
                    <Label>Replace Cover Image (Optional)</Label>
                    
                    {/* Upload Progress */}
                    {uploadingAsset && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Uploading cover image...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Current Selection Display */}
                    {(newCoverImage || selectedAssetId) && (
                      <div className="p-3 border rounded-lg bg-muted/50">
                        {newCoverImage ? (
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                              <img 
                                src={imagePreview || ""} 
                                alt="New cover"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{newCoverImage.name}</p>
                              <p className="text-xs text-muted-foreground">{(newCoverImage.size / 1024).toFixed(1)} KB</p>
                              <p className="text-xs text-blue-600">New upload</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setNewCoverImage(null)
                                setImagePreview(null)
                              }}
                              className="h-8 w-8 shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (() => {
                          const selectedAsset = assets.find(a => a.id === selectedAssetId)
                          if (selectedAsset) {
                            return (
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                                  <img 
                                    src={selectedAsset.url} 
                                    alt={selectedAsset.originalName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{selectedAsset.originalName}</p>
                                  <p className="text-xs text-muted-foreground">{(selectedAsset.size / 1024).toFixed(1)} KB</p>
                                  <p className="text-xs text-green-600">From assets</p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedAssetId("")}
                                  className="h-8 w-8 shrink-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>
                    )}

                    {/* Selection Options */}
                    {!newCoverImage && !selectedAssetId && (
                      <div className="grid grid-cols-2 gap-3">
                        {/* Upload New */}
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="cover-image-upload"
                          />
                          <label
                            htmlFor="cover-image-upload"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                          >
                            <div className="flex flex-col items-center justify-center pt-2 pb-2">
                              <svg className="w-8 h-8 mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="text-sm text-gray-500 font-medium">Upload new</p>
                              <p className="text-xs text-gray-400">JPG, PNG up to 10MB</p>
                            </div>
                          </label>
                        </div>

                        {/* Select from Assets */}
                        <div>
                          <Select value="choose" onValueChange={(value: string) => {
                            if (value !== "choose") {
                              setSelectedAssetId(value)
                              setNewCoverImage(null)
                              setImagePreview(null)
                            }
                          }}>
                            <SelectTrigger className="h-32">
                              <SelectValue placeholder="Choose from assets" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              {assets.filter(asset => asset.type === "IMAGE").map((asset) => (
                                <SelectItem key={asset.id} value={asset.id}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-10 h-8 bg-muted rounded flex items-center justify-center overflow-hidden">
                                      <img 
                                        src={asset.url} 
                                        alt={asset.originalName}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-sm">{asset.originalName}</span>
                                      <span className="text-xs text-muted-foreground">{(asset.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {!newCoverImage && !selectedAssetId && (
                      <p className="text-xs text-muted-foreground text-center">
                        Leave empty to keep current cover image
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="genreId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genre *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select genre" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {genres && Array.isArray(genres) && genres.map((genre) => (
                              <SelectItem key={genre.id} value={genre.id}>
                                {genre.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="releaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Release Date *</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value ? new Date(field.value) : undefined}
                            onDateChange={(date) => field.onChange(date?.toISOString().split('T')[0] || '')}
                            placeholder="Select release date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" size="icon" onClick={addTag}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                Draft
                              </div>
                            </SelectItem>
                            <SelectItem value="published">
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
                    <Button type="submit" className="w-full" disabled={isSubmitting || uploadingAsset}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting || uploadingAsset ? (
                        uploadingAsset ? "Uploading..." : "Updating..."
                      ) : (
                        "Update Podcast"
                      )}
                    </Button>
                    <Button type="button" variant="outline" className="w-full" onClick={() => router.back()} disabled={isSubmitting || uploadingAsset}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Episode Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Episode Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{formatDuration(audioDuration)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created by:</span>
                    <span className="font-medium">{podcast.author.firstName} {podcast.author.lastName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Genre:</span>
                    <span className="font-medium">{podcast.genre.name}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}