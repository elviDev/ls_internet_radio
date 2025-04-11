import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const events = [
  {
    id: 1,
    title: "Live Podcast Recording: Tech Trends 2023",
    date: "Oct 15, 2023",
    time: "6:00 PM - 8:00 PM",
    location: "Studio One, Downtown",
    category: "Live Recording",
    image: "/placeholder.svg?height=400&width=800&text=Tech+Trends+2023",
    description:
      "Join us for a live recording of our popular Tech Talks Weekly podcast. This special episode will feature industry experts discussing the most impactful tech trends of 2023 and predictions for the coming year.",
    host: "Sarah Johnson",
    attendees: 87,
    isFeatured: true,
  },
  {
    id: 2,
    title: "Meet & Greet with Podcast Hosts",
    date: "Oct 22, 2023",
    time: "3:00 PM - 5:00 PM",
    location: "Central Park Pavilion",
    category: "Community",
    image: "/placeholder.svg?height=400&width=800&text=Meet+and+Greet",
    description:
      "Meet your favorite WaveStream hosts in person! Get autographs, take photos, and participate in Q&A sessions with the voices behind our most popular shows.",
    host: "WaveStream Team",
    attendees: 124,
    isFeatured: true,
  },
  {
    id: 3,
    title: "Audiobook Launch: 'The Silent Echo'",
    date: "Nov 5, 2023",
    time: "7:00 PM - 9:00 PM",
    location: "City Library Auditorium",
    category: "Book Launch",
    image: "/placeholder.svg?height=400&width=800&text=Silent+Echo+Launch",
    description:
      "Celebrate the launch of 'The Silent Echo', the latest thriller from bestselling author J.R. Morgan. Join us for a reading, discussion, and exclusive first listen to the audiobook narrated by award-winning voice actor Elena Rodriguez.",
    host: "J.R. Morgan & Elena Rodriguez",
    attendees: 56,
    isFeatured: true,
  },
  {
    id: 4,
    title: "Music Industry Panel Discussion",
    date: "Nov 12, 2023",
    time: "4:00 PM - 6:00 PM",
    location: "Sound Wave Studio",
    category: "Panel Discussion",
    image: "/placeholder.svg?height=400&width=800&text=Music+Industry+Panel",
    description:
      "Industry professionals discuss the changing landscape of music production, distribution, and consumption in the digital age. Perfect for aspiring musicians and music business enthusiasts.",
    host: "DJ Marcus & Mia Chen",
    attendees: 42,
    isFeatured: false,
  },
  {
    id: 5,
    title: "Radio Drama Workshop",
    date: "Nov 18, 2023",
    time: "10:00 AM - 2:00 PM",
    location: "Community Arts Center",
    category: "Workshop",
    image: "/placeholder.svg?height=400&width=800&text=Radio+Drama+Workshop",
    description:
      "Learn the art of radio drama in this hands-on workshop. Participants will create, perform, and record their own short radio plays with guidance from professional voice actors and sound engineers.",
    host: "Jordan Taylor",
    attendees: 30,
    isFeatured: false,
  },
  {
    id: 6,
    title: "Holiday Broadcast Special",
    date: "Dec 20, 2023",
    time: "7:00 PM - 10:00 PM",
    location: "Town Square",
    category: "Live Broadcast",
    image: "/placeholder.svg?height=400&width=800&text=Holiday+Broadcast",
    description:
      "Join us for our annual holiday broadcast live from Town Square! Enjoy musical performances, special guest interviews, and community stories celebrating the season. Hot cocoa and treats provided!",
    host: "Alex Rivera & Full WaveStream Team",
    attendees: 215,
    isFeatured: false,
  },
];

const categories = [
  "All",
  "Live Recording",
  "Community",
  "Book Launch",
  "Panel Discussion",
  "Workshop",
  "Live Broadcast",
];

export default function EventsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Upcoming Events</h1>
        <p className="text-xl text-muted-foreground">
          Join us for live recordings, meet & greets, workshops, and special
          broadcasts.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search events..."
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
          <Select defaultValue="date">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date (Soonest)</SelectItem>
              <SelectItem value="popularity">Popularity</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              <SelectItem value="oct">October</SelectItem>
              <SelectItem value="nov">November</SelectItem>
              <SelectItem value="dec">December</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Featured Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events
            .filter((event) => event.isFeatured)
            .map((event) => (
              <Card
                key={event.id}
                className="overflow-hidden hover:shadow-md transition-all"
              >
                <div className="relative h-48">
                  <Image
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-brand-600 hover:bg-brand-700">
                      {event.category}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">{event.title}</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{event.attendees} attending</span>
                    </div>
                  </div>
                  <Button className="w-full bg-brand-600 hover:bg-brand-700">
                    Register Now
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-12">
        <TabsList className="flex flex-wrap h-auto p-1 mb-8">
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={
                category === "All"
                  ? "all"
                  : category.toLowerCase().replace(" ", "-")
              }
              className="mb-1"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent
            key={category}
            value={
              category === "All"
                ? "all"
                : category.toLowerCase().replace(" ", "-")
            }
            className="mt-0"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events
                .filter(
                  (event) => category === "All" || event.category === category
                )
                .map((event) => (
                  <Card
                    key={event.id}
                    className="overflow-hidden hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col md:flex-row h-full">
                      <div className="relative w-full md:w-1/3 h-48 md:h-auto">
                        <Image
                          src={event.image || "/placeholder.svg"}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <CardContent className="p-6 w-full md:w-2/3">
                        <Badge className="mb-2 bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200 hover:bg-brand-200 dark:hover:bg-brand-800">
                          {event.category}
                        </Badge>
                        <h3 className="font-semibold text-lg mb-2">
                          {event.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                        <Button className="w-full bg-brand-600 hover:bg-brand-700">
                          Register Now
                        </Button>
                      </CardContent>
                    </div>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="text-center">
        <Button variant="outline" size="lg" className="px-8">
          Load More Events
        </Button>
      </div>
    </div>
  );
}
