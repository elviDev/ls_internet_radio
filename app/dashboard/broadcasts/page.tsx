"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { Textarea } from "@/components/ui/textarea"
import { Radio, Plus, MoreVertical, Edit, Trash, Users, Clock, Calendar as CalendarIcon, Eye, Play, Search, X, Crown, Mic, Settings, Headphones, UserCheck, Save, Loader2, ArrowLeft, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Broadcast = {
  id: string
  title: string
  slug: string
  description: string
  status: "LIVE" | "SCHEDULED" | "READY" | "ENDED"
  hostUser?: {
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
  program?: {
    id: string
    title: string
    slug: string
  }
  staff?: BroadcastStaff[]
  guests?: BroadcastGuest[]
  startTime: string
  endTime?: string
  streamUrl?: string
  createdAt: string
  updatedAt: string
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

type StaffMember = {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string
  role: "HOST" | "CO_HOST" | "PRODUCER" | "SOUND_ENGINEER" | "ADMIN"
  profileImage?: string
}

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
}

type Program = {
  id: string
  title: string
  slug: string
  category: string
  status: string
}

async function fetchBroadcasts(programId?: string | null) {
  try {
    const params = new URLSearchParams()
    if (programId) {
      params.set('programId', programId)
    }
    const response = await fetch(`/api/admin/broadcasts?${params}`)
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('You do not have permission to view broadcasts')
      } else if (response.status === 404) {
        throw new Error('Broadcasts endpoint not found')
      } else {
        throw new Error(`Failed to fetch broadcasts (${response.status})`)
      }
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching broadcasts:', error)
    toast.error(error instanceof Error ? error.message : 'Failed to load broadcasts')
    return { broadcasts: [] }
  }
}

async function fetchStaff() {
  try {
    const response = await fetch('/api/admin/staff')
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('You do not have permission to view staff')
      } else {
        throw new Error(`Failed to fetch staff (${response.status})`)
      }
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching staff:', error)
    toast.error(error instanceof Error ? error.message : 'Failed to load staff members')
    return { staff: [] }
  }
}

async function fetchAssets() {
  try {
    const response = await fetch('/api/admin/assets?type=IMAGE&perPage=50')
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('You do not have permission to view assets')
      } else {
        throw new Error(`Failed to fetch assets (${response.status})`)
      }
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching assets:', error)
    toast.error(error instanceof Error ? error.message : 'Failed to load assets')
    return { assets: [] }
  }
}

async function fetchPrograms() {
  try {
    const response = await fetch('/api/admin/programs?perPage=100')
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('You do not have permission to view programs')
      } else {
        throw new Error(`Failed to fetch programs (${response.status})`)
      }
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching programs:', error)
    toast.error(error instanceof Error ? error.message : 'Failed to load programs')
    return { programs: [] }
  }
}

