import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Play, Clock, Calendar, Filter, Search, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const archives = [
  {
    id: 1,
    title: "Tech Talks Weekly: The Future of AI",
    host: "Sarah Johnson",
    image: "/placeholder.svg?height=400&width=400&text=Tech+Talks",
    duration: "45 min",
    date: "Oct 10, 2023",
    category: "Technology",
    description:
      "Exploring the latest trends and innovations in technology with industry experts.",
    type: "podcast",
  },
  {
    id: 2,
    title: "Morning Vibes with Alex: Celebrity Interview Special",
    host: "Alex Rivera",
    image: "/placeholder.svg?height=400&width=400&text=Morning+Vibes",
    duration: "120 min",
    date: "Oct 8, 2023",
    category: "Talk Show",
    description:
      "A special episode featuring interviews with top celebrities and entertainment news.",
    type: "broadcast",
  },
  {
    id: 3,
    title: "Business Insights: Market Trends Q4 2023",
    host: "Maya Patel",
    image: "/placeholder.svg?height=400&width=400&text=Business+Insights",
    duration: "58 min",
    date: "Oct 5, 2023",
    category: "Business",
    description:
      "Interviews with successful entrepreneurs and business strategies for growth.",
    type: "podcast",
  },
  {
    id: 4,
    title: "The Silent Echo - Chapter 1",
    host: "Elena Rodriguez (Narrator)",
    image: "/placeholder.svg?height=400&width=400&text=Silent+Echo",
    duration: "41 min",
    date: "Oct 3, 2023",
    category: "Audiobook",
    description:
      "The first chapter of the bestselling thriller by J.R. Morgan.",
    type: "audiobook",
  },
  {
    id: 5,
    title: "Science Simplified: Quantum Physics",
    host: "Elena Rodriguez",
    image: "/placeholder.svg?height=400&width=400&text=Science+Simplified",
    duration: "37 min",
    date: "Sep 29, 2023",
    category: "Science",
    description:
      "Breaking down complex scientific concepts into understandable explanations.",
    type: "podcast",
  },
  {
    id: 6,
    title: "Weekend Brunch: Summer Festival Special",
    host: "Chris & Pat",
    image: "/placeholder.svg?height=400&width=400&text=Weekend+Brunch",
    duration: "90 min",
    date: "Sep 25, 2023",
    category: "Entertainment",
    description:
      "Coverage of the summer music festival with live interviews and performances.",
    type: "broadcast",
  },
  {
    id: 7,
    title: "Evening Discussions: Climate Change Solutions",
    host: "Jordan Taylor",
    image: "/placeholder.svg?height=400&width=400&text=Evening+Discussions",
    duration: "62 min",
    date: "Sep 22, 2023",
    category: "Interview",
    description:
      "A panel discussion with environmental experts on practical climate solutions.",
    type: "podcast",
  },
  {
    id: 8,
    title: "The Art of Mindfulness - Complete Series",
    host: "David Chen",
    image: "/placeholder.svg?height=400&width=400&text=Mindfulness",
    duration: "6 hours total",
    date: "Sep 18, 2023",
    category: "Audiobook",
    description:
      "A comprehensive guide to mindfulness practices for everyday life.",
    type: "audiobook",
  },
  {
    id: 9,
    title: "Sports Central: Championship Analysis",
    host: "Carlos Mendez",
    image: "/placeholder.svg?height=400&width=400&text=Sports+Central",
    duration: "63 min",
    date: "Sep 15, 2023",
    category: "Sports",
    description:
      "Analysis and discussions about the championship games with athlete interviews.",
    type: "broadcast",
  },
  {
    id: 10,
    title: "Creative Corner: The Art of Storytelling",
    host: "James Wilson",
    image: "/placeholder.svg?height=400&width=400&text=Creative+Corner",
    duration: "48 min",
    date: "Sep 12, 2023",
    category: "Arts",
    description:
      "Conversations with authors and writers about their creative process.",
    type: "podcast",
  },
  {
    id: 11,
    title: "History Uncovered: Ancient Civilizations",
    host: "Sophia Lee",
    image: "/placeholder.svg?height=400&width=400&text=History+Uncovered",
    duration: "55 min",
    date: "Sep 8, 2023",
    category: "Education",
    description:
      "Exploring the mysteries and achievements of ancient civilizations.",
    type: "podcast",
  },
  {
    id: 12,
    title: "The Mystery of Blackwood Manor",
    host: "Full Cast Production",
    image: "/placeholder.svg?height=400&width=400&text=Blackwood+Manor",
    duration: "4 hours total",
    date: "Sep 5, 2023",
    category: "Audiobook",
    description:
      "A thrilling mystery set in a haunted manor with a full cast audio production.",
    type: "audiobook",
  },
];

