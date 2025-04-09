import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  Share2,
  Heart,
  Download,
  Clock,
  Calendar,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"

// This would normally come from a database or API
const podcast = {
  id: 1,
  title: "Tech Talks Weekly: The Future of AI",
  host: "Sarah Johnson",
  image: "/placeholder.svg?height=600&width=600",
  coverImage: "/placeholder.svg?height=1200&width=1200",
  duration: "45:32",
  date: "October 10, 2023",
  category: "Technology",
  description:
    "In this episode, we dive deep into the future of artificial intelligence with leading experts in the field. We discuss the latest advancements, ethical considerations, and how AI is set to transform various industries in the coming years.",
  episodes: [
    {
      id: 101,
      title: "The Future of AI",
      duration: "45:32",
      date: "October 10, 2023",
    },
    {
      id: 102,
      title: "Blockchain Revolution",
      duration: "38:15",
      date: "October 3, 2023",
    },
    {
      id: 103,
      title: "Cybersecurity Essentials",
      duration: "42:47",
      date: "September 26, 2023",
    },
    {
      id: 104,
      title: "The Rise of Quantum Computing",
      duration: "51:20",
      date: "September 19, 2023",
    },
  ],
  relatedPodcasts: [
    {
      id: 2,
      title: "Digital Frontiers",
      host: "Michael Chen",
      image: "/placeholder.svg?height=400&width=400",
      category: "Technology",
    },
    {
      id: 3,
      title: "Innovation Today",
      host: "Priya Sharma",
      image: "/placeholder.svg?height=400&width=400",
      category: "Technology",
    },
    {
      id: 4,
      title: "Tech Insights",
      host: "James Wilson",
      image: "/placeholder.svg?height=400&width=400",
      category: "Technology",
    },
  ],
}

export default function PodcastDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-6">
            <Image src={podcast.coverImage || "/placeholder.svg"} alt={podcast.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
              <div>
                <div className="text-sm font-medium text-purple-300 mb-2">{podcast.category}</div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{podcast.title}</h1>
                <p className="text-white/80">with {podcast.host}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/placeholder.svg?height=100&width=100" alt={podcast.host} />
                  <AvatarFallback>
                    {podcast.host
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{podcast.host}</p>
                  <p className="text-sm text-muted-foreground">Host & Producer</p>
                </div>
              </div>
              <Button variant="outline" className="gap-2">
                <Heart className="h-4 w-4" /> Follow
              </Button>
            </div>

            <div className="space-y-4 mb-6">
              <h2 className="text-xl font-semibold">About This Episode</h2>
              <p className="text-muted-foreground">{podcast.description}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                <span>{podcast.duration}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{podcast.date}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4 mr-2" />
                <span>24 Comments</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Audio Player</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{podcast.title}</h3>
                  <p className="text-sm text-muted-foreground">Episode {podcast.episodes[0].id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>12:34</span>
                  <span>{podcast.duration}</span>
                </div>
                <Slider defaultValue={[27]} max={100} step={1} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Slider defaultValue={[80]} max={100} step={1} className="w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button size="icon" className="rounded-full bg-purple-600 hover:bg-purple-700 h-12 w-12">
                    <Play className="h-5 w-5 fill-current" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    1x
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <Tabs defaultValue="episodes">
              <TabsList className="mb-6">
                <TabsTrigger value="episodes">Episodes</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
              </TabsList>
              <TabsContent value="episodes">
                <div className="space-y-4">
                  {podcast.episodes.map((episode) => (
                    <div
                      key={episode.id}
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Button size="icon" variant="outline" className="rounded-full">
                          <Play className="h-4 w-4" />
                        </Button>
                        <div>
                          <p className="font-medium">{episode.title}</p>
                          <p className="text-sm text-muted-foreground">{episode.date}</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{episode.duration}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="comments">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=100&width=100" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">John Doe</p>
                        <p className="text-xs text-muted-foreground">2 days ago</p>
                      </div>
                      <p className="text-muted-foreground">
                        This episode was incredibly insightful! I especially enjoyed the discussion about ethical AI
                        development. Looking forward to more content like this.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=100&width=100" />
                      <AvatarFallback>AS</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Amanda Smith</p>
                        <p className="text-xs text-muted-foreground">5 days ago</p>
                      </div>
                      <p className="text-muted-foreground">
                        Great episode! I have a question about the AI regulation frameworks mentioned around the
                        30-minute mark. Are there any resources you'd recommend to learn more about this topic?
                      </p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button className="w-full">Load More Comments</Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="transcript">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    [00:00:00] <span className="font-medium text-foreground">Sarah:</span> Welcome to Tech Talks Weekly.
                    I'm your host, Sarah Johnson, and today we're diving into the fascinating world of artificial
                    intelligence and its future.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    [00:01:15] <span className="font-medium text-foreground">Sarah:</span> Joining me today are Dr.
                    Emily Chen, AI researcher at Tech University, and Mark Williams, CEO of FutureAI.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    [00:02:30] <span className="font-medium text-foreground">Dr. Chen:</span> Thank you for having me,
                    Sarah. It's great to be here discussing such an important topic.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    [00:02:45] <span className="font-medium text-foreground">Mark:</span> Excited to join the
                    conversation and share some insights from the industry perspective.
                  </p>
                  <div className="pt-4">
                    <Button variant="outline" className="w-full">
                      View Full Transcript
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="space-y-8">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Related Podcasts</h2>
              <div className="space-y-4">
                {podcast.relatedPodcasts.map((related) => (
                  <Link href={`/podcasts/${related.id}`} key={related.id} className="block">
                    <div className="flex items-center gap-3 group">
                      <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                        <Image
                          src={related.image || "/placeholder.svg"}
                          alt={related.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-purple-600 transition-colors">{related.title}</p>
                        <p className="text-sm text-muted-foreground">with {related.host}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Subscribe</h2>
              <p className="text-muted-foreground mb-4">
                Never miss an episode. Subscribe to this podcast on your favorite platform.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full">
                  Apple Podcasts
                </Button>
                <Button variant="outline" className="w-full">
                  Spotify
                </Button>
                <Button variant="outline" className="w-full">
                  Google Podcasts
                </Button>
                <Button variant="outline" className="w-full">
                  RSS Feed
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Share This Episode</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </Button>
                <Button variant="outline" size="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </Button>
                <Button variant="outline" size="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </Button>
                <Button variant="outline" size="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="m22 2-7 20-4-9-9-4Z"></path>
                    <path d="M22 2 11 13"></path>
                  </svg>
                </Button>
                <Button variant="outline" size="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