export default function BroadcastsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const programIdFromUrl = searchParams.get('programId')
  
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [filter, setFilter] = useState<"all" | "LIVE" | "SCHEDULED" | "READY" | "ENDED">("all")
  const [programFilter, setProgramFilter] = useState(programIdFromUrl || "all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newBroadcast, setNewBroadcast] = useState({
    title: "",
    description: "",
    startTime: undefined as Date | undefined,
    startTimeHour: "09",
    startTimeMinute: "00",
    endTime: undefined as Date | undefined,
    endTimeHour: "10",
    endTimeMinute: "00",
    hostId: "",
    bannerId: "",
    bannerFile: null as File | null,
    programId: programIdFromUrl || "",
    staff: [] as { userId: string; role: string }[],
    guests: [] as { name: string; title?: string; role: string }[],
  })
  const [guestForm, setGuestForm] = useState({
    name: "",
    title: "",
    role: ""
  })
  const [staffForm, setStaffForm] = useState({
    userId: "",
    role: ""
  })
  const [uploadingAsset, setUploadingAsset] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [creating, setCreating] = useState(false)
  
  // Edit broadcast state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBroadcast, setEditingBroadcast] = useState(false)
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null)
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    streamUrl: "",
    bannerId: "",
    bannerFile: null as File | null
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      await Promise.all([
        loadBroadcasts(),
        loadStaff(),
        loadAssets(),
        loadPrograms()
      ])
    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('Failed to load data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (programIdFromUrl) {
      loadBroadcasts(programIdFromUrl)
      // Find and set the selected program
      const program = programs.find(p => p.id === programIdFromUrl)
      setSelectedProgram(program || null)
    }
  }, [programIdFromUrl, programs])

  const loadBroadcasts = async (programId?: string) => {
    const data = await fetchBroadcasts(programId)
    setBroadcasts(data.broadcasts || [])
  }

  const loadStaff = async () => {
    const data = await fetchStaff()
    setStaff(data.staff || [])
  }

  const loadAssets = async () => {
    const data = await fetchAssets()
    setAssets(data.assets || [])
  }

  const loadPrograms = async () => {
    const data = await fetchPrograms()
    setPrograms(data.programs || [])
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    loadInitialData()
  }

  const openEditDialog = (broadcast: Broadcast) => {
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

    setSelectedBroadcast(broadcast)
    setEditForm({
      title: broadcast.title,
      description: broadcast.description,
      startTime: formatForDatetimeLocal(broadcast.startTime),
      endTime: broadcast.endTime ? formatForDatetimeLocal(broadcast.endTime) : "",
      streamUrl: broadcast.streamUrl || "",
      bannerId: broadcast.banner?.id || "",
      bannerFile: null
    })
    setIsEditDialogOpen(true)
  }

  const updateBroadcast = async () => {
    if (!selectedBroadcast || !editForm.title.trim() || !editForm.description.trim() || !editForm.startTime) {
      toast.error('Please fill in all required fields')
      return
    }

    setEditingBroadcast(true)
    try {
      // Handle banner upload if a new file is selected
      let finalBannerId = editForm.bannerId && editForm.bannerId !== "none" ? editForm.bannerId : undefined
      
      if (editForm.bannerFile) {
        setUploadingAsset(true)
        setUploadProgress(30)
        try {
          const formData = new FormData()
          formData.append('file', editForm.bannerFile)
          formData.append('description', `Banner for broadcast: ${editForm.title}`)

          const uploadResponse = await fetch('/api/admin/assets/upload', {
            method: 'POST',
            body: formData,
          })

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload banner image')
          }

          const asset = await uploadResponse.json()
          finalBannerId = asset.id
          setUploadProgress(60)
          // Refresh assets list
          await loadAssets()
        } catch (error) {
          throw new Error('Failed to upload banner image')
        } finally {
          setUploadingAsset(false)
        }
      }
      
      setUploadProgress(80)

      const response = await fetch(`/api/admin/broadcasts/${selectedBroadcast.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          startTime: new Date(editForm.startTime).toISOString(),
          endTime: editForm.endTime ? new Date(editForm.endTime).toISOString() : undefined,
          streamUrl: editForm.streamUrl.trim() || undefined,
          bannerId: finalBannerId,
        }),
      })

      if (response.ok) {
        setUploadProgress(100)
        const updatedBroadcast = await response.json()
        setBroadcasts(prev => prev.map(b => b.id === updatedBroadcast.id ? updatedBroadcast : b))
        setIsEditDialogOpen(false)
        setSelectedBroadcast(null)
        setUploadProgress(0)
        setEditForm({
          title: "",
          description: "",
          startTime: "",
          endTime: "",
          streamUrl: "",
          bannerId: "",
          bannerFile: null
        })
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
      setUploadingAsset(false)
      setUploadProgress(0)
    }
  }

  const filteredBroadcasts = broadcasts.filter((broadcast) => {
    const matchesFilter = filter === "all" || broadcast.status === filter
    const matchesSearch =
      broadcast.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (broadcast.hostUser ? `${broadcast.hostUser.firstName} ${broadcast.hostUser.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      (broadcast.program ? broadcast.program.title.toLowerCase().includes(searchQuery.toLowerCase()) : false)
    
    const matchesProgram = programFilter === "all" || 
      (programFilter === "null" && !broadcast.program) ||
      (broadcast.program && broadcast.program.id === programFilter)
    
    return matchesFilter && matchesSearch && matchesProgram
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LIVE":
        return (
          <Badge variant="destructive" className="animate-pulse">
            <Radio className="h-3 w-3 mr-1" />
            LIVE
          </Badge>
        )
      case "SCHEDULED":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        )
      case "READY":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Settings className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        )
      case "ENDED":
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
            Ended
          </Badge>
        )
    }
  }

  const uploadBannerImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('description', `Banner for broadcast: ${newBroadcast.title}`)

    const response = await fetch('/api/admin/assets/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to upload banner image')
    }

    const asset = await response.json()
    return asset.id
  }

  const handleCreateBroadcast = async () => {
    try {
      setCreating(true)
      
      // Handle banner upload if a new file is selected
      let finalBannerId = newBroadcast.bannerId && newBroadcast.bannerId !== "none" ? newBroadcast.bannerId : undefined
      
      if (newBroadcast.bannerFile) {
        setUploadingAsset(true)
        setUploadProgress(30)
        try {
          finalBannerId = await uploadBannerImage(newBroadcast.bannerFile)
          setUploadProgress(60)
          // Refresh assets list
          await loadAssets()
        } catch (error) {
          throw new Error('Failed to upload banner image')
        } finally {
          setUploadingAsset(false)
        }
      }
      
      setUploadProgress(80)

      // Combine date and time for start time
      const startDateTime = newBroadcast.startTime ? new Date(newBroadcast.startTime) : null
      if (startDateTime) {
        startDateTime.setHours(parseInt(newBroadcast.startTimeHour), parseInt(newBroadcast.startTimeMinute))
      }

      // Combine date and time for end time
      const endDateTime = newBroadcast.endTime ? new Date(newBroadcast.endTime) : null
      if (endDateTime) {
        endDateTime.setHours(parseInt(newBroadcast.endTimeHour), parseInt(newBroadcast.endTimeMinute))
      }

      const broadcastData = {
        title: newBroadcast.title,
        description: newBroadcast.description,
        hostId: newBroadcast.hostId,
        startTime: startDateTime?.toISOString(),
        endTime: endDateTime?.toISOString(),
        bannerId: finalBannerId,
        programId: newBroadcast.programId && newBroadcast.programId !== "no-program" ? newBroadcast.programId : undefined,
        staff: newBroadcast.staff,
        guests: newBroadcast.guests,
      }

      const response = await fetch('/api/admin/broadcasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(broadcastData),
      })

      if (response.ok) {
        setUploadProgress(100)
        toast.success('Broadcast created successfully!')
        setIsCreateDialogOpen(false)
        setNewBroadcast({
          title: "",
          description: "",
          startTime: undefined,
          startTimeHour: "09",
          startTimeMinute: "00",
          endTime: undefined,
          endTimeHour: "10",
          endTimeMinute: "00",
          hostId: "",
          bannerId: "",
          bannerFile: null,
          programId: programIdFromUrl || "",
          staff: [],
          guests: [],
        })
        setStaffForm({ userId: "", role: "" })
        setGuestForm({ name: "", title: "", role: "" })
        setUploadProgress(0)
        loadBroadcasts()
      } else {
        throw new Error('Failed to create broadcast')
      }
    } catch (error) {
      console.error('Error creating broadcast:', error)
      toast.error('Failed to create broadcast')
    } finally {
      setCreating(false)
      setUploadingAsset(false)
      setUploadProgress(0)
    }
  }

  const handleGoLive = async (broadcast: Broadcast) => {
    try {
      await fetch(`/api/admin/broadcasts/${broadcast.slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'READY' }),
      })
      router.push(`/dashboard/broadcasts/${broadcast.slug}/studio`)
    } catch (error) {
      console.error('Error going live:', error)
    }
  }

  const addStaffMember = () => {
    if (staffForm.userId && staffForm.role) {
      // Check if this person already has this role
      if (!newBroadcast.staff.find(s => s.userId === staffForm.userId && s.role === staffForm.role)) {
        // Check if role has less than 5 people
        const roleCount = newBroadcast.staff.filter(s => s.role === staffForm.role).length
        if (roleCount < 5) {
          setNewBroadcast({
            ...newBroadcast,
            staff: [...newBroadcast.staff, { userId: staffForm.userId, role: staffForm.role }]
          })
          setStaffForm({ userId: "", role: "" })
        }
      }
    }
  }

  const removeStaffMember = (userId: string, role: string) => {
    setNewBroadcast({
      ...newBroadcast,
      staff: newBroadcast.staff.filter(s => !(s.userId === userId && s.role === role))
    })
  }

  const addGuest = () => {
    if (guestForm.name.trim() && guestForm.role.trim()) {
      setNewBroadcast({
        ...newBroadcast,
        guests: [...newBroadcast.guests, { 
          name: guestForm.name.trim(), 
          title: guestForm.title.trim() || undefined, 
          role: guestForm.role.trim() 
        }]
      })
      setGuestForm({ name: "", title: "", role: "" })
    }
  }

  const removeGuest = (index: number) => {
    setNewBroadcast({
      ...newBroadcast,
      guests: newBroadcast.guests.filter((_, i) => i !== index)
    })
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Broadcasts</h1>
          <p className="text-slate-500 mt-1">Manage live and scheduled broadcasts</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Broadcast
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="shrink-0">
              <DialogTitle>Create New Broadcast +</DialogTitle>
              <DialogDescription>Schedule a new broadcast or go live immediately</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto overflow-x-hidden flex-1">
              <div className="space-y-2">
                <Label htmlFor="title">Broadcast Title</Label>
                <Input
                  id="title"
                  value={newBroadcast.title}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                  placeholder="Enter broadcast title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newBroadcast.description}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, description: e.target.value })}
                  placeholder="Enter broadcast description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="host">Primary Host</Label>
                <Select value={newBroadcast.hostId} onValueChange={(value: string) => setNewBroadcast({ ...newBroadcast, hostId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary host" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{`${member.firstName} ${member.lastName}`.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span>{`${member.firstName} ${member.lastName}`}</span>
                          <Badge variant="outline" className="ml-auto">
                            {member.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Program Association */}
              <div className="space-y-2">
                <Label htmlFor="program">Associated Program (Optional)</Label>
                <Select value={newBroadcast.programId} onValueChange={(value: string) => setNewBroadcast({ ...newBroadcast, programId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={programIdFromUrl ? selectedProgram?.title || "Select program" : "Select program"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-program">No Program</SelectItem>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        <div className="flex items-center gap-2">
                          <span>{program.title}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {program.category.replace('_', ' ')}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {programIdFromUrl && selectedProgram && (
                  <p className="text-sm text-slate-500">
                    Pre-selected from program page. You can change this if needed.
                  </p>
                )}
              </div>

              {/* Banner Selection */}
              <div className="space-y-4">
                <Label>Broadcast Banner (Optional)</Label>
                
                {/* Upload Progress */}
                {uploadingAsset && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading banner...</span>
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
                {(newBroadcast.bannerFile || (newBroadcast.bannerId && newBroadcast.bannerId !== "none")) && (
                  <div className="p-3 border rounded-lg bg-slate-50">
                    {newBroadcast.bannerFile ? (
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-10 bg-slate-100 rounded overflow-hidden">
                          <img 
                            src={URL.createObjectURL(newBroadcast.bannerFile)} 
                            alt="New banner"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{newBroadcast.bannerFile.name}</p>
                          <p className="text-xs text-slate-500">{(newBroadcast.bannerFile.size / 1024).toFixed(1)} KB</p>
                          <p className="text-xs text-blue-600">New upload</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setNewBroadcast({ ...newBroadcast, bannerFile: null })}
                          className="h-8 w-8 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (() => {
                      const selectedAsset = assets.find(a => a.id === newBroadcast.bannerId)
                      if (selectedAsset) {
                        return (
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-10 bg-slate-100 rounded overflow-hidden">
                              <img 
                                src={selectedAsset.url} 
                                alt={selectedAsset.originalName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{selectedAsset.originalName}</p>
                              <p className="text-xs text-slate-500">{(selectedAsset.size / 1024).toFixed(1)} KB</p>
                              <p className="text-xs text-green-600">From assets</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setNewBroadcast({ ...newBroadcast, bannerId: "" })}
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
                {!newBroadcast.bannerFile && !newBroadcast.bannerId && (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Upload New */}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setNewBroadcast({ ...newBroadcast, bannerFile: file, bannerId: "" })
                          }
                        }}
                        className="hidden"
                        id="banner-upload"
                      />
                      <label
                        htmlFor="banner-upload"
                        className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                      >
                        <div className="flex flex-col items-center justify-center pt-2 pb-2">
                          <svg className="w-6 h-6 mb-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-xs text-gray-500">Upload new</p>
                        </div>
                      </label>
                    </div>

                    {/* Select from Assets */}
                    <div>
                      <Select value="choose" onValueChange={(value: string) => {
                        if (value !== "choose") {
                          setNewBroadcast({ ...newBroadcast, bannerId: value, bannerFile: null })
                        }
                      }}>
                        <SelectTrigger className="h-24">
                          <SelectValue placeholder="Choose from assets" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {assets.filter(asset => asset.type === "IMAGE").map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-6 bg-slate-100 rounded flex items-center justify-center overflow-hidden">
                                  <img 
                                    src={asset.url} 
                                    alt={asset.originalName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm">{asset.originalName}</span>
                                  <span className="text-xs text-slate-500">{(asset.size / 1024).toFixed(1)} KB</span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Start Date and Time */}
              <div className="space-y-2">
                <Label>Start Date & Time</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !newBroadcast.startTime && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newBroadcast.startTime ? format(newBroadcast.startTime, "MMM dd, yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newBroadcast.startTime}
                        onSelect={(date) => setNewBroadcast({ ...newBroadcast, startTime: date })}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Select value={newBroadcast.startTimeHour} onValueChange={(value: string) => setNewBroadcast({ ...newBroadcast, startTimeHour: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newBroadcast.startTimeMinute} onValueChange={(value: string) => setNewBroadcast({ ...newBroadcast, startTimeMinute: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 4 }, (_, i) => (
                        <SelectItem key={i} value={(i * 15).toString().padStart(2, '0')}>
                          :{(i * 15).toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* End Date and Time */}
              <div className="space-y-2">
                <Label>End Date & Time (Optional)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !newBroadcast.endTime && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newBroadcast.endTime ? format(newBroadcast.endTime, "MMM dd, yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newBroadcast.endTime}
                        onSelect={(date) => setNewBroadcast({ ...newBroadcast, endTime: date })}
                        disabled={(date) => {
                          const today = new Date(new Date().setHours(0, 0, 0, 0))
                          const startDate = newBroadcast.startTime ? new Date(newBroadcast.startTime.setHours(0, 0, 0, 0)) : today
                          return date < startDate
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Select value={newBroadcast.endTimeHour} onValueChange={(value: string) => setNewBroadcast({ ...newBroadcast, endTimeHour: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newBroadcast.endTimeMinute} onValueChange={(value: string) => setNewBroadcast({ ...newBroadcast, endTimeMinute: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 4 }, (_, i) => (
                        <SelectItem key={i} value={(i * 15).toString().padStart(2, '0')}>
                          :{(i * 15).toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Staff Assignment Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Broadcast Team</Label>
                  <p className="text-sm text-slate-500">Assign flexible roles to team members (max 5 per role)</p>
                </div>
                
                {/* Add Staff Form */}
                <div className="grid grid-cols-1 gap-3 p-4 border rounded-lg bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="staff-member" className="text-sm">Team Member</Label>
                      <Select value={staffForm.userId} onValueChange={(value: string) => setStaffForm({ ...staffForm, userId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent>
                          {staff.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">{`${member.firstName} ${member.lastName}`.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <span>{`${member.firstName} ${member.lastName}`}</span>
                                <Badge variant="outline" className="ml-auto">
                                  {member.role}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staff-role" className="text-sm">Broadcast Role</Label>
                      <Select value={staffForm.role} onValueChange={(value: string) => setStaffForm({ ...staffForm, role: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {["HOST", "CO_HOST", "PRODUCER", "SOUND_ENGINEER", "MODERATOR"].map((role) => {
                            const Icon = getRoleIcon(role)
                            const roleCount = newBroadcast.staff.filter(s => s.role === role).length
                            return (
                              <SelectItem key={role} value={role} disabled={roleCount >= 5}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <span>{role.replace('_', ' ')}</span>
                                  {roleCount > 0 && (
                                    <Badge variant="outline" className="ml-auto text-xs">
                                      {roleCount}/5
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={addStaffMember}
                      disabled={!staffForm.userId || !staffForm.role}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Team Member
                    </Button>
                  </div>
                </div>

                {/* Selected Staff Summary */}
                {newBroadcast.staff.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Selected Team Members:</Label>
                    <div className="space-y-2">
                      {newBroadcast.staff.map((staffAssignment, index) => {
                        const member = staff.find(s => s.id === staffAssignment.userId)
                        const Icon = getRoleIcon(staffAssignment.role)
                        return (
                          <div key={`${staffAssignment.userId}-${staffAssignment.role}-${index}`} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">{member ? `${member.firstName} ${member.lastName}`.substring(0, 2) : "??"}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{member ? `${member.firstName} ${member.lastName}` : "Unknown"}</span>
                                  <Badge variant="outline" className={`${getRoleColor(staffAssignment.role)} flex items-center gap-1`}>
                                    <Icon className="h-3 w-3" />
                                    {staffAssignment.role.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-500">{member?.email}</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeStaffMember(staffAssignment.userId, staffAssignment.role)}
                              className="h-8 w-8 shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Guest Management Section */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-medium">Guest Management</Label>
                  <p className="text-sm text-slate-500">Add external guests to the broadcast (max 5)</p>
                </div>
                
                {/* Add Guest Form */}
                <div className="grid grid-cols-1 gap-3 p-4 border rounded-lg bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="guest-name" className="text-sm">Guest Name *</Label>
                      <Input
                        id="guest-name"
                        placeholder="Enter guest name"
                        value={guestForm.name}
                        onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guest-title" className="text-sm">Title (Optional)</Label>
                      <Input
                        id="guest-title"
                        placeholder="e.g., Author, Expert, etc."
                        value={guestForm.title}
                        onChange={(e) => setGuestForm({ ...guestForm, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guest-role" className="text-sm">Role *</Label>
                      <Select value={guestForm.role} onValueChange={(value: string) => setGuestForm({ ...guestForm, role: value })}>
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
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={addGuest}
                      disabled={!guestForm.name.trim() || !guestForm.role.trim() || newBroadcast.guests.length >= 5}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Guest ({newBroadcast.guests.length}/5)
                    </Button>
                  </div>
                </div>

                {/* Guest List */}
                {newBroadcast.guests.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Added Guests:</Label>
                    <div className="space-y-2">
                      {newBroadcast.guests.map((guest, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">{guest.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{guest.name}</span>
                                {guest.title && (
                                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                    {guest.title}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                                  <UserCheck className="h-3 w-3" />
                                  {guest.role}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeGuest(index)}
                            className="h-8 w-8 shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="shrink-0 border-t pt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={creating || uploadingAsset}>
                Cancel
              </Button>
              <Button onClick={handleCreateBroadcast} disabled={creating || uploadingAsset || !newBroadcast.title.trim() || !newBroadcast.description.trim()}>
                {creating || uploadingAsset ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploadingAsset ? 'Uploading Banner...' : 'Creating...'}
                  </>
                ) : (
                  'Create Broadcast'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search broadcasts, hosts, or programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="LIVE">Live</TabsTrigger>
              <TabsTrigger value="READY">Ready</TabsTrigger>
              <TabsTrigger value="SCHEDULED">Scheduled</TabsTrigger>
              <TabsTrigger value="ENDED">Ended</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Program Filter */}
        {!programIdFromUrl && (
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-700">Filter by Program:</label>
            <Select value={programFilter} onValueChange={(value: string) => {
              setProgramFilter(value)
              if (value === "all") {
                loadBroadcasts()
              } else {
                loadBroadcasts(value === "null" ? "null" : value)
              }
            }}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                <SelectItem value="null">No Program Assigned</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Broadcasts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBroadcasts.map((broadcast) => (
          <Card key={broadcast.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            {/* Banner Image */}
            {broadcast.banner && (
              <div className="w-full h-32 bg-slate-100 overflow-hidden">
                <img 
                  src={broadcast.banner.url} 
                  alt={broadcast.banner.originalName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(broadcast.status)}
                    {broadcast.program && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Radio className="h-3 w-3 mr-1" />
                        {broadcast.program.title}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{broadcast.title}</CardTitle>
                  <CardDescription className="mt-1">{broadcast.description}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/broadcasts/${broadcast.slug}`)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {broadcast.program && (
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/programs/${broadcast.program!.id}`)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Program
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => openEditDialog(broadcast)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {broadcast.status === "SCHEDULED" && (
                      <DropdownMenuItem onClick={() => handleGoLive(broadcast)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Prepare Studio
                      </DropdownMenuItem>
                    )}
                    {(broadcast.status === "READY" || broadcast.status === "LIVE") && (
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/broadcasts/${broadcast.slug}/studio`)}>
                        <Play className="h-4 w-4 mr-2" />
                        Enter Studio
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-red-600">
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                {/* Primary Host */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{broadcast.hostUser ? `${broadcast.hostUser.firstName} ${broadcast.hostUser.lastName}`.substring(0, 2).toUpperCase() : "UN"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{broadcast.hostUser ? `${broadcast.hostUser.firstName} ${broadcast.hostUser.lastName}` : "Unknown Host"}</span>
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        HOST
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Additional Staff */}
                {broadcast.staff && broadcast.staff.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Team</p>
                    <div className="space-y-1">
                      {broadcast.staff.map((staffMember) => {
                        const Icon = getRoleIcon(staffMember.role)
                        return (
                          <div key={`${staffMember.id}-${staffMember.role}`} className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{`${staffMember.user.firstName} ${staffMember.user.lastName}`.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-600">{`${staffMember.user.firstName} ${staffMember.user.lastName}`}</span>
                              <Badge variant="outline" className={`text-xs ${getRoleColor(staffMember.role)} flex items-center gap-1`}>
                                <Icon className="h-2 w-2" />
                                {staffMember.role.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Guests */}
                {broadcast.guests && broadcast.guests.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Guests</p>
                    <div className="space-y-1">
                      {broadcast.guests.map((guest) => (
                        <div key={guest.id} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{guest.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-600">{guest.name}</span>
                            {guest.title && (
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                {guest.title}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                              <UserCheck className="h-2 w-2" />
                              {guest.role}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {broadcast.program && (
                  <div className="flex items-center gap-2 text-sm">
                    <Radio className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-600">Part of {broadcast.program.title}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => router.push(`/dashboard/programs/${broadcast.program!.id}`)}
                      className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                    >
                      View Program
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{new Date(broadcast.startTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(broadcast.startTime).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {broadcast.status === "LIVE" && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm font-semibold text-green-600">
                    🔴 Broadcasting Now
                  </div>
                  <Button size="sm" onClick={() => router.push(`/dashboard/broadcasts/${broadcast.slug}/studio`)}>
                    Enter Studio
                  </Button>
                </div>
              )}

              {broadcast.status === "SCHEDULED" && (
                <div className="flex justify-end pt-2 border-t">
                  <Button size="sm" onClick={() => handleGoLive(broadcast)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Prepare Studio
                  </Button>
                </div>
              )}

              {broadcast.status === "READY" && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm font-semibold text-yellow-600">
                    🎬 Studio Ready
                  </div>
                  <Button size="sm" onClick={() => router.push(`/dashboard/broadcasts/${broadcast.slug}/studio`)}>
                    Enter Studio
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBroadcasts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Radio className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500 text-center">No broadcasts found</p>
            <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setIsCreateDialogOpen(true)}>
              Create Your First Broadcast
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Broadcast Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) {
          // Reset form when dialog closes
          setEditForm({
            title: "",
            description: "",
            startTime: "",
            endTime: "",
            streamUrl: "",
            bannerId: "",
            bannerFile: null
          })
          setSelectedBroadcast(null)
          setUploadProgress(0)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
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

            {/* Banner Selection for Edit */}
            <div className="space-y-4">
              <Label>Broadcast Banner (Optional)</Label>
              
              {/* Upload Progress */}
              {uploadingAsset && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading banner...</span>
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
              {(editForm.bannerFile || (editForm.bannerId && editForm.bannerId !== "none")) && (
                <div className="p-3 border rounded-lg bg-slate-50">
                  {editForm.bannerFile ? (
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-10 bg-slate-100 rounded overflow-hidden">
                        <img 
                          src={URL.createObjectURL(editForm.bannerFile)} 
                          alt="New banner"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{editForm.bannerFile.name}</p>
                        <p className="text-xs text-slate-500">{(editForm.bannerFile.size / 1024).toFixed(1)} KB</p>
                        <p className="text-xs text-blue-600">New upload</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditForm({ ...editForm, bannerFile: null })}
                        className="h-8 w-8 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (() => {
                    const selectedAsset = assets.find(a => a.id === editForm.bannerId)
                    if (selectedAsset) {
                      return (
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-10 bg-slate-100 rounded overflow-hidden">
                            <img 
                              src={selectedAsset.url} 
                              alt={selectedAsset.originalName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{selectedAsset.originalName}</p>
                            <p className="text-xs text-slate-500">{(selectedAsset.size / 1024).toFixed(1)} KB</p>
                            <p className="text-xs text-green-600">From assets</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditForm({ ...editForm, bannerId: "" })}
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
              {!editForm.bannerFile && (!editForm.bannerId || editForm.bannerId === "none") && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Upload New */}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setEditForm({ ...editForm, bannerFile: file, bannerId: "" })
                        }
                      }}
                      className="hidden"
                      id="edit-banner-upload"
                    />
                    <label
                      htmlFor="edit-banner-upload"
                      className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-2 pb-2">
                        <svg className="w-6 h-6 mb-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-xs text-gray-500">Upload new</p>
                      </div>
                    </label>
                  </div>

                  {/* Select from Assets */}
                  <div>
                    <Select value="choose" onValueChange={(value: string) => {
                      if (value !== "choose") {
                        setEditForm({ ...editForm, bannerId: value, bannerFile: null })
                      }
                    }}>
                      <SelectTrigger className="h-24">
                        <SelectValue placeholder="Choose from assets" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {assets.filter(asset => asset.type === "IMAGE").map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-6 bg-slate-100 rounded flex items-center justify-center overflow-hidden">
                                <img 
                                  src={asset.url} 
                                  alt={asset.originalName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm">{asset.originalName}</span>
                                <span className="text-xs text-slate-500">{(asset.size / 1024).toFixed(1)} KB</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Remove Banner Option */}
              {(editForm.bannerId || selectedBroadcast?.banner) && !editForm.bannerFile && (
                <div className="flex justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditForm({ ...editForm, bannerId: "none" })}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove Banner
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={editingBroadcast || uploadingAsset}>
              Cancel
            </Button>
            <Button 
              onClick={updateBroadcast} 
              disabled={!editForm.title.trim() || !editForm.description.trim() || !editForm.startTime || editingBroadcast || uploadingAsset}
            >
              {editingBroadcast || uploadingAsset ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadingAsset ? 'Uploading Banner...' : 'Updating...'}
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
    </div>
  )
}
