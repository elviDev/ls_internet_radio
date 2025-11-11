"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Calendar, MapPin, Users, DollarSign, ExternalLink, Loader2, AlertCircle, RefreshCw, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { FileUpload } from "@/components/ui/file-upload"
import { DateTimePicker } from "@/components/ui/datetime-picker"

interface Event {
  id: string
  title: string
  description: string
  startTime: string
  endTime?: string
  eventType: string
  location?: string
  venue?: string
  address?: string
  city?: string
  state?: string
  country?: string
  isVirtual: boolean
  virtualLink?: string
  isPaid: boolean
  ticketPrice?: number
  currency?: string
  maxAttendees?: number
  currentAttendees: number
  requiresRSVP: boolean
  imageUrl?: string
  bannerUrl?: string
  galleryUrls?: string
  contactEmail?: string
  contactPhone?: string
  contactPerson?: string
  facebookEvent?: string
  twitterEvent?: string
  linkedinEvent?: string
  coOrganizers?: string
  sponsors?: string
  status: string
  organizer: {
    id: string
    name: string
    email: string
  }
  createdAt: string
}

interface EventFormData {
  title: string
  description: string
  startTime: Date | undefined
  endTime: Date | undefined
  eventType: string
  location: string
  venue: string
  address: string
  city: string
  state: string
  country: string
  isVirtual: boolean
  virtualLink: string
  isPaid: boolean
  ticketPrice: string
  currency: string
  maxAttendees: string
  requiresRSVP: boolean
  imageUrl: string
  bannerUrl: string
  galleryUrls: string
  contactEmail: string
  contactPhone: string
  contactPerson: string
  facebookEvent: string
  twitterEvent: string
  linkedinEvent: string
  coOrganizers: string
  sponsors: string
  status: string
}

const eventTypes = [
  { value: "CONCERT", label: "Concert" },
  { value: "MEETUP", label: "Meetup" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "SPECIAL_BROADCAST", label: "Special Broadcast" },
  { value: "CONTEST", label: "Contest" },
  { value: "GIVEAWAY", label: "Giveaway" },
  { value: "COMMUNITY_EVENT", label: "Community Event" },
  { value: "FUNDRAISER", label: "Fundraiser" }
]

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" }
]

