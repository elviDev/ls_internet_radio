"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  Radio, 
  Calendar, 
  Clock, 
  Users, 
  Play, 
  Settings, 
  Edit3, 
  Share2, 
  ExternalLink,
  Crown,
  Mic,
  Headphones,
  UserCheck,
  Volume2,
  Eye,
  Heart,
  MessageCircle,
  Download,
  MoreHorizontal,
  ChevronLeft,
  MapPin,
  Zap,
  Activity,
  TrendingUp,
  Plus,
  X,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"

type Broadcast = {
  id: string
  title: string
  slug: string
  description: string
  status: "LIVE" | "SCHEDULED" | "ENDED"
  startTime: string
  endTime?: string
  streamUrl?: string
  hostUser: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  banner?: {
    id: string
    url: string
    originalName: string
    type: string
  }
  staff: BroadcastStaff[]
  guests: BroadcastGuest[]
  // Configuration settings
  autoRecord?: boolean
  chatEnabled?: boolean
  chatModeration?: boolean
  allowGuests?: boolean
  maxListeners?: number
  quality?: string
  notificationsEnabled?: boolean
  emailNotifications?: boolean
  smsNotifications?: boolean
  slackNotifications?: boolean
  recordingFormat?: string
  streamDelay?: number
  createdAt: string
  updatedAt: string
}

type BroadcastSettings = {
  autoRecord: boolean
  chatEnabled: boolean
  chatModeration: boolean
  allowGuests: boolean
  maxListeners: number
  quality: string
  notificationsEnabled: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  slackNotifications: boolean
  recordingFormat: string
  streamDelay: number
}

type BroadcastStaff = {
  id: string
  role: "HOST" | "CO_HOST" | "PRODUCER" | "SOUND_ENGINEER" | "GUEST" | "MODERATOR"
  user: {
    id: string
    firstName: string
    lastName: string
    username: string
    email: string
    profileImage?: string
  }
  isActive: boolean
}

type BroadcastGuest = {
  id: string
  name: string
  title?: string
  role: string
}

async function fetchBroadcast(slug: string) {
  try {
    const response = await fetch(`/api/admin/broadcasts/${slug}`)
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch broadcast')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching broadcast:', error)
    return null
  }
}

