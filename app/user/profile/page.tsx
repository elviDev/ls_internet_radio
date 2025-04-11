import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Play, Settings, Edit, Clock, Calendar } from "lucide-react"

export default function UserProfilePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="relative mb-8">
          <div className="h-48 md:h-64 w-full rounded-xl overflow-hidden">
            <Image src="/placeholder.svg?height=400&width=1200" alt="Profile banner" fill className="object-cover" />
          </div>
          <div className="absolute -bottom-12 left-6 flex items-end">
            <Avatar className="h-24 w-24 border-4 border-white">
              <AvatarImage src="/placeholder.svg?height=200&width=200" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
          <div className="absolute top-4 right-4 flex gap-2">
            <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-sm">
              <Settings className="h-4 w-4 mr-2" /> Settings
            </Button>
            <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-sm">
              <Edit className="h-4 w-4 mr-2" /> Edit Profile
            </Button>
          </div>
        </div>

        <div className="pt-12 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">John Doe</h1>
              <p className="text-muted-foreground">@johndoe • Member since October 2022</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">42</p>
                <p className="text-sm text-muted-foreground">Favorites</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">18</p>
                <p className="text-sm text-muted-foreground">Playlists</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">7</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="favorites" className="mb-12">
          <TabsList className="mb-8">
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
          <TabsContent value="favorites">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Card key={item} className="overflow-hidden">
                  <div className="flex h-full">
                    <div className="relative w-1/3">
                      <Image
                        src={`/placeholder.svg?height=200&width=200&text=Podcast ${item}`}
                        alt={`Podcast ${item}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="p-4 w-2/3">
                      <Badge className="mb-2 bg-purple-100 text-purple-800 hover:bg-purple-200">
                        {["Technology", "Business", "Health", "Education", "Entertainment", "Science"][item % 6]}
                      </Badge>
                      <h3 className="font-semibold mb-1 line-clamp-1">
                        {
                          [
                            "Tech Talks Weekly",
                            "Business Insights",
                            "Mindful Moments",
                            "Learning Today",
                            "Entertainment Now",
                            "Science Simplified",
                          ][item % 6]
                        }
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                        Episode {Math.floor(Math.random() * 100) + 1}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <Button variant="ghost" size="sm" className="p-0 h-auto">
                          <Play className="h-4 w-4 mr-1" /> Play
                        </Button>
                        <div className="text-xs text-muted-foreground">{Math.floor(Math.random() * 60) + 10} min</div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="playlists">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <Card key={item} className="overflow-hidden">
                  <div className="relative aspect-video">
                    <Image
                      src={`/placeholder.svg?height=300&width=500&text=Playlist ${item}`}
                      alt={`Playlist ${item}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {["My Favorites", "Tech Collection", "Relaxing Podcasts"][item - 1]}
                        </h3>
                        <p className="text-sm text-white/80">{(item + 2) * 3} episodes</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              <Card className="flex items-center justify-center aspect-video border-dashed">
                <div className="text-center p-6">
                  <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <h3 className="font-medium mb-1">Create New Playlist</h3>
                  <p className="text-sm text-muted-foreground">Organize your favorite episodes</p>
                </div>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="history">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted transition-colors">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={`/placeholder.svg?height=100&width=100&text=${item}`}
                      alt={`History item ${item}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {
                        [
                          "Tech Talks Weekly: The Future of AI",
                          "Business Insights: Market Trends",
                          "Mindful Moments: Meditation Basics",
                          "Science Simplified: Quantum Physics",
                          "Creative Corner: Design Thinking",
                        ][item - 1]
                      }
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      Listened {["yesterday", "2 days ago", "last week", "2 weeks ago", "last month"][item - 1]}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="following">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                <Card key={item} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={`/placeholder.svg?height=100&width=100&text=${item}`} />
                        <AvatarFallback>{["SJ", "MC", "PS", "JW", "ER", "MT", "SL"][item - 1]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {
                            [
                              "Sarah Johnson",
                              "Michael Chen",
                              "Priya Sharma",
                              "James Wilson",
                              "Elena Rodriguez",
                              "Michael Thompson",
                              "Sophia Lee",
                            ][item - 1]
                          }
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {
                            [
                              "Tech Talks Weekly",
                              "Digital Frontiers",
                              "Innovation Today",
                              "Creative Corner",
                              "Science Simplified",
                              "Education Matters",
                              "Entertainment Weekly",
                            ][item - 1]
                          }
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {["12", "8", "15", "6", "20", "10", "9"][item - 1]} episodes
                      </div>
                      <Button variant="outline" size="sm">
                        Unfollow
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
