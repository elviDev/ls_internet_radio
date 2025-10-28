"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Radio,
  User,
  Calendar as CalendarIcon,
  Clock,
  Play,
  Download,
  Eye,
  Settings,
  Mic,
  Save,
  Loader2
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

type Program = {
  id: string
  title: string
  slug: string
  description: string
  category: string
  schedule: string
  image?: string
  status: string
  host: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  genre?: {
    id: string
    name: string
  }
  _count: {
    episodes: number
    broadcasts: number
  }
  createdAt: string
  updatedAt: string
}

type Episode = {
  id: string
  title: string
  description?: string
  audioFile?: string
  duration?: number
  airDate: string
  broadcastId?: string
  broadcast?: {
    id: string
    status: string
    startTime: string
    endTime?: string
    recordingUrl?: string
  }
  createdAt: string
}

type Broadcast = {
  id: string
  title: string
  slug: string
  description: string
  status: string
  startTime: string
  endTime?: string
  recordingUrl?: string
  hostUser: {
    firstName: string
    lastName: string
  }
}

const statusColors = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-yellow-100 text-yellow-800", 
  ARCHIVED: "bg-gray-100 text-gray-800"
}

const broadcastStatusColors = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  LIVE: "bg-red-100 text-red-800",
  ENDED: "bg-gray-100 text-gray-800"
}