export default function BroadcastDetailPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Guest management state
  const [isAddGuestDialogOpen, setIsAddGuestDialogOpen] = useState(false)
  const [addingGuest, setAddingGuest] = useState(false)
  const [removingGuestId, setRemovingGuestId] = useState<string | null>(null)
  const [newGuest, setNewGuest] = useState({
    name: "",
    title: "",
    role: ""
  })
  
  // Settings state
  const [settings, setSettings] = useState<BroadcastSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  
  // Edit broadcast state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBroadcast, setEditingBroadcast] = useState(false)
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    streamUrl: ""
  })
  
  // Share broadcast state
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (slug) {
      loadBroadcast()
    }
  }, [slug])

  const loadBroadcast = async () => {
    setLoading(true)
    const data = await fetchBroadcast(slug)
    setBroadcast(data)
    setLoading(false)
  }

  // Load settings when settings tab is active
  useEffect(() => {
    if (activeTab === "settings" && slug && !settings) {
      loadSettings()
    }
  }, [activeTab, slug, settings])

  const loadSettings = async () => {
    setSettingsLoading(true)
    setSettingsError(null)
    try {
      const response = await fetch(`/api/admin/broadcasts/${slug}/settings`)
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        throw new Error('Failed to load settings')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setSettingsError('Failed to load settings')
    } finally {
      setSettingsLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return
    
    setSavingSettings(true)
    setSettingsError(null)
    try {
      const response = await fetch(`/api/admin/broadcasts/${slug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      
      if (response.ok) {
        const updatedSettings = await response.json()
        setSettings(updatedSettings)
        toast.success('Settings saved successfully')
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setSettingsError('Failed to save settings')
      toast.error('Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const addGuest = async () => {
    if (!newGuest.name.trim() || !newGuest.role.trim()) {
      toast.error('Please fill in required fields')
      return
    }

    setAddingGuest(true)
    try {
      const response = await fetch(`/api/admin/broadcasts/${slug}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGuest.name.trim(),
          title: newGuest.title.trim() || undefined,
          role: newGuest.role.trim(),
        }),
      })

      if (response.ok) {
        const guest = await response.json()
        setBroadcast(prev => prev ? {
          ...prev,
          guests: [...prev.guests, guest]
        } : prev)
        setNewGuest({ name: "", title: "", role: "" })
        setIsAddGuestDialogOpen(false)
        toast.success('Guest added successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add guest')
      }
    } catch (error) {
      console.error('Error adding guest:', error)
      toast.error('Failed to add guest')
    } finally {
      setAddingGuest(false)
    }
  }

  const removeGuest = async (guestId: string) => {
    setRemovingGuestId(guestId)
    try {
      const response = await fetch(`/api/admin/broadcasts/${slug}/guests/${guestId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setBroadcast(prev => prev ? {
          ...prev,
          guests: prev.guests.filter(g => g.id !== guestId)
        } : prev)
        toast.success('Guest removed successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to remove guest')
      }
    } catch (error) {
      console.error('Error removing guest:', error)
      toast.error('Failed to remove guest')
    } finally {
      setRemovingGuestId(null)
    }
  }

  const openEditDialog = () => {
    if (broadcast) {
      // Format datetime for datetime-local input (YYYY-MM-DDTHH:MM)
      const formatForDatetimeLocal = (dateString: string) => {
        const date = new Date(dateString)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      }

      setEditForm({
        title: broadcast.title,
        description: broadcast.description,
        startTime: formatForDatetimeLocal(broadcast.startTime),
        endTime: broadcast.endTime ? formatForDatetimeLocal(broadcast.endTime) : "",
        streamUrl: broadcast.streamUrl || ""
      })
      setIsEditDialogOpen(true)
    }
  }

  const updateBroadcast = async () => {
    if (!editForm.title.trim() || !editForm.description.trim() || !editForm.startTime) {
      toast.error('Please fill in all required fields')
      return
    }

    setEditingBroadcast(true)
    try {
      const response = await fetch(`/api/admin/broadcasts/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          startTime: new Date(editForm.startTime).toISOString(),
          endTime: editForm.endTime ? new Date(editForm.endTime).toISOString() : undefined,
          streamUrl: editForm.streamUrl.trim() || undefined,
        }),
      })

      if (response.ok) {
        const updatedBroadcast = await response.json()
        setBroadcast(updatedBroadcast)
        setIsEditDialogOpen(false)
        toast.success('Broadcast updated successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update broadcast')
      }
    } catch (error) {
      console.error('Error updating broadcast:', error)
      toast.error('Failed to update broadcast')
    } finally {
      setEditingBroadcast(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      toast.error('Failed to copy link')
    }
  }

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/live` : ''
  const embedCode = `<iframe src="${shareUrl}" width="800" height="600" frameborder="0"></iframe>`

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LIVE":
        return (
          <Badge variant="destructive" className="animate-pulse text-sm px-3 py-1">
            <Radio className="h-4 w-4 mr-2" />
            LIVE NOW
          </Badge>
        )
      case "SCHEDULED":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-sm px-3 py-1">
            <Clock className="h-4 w-4 mr-2" />
            Scheduled
          </Badge>
        )
      case "ENDED":
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-sm px-3 py-1">
            <Activity className="h-4 w-4 mr-2" />
            Ended
          </Badge>
        )
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "HOST": return Crown
      case "CO_HOST": return Mic
      case "PRODUCER": return Settings
      case "SOUND_ENGINEER": return Headphones
      case "GUEST": return UserCheck
      case "MODERATOR": return Users
      default: return Users
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "HOST": return "bg-purple-100 text-purple-800 border-purple-200"
      case "CO_HOST": return "bg-blue-100 text-blue-800 border-blue-200"
      case "PRODUCER": return "bg-green-100 text-green-800 border-green-200"
      case "SOUND_ENGINEER": return "bg-orange-100 text-orange-800 border-orange-200"
      case "GUEST": return "bg-gray-100 text-gray-800 border-gray-200"
      case "MODERATOR": return "bg-indigo-100 text-indigo-800 border-indigo-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZoneName: 'short'
      })
    }
  }

  const calculateDuration = (start: string, end?: string) => {
    if (!end) return "Duration TBD"
    const startTime = new Date(start)
    const endTime = new Date(end)
    const diffMs = endTime.getTime() - startTime.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    }
    return `${diffMinutes}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-64 bg-slate-200 rounded-xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-32 bg-slate-200 rounded-xl"></div>
                <div className="h-48 bg-slate-200 rounded-xl"></div>
              </div>
              <div className="space-y-4">
                <div className="h-24 bg-slate-200 rounded-xl"></div>
                <div className="h-32 bg-slate-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!broadcast) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Radio className="h-16 w-16 text-slate-300 mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Broadcast Not Found</h2>
            <p className="text-slate-500 text-center mb-6">
              The broadcast you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/dashboard/broadcasts')} className="w-full">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Broadcasts
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const startDateTime = formatDateTime(broadcast.startTime)
  const endDateTime = broadcast.endTime ? formatDateTime(broadcast.endTime) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-6 py-8">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push('/dashboard/broadcasts')}
              className="hover:bg-white/80 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Broadcast Details
              </h1>
              <p className="text-slate-500 mt-1">Manage and monitor your broadcast</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {broadcast.status === "LIVE" && (
              <Button 
                onClick={() => router.push(`/dashboard/broadcasts/${broadcast.slug}/studio`)}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
              >
                <Radio className="h-4 w-4 mr-2" />
                Enter Studio
              </Button>
            )}
            {broadcast.status === "SCHEDULED" && (
              <Button 
                onClick={() => router.push(`/dashboard/broadcasts/${broadcast.slug}/studio`)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
              >
                <Play className="h-4 w-4 mr-2" />
                Go Live
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="hover:bg-white/80">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={openEditDialog}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Broadcast
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsShareDialogOpen(true)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <Activity className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Hero Section */}
        <Card className="mb-8 overflow-hidden border-0 shadow-xl bg-gradient-to-r from-white via-slate-50 to-white">
          {broadcast.banner && (
            <div 
              className="h-64 bg-cover bg-center relative"
              style={{ backgroundImage: `url(${broadcast.banner.url})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center justify-between">
                  {getStatusBadge(broadcast.status)}
                  <div className="flex items-center gap-2 text-white">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">1.2K views</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <CardContent className="p-8">
            {!broadcast.banner && (
              <div className="flex items-center justify-between mb-6">
                {getStatusBadge(broadcast.status)}
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">1.2K views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm font-medium">89 likes</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
                  {broadcast.title}
                </h1>
                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                  {broadcast.description}
                </p>
                
                {/* Host Info */}
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-12 w-12 ring-2 ring-purple-100">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold">
                      {`${broadcast.hostUser.firstName} ${broadcast.hostUser.lastName}`.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {`${broadcast.hostUser.firstName} ${broadcast.hostUser.lastName}`}
                      </span>
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                        <Crown className="h-3 w-3 mr-1" />
                        HOST
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">{broadcast.hostUser.email}</p>
                  </div>
                </div>
              </div>
              
              {/* Schedule Card */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Calendar className="h-5 w-5" />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                      <MapPin className="h-4 w-4" />
                      Start Time
                    </div>
                    <p className="font-semibold text-blue-900">{startDateTime.date}</p>
                    <p className="text-blue-700">{startDateTime.time}</p>
                  </div>
                  
                  {endDateTime && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                        <Clock className="h-4 w-4" />
                        End Time
                      </div>
                      <p className="font-semibold text-blue-900">{endDateTime.date}</p>
                      <p className="text-blue-700">{endDateTime.time}</p>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-blue-200">
                    <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                      <TrendingUp className="h-4 w-4" />
                      Duration
                    </div>
                    <p className="font-semibold text-blue-900">
                      {calculateDuration(broadcast.startTime, broadcast.endTime)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-white shadow-sm border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Team & Guests
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stream Info */}
              <Card className="lg:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <Volume2 className="h-5 w-5" />
                    Stream Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {broadcast.streamUrl ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-green-700">Stream URL</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input 
                            value={broadcast.streamUrl} 
                            readOnly 
                            className="bg-white/80 border-green-200 text-green-900"
                          />
                          <Button variant="outline" size="icon" className="border-green-200 hover:bg-green-100">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-green-700">Stream Active</span>
                        </div>
                        <div className="text-sm text-green-600">
                          Quality: HD (320 kbps)
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Volume2 className="h-12 w-12 text-green-300 mx-auto mb-3" />
                      <p className="text-green-700 font-medium">No stream URL configured</p>
                      <p className="text-sm text-green-600">Stream settings will be available when broadcast goes live</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-700">Live Listeners</p>
                        <p className="text-2xl font-bold text-orange-900">1,247</p>
                      </div>
                      <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-700">Peak Audience</p>
                        <p className="text-2xl font-bold text-purple-900">2,891</p>
                      </div>
                      <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-cyan-700">Chat Messages</p>
                        <p className="text-2xl font-bold text-cyan-900">456</p>
                      </div>
                      <div className="h-12 w-12 bg-cyan-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 text-cyan-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Staff Members */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Broadcast Team ({broadcast.staff.length + 1})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Host */}
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-purple-500 text-white">
                          {`${broadcast.hostUser.firstName} ${broadcast.hostUser.lastName}`.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {`${broadcast.hostUser.firstName} ${broadcast.hostUser.lastName}`}
                          </span>
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                            <Crown className="h-3 w-3 mr-1" />
                            HOST
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">{broadcast.hostUser.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Staff */}
                  {broadcast.staff.map((staffMember) => {
                    const Icon = getRoleIcon(staffMember.role)
                    return (
                      <div key={`${staffMember.id}-${staffMember.role}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {`${staffMember.user.firstName} ${staffMember.user.lastName}`.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">
                                {`${staffMember.user.firstName} ${staffMember.user.lastName}`}
                              </span>
                              <Badge variant="outline" className={`${getRoleColor(staffMember.role)} flex items-center gap-1`}>
                                <Icon className="h-3 w-3" />
                                {staffMember.role.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500">{staffMember.user.email}</p>
                          </div>
                        </div>
                        <div className={`h-3 w-3 rounded-full ${staffMember.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Guests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Guests ({broadcast.guests.length})
                    </div>
                    {broadcast.allowGuests !== false && (
                      <Dialog open={isAddGuestDialogOpen} onOpenChange={setIsAddGuestDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="h-8">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Guest
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Guest to Broadcast</DialogTitle>
                            <DialogDescription>
                              Add an external guest to this broadcast
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="guest-name">Guest Name *</Label>
                              <Input
                                id="guest-name"
                                value={newGuest.name}
                                onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                                placeholder="Enter guest name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="guest-title">Title (Optional)</Label>
                              <Input
                                id="guest-title"
                                value={newGuest.title}
                                onChange={(e) => setNewGuest({ ...newGuest, title: e.target.value })}
                                placeholder="e.g., Author, Expert, etc."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="guest-role">Role *</Label>
                              <Select value={newGuest.role} onValueChange={(value) => setNewGuest({ ...newGuest, role: value })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select guest role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Guest Speaker">Guest Speaker</SelectItem>
                                  <SelectItem value="Interviewee">Interviewee</SelectItem>
                                  <SelectItem value="Expert">Expert</SelectItem>
                                  <SelectItem value="Author">Author</SelectItem>
                                  <SelectItem value="Musician">Musician</SelectItem>
                                  <SelectItem value="Artist">Artist</SelectItem>
                                  <SelectItem value="Politician">Politician</SelectItem>
                                  <SelectItem value="Journalist">Journalist</SelectItem>
                                  <SelectItem value="Celebrity">Celebrity</SelectItem>
                                  <SelectItem value="Analyst">Analyst</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddGuestDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={addGuest} 
                              disabled={!newGuest.name.trim() || !newGuest.role.trim() || addingGuest}
                            >
                              {addingGuest ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                'Add Guest'
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {broadcast.guests.length > 0 ? (
                    broadcast.guests.map((guest) => (
                      <div key={guest.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-green-500 text-white">
                              {guest.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">{guest.name}</span>
                              {guest.title && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                  {guest.title}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">{guest.role}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeGuest(guest.id)}
                          disabled={removingGuestId === guest.id}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {removingGuestId === guest.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <UserCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No guests added to this broadcast</p>
                      {broadcast.allowGuests !== false ? (
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setIsAddGuestDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Guest
                        </Button>
                      ) : (
                        <p className="text-sm text-slate-400">Guest functionality is disabled for this broadcast</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700">Total Views</p>
                      <p className="text-3xl font-bold text-blue-900">12,847</p>
                      <p className="text-xs text-blue-600">+23% from last week</p>
                    </div>
                    <Eye className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700">Avg. Duration</p>
                      <p className="text-3xl font-bold text-green-900">47m</p>
                      <p className="text-xs text-green-600">+12% from last week</p>
                    </div>
                    <Clock className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700">Engagement</p>
                      <p className="text-3xl font-bold text-purple-900">89%</p>
                      <p className="text-xs text-purple-600">+5% from last week</p>
                    </div>
                    <Heart className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-700">Chat Activity</p>
                      <p className="text-3xl font-bold text-orange-900">1,234</p>
                      <p className="text-xs text-orange-600">+34% from last week</p>
                    </div>
                    <MessageCircle className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Listener Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                  <p className="text-slate-500">Analytics Chart Placeholder</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {settingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                <span className="ml-2 text-slate-500">Loading settings...</span>
              </div>
            ) : settingsError ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="flex items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                  <div className="text-center">
                    <p className="text-red-700 font-medium">{settingsError}</p>
                    <Button variant="outline" className="mt-4" onClick={loadSettings}>
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : settings ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Broadcast Configuration</h3>
                    <p className="text-slate-500">Configure your broadcast settings and preferences</p>
                  </div>
                  <Button 
                    onClick={saveSettings} 
                    disabled={savingSettings}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {savingSettings ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recording & Stream Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Radio className="h-5 w-5" />
                        Recording & Stream
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">Auto-Record</p>
                          <p className="text-sm text-slate-500">Automatically save broadcast recording</p>
                        </div>
                        <Switch
                          checked={settings.autoRecord}
                          onCheckedChange={(checked) => setSettings({ ...settings, autoRecord: checked })}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-3">
                        <Label>Stream Quality</Label>
                        <Select 
                          value={settings.quality} 
                          onValueChange={(value) => setSettings({ ...settings, quality: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HD">HD (320 kbps)</SelectItem>
                            <SelectItem value="SD">SD (128 kbps)</SelectItem>
                            <SelectItem value="Auto">Auto Quality</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Recording Format</Label>
                        <Select 
                          value={settings.recordingFormat} 
                          onValueChange={(value) => setSettings({ ...settings, recordingFormat: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MP3">MP3</SelectItem>
                            <SelectItem value="WAV">WAV</SelectItem>
                            <SelectItem value="FLAC">FLAC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Stream Delay (seconds)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="60"
                          value={settings.streamDelay}
                          onChange={(e) => setSettings({ ...settings, streamDelay: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Max Listeners</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10000"
                          value={settings.maxListeners}
                          onChange={(e) => setSettings({ ...settings, maxListeners: parseInt(e.target.value) || 1000 })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Chat & Interaction Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Chat & Interaction
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">Enable Chat</p>
                          <p className="text-sm text-slate-500">Allow viewers to chat during broadcast</p>
                        </div>
                        <Switch
                          checked={settings.chatEnabled}
                          onCheckedChange={(checked) => setSettings({ ...settings, chatEnabled: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">Chat Moderation</p>
                          <p className="text-sm text-slate-500">Enable automated chat filtering</p>
                        </div>
                        <Switch
                          checked={settings.chatModeration}
                          disabled={!settings.chatEnabled}
                          onCheckedChange={(checked) => setSettings({ ...settings, chatModeration: checked })}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">Allow Guests</p>
                          <p className="text-sm text-slate-500">Enable guest participation</p>
                        </div>
                        <Switch
                          checked={settings.allowGuests}
                          onCheckedChange={(checked) => setSettings({ ...settings, allowGuests: checked })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notification Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Notifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">Enable Notifications</p>
                          <p className="text-sm text-slate-500">Receive broadcast alerts</p>
                        </div>
                        <Switch
                          checked={settings.notificationsEnabled}
                          onCheckedChange={(checked) => setSettings({ ...settings, notificationsEnabled: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">Email Notifications</p>
                          <p className="text-sm text-slate-500">Get updates via email</p>
                        </div>
                        <Switch
                          checked={settings.emailNotifications}
                          disabled={!settings.notificationsEnabled}
                          onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">SMS Notifications</p>
                          <p className="text-sm text-slate-500">Get updates via SMS</p>
                        </div>
                        <Switch
                          checked={settings.smsNotifications}
                          disabled={!settings.notificationsEnabled}
                          onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">Slack Notifications</p>
                          <p className="text-sm text-slate-500">Send alerts to Slack</p>
                        </div>
                        <Switch
                          checked={settings.slackNotifications}
                          disabled={!settings.notificationsEnabled}
                          onCheckedChange={(checked) => setSettings({ ...settings, slackNotifications: checked })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Basic Info (Read-only) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Edit3 className="h-5 w-5" />
                        Broadcast Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Broadcast Title</Label>
                        <Input value={broadcast.title} readOnly className="bg-slate-50" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={broadcast.description} readOnly className="bg-slate-50" rows={3} />
                      </div>
                      <div className="space-y-2">
                        <Label>Stream URL</Label>
                        <Input value={broadcast.streamUrl || "Not configured"} readOnly className="bg-slate-50" />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(broadcast.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Settings className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Settings not available</p>
                    <Button variant="outline" className="mt-4" onClick={loadSettings}>
                      Load Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Broadcast Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Edit Broadcast
              </DialogTitle>
              <DialogDescription>
                Update your broadcast details and schedule
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Broadcast Title *</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Enter broadcast title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Enter broadcast description"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start-time">Start Time *</Label>
                  <Input
                    id="edit-start-time"
                    type="datetime-local"
                    value={editForm.startTime}
                    onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-end-time">End Time</Label>
                  <Input
                    id="edit-end-time"
                    type="datetime-local"
                    value={editForm.endTime}
                    onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-stream-url">Stream URL</Label>
                <Input
                  id="edit-stream-url"
                  type="url"
                  value={editForm.streamUrl}
                  onChange={(e) => setEditForm({ ...editForm, streamUrl: e.target.value })}
                  placeholder="https://your-stream-url.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={updateBroadcast} 
                disabled={!editForm.title.trim() || !editForm.description.trim() || !editForm.startTime || editingBroadcast}
              >
                {editingBroadcast ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Broadcast
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Broadcast Dialog */}
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Share Broadcast
              </DialogTitle>
              <DialogDescription>
                Share your broadcast with listeners
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Public Link */}
              <div className="space-y-3">
                <Label>Public Broadcast Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="bg-slate-50"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(shareUrl)}
                    className={copySuccess ? "bg-green-100 border-green-300" : ""}
                  >
                    {copySuccess ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-slate-500">
                  Direct link to your live broadcast page
                </p>
              </div>

              <Separator />

              {/* Embed Code */}
              <div className="space-y-3">
                <Label>Embed Code</Label>
                <div className="space-y-2">
                  <Textarea
                    value={embedCode}
                    readOnly
                    className="bg-slate-50 font-mono text-sm"
                    rows={3}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(embedCode)}
                    className="w-full"
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Copy Embed Code
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-slate-500">
                  Embed this player on your website
                </p>
              </div>

              <Separator />

              {/* Social Sharing */}
              <div className="space-y-3">
                <Label>Social Media</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const text = `Check out this live broadcast: ${broadcast?.title}`
                      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
                      window.open(url, '_blank')
                    }}
                    className="justify-start"
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
                      window.open(url, '_blank')
                    }}
                    className="justify-start"
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}