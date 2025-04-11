"use client"

import type React from "react"

import { useState } from "react"
import { AudiobookCard } from "./audiobook-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Search } from "lucide-react"
import { audiobookCategories } from "@/lib/audiobook-api"
import { fetchAudiobookSearch } from "@/app/audiobooks/actions"
import { useToast } from "@/hooks/use-toast"

interface Audiobook {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
    categories?: string[]
    averageRating?: number
  }
}

interface AudiobookListProps {
  initialAudiobooks: Audiobook[]
  title?: string
  showSearch?: boolean
  showFilters?: boolean
}

export function AudiobookList({
  initialAudiobooks,
  title = "Audiobooks",
  showSearch = true,
  showFilters = true,
}: AudiobookListProps) {
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>(initialAudiobooks)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("title")
  const { toast } = useToast()

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
      if (selectedCategory === "all") return true
      const categories = audiobook.volumeInfo.categories || []
      return categories.some((category) => category.toLowerCase().includes(selectedCategory.toLowerCase()))
    })
    .sort((a, b) => {
      if (sortBy === "title") {
        return (a.volumeInfo.title || "").localeCompare(b.volumeInfo.title || "")
      } else if (sortBy === "author") {
        const authorA = a.volumeInfo.authors?.[0] || ""
        const authorB = b.volumeInfo.authors?.[0] || ""
        return authorA.localeCompare(authorB)
      } else if (sortBy === "rating") {
        const ratingA = a.volumeInfo.averageRating || 0
        const ratingB = b.volumeInfo.averageRating || 0
        return ratingB - ratingA // Higher ratings first
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
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(audiobookCategories).map(([name, id]) => (
                    <SelectItem key={id} value={id}>
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
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
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

      {filteredAudiobooks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No audiobooks found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredAudiobooks.map((audiobook) => (
            <AudiobookCard
              key={audiobook.id}
              id={audiobook.id}
              title={audiobook.volumeInfo.title || "Unknown Title"}
              author={audiobook.volumeInfo.authors?.[0] || "Unknown Author"}
              image={
                audiobook.volumeInfo.imageLinks?.thumbnail ||
                audiobook.volumeInfo.imageLinks?.smallThumbnail ||
                "/placeholder.svg?height=600&width=400"
              }
              category={audiobook.volumeInfo.categories?.[0]}
              rating={audiobook.volumeInfo.averageRating}
            />
          ))}
        </div>
      )}
    </div>
  )
}
