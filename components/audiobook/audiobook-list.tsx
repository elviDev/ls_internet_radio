"use client"

import React from "react"

import { useState } from "react"
import { AudiobookCard } from "./audiobook-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Search } from "lucide-react"
import { fetchAudiobookSearch, getFavoriteAudiobooks } from "@/app/audiobooks/actions"
import { useToast } from "@/hooks/use-toast"


interface Audiobook {
  id: string
  title: string
  author: string
  narrator?: string
  coverImage: string
  genre?: string
  description?: string
  chapterCount?: number
  totalDuration?: number
}

interface Genre {
  id: string
  name: string
  slug: string
}

interface AudiobookListProps {
  initialAudiobooks: Audiobook[]
  title?: string
  showSearch?: boolean
  showFilters?: boolean
  showFavoritesOnly?: boolean
  availableGenres?: Genre[]
}

export function AudiobookList({
  initialAudiobooks,
  title = "Audiobooks",
  showSearch = true,
  showFilters = true,
  showFavoritesOnly = false,
  availableGenres = [],
}: AudiobookListProps) {
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>(initialAudiobooks)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("title")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Load favorites if showFavoritesOnly is true
  React.useEffect(() => {
    if (showFavoritesOnly) {
      loadFavorites()
    }
  }, [showFavoritesOnly])

  const loadFavorites = async () => {
    setIsLoading(true)
    try {
      const result = await getFavoriteAudiobooks()
      if (result.success) {
        setAudiobooks(result.data)
      } else {
        if (result.authRequired) {
          toast({
            title: "Please sign in",
            description: "Sign in to view your favorite audiobooks",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to load favorites",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setIsSearching(true)
    try {
      const result = await fetchAudiobookSearch(searchTerm)
      if (result.success) {
        setAudiobooks(result.data)
      } else {
        toast({
          title: "Search failed",
          description: "Failed to search audiobooks. Please try again.",
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

  const filteredAudiobooks = audiobooks
    .filter((audiobook) => {
      if (selectedGenre === "all") return true
      return audiobook.genre === selectedGenre
    })
    .sort((a, b) => {
      if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "")
      } else if (sortBy === "author") {
        return (a.author || "").localeCompare(b.author || "")
      } else if (sortBy === "duration") {
        const durationA = a.totalDuration || 0
        const durationB = b.totalDuration || 0
        return durationB - durationA // Longer duration first
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
                placeholder="Search audiobooks..."
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
                  {availableGenres.map((genre) => (
                    <SelectItem key={genre.id} value={genre.name}>
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
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

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <p className="text-muted-foreground mt-2">Loading audiobooks...</p>
        </div>
      ) : filteredAudiobooks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {showFavoritesOnly ? "No favorite audiobooks yet" : "No audiobooks found"}
          </p>
          {showFavoritesOnly && (
            <p className="text-sm text-muted-foreground mt-2">
              Start exploring audiobooks and add some to your favorites!
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredAudiobooks.map((audiobook) => (
            <AudiobookCard
              key={audiobook.id}
              id={audiobook.id}
              title={audiobook.title}
              author={audiobook.author}
              narrator={audiobook.narrator}
              image={audiobook.coverImage}
              category={audiobook.genre}
              chapterCount={audiobook.chapterCount}
              duration={audiobook.totalDuration}
            />
          ))}
        </div>
      )}
    </div>
  )
}
