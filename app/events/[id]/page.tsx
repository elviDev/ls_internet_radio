"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Clock, MapPin, Users, DollarSign, ExternalLink, Loader2, AlertCircle, CheckCircle, Heart, Facebook, Twitter, Linkedin, Phone, Mail, User, Building2, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

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
  organizer: {
    id: string
    firstName: string
    lastName: string
  }
  isFeatured: boolean
  isRegistered?: boolean
}

export default function PublicEventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    fetchEventDetail()
    fetchCurrentUser()
  }, [params.id])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchEventDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
      } else {
        throw new Error("Event not found")
      }
    } catch (error: any) {
      toast({
        title: "Failed to Load Event",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to register for events",
        variant: "destructive"
      })
      router.push('/signin')
      return
    }

    if (!event) return

    setRegistering(true)
    try {
      const response = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Successfully registered for event!"
        })
        // Refresh event data to update registration status and count
        fetchEventDetail()
      } else {
        const error = await response.json()
        toast({
          title: "Registration Failed",
          description: error.error || "Failed to register for event",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register for event",
        variant: "destructive"
      })
    } finally {
      setRegistering(false)
    }
  }

  const handleShare = () => {
    const eventUrl = window.location.href
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: event?.description,
        url: eventUrl
      })
    } else {
      navigator.clipboard.writeText(eventUrl)
      toast({
        title: "Link Copied",
        description: "Event link copied to clipboard"
      })
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getEventTypeLabel = (eventType: string) => {
    return eventType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const getLocationDisplay = () => {
    if (event?.isVirtual) return "Virtual Event"
    
    const parts = []
    if (event?.venue) parts.push(event.venue)
    if (event?.city) parts.push(event.city)
    if (event?.state) parts.push(event.state)
    if (event?.country && event?.country !== 'US') parts.push(event.country)
    
    return parts.length > 0 ? parts.join(', ') : event?.location || "Location TBD"
  }

  const isEventFull = () => {
    return event?.maxAttendees && event.currentAttendees >= event.maxAttendees
  }

  const canRegister = () => {
    if (!event) return false
    if (event.isRegistered) return false
    if (isEventFull()) return false
    if (new Date(event.startTime) < new Date()) return false
    return true
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-20 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-96 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
          <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.push('/events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            {(event.bannerUrl || event.imageUrl) && (
              <div className="relative h-64 md:h-80 rounded-lg overflow-hidden">
                <Image
                  src={event.bannerUrl || event.imageUrl || "/placeholder.svg?height=400&width=800"}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                  <div className="p-6 text-white">
                    <Badge className="bg-purple-600 hover:bg-purple-700 mb-2">
                      {getEventTypeLabel(event.eventType)}
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{event.title}</h1>
                    <p className="text-lg opacity-90">
                      {formatDate(event.startTime)} • {getLocationDisplay()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Event Info without hero image */}
            {!event.bannerUrl && !event.imageUrl && (
              <div className="text-center md:text-left">
                <Badge className="bg-purple-600 hover:bg-purple-700 mb-4">
                  {getEventTypeLabel(event.eventType)}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
                <p className="text-xl text-muted-foreground">
                  {formatDate(event.startTime)} • {getLocationDisplay()}
                </p>
              </div>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Date & Time</p>
                      <p className="text-sm text-muted-foreground">{formatDateTime(event.startTime)}</p>
                      {event.endTime && (
                        <p className="text-sm text-muted-foreground">to {formatDateTime(event.endTime)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    {event.isVirtual ? (
                      <>
                        <ExternalLink className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Virtual Event</p>
                          <p className="text-sm text-muted-foreground">Join link will be provided</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Location</p>
                          <p className="text-sm text-muted-foreground">{getLocationDisplay()}</p>
                          {event.address && (
                            <p className="text-sm text-muted-foreground">{event.address}</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Attendance</p>
                      <p className="text-sm text-muted-foreground">
                        {event.currentAttendees} registered
                        {event.maxAttendees && ` • ${event.maxAttendees} max`}
                      </p>
                      {event.requiresRSVP && (
                        <Badge variant="outline" className="text-xs mt-1">RSVP Required</Badge>
                      )}
                    </div>
                  </div>

                  {event.isPaid && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Ticket Price</p>
                        <p className="text-sm text-muted-foreground">
                          {event.ticketPrice} {event.currency || 'USD'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Organizer & Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Organizer & Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Organized by</p>
                    <p className="text-sm text-muted-foreground">
                      {event.organizer.firstName} {event.organizer.lastName}
                    </p>
                  </div>
                </div>

                {(event.contactEmail || event.contactPhone || event.contactPerson) && (
                  <div className="space-y-2">
                    {event.contactPerson && event.contactPerson !== `${event.organizer.firstName} ${event.organizer.lastName}` && (
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Contact Person</p>
                          <p className="text-sm text-muted-foreground">{event.contactPerson}</p>
                        </div>
                      </div>
                    )}

                    {event.contactEmail && (
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Email</p>
                          <a href={`mailto:${event.contactEmail}`} 
                             className="text-sm text-purple-600 hover:text-purple-800">
                            {event.contactEmail}
                          </a>
                        </div>
                      </div>
                    )}

                    {event.contactPhone && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Phone</p>
                          <a href={`tel:${event.contactPhone}`} 
                             className="text-sm text-purple-600 hover:text-purple-800">
                            {event.contactPhone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(event.coOrganizers || event.sponsors) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      {event.coOrganizers && (
                        <div className="flex items-start gap-3">
                          <Building2 className="h-5 w-5 text-purple-600 mt-0.5" />
                          <div>
                            <p className="font-medium">Co-Organizers</p>
                            <p className="text-sm text-muted-foreground">{event.coOrganizers}</p>
                          </div>
                        </div>
                      )}

                      {event.sponsors && (
                        <div className="flex items-start gap-3">
                          <Building2 className="h-5 w-5 text-purple-600 mt-0.5" />
                          <div>
                            <p className="font-medium">Sponsors</p>
                            <p className="text-sm text-muted-foreground">{event.sponsors}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {(event.facebookEvent || event.twitterEvent || event.linkedinEvent) && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium mb-2">Follow this event</p>
                      <div className="flex gap-2">
                        {event.facebookEvent && (
                          <a href={event.facebookEvent} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 hover:text-blue-800">
                            <Facebook className="h-5 w-5" />
                          </a>
                        )}
                        {event.twitterEvent && (
                          <a href={event.twitterEvent} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-400 hover:text-blue-600">
                            <Twitter className="h-5 w-5" />
                          </a>
                        )}
                        {event.linkedinEvent && (
                          <a href={event.linkedinEvent} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-700 hover:text-blue-900">
                            <Linkedin className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Gallery */}
            {event.galleryUrls && event.galleryUrls.trim() && (
              <Card>
                <CardHeader>
                  <CardTitle>Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {event.galleryUrls.split(',').map((url, index) => {
                      const trimmedUrl = url.trim()
                      if (!trimmedUrl) return null
                      return (
                        <div key={index} className="relative h-32 rounded-lg overflow-hidden">
                          <Image
                            src={trimmedUrl}
                            alt={`Gallery image ${index + 1}`}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Registration</span>
                  <Button variant="ghost" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.isPaid && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {event.ticketPrice} {event.currency || 'USD'}
                    </p>
                    <p className="text-sm text-muted-foreground">per ticket</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Registered</span>
                    <span>{event.currentAttendees}</span>
                  </div>
                  {event.maxAttendees && (
                    <div className="flex justify-between text-sm">
                      <span>Available</span>
                      <span>{event.maxAttendees - event.currentAttendees}</span>
                    </div>
                  )}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: event.maxAttendees 
                          ? `${Math.min((event.currentAttendees / event.maxAttendees) * 100, 100)}%`
                          : '30%'
                      }}
                    />
                  </div>
                </div>

                {event.isRegistered ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">You're registered!</span>
                    </div>
                    {event.isVirtual && event.virtualLink && (
                      <Button 
                        className="w-full" 
                        onClick={() => window.open(event.virtualLink, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Join Event
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {!canRegister() && (
                      <div className="text-center text-sm text-muted-foreground">
                        {isEventFull() ? (
                          <span>This event is full</span>
                        ) : new Date(event.startTime) < new Date() ? (
                          <span>This event has passed</span>
                        ) : (
                          <span>Registration not available</span>
                        )}
                      </div>
                    )}
                    
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={handleRegister}
                      disabled={registering || !canRegister()}
                    >
                      {registering ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4 mr-2" />
                          {event.isPaid ? 'Buy Ticket' : 'Register Now'}
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {!currentUser && (
                  <p className="text-xs text-center text-muted-foreground">
                    <button 
                      onClick={() => router.push('/signin')}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      Sign in
                    </button> to register for this event
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{formatDate(event.startTime)}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(event.startTime)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{getLocationDisplay()}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{event.currentAttendees} attending</p>
                </div>

                {event.isPaid && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{event.ticketPrice} {event.currency || 'USD'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}