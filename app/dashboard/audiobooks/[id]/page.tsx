"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Edit, 
  BookOpen, 
  Clock, 
  Star, 
  Users, 
  TrendingUp,
  FileText,
  Settings,
  BarChart3,
  Calendar,
  Globe,
  DollarSign,
  Archive,
  CheckCircle,
  XCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ReviewSection } from "@/components/audiobook/review-section"

type Audiobook = {
  id: string
  title: string
  narrator: string
  description: string
  coverImage: string
  duration: number
  releaseDate: string
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  playCount: number
  likeCount: number
  isbn?: string
  publisher?: string
  language: string
  tags?: string
  price?: number
  currency: string
  isExclusive: boolean
  publishedAt?: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
  author?: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  genre: {
    id: string
    name: string
    slug: string
  }
  chapters: Array<{
    id: string
    title: string
    duration: number
    trackNumber: number
    status: string
    playCount: number
  }>
  transcription?: {
    id: string
    content: string
    language: string
    format: string
    isEditable: boolean
    lastEditedAt?: string
  }
  _count: {
    chapters: number
    comments: number
    reviews: number
    favorites: number
    playbackProgress: number
  }
  averageRating?: number
  totalPlays?: number
}

export default function AudiobookDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const audiobookId = params.id as string
  
  const [audiobook, setAudiobook] = useState<Audiobook | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchAudiobook()
  }, [audiobookId])

  const fetchAudiobook = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/audiobooks/${audiobookId}`)
      if (response.ok) {
        const data = await response.json()
        setAudiobook(data)
      } else {
        throw new Error('Failed to fetch audiobook')
      }
    } catch (error) {
      console.error('Error fetching audiobook:', error)
      toast({
        title: "Error",
        description: "Failed to load audiobook details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    try {
      const response = await fetch(`/api/admin/audiobooks/${audiobookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const updatedAudiobook = await response.json()
      setAudiobook(updatedAudiobook)
      
      toast({
        title: "Success",
        description: `Audiobook ${status.toLowerCase()} successfully`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update audiobook status",
        variant: "destructive"
      })
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
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

  const getTags = () => {
    if (!audiobook?.tags) return []
    try {
      return JSON.parse(audiobook.tags)
    } catch {
      return []
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading audiobook...</p>
        </div>
      </div>
    )
  }

  if (!audiobook) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Audiobook not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/audiobooks')}>
            Back to Audiobooks
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/audiobooks')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{audiobook.title}</h1>
          <p className="text-muted-foreground">
            {audiobook.author ? `By ${audiobook.author} • ` : ''}Narrated by {audiobook.narrator} • Created by {audiobook.createdBy?.firstName} {audiobook.createdBy?.lastName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters`)}>
            <BookOpen className="h-4 w-4 mr-2" />
            Manage Chapters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Cover and Basic Info */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-4">
                <img
                  src={audiobook.coverImage || "/placeholder.svg"}
                  alt={audiobook.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(audiobook.status)}>
                    {audiobook.status === 'PUBLISHED' ? 'Published' : 
                     audiobook.status === 'DRAFT' ? 'Draft' : 'Archived'}
                  </Badge>
                  {audiobook.isExclusive && (
                    <Badge variant="secondary">Exclusive</Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDuration(audiobook.duration)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{audiobook._count.chapters} chapters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-muted-foreground" />
                    <span>{formatNumber(audiobook.playCount)} plays</span>
                  </div>
                  {audiobook.averageRating && audiobook.averageRating > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span>{audiobook.averageRating.toFixed(1)} ({audiobook._count.reviews} reviews)</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Status Actions */}
                <div className="space-y-2">
                  {audiobook.status === 'DRAFT' && (
                    <Button 
                      className="w-full" 
                      onClick={() => handleStatusChange('PUBLISHED')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Publish Audiobook
                    </Button>
                  )}
                  {audiobook.status === 'PUBLISHED' && (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => handleStatusChange('ARCHIVED')}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive Audiobook
                    </Button>
                  )}
                  {audiobook.status === 'ARCHIVED' && (
                    <Button 
                      className="w-full" 
                      onClick={() => handleStatusChange('PUBLISHED')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Restore Audiobook
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Favorites</p>
                  <p className="font-semibold">{audiobook._count.favorites}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Comments</p>
                  <p className="font-semibold">{audiobook._count.comments}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Progress</p>
                  <p className="font-semibold">{audiobook._count.playbackProgress}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Genre</p>
                  <p className="font-semibold">{audiobook.genre.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="chapters">Chapters</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {audiobook.description}
                  </p>
                </CardContent>
              </Card>

              {/* Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Release Date</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{new Date(audiobook.releaseDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Language</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{audiobook.language.toUpperCase()}</span>
                        </div>
                      </div>

                      {audiobook.isbn && (
                        <div>
                          <Label className="text-sm font-medium">ISBN</Label>
                          <p className="text-sm text-muted-foreground mt-1">{audiobook.isbn}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {audiobook.publisher && (
                        <div>
                          <Label className="text-sm font-medium">Publisher</Label>
                          <p className="text-sm text-muted-foreground mt-1">{audiobook.publisher}</p>
                        </div>
                      )}

                      {audiobook.price && (
                        <div>
                          <Label className="text-sm font-medium">Price</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{audiobook.price} {audiobook.currency}</span>
                          </div>
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium">Created</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(audiobook.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {getTags().length > 0 && (
                    <>
                      <Separator className="my-6" />
                      <div>
                        <Label className="text-sm font-medium">Tags</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {getTags().map((tag: string) => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chapters" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Chapters ({audiobook.chapters.length})</CardTitle>
                    <Button onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters`)}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Manage All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {audiobook.chapters.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No chapters added yet</p>
                      <Button onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters`)}>
                        Add First Chapter
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {audiobook.chapters.slice(0, 5).map((chapter) => (
                        <div key={chapter.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-muted rounded flex items-center justify-center">
                            <span className="text-sm font-medium">{chapter.trackNumber}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{chapter.title}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{formatDuration(chapter.duration)}</span>
                              <span>{formatNumber(chapter.playCount)} plays</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {chapter.status}
                          </Badge>
                        </div>
                      ))}
                      {audiobook.chapters.length > 5 && (
                        <div className="text-center pt-4">
                          <Button variant="outline" onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters`)}>
                            View All {audiobook.chapters.length} Chapters
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transcript" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Transcript</CardTitle>
                      <CardDescription>
                        {audiobook.transcription ? 'Transcript available' : 'No transcript available'}
                      </CardDescription>
                    </div>
                    {audiobook.transcription && (
                      <Button onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/transcription/edit`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Transcript
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {audiobook.transcription ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label>Language</Label>
                          <p className="text-muted-foreground">{audiobook.transcription.language.toUpperCase()}</p>
                        </div>
                        <div>
                          <Label>Format</Label>
                          <p className="text-muted-foreground">{audiobook.transcription.format}</p>
                        </div>
                        <div>
                          <Label>Editable</Label>
                          <p className="text-muted-foreground">{audiobook.transcription.isEditable ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
                        <p className="text-sm font-mono whitespace-pre-wrap">
                          {audiobook.transcription.content.substring(0, 500)}
                          {audiobook.transcription.content.length > 500 && '...'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No transcript available</p>
                      <Button onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/transcription/edit`)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Add Transcript
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Reviews</CardTitle>
                  <CardDescription>
                    Reviews and ratings from users who have listened to this audiobook
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReviewSection audiobookId={audiobookId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
                    <Play className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(audiobook.playCount)}</div>
                    <p className="text-xs text-muted-foreground">
                      Across all chapters
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{audiobook._count.favorites + audiobook._count.comments}</div>
                    <p className="text-xs text-muted-foreground">
                      Favorites + Comments
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {audiobook._count.playbackProgress > 0 
                        ? Math.round((audiobook._count.playbackProgress / audiobook.playCount) * 100)
                        : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Users who started listening
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Chapter Performance</CardTitle>
                  <CardDescription>Play count by chapter</CardDescription>
                </CardHeader>
                <CardContent>
                  {audiobook.chapters.length > 0 ? (
                    <div className="space-y-4">
                      {audiobook.chapters.map((chapter) => {
                        const maxPlays = Math.max(...audiobook.chapters.map(c => c.playCount))
                        const percentage = maxPlays > 0 ? (chapter.playCount / maxPlays) * 100 : 0
                        
                        return (
                          <div key={chapter.id} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="truncate">Chapter {chapter.trackNumber}: {chapter.title}</span>
                              <span className="text-muted-foreground">{formatNumber(chapter.playCount)} plays</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No chapter data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}