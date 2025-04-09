import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { Play, Clock, Calendar, Filter } from "lucide-react"

const categories = [
  "All",
  "Technology",
  "Business",
  "Science",
  "Health",
  "Arts",
  "Education",
  "Entertainment",
  "News",
  "Sports",
]

const podcasts = [
  {
    id: 1,
    title: "Tech Talks Weekly",
    host: "Sarah Johnson",
    image: "/placeholder.svg?height=400&width=400",
    duration: "45 min",
    date: "Oct 10, 2023",
    category: "Technology",
    description: "Exploring the latest trends and innovations in technology with industry experts.",
  },
  {
    id: 2,
    title: "Mindful Moments",
    host: "David Chen",
    image: "/placeholder.svg?height=400&width=400",
    duration: "32 min",
    date: "Oct 8, 2023",
    category: "Health",
    description: "Guided meditations and discussions on mindfulness for everyday life.",
  },
  {
    id: 3,
    title: "Business Insights",
    host: "Maya Patel",
    image: "/placeholder.svg?height=400&width=400",
    duration: "58 min",
    date: "Oct 5, 2023",
    category: "Business",
    description: "Interviews with successful entrepreneurs and business strategies for growth.",
  },
  {
    id: 4,
    title: "Creative Corner",
    host: "James Wilson",
    image: "/placeholder.svg?height=400&width=400",
    duration: "41 min",
    date: "Oct 3, 2023",
    category: "Arts",
    description: "Conversations with artists, writers, and creators about their creative process.",
  },
  {
    id: 5,
    title: "Science Simplified",
    host: "Elena Rodriguez",
    image: "/placeholder.svg?height=400&width=400",
    duration: "37 min",
    date: "Sep 29, 2023",
    category: "Science",
    description: "Breaking down complex scientific concepts into understandable explanations.",
  },
  {
    id: 6,
    title: "Education Matters",
    host: "Michael Thompson",
    image: "/placeholder.svg?height=400&width=400",
    duration: "52 min",
    date: "Sep 25, 2023",
    category: "Education",
    description: "Discussions on educational trends, teaching methods, and learning strategies.",
  },
  {
    id: 7,
    title: "Entertainment Weekly",
    host: "Sophia Lee",
    image: "/placeholder.svg?height=400&width=400",
    duration: "48 min",
    date: "Sep 22, 2023",
    category: "Entertainment",
    description: "The latest news and reviews from the world of movies, TV, and music.",
  },
  {
    id: 8,
    title: "Sports Talk",
    host: "Carlos Mendez",
    image: "/placeholder.svg?height=400&width=400",
    duration: "63 min",
    date: "Sep 18, 2023",
    category: "Sports",
    description: "Analysis and discussions about the latest sports events and athlete interviews.",
  },
]

export default function PodcastsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Explore Our Podcasts</h1>
        <p className="text-xl text-muted-foreground">
          Discover thought-provoking conversations, inspiring stories, and expert insights across a variety of topics.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Input type="search" placeholder="Search podcasts..." className="pl-10 pr-4 py-2 w-full" />
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
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filter
        </Button>
        <Button variant="outline">Sort By: Latest</Button>
      </div>

      <Tabs defaultValue="all" className="mb-12">
        <TabsList className="flex flex-wrap h-auto p-1 mb-8">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category === "All" ? "all" : category.toLowerCase()} className="mb-1">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {podcasts.map((podcast) => (
              <Link href={`/podcasts/${podcast.id}`} key={podcast.id}>
                <Card className="overflow-hidden transition-all hover:shadow-md h-full">
                  <div className="relative aspect-square">
                    <Image
                      src={podcast.image || "/placeholder.svg"}
                      alt={podcast.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="rounded-full bg-white p-3">
                        <Play className="h-8 w-8 text-purple-700 fill-current" />
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 bg-purple-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                      {podcast.category}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">{podcast.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">with {podcast.host}</p>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{podcast.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {podcast.duration}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {podcast.date}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
        {categories.slice(1).map((category) => (
          <TabsContent key={category} value={category.toLowerCase()} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {podcasts
                .filter((podcast) => podcast.category === category)
                .map((podcast) => (
                  <Link href={`/podcasts/${podcast.id}`} key={podcast.id}>
                    <Card className="overflow-hidden transition-all hover:shadow-md h-full">
                      <div className="relative aspect-square">
                        <Image
                          src={podcast.image || "/placeholder.svg"}
                          alt={podcast.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="rounded-full bg-white p-3">
                            <Play className="h-8 w-8 text-purple-700 fill-current" />
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{podcast.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">with {podcast.host}</p>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{podcast.description}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {podcast.duration}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {podcast.date}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-center">
        <Button variant="outline" className="px-8">
          Load More
        </Button>
      </div>
    </div>
  )
}

