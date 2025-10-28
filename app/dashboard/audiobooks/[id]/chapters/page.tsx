"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,  AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { 
  ArrowLeft, 
  Plus, 
  Play, 
  FileText, 
  Edit, 
  Trash, 
  MoreVertical,
  Clock,
  CheckCircle,
  Archive,
  Eye
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Chapter = {
  id: string
  title: string
  audioFile: string
  duration: number
  trackNumber: number
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  playCount: number
  description?: string
  transcript?: string
  createdAt: string
  updatedAt: string
}

type Audiobook = {
  id: string
  title: string
  narrator: string
  status: string
  _count: {
    chapters: number
  }
}

export default function ChaptersPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const audiobookId = params.id as string
  
  const [audiobook, setAudiobook] = useState<Audiobook | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (audiobookId && audiobookId !== 'undefined') {
      fetchAudiobook()
      fetchChapters()
    }
  }, [audiobookId])

  const fetchAudiobook = async () => {
    if (!audiobookId || audiobookId === 'undefined') return
    
    try {
      const response = await fetch(`/api/admin/audiobooks/${audiobookId}`)
      if (response.ok) {
        const data = await response.json()
        setAudiobook(data)
      }
    } catch (error) {
      console.error('Error fetching audiobook:', error)
    }
  }

  const fetchChapters = async () => {
    if (!audiobookId || audiobookId === 'undefined') {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/audiobooks/${audiobookId}/chapters`)
      if (response.ok) {
        const data = await response.json()
        setChapters(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch chapters",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }



  const handleStatusChange = async (chapterId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/audiobooks/${audiobookId}/chapters/${chapterId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error('Failed to update chapter status')
      }

      setChapters(chapters.map(c => 
        c.id === chapterId ? { ...c, status: status as any } : c
      ))
      
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

  const handleDeleteChapter = async (chapterId: string) => {
    try {
      const response = await fetch(`/api/admin/audiobooks/${audiobookId}/chapters/${chapterId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete chapter')
      }

      setChapters(chapters.filter(c => c.id !== chapterId))
      toast({
        title: "Success",
        description: "Chapter deleted successfully"
      })
      fetchAudiobook()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete chapter",
        variant: "destructive"
      })
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` 
                     : `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800 border-green-200'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!audiobookId || audiobookId === 'undefined') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Invalid Audiobook</h2>
          <p className="text-muted-foreground mb-4">The audiobook ID is missing or invalid.</p>
          <Button onClick={() => router.push('/dashboard/audiobooks')}>
            Back to Audiobooks
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading chapters...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Chapter Management</h1>
          <p className="text-muted-foreground">
            {audiobook?.title} • {chapters.length} chapters
          </p>
        </div>
        <Button onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Chapter
        </Button>


      </div>

      {/* Chapters List */}
      <div className="space-y-4">
        {chapters.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">No chapters found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters/new`)}
              >
                Add Your First Chapter
              </Button>
            </CardContent>
          </Card>
        ) : (
          chapters.map((chapter, index) => (
            <Card key={chapter.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <span className="font-semibold text-lg">{chapter.trackNumber}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg truncate">{chapter.title}</h3>
                        {chapter.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {chapter.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDuration(chapter.duration)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Play className="h-4 w-4" />
                            <span>{chapter.playCount} plays</span>
                          </div>
                          {chapter.transcript && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span>Transcript available</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(chapter.status)}>
                          {chapter.status === 'PUBLISHED' ? 'Published' : 
                           chapter.status === 'DRAFT' ? 'Draft' : 'Archived'}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters/${chapter.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters/${chapter.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Chapter
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/audiobooks/${audiobookId}/chapters/${chapter.id}/transcript`)}>
                              <FileText className="h-4 w-4 mr-2" />
                              {chapter.transcript ? 'Edit Transcript' : 'Add Transcript'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {chapter.status === 'DRAFT' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(chapter.id, 'PUBLISHED')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {chapter.status === 'PUBLISHED' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(chapter.id, 'ARCHIVED')}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            {chapter.status === 'ARCHIVED' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(chapter.id, 'PUBLISHED')}>
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
                                  <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{chapter.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteChapter(chapter.id)} className="bg-red-600 hover:bg-red-700">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}