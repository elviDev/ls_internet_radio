import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calendar, User } from "lucide-react";

const programs = [
  {
    id: 1,
    title: "Morning Vibes",
    host: "Alex Rivera",
    schedule: "Weekdays, 7AM - 10AM",
    image: "/placeholder.svg?height=300&width=600&text=Morning+Vibes",
    category: "Talk Show",
    description:
      "Start your day with uplifting conversations, news updates, and the perfect music mix to energize your morning.",
    episodes: 124,
  },
  {
    id: 2,
    title: "Tech Talk",
    host: "Sarah Johnson",
    schedule: "Weekdays, 9AM - 11AM",
    image: "/placeholder.svg?height=300&width=600&text=Tech+Talk",
    category: "Technology",
    description:
      "Dive into the latest tech trends, gadget reviews, and interviews with industry leaders shaping our digital future.",
    episodes: 87,
  },
  {
    id: 3,
    title: "Lunch Beats",
    host: "DJ Marcus",
    schedule: "Weekdays, 11AM - 1PM",
    image: "/placeholder.svg?height=300&width=600&text=Lunch+Beats",
    category: "Music",
    description:
      "The perfect midday music mix to keep you energized through your lunch break with the hottest tracks and throwbacks.",
    episodes: 156,
  },
  {
    id: 4,
    title: "Afternoon Acoustics",
    host: "Mia Chen",
    schedule: "Weekdays, 2PM - 4PM",
    image: "/placeholder.svg?height=300&width=600&text=Afternoon+Acoustics",
    category: "Music",
    description:
      "Unwind with soothing acoustic performances, artist interviews, and behind-the-scenes stories from the music world.",
    episodes: 92,
  },
  {
    id: 5,
    title: "Business Hour",
    host: "James Wilson",
    schedule: "Weekdays, 3PM - 5PM",
    image: "/placeholder.svg?height=300&width=600&text=Business+Hour",
    category: "Business",
    description:
      "Expert analysis on market trends, business strategies, and interviews with entrepreneurs and industry leaders.",
    episodes: 78,
  },
  {
    id: 6,
    title: "Evening Discussions",
    host: "Jordan Taylor",
    schedule: "Mon, Wed, Fri, 7PM - 9PM",
    image: "/placeholder.svg?height=300&width=600&text=Evening+Discussions",
    category: "Interview",
    description:
      "Thought-provoking conversations with authors, experts, and changemakers on topics that matter in today's world.",
    episodes: 64,
  },
  {
    id: 7,
    title: "Night Waves",
    host: "DJ Luna",
    schedule: "Weekdays, 9PM - 12AM",
    image: "/placeholder.svg?height=300&width=600&text=Night+Waves",
    category: "Music",
    description:
      "Wind down your day with smooth beats, ambient sounds, and the perfect soundtrack for your evening relaxation.",
    episodes: 112,
  },
  {
    id: 8,
    title: "Weekend Brunch",
    host: "Chris & Pat",
    schedule: "Weekends, 10AM - 12PM",
    image: "/placeholder.svg?height=300&width=600&text=Weekend+Brunch",
    category: "Talk Show",
    description:
      "Start your weekend right with fun conversations, celebrity interviews, and the latest in entertainment news.",
    episodes: 48,
  },
  {
    id: 9,
    title: "Sports Central",
    host: "Mike Thompson",
    schedule: "Weekends, 12PM - 3PM",
    image: "/placeholder.svg?height=300&width=600&text=Sports+Central",
    category: "Sports",
    description:
      "Complete coverage of the week's biggest games, athlete interviews, and expert analysis of all your favorite sports.",
    episodes: 52,
  },
];

const categories = [
  "All",
  "Talk Show",
  "Music",
  "Technology",
  "Business",
  "Interview",
  "Sports",
];

export default function ProgramsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Our Programs</h1>
        <p className="text-xl text-muted-foreground">
          Discover our diverse lineup of shows covering everything from music
          and technology to business and culture.
        </p>
      </div>

      <Tabs defaultValue="all" className="mb-12">
        <TabsList className="flex flex-wrap h-auto p-1 mb-8">
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={category === "All" ? "all" : category.toLowerCase()}
              className="mb-1"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent
            key={category}
            value={category === "All" ? "all" : category.toLowerCase()}
            className="mt-0"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs
                .filter(
                  (program) =>
                    category === "All" || program.category === category
                )
                .map((program) => (
                  <Link href={`/programs/${program.id}`} key={program.id}>
                    <Card className="overflow-hidden hover:shadow-md transition-all h-full">
                      <div className="relative h-48">
                        <Image
                          src={program.image || "/placeholder.svg"}
                          alt={program.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-brand-600 hover:bg-brand-700">
                            {program.category}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-semibold text-lg mb-1">
                          {program.title}
                        </h3>
                        <div className="flex items-center mb-3 text-sm text-muted-foreground">
                          <User className="h-3 w-3 mr-1" />
                          <span>{program.host}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {program.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-auto">
                          <div className="text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200 px-3 py-1 rounded-full inline-flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {program.schedule}
                          </div>
                          <div className="text-xs font-medium bg-muted text-muted-foreground px-3 py-1 rounded-full inline-flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {program.episodes} episodes
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
    </div>
  );
}
