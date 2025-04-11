"use client"

import type React from "react"

import { useState } from "react"
import { PodcastCard } from "./podcast-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Search } from "lucide-react"
import { podcastGenres } from "@/lib/podcast-api"
import { fetchPodcastSearch } from "@/app/podcasts/actions"
import { useToast } from "@/hooks/use-toast"

interface Podcast {
  collectionId: string
  collectionName: string
  artistName: string
  artworkUrl100: string
  primaryGenreName?: string
  trackExplicitness?: string
}

interface PodcastListProps {
  initialPodcasts: Podcast[]
  title?: string
  showSearch?: boolean
  showFilters?: boolean
}

export function PodcastList({
  initialPodcasts,
  title = "Podcasts",
  showSearch = true,
  showFilters = true,
}: PodcastListProps) {
  const [podcasts, setPodcasts] = useState<Podcast[]>(initialPodcasts)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")
  const { toast } = useToast()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setIsSearching(true)
    try {
      const result = await fetchPodcastSearch(searchTerm)
      if (result.success) {
        setPodcasts(result.data)
      } else {
        toast({
          title: "Search failed",
          description: "Failed to search podcasts. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const filteredPodcasts = podcasts
    .filter((podcast) => {
      if (selectedGenre === "all") return true
      return podcast.primaryGenreName === selectedGenre
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.collectionName.localeCompare(b.collectionName)
      } else if (sortBy === "artist") {
        return a.artistName.localeCompare(b.artistName)
      }
      return 0
    })

  return (
    <div className="space-y-6">
      {title && <h2 className="text-2xl font-bold">{title}</h2>}

      {showSearch && (
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search podcasts..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </form>

          {showFilters && (
            <div className="flex gap-2">
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {Object.entries(podcastGenres).map(([name, id]) => (
                    <SelectItem key={id} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="artist">Artist</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filter</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {filteredPodcasts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No podcasts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPodcasts.map((podcast) => (
            <PodcastCard
              key={podcast.collectionId}
              id={podcast.collectionId.toString()}
              title={podcast.collectionName}
              artist={podcast.artistName}
              image={podcast.artworkUrl100.replace("100x100", "600x600")}
              category={podcast.primaryGenreName}
              explicit={podcast.trackExplicitness === "explicit"}
            />
          ))}
        </div>
      )}
    </div>
  )
}
