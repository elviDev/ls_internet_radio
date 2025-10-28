"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Clock, Calendar, User, Play, Download, Share2, ArrowLeft } from "lucide-react"
import Link from "next/link"

type Program = {
  id: string
  title: string
  slug: string
  description: string
  category: string
  schedule: string
  image?: string
  status: string
  host: {
    firstName: string
    lastName: string
    bio?: string
    profileImage?: string
  }
  genre?: {
    name: string
    description?: string
  }
  episodes: Array<{
    id: string
    title: string
    description?: string
    audioFile?: string
    duration?: number
    airDate: string
  }>
  _count: {
    episodes: number
  }
}

export default function ProgramDetailPage() {
  const params = useParams()
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.slug) {
      fetchProgram()
    }
  }, [params.slug])

  const fetchProgram = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/programs/${params.slug}`)
      if (response.ok) {
        const data = await response.json()
        setProgram(data)
      }
    } catch (error) {
      console.error("Failed to fetch program:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-muted rounded mb-6"></div>
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Program not found</h1>
        <p className="text-muted-foreground mb-6">The program you're looking for doesn't exist.</p>
        <Link href="/programs">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Programs
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Back Button */}
      <Link href="/programs" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Programs
      </Link>

      {/* Program Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
          <div className="relative h-64 md:h-80 rounded-lg overflow-hidden mb-6">
            <Image
              src={program.image || "/placeholder.svg?height=400&width=800&text=Program+Image"}
              alt={program.title}
              fill
              className="object-cover"
            />
            <div className="absolute top-4 left-4">
              <Badge className="bg-brand-600 hover:bg-brand-700">
                {formatCategory(program.category)}
              </Badge>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-4">{program.title}</h1>
          <p className="text-lg text-muted-foreground mb-6">{program.description}</p>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{program.schedule}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{program._count.episodes} episodes</span>
            </div>
            {program.genre && (
              <div className="flex items-center gap-2">
                <span className="text-sm">Genre: {program.genre.name}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Listen Live
            </Button>
            <Button variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Host Info */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Host
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
                  <Image
                    src={program.host.profileImage || "/placeholder.svg?height=64&width=64&text=Host"}
                    alt={`${program.host.firstName} ${program.host.lastName}`}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {program.host.firstName} {program.host.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">Program Host</p>
                </div>
              </div>
              {program.host.bio && (
                <p className="text-sm text-muted-foreground">{program.host.bio}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="mb-12" />

      {/* Recent Episodes */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Recent Episodes</h2>
        {program.episodes.length > 0 ? (
          <div className="grid gap-4">
            {program.episodes.map((episode) => (
              <Card key={episode.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{episode.title}</h3>
                      {episode.description && (
                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {episode.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(episode.airDate).toLocaleDateString()}
                        </div>
                        {episode.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDuration(episode.duration)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {episode.audioFile && (
                        <>
                          <Button size="sm">
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No episodes yet</h3>
              <p className="text-muted-foreground text-center">
                Episodes will appear here once they're available.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}