export default function ProgramDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [program, setProgram] = useState<Program | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const [showNewEpisodeDialog, setShowNewEpisodeDialog] = useState(false)
  const [showLinkBroadcastDialog, setShowLinkBroadcastDialog] = useState(false)
  const [selectedBroadcast, setSelectedBroadcast] = useState("")
  const [episodeForm, setEpisodeForm] = useState({
    title: "",
    description: "",
    airDate: new Date()
  })

  useEffect(() => {
    if (params.id) {
      fetchProgram()
      fetchEpisodes()
      fetchAvailableBroadcasts()
    }
  }, [params.id])

  const fetchProgram = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/programs/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProgram(data)
      } else {
        throw new Error("Failed to fetch program")
      }
    } catch (error) {
      console.error("Error fetching program:", error)
      toast({
        title: "Error",
        description: "Failed to fetch program details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchEpisodes = async () => {
    try {
      setEpisodesLoading(true)
      const response = await fetch(`/api/admin/programs/${params.id}/episodes`)
      if (response.ok) {
        const data = await response.json()
        setEpisodes(data)
      }
    } catch (error) {
      console.error("Error fetching episodes:", error)
    } finally {
      setEpisodesLoading(false)
    }
  }

  const fetchAvailableBroadcasts = async () => {
    try {
      const response = await fetch(`/api/admin/broadcasts?status=ENDED&programId=null`)
      if (response.ok) {
        const data = await response.json()
        setBroadcasts(data.broadcasts || [])
      }
    } catch (error) {
      console.error("Error fetching broadcasts:", error)
    }
  }

  const handleCreateEpisode = async () => {
    try {
      const response = await fetch(`/api/admin/programs/${params.id}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(episodeForm)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Episode created successfully"
        })
        setShowNewEpisodeDialog(false)
        setEpisodeForm({ title: "", description: "", airDate: new Date() })
        fetchEpisodes()
        fetchProgram() // Refresh to update episode count
      } else {
        throw new Error("Failed to create episode")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create episode",
        variant: "destructive"
      })
    }
  }

  const handleLinkBroadcast = async () => {
    if (!selectedBroadcast) return

    try {
      const response = await fetch(`/api/admin/programs/${params.id}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcasts.find(b => b.id === selectedBroadcast)?.title || "Episode",
          description: broadcasts.find(b => b.id === selectedBroadcast)?.description || "",
          airDate: broadcasts.find(b => b.id === selectedBroadcast)?.startTime || new Date(),
          broadcastId: selectedBroadcast
        })
      })

      if (response.ok) {
        toast({
          title: "Success", 
          description: "Broadcast linked as episode successfully"
        })
        setShowLinkBroadcastDialog(false)
        setSelectedBroadcast("")
        fetchEpisodes()
        fetchProgram()
        fetchAvailableBroadcasts() // Refresh available broadcasts
      } else {
        throw new Error("Failed to link broadcast")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to link broadcast",
        variant: "destructive"
      })
    }
  }

  const handleDeleteEpisode = async (episodeId: string) => {
    if (!confirm("Are you sure you want to delete this episode?")) return

    try {
      const response = await fetch(`/api/admin/programs/${params.id}/episodes/${episodeId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Episode deleted successfully"
        })
        fetchEpisodes()
        fetchProgram()
      } else {
        throw new Error("Failed to delete episode")
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to delete episode",
        variant: "destructive"
      })
    }
  }

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
          <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Radio className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Program not found</h3>
            <p className="text-muted-foreground text-center">
              The program you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{program.title}</h1>
          <p className="text-muted-foreground">
            Program details and episode management
          </p>
        </div>
        <Button onClick={() => router.push(`/dashboard/programs/${program.id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Program
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Program Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{program.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      {formatCategory(program.category)}
                    </Badge>
                    <Badge className={statusColors[program.status as keyof typeof statusColors]}>
                      {program.status}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{program.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{program.host.firstName} {program.host.lastName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{program.schedule}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-muted-foreground" />
                  <span>{program._count.episodes} episodes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-muted-foreground" />
                  <span>{program._count.broadcasts} broadcasts</span>
                </div>
                {program.genre && (
                  <div className="flex items-center gap-2 col-span-2">
                    <span className="text-muted-foreground">Genre:</span>
                    <span>{program.genre.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Episodes Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Episodes</CardTitle>
                  <CardDescription>
                    Manage episodes for this program
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={showLinkBroadcastDialog} onOpenChange={setShowLinkBroadcastDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Mic className="h-4 w-4 mr-2" />
                        Link Broadcast
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Link Broadcast as Episode</DialogTitle>
                        <DialogDescription>
                          Select a completed broadcast to add as an episode
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="broadcast">Select Broadcast</Label>
                          <Select value={selectedBroadcast} onValueChange={setSelectedBroadcast}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a broadcast" />
                            </SelectTrigger>
                            <SelectContent>
                              {broadcasts.map((broadcast) => (
                                <SelectItem key={broadcast.id} value={broadcast.id}>
                                  {broadcast.title} - {format(new Date(broadcast.startTime), "MMM d, yyyy")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLinkBroadcastDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleLinkBroadcast} disabled={!selectedBroadcast}>
                          Link Broadcast
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showNewEpisodeDialog} onOpenChange={setShowNewEpisodeDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Episode
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Episode</DialogTitle>
                        <DialogDescription>
                          Add a new episode to this program
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Episode Title</Label>
                          <Input
                            id="title"
                            value={episodeForm.title}
                            onChange={(e) => setEpisodeForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter episode title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={episodeForm.description}
                            onChange={(e) => setEpisodeForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter episode description"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Air Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(episodeForm.airDate, "PPP")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={episodeForm.airDate}
                                onSelect={(date) => date && setEpisodeForm(prev => ({ ...prev, airDate: date }))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewEpisodeDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateEpisode} disabled={!episodeForm.title.trim()}>
                          Create Episode
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {episodesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-48"></div>
                        <div className="h-3 bg-muted rounded w-32"></div>
                      </div>
                      <div className="h-8 w-20 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : episodes.length > 0 ? (
                <div className="space-y-4">
                  {episodes.map((episode) => (
                    <div key={episode.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex-1">
                        <h4 className="font-medium">{episode.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(new Date(episode.airDate), "MMM d, yyyy")}
                          </span>
                          {episode.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.floor(episode.duration / 60)}m
                            </span>
                          )}
                          {episode.broadcast && (
                            <Badge className={broadcastStatusColors[episode.broadcast.status as keyof typeof broadcastStatusColors]}>
                              {episode.broadcast.status}
                            </Badge>
                          )}
                        </div>
                        {episode.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {episode.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {episode.audioFile && (
                          <Button variant="ghost" size="icon">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {episode.broadcast?.recordingUrl && (
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteEpisode(episode.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Radio className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <h4 className="font-medium mb-1">No episodes yet</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first episode or link an existing broadcast
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" onClick={() => setShowNewEpisodeDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Episode
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowLinkBroadcastDialog(true)}>
                      <Mic className="h-4 w-4 mr-2" />
                      Link Broadcast
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Program Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Program Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Episodes</span>
                <span className="font-medium">{program._count.episodes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Broadcasts</span>
                <span className="font-medium">{program._count.broadcasts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={statusColors[program.status as keyof typeof statusColors]}>
                  {program.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{format(new Date(program.createdAt), "MMM d, yyyy")}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Play className="h-4 w-4 mr-2" />
                View Public Page
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Program Settings
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Eye className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}