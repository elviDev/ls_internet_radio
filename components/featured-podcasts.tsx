import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Play } from "lucide-react"

const podcasts = [
  {
    id: 1,
    title: "Tech Talks Weekly",
    host: "Sarah Johnson",
    image: "/placeholder.svg?height=400&width=400",
    duration: "45 min",
    category: "Technology",
  },
  {
    id: 2,
    title: "Mindful Moments",
    host: "David Chen",
    image: "/placeholder.svg?height=400&width=400",
    duration: "32 min",
    category: "Wellness",
  },
  {
    id: 3,
    title: "Business Insights",
    host: "Maya Patel",
    image: "/placeholder.svg?height=400&width=400",
    duration: "58 min",
    category: "Business",
  },
  {
    id: 4,
    title: "Creative Corner",
    host: "James Wilson",
    image: "/placeholder.svg?height=400&width=400",
    duration: "41 min",
    category: "Arts",
  },
]

export default function FeaturedPodcasts() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {podcasts.map((podcast) => (
        <Link href={`/podcasts/${podcast.id}`} key={podcast.id}>
          <Card className="overflow-hidden transition-all hover:shadow-md">
            <div className="relative aspect-square">
              <Image src={podcast.image || "/placeholder.svg"} alt={podcast.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="rounded-full bg-white p-3">
                  <Play className="h-8 w-8 text-brand-700 fill-current" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="text-xs font-medium text-brand-600 mb-1">{podcast.category}</div>
              <h3 className="font-semibold text-lg mb-1 line-clamp-1">{podcast.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">with {podcast.host}</p>
              <div className="text-xs text-muted-foreground">{podcast.duration}</div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
