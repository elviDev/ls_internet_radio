"use client"

import { useState, useEffect } from "react"
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calendar, User, Loader2 } from "lucide-react";

type Program = {
  id: string
  title: string
  slug: string
  host: string
  schedule: string
  image: string
  category: string
  description: string
  episodes: number
  genre?: string
  status: string
  createdAt: string
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState("all")

  useEffect(() => {
    fetchCategories()
    fetchPrograms()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/programs/categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Fallback to default categories
      setCategories([
        "All",
        "Talk Show", 
        "Music",
        "Technology",
        "Business",
        "Interview",
        "Sports",
        "News",
        "Entertainment",
        "Education"
      ])
    }
  }

  // Map display category to backend format
  const mapCategoryToBackend = (category: string): string => {
    if (category === "all") return "all"
    
    const categoryMap: { [key: string]: string } = {
      "talk show": "TALK_SHOW",
      "music": "MUSIC",
      "technology": "TECHNOLOGY", 
      "business": "BUSINESS",
      "interview": "INTERVIEW",
      "sports": "SPORTS",
      "news": "NEWS",
      "entertainment": "ENTERTAINMENT",
      "education": "EDUCATION"
    }
    
    return categoryMap[category.toLowerCase()] || category.toUpperCase()
  }

  const fetchPrograms = async (category?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (category && category !== "all") {
        const backendCategory = mapCategoryToBackend(category)
        params.append('category', backendCategory)
      }
      
      const response = await fetch(`/api/programs?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch programs')
      
      const data = await response.json()
      setPrograms(data.programs || [])
      setError(null)
    } catch (error) {
      console.error('Error fetching programs:', error)
      setError('Failed to load programs. Please try again later.')
      setPrograms([])
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    fetchPrograms(category)
  }


  if (loading && programs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading programs...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && programs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Our Programs</h1>
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => fetchPrograms()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Our Programs</h1>
        <p className="text-xl text-muted-foreground">
          Discover our diverse lineup of shows covering everything from music
          and technology to business and culture.
        </p>
      </div>

      <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="mb-12">
        <TabsList className="flex flex-wrap h-auto p-1 mb-8">
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={category === "All" ? "all" : category.toLowerCase()}
              className="mb-1"
              disabled={loading}
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading programs...</span>
              </div>
            ) : programs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No programs found in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {programs.map((program) => (
                  <Link href={`/programs/${program.slug}`} key={program.id}>
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
                          <span>{program.host?.name || 'No host assigned'}</span>
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
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
