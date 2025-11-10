"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  Play, 
  Pause, 
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
  Headphones,
  Volume2,
  SkipBack,
  SkipForward,
  Plus,
  MoreVertical
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ReviewSection } from "@/components/audiobook/review-section"
import { CommentSection } from "@/components/audiobook/comment-section"

type Podcast = {
  id: string
  title: string
  description: string
  host: string
  guests?: string
  coverImage: string
  releaseDate: string
  createdAt: string
  updatedAt: string
  author: {
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
  episodes: Episode[]
  _count: {
    comments: number
    reviews: number
    favorites: number
    playbackProgress: number
    episodes: number
  }
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
}

type Episode = {
  id: string
  title: string
  description: string
  episodeNumber: number
  audioFile: string
  duration: number
  publishedAt: string | null
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  transcript: string | null
  transcriptFile: string | null
  createdAt: string
  updatedAt: string
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

export default function PodcastDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [podcast, setPodcast] = useState<Podcast | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])

  const [loading, setLoading] = useState(true)
  const [episodesLoading, setEpisodesLoading] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchPodcast()
      fetchEpisodes()

    }
  }, [params.id])

  const fetchPodcast = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/podcasts/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch podcast')
      
      const data = await response.json()
      setPodcast(data)
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

  const fetchEpisodes = async () => {
    try {
      setEpisodesLoading(true)
      const response = await fetch(`/api/admin/podcasts/${params.id}/episodes`)
      if (response.ok) {
        const data = await response.json()
        setEpisodes(data)
      }
    } catch (error) {
      console.error('Failed to fetch episodes:', error)
    } finally {
      setEpisodesLoading(false)
    }
  }



  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/podcasts/${params.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete podcast')
      
      toast({
        title: "Success",
        description: "Podcast deleted successfully"
      })
      router.push('/dashboard/podcasts')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete podcast",
        variant: "destructive"
      })
    }
  }

  const handleStatusChange = async (status: string) => {
    try {
      const response = await fetch(`/api/admin/podcasts/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (!response.ok) throw new Error('Failed to update status')
      
      setPodcast(prev => prev ? { ...prev, status: status as any } : null)
      toast({
        title: "Success",
        description: `Podcast ${status.toLowerCase()} successfully`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update podcast status",
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

  const getTotalDuration = () => {
    console.log("Duration calculation for episodes:", episodes[0]?.duration)
    return episodes.reduce((total, episode) => total + episode?.duration, 0)
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
          <p className="text-muted-foreground mb-4">The podcast you're looking for doesn't exist.</p>
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
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{podcast.title}</h1>
            <Badge className={getStatusColor(podcast.status)}>
              {podcast.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">Manage your podcast series</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/dashboard/podcasts/${podcast.id}/episodes/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Episode
          </Button>
          <Button variant="outline" onClick={() => router.push(`/dashboard/podcasts/${podcast.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Series
          </Button>
          {podcast.status === 'DRAFT' && (
            <Button onClick={() => handleStatusChange('PUBLISHED')}>
              <Play className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}
          {podcast.status === 'PUBLISHED' && (
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
                <AlertDialogTitle>Delete Podcast</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{podcast.title}"? This will also delete all episodes. This action cannot be undone.
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
          {/* Podcast Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-6">
                <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted shrink-0">
                  <img
                    src={podcast.coverImage || "/placeholder.svg"}
                    alt={podcast.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold">{podcast.title}</h2>
                    <p className="text-muted-foreground">Hosted by {podcast.host}</p>
                    {podcast.guests && (
                      <p className="text-sm text-muted-foreground">Guests: {podcast.guests}</p>
                    )}
                  </div >
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Description</p>
                    <p className="text-sm">{podcast.description}</p>
                  </div>

                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Headphones className="h-4 w-4" />
                      <span>{episodes.length} episodes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(getTotalDuration())} total</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(podcast.releaseDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="episodes" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="episodes">Episodes</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="episodes" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Headphones className="h-5 w-5" />
                      Episodes ({episodes.length})
                    </CardTitle>
                    <Button onClick={() => router.push(`/dashboard/podcasts/${podcast.id}/episodes/new`)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Episode
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {episodesLoading ? (
                    <div className="text-center py-8">
                      <div className="h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading episodes...</p>
                    </div>
                  ) : episodes.length > 0 ? (
                    <div className="space-y-4">
                      {episodes.map((episode) => (
                        <div key={episode.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <span className="font-semibold text-sm">#{episode.episodeNumber}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold">{episode.title}</h3>
                                  {episode.description && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {episode.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Badge className={getStatusColor(episode.status)} variant="outline">
                                    {episode.status}
                                  </Badge>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => router.push(`/dashboard/podcasts/${podcast.id}/episodes/${episode.id}`)}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDuration(episode.duration)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{episode._count.comments} comments</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  <span>{episode._count.favorites} favorites</span>
                                </div>
                                {episode.transcript && (
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    <span>Transcript</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Headphones className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No episodes yet</h3>
                      <p className="text-muted-foreground mb-4">Start creating episodes to publish your podcast content</p>
                      <Button onClick={() => router.push(`/dashboard/podcasts/${podcast.id}/episodes/new`)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Episode
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Podcast Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <p className="text-sm text-muted-foreground mt-1">{podcast.description}</p>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Genre</label>
                      <p className="text-sm text-muted-foreground mt-1">{podcast.genre.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Episodes</label>
                      <p className="text-sm text-muted-foreground mt-1">{episodes.length} episodes</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Total Duration</label>
                      <p className="text-sm text-muted-foreground mt-1">{formatDuration(getTotalDuration())}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Release Date</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(podcast.releaseDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Created By</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {podcast.author.firstName} {podcast.author.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        <Badge className={getStatusColor(podcast.status)} variant="outline">
                          {podcast.status}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Reviews</CardTitle>
                  <CardDescription>
                    Reviews and ratings from users who have listened to this podcast
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReviewSection podcastId={params.id as string} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CommentSection podcastId={params.id as string} />
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
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Headphones className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Episodes</span>
                </div>
                <span className="font-semibold">{episodes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total Duration</span>
                </div>
                <span className="font-semibold">{formatDuration(getTotalDuration())}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Favorites</span>
                </div>
                <span className="font-semibold">{podcast._count.favorites}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Comments</span>
                </div>
                <span className="font-semibold">{podcast._count.comments}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Reviews</span>
                </div>
                <span className="font-semibold">{podcast._count.reviews}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Listeners</span>
                </div>
                <span className="font-semibold">{podcast._count.playbackProgress}</span>
              </div>
            </CardContent>
          </Card>

          {/* Series Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Series Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Headphones className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Episodes:</span>
                <span className="font-medium">{episodes.length}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Released:</span>
                <span className="font-medium">{new Date(podcast.releaseDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created by:</span>
                <span className="font-medium">{podcast.author.firstName} {podcast.author.lastName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Status:</span>
                <Badge className={getStatusColor(podcast.status)} variant="outline">
                  {podcast.status}
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
              <Button className="w-full" onClick={() => router.push(`/dashboard/podcasts/${podcast.id}/episodes/new`)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Episode
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push(`/dashboard/podcasts/${podcast.id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Series
              </Button>
              <Button variant="outline" className="w-full">
                <Share className="h-4 w-4 mr-2" />
                Share Podcast
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}