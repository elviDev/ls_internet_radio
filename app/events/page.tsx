"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, Heart, ExternalLink, Facebook, Twitter, Linkedin, Phone, Mail } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  organizer: {
    id: string
    firstName: string
    lastName: string
  }
  isFeatured: boolean
  isRegistered?: boolean
}

const categories = [
  { value: "all", label: "All Events" },
  { value: "concert", label: "Concerts" },
  { value: "meetup", label: "Meetups" },
  { value: "interview", label: "Interviews" },
  { value: "special-broadcast", label: "Special Broadcasts" },
  { value: "contest", label: "Contests" },
  { value: "giveaway", label: "Giveaways" },
  { value: "community-event", label: "Community Events" },
  { value: "fundraiser", label: "Fundraisers" }
]

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchEvents()
    fetchCurrentUser()
  }, [selectedCategory, searchTerm, sortBy])

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

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        category: selectedCategory,
        search: searchTerm,
        sort: sortBy
      })
      
      const [eventsResponse, featuredResponse] = await Promise.all([
        fetch(`/api/events?${params}`),
        fetch(`/api/events?featured=true`)
      ])
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setEvents(eventsData.events)
      }
      
      if (featuredResponse.ok) {
        const featuredData = await featuredResponse.json()
        setFeaturedEvents(featuredData.events.slice(0, 3))
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to register for events",
        variant: "destructive"
      })
      return
    }

    setRegistering(eventId)
    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Successfully registered for event!"
        })
        fetchEvents() // Refresh to update registration status
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
      setRegistering(null)
    }
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <Skeleton className="h-12 w-96 mx-auto mb-4" />
          <Skeleton className="h-6 w-[600px] mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Upcoming Events</h1>
        <p className="text-xl text-muted-foreground">
          Join us for live recordings, meet & greets, workshops, and special broadcasts.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-muted-foreground"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date (Soonest)</SelectItem>
              <SelectItem value="popularity">Popularity</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {featuredEvents.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Featured Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-all group">
                <div className="relative h-48">
                  <Image
                    src={event.imageUrl || "/placeholder.svg?height=400&width=600"}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-purple-600 hover:bg-purple-700">
                      {getEventTypeLabel(event.eventType)}
                    </Badge>
                  </div>
                  {event.isPaid && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary">
                        ${event.ticketPrice}
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    <button 
                      onClick={() => router.push(`/events/${event.id}`)}
                      className="text-left hover:text-purple-600 transition-colors"
                    >
                      {event.title}
                    </button>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{formatDate(event.startTime)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{formatTime(event.startTime)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      {event.isVirtual ? (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Virtual Event</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            {event.venue && event.city 
                              ? `${event.venue}, ${event.city}${event.state ? `, ${event.state}` : ''}`
                              : event.venue || event.location || event.city || "TBD"
                            }
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{event.currentAttendees} attending</span>
                      {event.maxAttendees && (
                        <span className="text-muted-foreground"> / {event.maxAttendees}</span>
                      )}
                    </div>
                    {(event.facebookEvent || event.twitterEvent || event.linkedinEvent || event.contactEmail || event.contactPhone) && (
                      <div className="flex items-center gap-2 text-sm mt-2 pt-2 border-t">
                        {event.facebookEvent && (
                          <a href={event.facebookEvent} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                            <Facebook className="h-4 w-4" />
                          </a>
                        )}
                        {event.twitterEvent && (
                          <a href={event.twitterEvent} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600">
                            <Twitter className="h-4 w-4" />
                          </a>
                        )}
                        {event.linkedinEvent && (
                          <a href={event.linkedinEvent} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900">
                            <Linkedin className="h-4 w-4" />
                          </a>
                        )}
                        {event.contactEmail && (
                          <a href={`mailto:${event.contactEmail}`} className="text-gray-600 hover:text-gray-800">
                            <Mail className="h-4 w-4" />
                          </a>
                        )}
                        {event.contactPhone && (
                          <a href={`tel:${event.contactPhone}`} className="text-gray-600 hover:text-gray-800">
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      View Details
                    </Button>
                    {event.isRegistered && (
                      <Badge variant="outline" className="text-green-600 border-green-600 px-3 py-1">
                        <Heart className="h-3 w-3 mr-1 fill-current" />
                        Registered
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">All Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-all group">
              <div className="flex flex-col md:flex-row h-full">
                <div className="relative w-full md:w-1/3 h-48 md:h-auto">
                  <Image
                    src={event.imageUrl || "/placeholder.svg?height=300&width=400"}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {event.isPaid && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        ${event.ticketPrice}
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-6 w-full md:w-2/3 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                      {getEventTypeLabel(event.eventType)}
                    </Badge>
                    {event.isRegistered && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <Heart className="h-3 w-3 mr-1 fill-current" />
                        Registered
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    <button 
                      onClick={() => router.push(`/events/${event.id}`)}
                      className="text-left hover:text-purple-600 transition-colors"
                    >
                      {event.title}
                    </button>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
                    {event.description}
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{formatDate(event.startTime)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{formatTime(event.startTime)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      {event.isVirtual ? (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Virtual Event</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            {event.venue && event.city 
                              ? `${event.venue}, ${event.city}${event.state ? `, ${event.state}` : ''}`
                              : event.venue || event.location || event.city || "TBD"
                            }
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{event.currentAttendees} attending</span>
                      {event.maxAttendees && (
                        <span className="text-muted-foreground"> / {event.maxAttendees}</span>
                      )}
                    </div>
                    {(event.facebookEvent || event.twitterEvent || event.linkedinEvent || event.contactEmail || event.contactPhone) && (
                      <div className="flex items-center gap-2 text-sm mt-2 pt-2 border-t">
                        {event.facebookEvent && (
                          <a href={event.facebookEvent} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                            <Facebook className="h-4 w-4" />
                          </a>
                        )}
                        {event.twitterEvent && (
                          <a href={event.twitterEvent} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600">
                            <Twitter className="h-4 w-4" />
                          </a>
                        )}
                        {event.linkedinEvent && (
                          <a href={event.linkedinEvent} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900">
                            <Linkedin className="h-4 w-4" />
                          </a>
                        )}
                        {event.contactEmail && (
                          <a href={`mailto:${event.contactEmail}`} className="text-gray-600 hover:text-gray-800">
                            <Mail className="h-4 w-4" />
                          </a>
                        )}
                        {event.contactPhone && (
                          <a href={`tel:${event.contactPhone}`} className="text-gray-600 hover:text-gray-800">
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Button 
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      View Details
                    </Button>
                    {event.isRegistered && (
                      <Badge variant="outline" className="text-green-600 border-green-600 px-3 py-1">
                        <Heart className="h-3 w-3 mr-1 fill-current" />
                        Registered
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {events.length === 0 && !loading && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedCategory !== "all" 
              ? "Try adjusting your search or filters" 
              : "Check back soon for upcoming events!"}
          </p>
          {(searchTerm || selectedCategory !== "all") && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("all")
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
