"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash, 
  Search, 
  BookOpen, 
  Calendar, 
  Clock, 
  User,
  Play,
  Pause,
  Download,
  Share,
  Eye,
  TrendingUp,
  Users,
  Filter,
  Grid3X3,
  List,
  Star,
  BarChart3,
  FileText,
  Archive,
  CheckCircle,
  XCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

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

type AudiobookStats = {
  total: number
  published: number
  draft: number
  archived: number
  totalChapters: number
  totalDuration: number
  totalPlays: number
  averageRating: number
  topGenres: Array<{ name: string; count: number }>
}



export default function AudiobooksPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([])
  const [stats, setStats] = useState<AudiobookStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    genre: "all",
    author: "all",
    sortBy: "updatedAt",
    sortOrder: "desc"
  })
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 12,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchAudiobooks()
    fetchStats()
  }, [filters, pagination.page])

  const fetchAudiobooks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        perPage: pagination.perPage.toString(),
        search: filters.search,
        status: filters.status,
        genre: filters.genre,
        author: filters.author,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      })

      const response = await fetch(`/api/admin/audiobooks?${params}`)
      if (!response.ok) throw new Error('Failed to fetch audiobooks')
      
      const data = await response.json()
      setAudiobooks(data.audiobooks)
      setPagination(data.pagination)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch audiobooks",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/audiobooks/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch audiobook stats:', error)
    }
  }

  const handleDelete = async (audiobookId: string) => {
    try {
      const response = await fetch(`/api/admin/audiobooks/${audiobookId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete audiobook')
      
      setAudiobooks(audiobooks.filter(a => a.id !== audiobookId))
      toast({
        title: "Success",
        description: "Audiobook deleted successfully"
      })
      fetchStats()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete audiobook",
        variant: "destructive"
      })
    }
  }

  const handleStatusChange = async (audiobookId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/audiobooks/${audiobookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (!response.ok) throw new Error('Failed to update status')
      
      setAudiobooks(audiobooks.map(a => 
        a.id === audiobookId ? { ...a, status: status as any } : a
      ))
      toast({
        title: "Success",
        description: `Audiobook ${status.toLowerCase()} successfully`
      })
      fetchStats()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update audiobook status",
        variant: "destructive"
      })
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
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

  if (loading && audiobooks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading audiobooks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audiobook Management</h1>
          <p className="text-muted-foreground">Create, manage, and publish your audiobook library</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/audiobooks/analytics')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => router.push('/dashboard/audiobooks/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Audiobook
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Audiobooks</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.published} published, {stats.draft} drafts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChapters}</div>
              <p className="text-xs text-muted-foreground">
                Across all audiobooks
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalPlays)}</div>
              <p className="text-xs text-muted-foreground">
                Across all episodes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.averageRating.toFixed(1)} avg rating
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audiobooks..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt">Last Updated</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="playCount">Plays</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Audiobooks Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {audiobooks.map((audiobook) => (
            <Card key={audiobook.id} className="hover:shadow-lg transition-shadow">
              <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
                <Image
                height={400}
                width={400}
                  src={audiobook.coverImage || "/placeholder.svg"}
                  alt={audiobook.title}
                  className="object-cover w-full h-full"
                />
                <div className="absolute top-2 right-2">
                  <Badge className={getStatusColor(audiobook.status)}>
                    {audiobook.status === 'PUBLISHED' ? 'Published' : 
                     audiobook.status === 'DRAFT' ? 'Draft' : 'Archived'}
                  </Badge>
                </div>
                {audiobook.averageRating && audiobook.averageRating > 0 && (
                  <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="font-semibold">{audiobook.averageRating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({audiobook._count.reviews})</span>
                    </div>
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{audiobook.title}</CardTitle>
                    <CardDescription className="mt-1">
                      <div className="flex flex-col gap-1 text-sm">
                        {audiobook.author && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            <span>Author: {audiobook.author}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Created by: {audiobook.createdBy?.firstName} {audiobook.createdBy?.lastName}</span>
                        </div>
                      </div>
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/audiobooks/${audiobook.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/audiobooks/${audiobook.id}/chapters`)}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Manage Chapters
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/audiobooks/${audiobook.id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {audiobook.status === 'DRAFT' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(audiobook.id, 'PUBLISHED')}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Publish
                        </DropdownMenuItem>
                      )}
                      {audiobook.status === 'PUBLISHED' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(audiobook.id, 'ARCHIVED')}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                      {audiobook.status === 'ARCHIVED' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(audiobook.id, 'PUBLISHED')}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Restore
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Audiobook</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{audiobook.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(audiobook.id)} className="bg-red-600 hover:bg-red-700">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{audiobook.description}</p>

                <div className="flex items-center gap-2">
                  <Badge variant="outline">{audiobook.genre.name}</Badge>
                  <span className="text-sm text-muted-foreground">• Narrated by {audiobook.narrator}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Chapters</p>
                    <p className="font-semibold">{audiobook._count.chapters}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-semibold">{formatDuration(audiobook.duration)}</p>
                  </div>
                </div>

                {audiobook.status === 'PUBLISHED' && (
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Play className="h-4 w-4" />
                      <span>{formatNumber(audiobook.playCount)} plays</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(audiobook.releaseDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}

                <Button className="w-full" onClick={() => router.push(`/dashboard/audiobooks/${audiobook.id}/chapters`)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage Chapters
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {audiobooks.map((audiobook) => (
                <div key={audiobook.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <Image
                      width={20}
                      height={20}
                        src={audiobook.coverImage || "/placeholder.svg"}
                        alt={audiobook.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold truncate">{audiobook.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {audiobook.author ? `${audiobook.author} • ` : ''}Narrator: {audiobook.narrator} • Created by: {audiobook.createdBy?.firstName} {audiobook.createdBy?.lastName}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>{audiobook._count.chapters} chapters</span>
                            <span>{formatDuration(audiobook.duration)}</span>
                            <span>{formatNumber(audiobook.playCount)} plays</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(audiobook.status)}>
                            {audiobook.status === 'PUBLISHED' ? 'Published' : 
                             audiobook.status === 'DRAFT' ? 'Draft' : 'Archived'}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/audiobooks/${audiobook.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/audiobooks/${audiobook.id}/chapters`)}>
                                <BookOpen className="h-4 w-4 mr-2" />
                                Manage Chapters
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/audiobooks/${audiobook.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {audiobooks.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No audiobooks found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/dashboard/audiobooks/new")}
            >
              Create Your First Audiobook
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.perPage) + 1} to {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total} audiobooks
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
