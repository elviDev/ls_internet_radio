"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CalendarIcon, Search, Plus, Edit, Trash2, MapPin, DollarSign, Users, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

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
  maxAttendees?: number
  currentAttendees: number
  requiresRSVP: boolean
  imageUrl?: string
  bannerUrl?: string
  contactEmail?: string
  contactPhone?: string
  contactPerson?: string
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
  startTime: string
  endTime: string
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
  maxAttendees: string
  requiresRSVP: boolean
  imageUrl: string
  bannerUrl: string
  contactEmail: string
  contactPhone: string
  contactPerson: string
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
  { value: "PUBLISHED", label: "Published" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" }
]

export default function EventsManagePage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [upcomingOnly, setUpcomingOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
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
    maxAttendees: "",
    requiresRSVP: false,
    imageUrl: "",
    bannerUrl: "",
    contactEmail: "",
    contactPhone: "",
    contactPerson: "",
    status: "DRAFT"
  })

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: "10"
      })
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      if (upcomingOnly) {
        params.append("upcoming", "true")
      }
      if (searchTerm) {
        params.append("search", searchTerm)
      }
      
      const response = await fetch(`/api/admin/events?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
        setTotalPages(data.pagination.totalPages)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch events",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [page, statusFilter, upcomingOnly, searchTerm])

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startTime: "",
      endTime: "",
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
      maxAttendees: "",
      requiresRSVP: false,
      imageUrl: "",
      bannerUrl: "",
      contactEmail: "",
      contactPhone: "",
      contactPerson: "",
      status: "DRAFT"
    })
  }

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
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create event",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event",
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
      startTime: new Date(event.startTime).toISOString().slice(0, 16),
      endTime: event.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : "",
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
      maxAttendees: event.maxAttendees?.toString() || "",
      requiresRSVP: event.requiresRSVP,
      imageUrl: event.imageUrl || "",
      bannerUrl: event.bannerUrl || "",
      contactEmail: event.contactEmail || "",
      contactPhone: event.contactPhone || "",
      contactPerson: event.contactPerson || "",
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
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update event",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingEvent) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/events/${deletingEvent.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Event deleted successfully"
        })
        setShowDeleteDialog(false)
        setDeletingEvent(null)
        fetchEvents()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete event",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PUBLISHED":
      case "ACTIVE":
        return "default"
      case "SCHEDULED":
        return "secondary"
      case "DRAFT":
        return "outline"
      case "COMPLETED":
        return "secondary"
      case "CANCELLED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getEventTypeLabel = (eventType: string) => {
    return eventType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatPrice = (price: number | null) => {
    if (price === null || price === 0) return "Free"
    return `$${price.toFixed(2)}`
  }

  const EventForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
      <div className="space-y-4">
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
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Event description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="startTime">Start Time *</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
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

        <div className="flex items-center space-x-2">
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
          <>
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
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
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
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="isPaid"
            checked={formData.isPaid}
            onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
          />
          <Label htmlFor="isPaid">Paid Event</Label>
        </div>

        {formData.isPaid && (
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
        )}

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

        <div className="flex items-center space-x-2">
          <Switch
            id="requiresRSVP"
            checked={formData.requiresRSVP}
            onCheckedChange={(checked) => setFormData({ ...formData, requiresRSVP: checked })}
          />
          <Label htmlFor="requiresRSVP">Requires RSVP</Label>
        </div>

        <div>
          <Label htmlFor="imageUrl">Event Image URL</Label>
          <Input
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div>
          <Label htmlFor="bannerUrl">Banner Image URL</Label>
          <Input
            id="bannerUrl"
            value={formData.bannerUrl}
            onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div>
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input
            id="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            placeholder="contact@example.com"
          />
        </div>

        <div>
          <Label htmlFor="contactPhone">Contact Phone</Label>
          <Input
            id="contactPhone"
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <Label htmlFor="contactPerson">Contact Person</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            placeholder="Contact person name"
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
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Event Management</h1>
        <p className="text-muted-foreground">
          Manage station events and special broadcasts
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Events ({events.length})
            </CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
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
                <EventForm />
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
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
          </div>

          <div className="rounded-md border">
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
                    <TableRow key={event.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium line-clamp-1">{event.title}</div>
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
                          {getEventTypeLabel(event.eventType)}
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
                              <span className="line-clamp-1">
                                {event.venue || event.location || "TBD"}
                              </span>
                            </div>
                          )}
                          {event.isPaid && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              {formatPrice(event.ticketPrice)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-3 w-3" />
                            <span>{event.currentAttendees}</span>
                            {event.maxAttendees && (
                              <span className="text-muted-foreground">/ {event.maxAttendees}</span>
                            )}
                          </div>
                          {event.requiresRSVP && (
                            <Badge variant="outline" className="text-xs">
                              RSVP Required
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(event.status)}>
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(event)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setDeletingEvent(event)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update the event details and settings.
            </DialogDescription>
          </DialogHeader>
          <EventForm isEdit />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setEditingEvent(null); resetForm() }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? "Updating..." : "Update Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingEvent?.title}"? This action cannot be undone.
              All registrations for this event will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowDeleteDialog(false); setDeletingEvent(null) }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? "Deleting..." : "Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}