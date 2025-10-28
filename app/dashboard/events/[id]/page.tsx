"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, ExternalLink, Loader2, AlertCircle, CheckCircle, XCircle, Edit, Send, Copy, Mail, Download, RefreshCw, Facebook, Twitter, Linkedin, Phone, User, Building2, Image, Globe } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload } from "@/components/ui/file-upload"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EventRegistration {
  id: string
  user: {
    id: string
    name: string
    email: string
  }
  registeredAt: string
  paymentStatus?: "PENDING" | "COMPLETED" | "FAILED"
  paymentAmount?: number
}

interface EventDetail {
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
  registrations: EventRegistration[]
  createdAt: string
  updatedAt: string
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

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
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

  useEffect(() => {
    fetchEventDetail()
  }, [params.id])

  const fetchEventDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/events/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch event" }))
        throw new Error(errorData.error)
      }
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Failed to Load Event",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
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

  const getPaymentStatusIcon = (status?: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'FAILED': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const calculateTotalRevenue = () => {
    if (!event?.isPaid || !event.ticketPrice) return 0
    const paidRegistrations = event.registrations.filter(r => r.paymentStatus === 'COMPLETED')
    return paidRegistrations.length * event.ticketPrice
  }

  const getPendingPayments = () => {
    if (!event?.isPaid) return 0
    return event.registrations.filter(r => r.paymentStatus === 'PENDING').length
  }

  const handleQuickPublish = async () => {
    if (!event) return
    setActionLoading('publish')
    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SCHEDULED' })
      })
      if (response.ok) {
        toast({ title: "Success", description: "Event published successfully" })
        fetchEventDetail()
      } else {
        throw new Error("Failed to publish event")
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCopyLink = () => {
    const eventUrl = `${window.location.origin}/events/${event?.id}`
    navigator.clipboard.writeText(eventUrl)
    toast({ title: "Success", description: "Event link copied to clipboard" })
  }

  const handleEmailAttendees = () => {
    if (!event?.registrations.length) {
      toast({ title: "No Attendees", description: "No registered attendees to email", variant: "destructive" })
      return
    }
    const emails = event.registrations.map(r => r.user.email).join(',')
    window.location.href = `mailto:${emails}?subject=Update: ${event.title}`
  }

  const handleExportAttendees = () => {
    if (!event?.registrations.length) {
      toast({ title: "No Data", description: "No attendees to export", variant: "destructive" })
      return
    }
    const csvContent = [
      ['Name', 'Email', 'Registration Date', ...(event.isPaid ? ['Payment Status', 'Amount'] : [])],
      ...event.registrations.map(r => [
        r.user.name || 'Unknown',
        r.user.email,
        new Date(r.registeredAt).toLocaleDateString(),
        ...(event.isPaid ? [r.paymentStatus || 'PENDING', `$${r.paymentAmount || event.ticketPrice || 0}`] : [])
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}_attendees.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Success", description: "Attendee list exported" })
  }

  const handleEdit = () => {
    if (!event) return
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
    if (!event || !formData.title || !formData.description || !formData.startTime) {
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

      const response = await fetch(`/api/admin/events/${event.id}`, {
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
        fetchEventDetail()
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Event Details</h3>
            <p className="text-gray-600">Please wait while we fetch the event information...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-96 space-y-6">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h3>
            <p className="text-gray-600 mb-6 max-w-md">{error || "The event you're looking for doesn't exist."}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <p className="text-muted-foreground">Event Details & Registrations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(event.status)}>
            {event.status}
          </Badge>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            {event.status === 'DRAFT' && (
              <Button 
                size="sm" 
                onClick={handleQuickPublish}
                disabled={actionLoading === 'publish'}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading === 'publish' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Publish
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={fetchEventDetail}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{event.currentAttendees}</div>
            <p className="text-xs text-muted-foreground">
              {event.maxAttendees ? `of ${event.maxAttendees} max` : "No limit"}
            </p>
          </CardContent>
        </Card>

        {event.isPaid && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${calculateTotalRevenue().toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">From completed payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getPendingPayments()}</div>
                <p className="text-xs text-muted-foreground">Awaiting payment</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Event Schedule</p>
                  <p className="text-sm">{formatDateTime(event.startTime)}</p>
                  {event.endTime && (
                    <p className="text-sm text-muted-foreground">to {formatDateTime(event.endTime)}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                {event.isVirtual ? (
                  <>
                    <ExternalLink className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Virtual Event</p>
                      {event.virtualLink && (
                        <a href={event.virtualLink} target="_blank" rel="noopener noreferrer" 
                           className="text-sm text-blue-600 hover:underline break-all">
                          {event.virtualLink}
                        </a>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      {event.venue && <p className="text-sm">{event.venue}</p>}
                      {event.address && <p className="text-sm text-muted-foreground">{event.address}</p>}
                      {(event.city || event.state || event.country) && (
                        <p className="text-sm text-muted-foreground">
                          {[event.city, event.state, event.country].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {event.location && !event.venue && <p className="text-sm">{event.location}</p>}
                    </div>
                  </>
                )}
              </div>

              {event.isPaid && (
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Pricing</p>
                    <p className="text-sm">{event.ticketPrice} {event.currency || 'USD'}</p>
                    <p className="text-xs text-muted-foreground">Payment required for registration</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Attendance</p>
                  <p className="text-sm">{event.currentAttendees} registered</p>
                  {event.maxAttendees && (
                    <p className="text-xs text-muted-foreground">Maximum: {event.maxAttendees}</p>
                  )}
                  {event.requiresRSVP && (
                    <Badge variant="outline" className="text-xs mt-1">RSVP Required</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization & Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Organized by</p>
                  <p className="text-sm">{event.organizer.name}</p>
                  <p className="text-xs text-muted-foreground">{event.organizer.email}</p>
                </div>
              </div>

              {event.contactPerson && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Contact Person</p>
                    <p className="text-sm">{event.contactPerson}</p>
                  </div>
                </div>
              )}

              {event.contactEmail && (
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Contact Email</p>
                    <a href={`mailto:${event.contactEmail}`} className="text-sm text-blue-600 hover:underline">
                      {event.contactEmail}
                    </a>
                  </div>
                </div>
              )}

              {event.contactPhone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Contact Phone</p>
                    <a href={`tel:${event.contactPhone}`} className="text-sm text-blue-600 hover:underline">
                      {event.contactPhone}
                    </a>
                  </div>
                </div>
              )}

              {event.coOrganizers && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Co-Organizers</p>
                    <p className="text-sm text-muted-foreground">{event.coOrganizers}</p>
                  </div>
                </div>
              )}

              {event.sponsors && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Sponsors</p>
                    <p className="text-sm text-muted-foreground">{event.sponsors}</p>
                  </div>
                </div>
              )}

              {(event.facebookEvent || event.twitterEvent || event.linkedinEvent) && (
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Social Media</p>
                    <div className="flex gap-2 mt-1">
                      {event.facebookEvent && (
                        <a href={event.facebookEvent} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:text-blue-800">
                          <Facebook className="h-4 w-4" />
                        </a>
                      )}
                      {event.twitterEvent && (
                        <a href={event.twitterEvent} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-400 hover:text-blue-600">
                          <Twitter className="h-4 w-4" />
                        </a>
                      )}
                      {event.linkedinEvent && (
                        <a href={event.linkedinEvent} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-700 hover:text-blue-900">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {(event.imageUrl || event.bannerUrl || event.galleryUrls) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Media Gallery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {event.imageUrl && (
                <div>
                  <p className="text-sm font-medium mb-2">Event Image</p>
                  <img 
                    src={event.imageUrl} 
                    alt="Event" 
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>
              )}
              {event.bannerUrl && (
                <div>
                  <p className="text-sm font-medium mb-2">Banner Image</p>
                  <img 
                    src={event.bannerUrl} 
                    alt="Event Banner" 
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>
              )}
              {event.galleryUrls && event.galleryUrls.split(',').map((url, index) => {
                const trimmedUrl = url.trim();
                if (!trimmedUrl) return null;
                return (
                  <div key={index}>
                    <p className="text-sm font-medium mb-2">Gallery Image {index + 1}</p>
                    <img 
                      src={trimmedUrl} 
                      alt={`Gallery ${index + 1}`} 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Event Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Event ID</p>
              <p className="font-mono">{event.id}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Event Type</p>
              <Badge variant="outline">{event.eventType.replace('_', ' ')}</Badge>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Created</p>
              <p>{formatDateTime(event.createdAt)}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Last Updated</p>
              <p>{formatDateTime(event.updatedAt)}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Status</p>
              <Badge className={getStatusColor(event.status)}>
                {event.status}
              </Badge>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Currency</p>
              <p>{event.currency || 'USD'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Registrations ({event.registrations.length})</CardTitle>
          {event.registrations.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEmailAttendees}>
                <Mail className="h-4 w-4 mr-2" />
                Email All
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportAttendees}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {event.registrations.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No registrations yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registration Date</TableHead>
                  {event.isPaid && (
                    <>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Amount</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {event.registrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">
                      {registration.user.name || "Unknown User"}
                    </TableCell>
                    <TableCell>{registration.user.email}</TableCell>
                    <TableCell>{formatDateTime(registration.registeredAt)}</TableCell>
                    {event.isPaid && (
                      <>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPaymentStatusIcon(registration.paymentStatus)}
                            <span className="text-sm">
                              {registration.paymentStatus || "PENDING"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          ${registration.paymentAmount || event.ticketPrice || 0}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Event Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update the event details.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="flex-1 flex flex-col max-h-[70vh]">
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
  )
}