export default function EventsManagePage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [upcomingOnly, setUpcomingOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    startTime: undefined,
    endTime: undefined,
    eventType: "MEETUP",
    location: "",
    venue: "",
    address: "",
    city: "",
    state: "",
    country: "",
    isVirtual: false,
    virtualLink: "",
    isPaid: false,
    ticketPrice: "",
    currency: "USD",
    maxAttendees: "",
    requiresRSVP: false,
    imageUrl: "",
    bannerUrl: "",
    galleryUrls: "",
    contactEmail: "",
    contactPhone: "",
    contactPerson: "",
    facebookEvent: "",
    twitterEvent: "",
    linkedinEvent: "",
    coOrganizers: "",
    sponsors: "",
    status: "DRAFT"
  })

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        type: "EVENT",
        page: page.toString(),
        perPage: "10"
      })
      if (statusFilter !== "all") {
        params.append("status", statusFilter.toUpperCase())
      }
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim())
      }
      
      const response = await fetch(`/api/admin/schedules?${params}`)
      if (response.ok) {
        const data = await response.json()
        // Transform schedule data to event format
        const events = data.schedules.map((schedule: any) => ({
          id: schedule.id,
          title: schedule.title,
          description: schedule.description,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          eventType: schedule.event?.eventType || "MEETUP",
          location: schedule.event?.location,
          venue: schedule.event?.venue,
          address: schedule.event?.address,
          city: schedule.event?.city,
          state: schedule.event?.state,
          country: schedule.event?.country,
          isVirtual: schedule.event?.isVirtual || false,
          virtualLink: schedule.event?.virtualLink,
          isPaid: schedule.event?.isPaid || false,
          ticketPrice: schedule.event?.ticketPrice,
          currency: schedule.event?.currency || "USD",
          maxAttendees: schedule.event?.maxAttendees,
          currentAttendees: schedule.event?.currentAttendees || 0,
          requiresRSVP: schedule.event?.requiresRSVP || false,
          status: schedule.status,
          organizer: {
            id: schedule.creator.id,
            name: `${schedule.creator.firstName} ${schedule.creator.lastName}`,
            email: schedule.creator.email
          },
          createdAt: schedule.createdAt,
          scheduleId: schedule.id
        }))
        setEvents(events)
        setTotalPages(data.pagination.totalPages)
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error occurred" }))
        throw new Error(errorData.error || "Failed to fetch events")
      }
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Failed to Load Events",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [page, statusFilter, upcomingOnly, searchTerm])

  const handleCreate = async () => {
    if (!formData.title || !formData.description || !formData.startTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        startTime: formData.startTime?.toISOString(),
        endTime: formData.endTime?.toISOString(),
        ticketPrice: formData.ticketPrice ? parseFloat(formData.ticketPrice) : undefined,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined
      }

      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Event created successfully"
        })
        setShowCreateDialog(false)
        resetForm()
        fetchEvents()
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to create event" }))
        throw new Error(errorData.error)
      }
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description,
      startTime: new Date(event.startTime),
      endTime: event.endTime ? new Date(event.endTime) : undefined,
      eventType: event.eventType,
      location: event.location || "",
      venue: event.venue || "",
      address: event.address || "",
      city: event.city || "",
      state: event.state || "",
      country: event.country || "",
      isVirtual: event.isVirtual,
      virtualLink: event.virtualLink || "",
      isPaid: event.isPaid,
      ticketPrice: event.ticketPrice?.toString() || "",
      currency: event.currency || "USD",
      maxAttendees: event.maxAttendees?.toString() || "",
      requiresRSVP: event.requiresRSVP,
      imageUrl: event.imageUrl || "",
      bannerUrl: event.bannerUrl || "",
      galleryUrls: event.galleryUrls || "",
      contactEmail: event.contactEmail || "",
      contactPhone: event.contactPhone || "",
      contactPerson: event.contactPerson || "",
      facebookEvent: event.facebookEvent || "",
      twitterEvent: event.twitterEvent || "",
      linkedinEvent: event.linkedinEvent || "",
      coOrganizers: event.coOrganizers || "",
      sponsors: event.sponsors || "",
      status: event.status
    })
    setShowEditDialog(true)
  }

  const handleUpdate = async () => {
    if (!editingEvent || !formData.title || !formData.description || !formData.startTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        startTime: formData.startTime?.toISOString(),
        endTime: formData.endTime?.toISOString(),
        ticketPrice: formData.ticketPrice ? parseFloat(formData.ticketPrice) : undefined,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined
      }

      const response = await fetch(`/api/admin/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Event updated successfully"
        })
        setShowEditDialog(false)
        setEditingEvent(null)
        resetForm()
        fetchEvents()
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to update event" }))
        throw new Error(errorData.error)
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickPublish = async (event: Event) => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SCHEDULED' })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Event published successfully"
        })
        fetchEvents()
      } else {
        throw new Error("Failed to publish event")
      }
    } catch (error: any) {
      toast({
        title: "Publish Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setEvents(events.filter(e => e.id !== id))
        toast({
          title: "Success",
          description: "Event deleted successfully"
        })
      } else {
        throw new Error("Failed to delete event")
      }
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setDeletingId(null)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startTime: undefined,
      endTime: undefined,
      eventType: "MEETUP",
      location: "",
      venue: "",
      address: "",
      city: "",
      state: "",
      country: "",
      isVirtual: false,
      virtualLink: "",
      isPaid: false,
      ticketPrice: "",
      currency: "USD",
      maxAttendees: "",
      requiresRSVP: false,
      imageUrl: "",
      bannerUrl: "",
      galleryUrls: "",
      contactEmail: "",
      contactPhone: "",
      contactPerson: "",
      facebookEvent: "",
      twitterEvent: "",
      linkedinEvent: "",
      coOrganizers: "",
      sponsors: "",
      status: "DRAFT"
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Events</h3>
            <p className="text-gray-600">Please wait while we fetch your events...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-96 space-y-6">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-6 max-w-md">{error}</p>
            <Button onClick={fetchEvents}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Event Management</h1>
          <p className="text-muted-foreground">
            Manage station events and special broadcasts
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Create a new event or special broadcast for your radio station.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="flex-1 flex flex-col max-h-[60vh]">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="media">Media & Social</TabsTrigger>
                <TabsTrigger value="contact">Contact & Org</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto mt-4">
                <TabsContent value="basic" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Event title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventType">Event Type</Label>
                      <Select value={formData.eventType} onValueChange={(value) => setFormData({ ...formData, eventType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {eventTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Event description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <DateTimePicker
                      label="Start Time"
                      value={formData.startTime}
                      onChange={(date) => setFormData({ ...formData, startTime: date })}
                      required
                      placeholder="start date"
                    />
                    <DateTimePicker
                      label="End Time"
                      value={formData.endTime}
                      onChange={(date) => setFormData({ ...formData, endTime: date })}
                      placeholder="end date"
                      minDate={formData.startTime}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxAttendees">Max Attendees</Label>
                      <Input
                        id="maxAttendees"
                        type="number"
                        value={formData.maxAttendees}
                        onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                        placeholder="Leave empty for unlimited"
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requiresRSVP"
                        checked={formData.requiresRSVP}
                        onCheckedChange={(checked) => setFormData({ ...formData, requiresRSVP: checked })}
                      />
                      <Label htmlFor="requiresRSVP">Requires RSVP</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isPaid"
                        checked={formData.isPaid}
                        onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
                      />
                      <Label htmlFor="isPaid">Paid Event</Label>
                    </div>
                  </div>
                  {formData.isPaid && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ticketPrice">Ticket Price</Label>
                        <Input
                          id="ticketPrice"
                          type="number"
                          step="0.01"
                          value={formData.ticketPrice}
                          onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="location" className="space-y-4 mt-0">
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      id="isVirtual"
                      checked={formData.isVirtual}
                      onCheckedChange={(checked) => setFormData({ ...formData, isVirtual: checked })}
                    />
                    <Label htmlFor="isVirtual">Virtual Event</Label>
                  </div>
                  {formData.isVirtual ? (
                    <div>
                      <Label htmlFor="virtualLink">Virtual Link</Label>
                      <Input
                        id="virtualLink"
                        value={formData.virtualLink}
                        onChange={(e) => setFormData({ ...formData, virtualLink: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="venue">Venue</Label>
                          <Input
                            id="venue"
                            value={formData.venue}
                            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                            placeholder="Venue name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="General location"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Street address"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            placeholder="Country"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="media" className="space-y-4 mt-0">
                  <FileUpload
                    type="image"
                    value={formData.imageUrl}
                    onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                    label="Event Image"
                    description="Upload a main image for the event"
                  />
                  <FileUpload
                    type="image"
                    value={formData.bannerUrl}
                    onChange={(url) => setFormData({ ...formData, bannerUrl: url })}
                    label="Banner Image"
                    description="Upload a banner image for the event"
                  />
                  <div>
                    <Label htmlFor="galleryUrls">Gallery URLs</Label>
                    <Textarea
                      id="galleryUrls"
                      value={formData.galleryUrls}
                      onChange={(e) => setFormData({ ...formData, galleryUrls: e.target.value })}
                      placeholder="Additional image URLs (comma-separated)"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="facebookEvent">Facebook Event URL</Label>
                      <Input
                        id="facebookEvent"
                        value={formData.facebookEvent}
                        onChange={(e) => setFormData({ ...formData, facebookEvent: e.target.value })}
                        placeholder="https://facebook.com/events/..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="twitterEvent">Twitter Event URL</Label>
                      <Input
                        id="twitterEvent"
                        value={formData.twitterEvent}
                        onChange={(e) => setFormData({ ...formData, twitterEvent: e.target.value })}
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedinEvent">LinkedIn Event URL</Label>
                      <Input
                        id="linkedinEvent"
                        value={formData.linkedinEvent}
                        onChange={(e) => setFormData({ ...formData, linkedinEvent: e.target.value })}
                        placeholder="https://linkedin.com/events/..."
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="contact" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactPerson">Contact Person</Label>
                      <Input
                        id="contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="Primary contact person"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="contact@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="coOrganizers">Co-Organizers</Label>
                    <Textarea
                      id="coOrganizers"
                      value={formData.coOrganizers}
                      onChange={(e) => setFormData({ ...formData, coOrganizers: e.target.value })}
                      placeholder="List of co-organizers (comma-separated)"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sponsors">Sponsors</Label>
                    <Textarea
                      id="sponsors"
                      value={formData.sponsors}
                      onChange={(e) => setFormData({ ...formData, sponsors: e.target.value })}
                      placeholder="List of sponsors (comma-separated)"
                      rows={2}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm() }}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? "Creating..." : "Create Event"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Event Dialog */}
        <Dialog open={showEditDialog} onOpenChange={(open) => {
          setShowEditDialog(open)
          if (!open) {
            setEditingEvent(null)
            resetForm()
          }
        }}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Update the event details.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="flex-1 flex flex-col max-h-[60vh]">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="media">Media & Social</TabsTrigger>
                <TabsTrigger value="contact">Contact & Org</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto mt-4">
                <TabsContent value="basic" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-title">Title *</Label>
                      <Input
                        id="edit-title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Event title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-eventType">Event Type</Label>
                      <Select value={formData.eventType} onValueChange={(value) => setFormData({ ...formData, eventType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {eventTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description *</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Event description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <DateTimePicker
                      label="Start Time"
                      value={formData.startTime}
                      onChange={(date) => setFormData({ ...formData, startTime: date })}
                      required
                      placeholder="Pick start date & time"
                    />
                    <DateTimePicker
                      label="End Time"
                      value={formData.endTime}
                      onChange={(date) => setFormData({ ...formData, endTime: date })}
                      placeholder="Pick end date & time"
                      minDate={formData.startTime}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-maxAttendees">Max Attendees</Label>
                      <Input
                        id="edit-maxAttendees"
                        type="number"
                        value={formData.maxAttendees}
                        onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                        placeholder="Leave empty for unlimited"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-requiresRSVP"
                        checked={formData.requiresRSVP}
                        onCheckedChange={(checked) => setFormData({ ...formData, requiresRSVP: checked })}
                      />
                      <Label htmlFor="edit-requiresRSVP">Requires RSVP</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-isPaid"
                        checked={formData.isPaid}
                        onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
                      />
                      <Label htmlFor="edit-isPaid">Paid Event</Label>
                    </div>
                  </div>
                  {formData.isPaid && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-ticketPrice">Ticket Price</Label>
                        <Input
                          id="edit-ticketPrice"
                          type="number"
                          step="0.01"
                          value={formData.ticketPrice}
                          onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-currency">Currency</Label>
                        <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="location" className="space-y-4 mt-0">
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      id="edit-isVirtual"
                      checked={formData.isVirtual}
                      onCheckedChange={(checked) => setFormData({ ...formData, isVirtual: checked })}
                    />
                    <Label htmlFor="edit-isVirtual">Virtual Event</Label>
                  </div>
                  {formData.isVirtual ? (
                    <div>
                      <Label htmlFor="edit-virtualLink">Virtual Link</Label>
                      <Input
                        id="edit-virtualLink"
                        value={formData.virtualLink}
                        onChange={(e) => setFormData({ ...formData, virtualLink: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit-venue">Venue</Label>
                          <Input
                            id="edit-venue"
                            value={formData.venue}
                            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                            placeholder="Venue name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-location">Location</Label>
                          <Input
                            id="edit-location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="General location"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="edit-address">Address</Label>
                        <Input
                          id="edit-address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Street address"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="edit-city">City</Label>
                          <Input
                            id="edit-city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-state">State</Label>
                          <Input
                            id="edit-state"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-country">Country</Label>
                          <Input
                            id="edit-country"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            placeholder="Country"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="media" className="space-y-4 mt-0">
                  <FileUpload
                    type="image"
                    value={formData.imageUrl}
                    onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                    label="Event Image"
                    description="Upload a main image for the event"
                  />
                  <FileUpload
                    type="image"
                    value={formData.bannerUrl}
                    onChange={(url) => setFormData({ ...formData, bannerUrl: url })}
                    label="Banner Image"
                    description="Upload a banner image for the event"
                  />
                  <div>
                    <Label htmlFor="edit-galleryUrls">Gallery URLs</Label>
                    <Textarea
                      id="edit-galleryUrls"
                      value={formData.galleryUrls}
                      onChange={(e) => setFormData({ ...formData, galleryUrls: e.target.value })}
                      placeholder="Additional image URLs (comma-separated)"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="edit-facebookEvent">Facebook Event URL</Label>
                      <Input
                        id="edit-facebookEvent"
                        value={formData.facebookEvent}
                        onChange={(e) => setFormData({ ...formData, facebookEvent: e.target.value })}
                        placeholder="https://facebook.com/events/..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-twitterEvent">Twitter Event URL</Label>
                      <Input
                        id="edit-twitterEvent"
                        value={formData.twitterEvent}
                        onChange={(e) => setFormData({ ...formData, twitterEvent: e.target.value })}
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-linkedinEvent">LinkedIn Event URL</Label>
                      <Input
                        id="edit-linkedinEvent"
                        value={formData.linkedinEvent}
                        onChange={(e) => setFormData({ ...formData, linkedinEvent: e.target.value })}
                        placeholder="https://linkedin.com/events/..."
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="contact" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-contactPerson">Contact Person</Label>
                      <Input
                        id="edit-contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="Primary contact person"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-contactEmail">Contact Email</Label>
                      <Input
                        id="edit-contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="contact@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-contactPhone">Contact Phone</Label>
                    <Input
                      id="edit-contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-coOrganizers">Co-Organizers</Label>
                    <Textarea
                      id="edit-coOrganizers"
                      value={formData.coOrganizers}
                      onChange={(e) => setFormData({ ...formData, coOrganizers: e.target.value })}
                      placeholder="List of co-organizers (comma-separated)"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-sponsors">Sponsors</Label>
                    <Textarea
                      id="edit-sponsors"
                      value={formData.sponsors}
                      onChange={(e) => setFormData({ ...formData, sponsors: e.target.value })}
                      placeholder="List of sponsors (comma-separated)"
                      rows={2}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={submitting}>
                {submitting ? "Updating..." : "Update Event"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList>
          <TabsTrigger value="events">All Events</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={upcomingOnly ? "default" : "outline"}
              onClick={() => setUpcomingOnly(!upcomingOnly)}
            >
              Upcoming Only
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Attendees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm || statusFilter !== "all" || upcomingOnly
                            ? "No events found matching your criteria"
                            : "No events created yet"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                              {event.description}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              by {event.organizer.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {event.eventType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">
                              {formatDateTime(event.startTime)}
                            </div>
                            {event.endTime && (
                              <div className="text-xs text-muted-foreground">
                                to {formatDateTime(event.endTime)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {event.isVirtual ? (
                              <div className="flex items-center gap-1 text-sm">
                                <ExternalLink className="h-3 w-3" />
                                <span>Virtual</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3" />
                                <span>{event.venue || event.location || "TBD"}</span>
                              </div>
                            )}
                            {event.isPaid && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                ${event.ticketPrice || 0}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-3 w-3" />
                            <span>{event.currentAttendees}</span>
                            {event.maxAttendees && (
                              <span className="text-muted-foreground">/ {event.maxAttendees}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/events/${event.id}`)}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(event)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {event.status === 'DRAFT' && (
                                <DropdownMenuItem 
                                  onClick={() => handleQuickPublish(event)}
                                  disabled={submitting}
                                  className="text-green-600"
                                >
                                  <Send className="mr-2 h-4 w-4" />
                                  {submitting ? "Publishing..." : "Quick Publish"}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(event.id)}
                                className="text-red-600"
                                disabled={deletingId === event.id}
                              >
                                {deletingId === event.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                {deletingId === event.id ? "Deleting..." : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}