export default function ArchivesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Audio Archives</h1>
        <p className="text-xl text-muted-foreground">
          Access our complete library of past broadcasts, podcasts, and
          audiobooks.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search archives..."
              className="pl-10 pr-4 py-2 w-full"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
          <Select defaultValue="date">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date (Newest)</SelectItem>
              <SelectItem value="title">Title (A-Z)</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
              <SelectItem value="popularity">Popularity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-12">
        <TabsList className="flex flex-wrap h-auto p-1 mb-8">
          <TabsTrigger value="all" className="mb-1">
            All
          </TabsTrigger>
          <TabsTrigger value="podcasts" className="mb-1">
            Podcasts
          </TabsTrigger>
          <TabsTrigger value="broadcasts" className="mb-1">
            Past Broadcasts
          </TabsTrigger>
          <TabsTrigger value="audiobooks" className="mb-1">
            Audiobooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {archives.map((item) => (
              <Link href={`/archives/${item.id}`} key={item.id}>
                <Card className="overflow-hidden transition-all hover:shadow-md h-full">
                  <div className="relative aspect-square">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="rounded-full bg-white p-3">
                        <Play className="h-8 w-8 text-brand-700 fill-current" />
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 bg-brand-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                      {item.type === "podcast"
                        ? "Podcast"
                        : item.type === "broadcast"
                        ? "Broadcast"
                        : "Audiobook"}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="text-xs font-medium text-brand-600 dark:text-brand-400 mb-1">
                      {item.category}
                    </div>
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      with {item.host}
                    </p>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {item.duration}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {item.date}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="podcasts" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {archives
              .filter((item) => item.type === "podcast")
              .map((item) => (
                <Link href={`/archives/${item.id}`} key={item.id}>
                  <Card className="overflow-hidden transition-all hover:shadow-md h-full">
                    <div className="relative aspect-square">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="rounded-full bg-white p-3">
                          <Play className="h-8 w-8 text-brand-700 fill-current" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="text-xs font-medium text-brand-600 dark:text-brand-400 mb-1">
                        {item.category}
                      </div>
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        with {item.host}
                      </p>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {item.duration}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {item.date}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="broadcasts" className="mt-0">
          <div className="space-y-4">
            {archives
              .filter((item) => item.type === "broadcast")
              .map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row h-full">
                    <div className="relative w-full md:w-1/4 aspect-video md:aspect-square">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="p-6 w-full md:w-3/4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                        <div>
                          <Badge className="mb-2 bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200">
                            {item.category}
                          </Badge>
                          <h3 className="text-xl font-semibold mb-1">
                            {item.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            with {item.host}
                          </p>
                        </div>
                        <div className="flex items-center mt-4 md:mt-0">
                          <div className="text-sm text-muted-foreground mr-4">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            {item.date}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 inline mr-1" />
                            {item.duration}
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-6">
                        {item.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button className="bg-brand-600 hover:bg-brand-700">
                          <Play className="h-4 w-4 mr-2" /> Play
                        </Button>
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" /> Download
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="audiobooks" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {archives
              .filter((item) => item.type === "audiobook")
              .map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="flex h-full">
                    <div className="relative w-1/3">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="p-6 w-2/3">
                      <div className="text-xs font-medium text-brand-600 dark:text-brand-400 mb-1">
                        {item.category}
                      </div>
                      <h3 className="font-semibold text-lg mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Narrated by {item.host}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {item.duration}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {item.date}
                        </div>
                      </div>
                      <Button className="w-full bg-brand-600 hover:bg-brand-700">
                        <Play className="h-4 w-4 mr-2" /> Listen Now
                      </Button>
                    </CardContent>
                  </div>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm">
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-brand-600 text-white hover:bg-brand-700"
        >
          1
        </Button>
        <Button variant="outline" size="sm">
          2
        </Button>
        <Button variant="outline" size="sm">
          3
        </Button>
        <Button variant="outline" size="sm">
          4
        </Button>
        <Button variant="outline" size="sm">
          Next
        </Button>
      </div>
    </div>
  );
}
