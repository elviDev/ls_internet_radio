"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AudiobookPlayer } from "@/components/audiobook/audiobook-player"
import { ChapterList } from "@/components/audiobook/chapter-list"
import {
  fetchAudiobookDetails,
  toggleFavoriteAudiobook,
  checkIsFavorite,
  getAudiobookProgress,
} from "@/app/audiobooks/actions"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { generateSampleChapters, getSampleAudioUrl } from "@/lib/audiobook-api"
import { Badge } from "@/components/ui/badge"
import { Star, Clock, Calendar, User, BookOpen } from "lucide-react"

export default function AudiobookDetailPage({ params }: { params: { id: string } }) {
  const [audiobookData, setAudiobookData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [chapters, setChapters] = useState<any[]>([])
  const [progress, setProgress] = useState<{ position: number; chapter: number }>({ position: 0, chapter: 0 })
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch audiobook details
        const result = await fetchAudiobookDetails(params.id)

        if (result.success) {
          setAudiobookData(result.data)

          // Generate sample chapters since the API doesn't provide them
          const sampleChapters = generateSampleChapters(result.data.volumeInfo.title, result.data.volumeInfo.pageCount)
          setChapters(sampleChapters)
        } else {
          setError(result.error || "Failed to load audiobook")
        }

        // Check if this audiobook is in favorites
        const favoriteResult = await checkIsFavorite(params.id)
        if (favoriteResult.success) {
          setIsFavorite(favoriteResult.isFavorite)
        }

        // Get saved progress
        const progressResult = await getAudiobookProgress(params.id)
        if (progressResult.success) {
          setProgress(progressResult.data)
          setCurrentChapter(progressResult.data.chapter)
        }
      } catch (err) {
        setError("An unexpected error occurred")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const handlePlayChapter = (chapter: any) => {
    setCurrentChapter(chapters.findIndex((c) => c.id === chapter.id))
  }

  const handleChapterChange = (chapterIndex: number) => {
    setCurrentChapter(chapterIndex)
  }

  const handleFavoriteToggle = async () => {
    if (!audiobookData?.volumeInfo) return

    try {
      const result = await toggleFavoriteAudiobook({
        id: params.id,
        title: audiobookData.volumeInfo.title,
        image: audiobookData.volumeInfo.imageLinks?.thumbnail || "/placeholder.svg?height=600&width=400",
        author: audiobookData.volumeInfo.authors?.[0] || "Unknown Author",
      })

      if (result.success) {
        setIsFavorite(result.isFavorite)
        toast({
          title: result.isFavorite ? "Added to favorites" : "Removed from favorites",
          description: result.isFavorite
            ? `${audiobookData.volumeInfo.title} has been added to your favorites`
            : `${audiobookData.volumeInfo.title} has been removed from your favorites`,
          duration: 3000,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  // Generate rating stars
  const renderRating = (rating: number) => {
    if (!rating) return null

    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 text-yellow-400" />)
    }

    const emptyStars = 5 - stars.length
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />)
    }

    return (
      <div className="flex items-center gap-0.5">
        {stars}
        <span className="ml-1 text-sm">{rating.toFixed(1)}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex gap-8 mb-8">
              <Skeleton className="w-48 h-72" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
            <Skeleton className="w-full h-[200px] rounded-xl mb-8" />
            <Skeleton className="w-full h-[300px] rounded-xl" />
          </div>
          <div>
            <Skeleton className="w-full h-[200px] rounded-xl mb-8" />
            <Skeleton className="w-full h-[150px] rounded-xl mb-8" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-6 rounded-xl">
          <h2 className="text-2xl font-bold mb-2">Error Loading Audiobook</h2>
          <p className="mb-4">{error}</p>
          <Button asChild>
            <Link href="/audiobooks">Back to Audiobooks</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!audiobookData || !audiobookData.volumeInfo) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 p-6 rounded-xl">
          <h2 className="text-2xl font-bold mb-2">Audiobook Not Found</h2>
          <p className="mb-4">The audiobook you're looking for could not be found.</p>
          <Button asChild>
            <Link href="/audiobooks">Browse Audiobooks</Link>
          </Button>
        </div>
      </div>
    )
  }

  const { volumeInfo } = audiobookData
  const audioUrl = getSampleAudioUrl(params.id, currentChapter + 1)

  // Get related audiobooks (in a real app, this would come from an API)
  const relatedAudiobooks = [
    {
      id: "1",
      title: "The Silent Echo",
      author: "J.R. Morgan",
      image: "/placeholder.svg?height=400&width=300",
      category: "Mystery",
    },
    {
      id: "2",
      title: "Beyond the Horizon",
      author: "Elena Rodriguez",
      image: "/placeholder.svg?height=400&width=300",
      category: "Science Fiction",
    },
    {
      id: "3",
      title: "Whispers in the Dark",
      author: "Michael Chen",
      image: "/placeholder.svg?height=400&width=300",
      category: "Thriller",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="relative w-48 h-72 flex-shrink-0 mx-auto md:mx-0">
              <Image
                src={volumeInfo.imageLinks?.thumbnail || "/placeholder.svg?height=600&width=400"}
                alt={volumeInfo.title}
                fill
                className="object-cover rounded-lg shadow-md"
              />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                {volumeInfo.categories?.map((category: string, index: number) => (
                  <Badge key={index} className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                    {category}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl font-bold mb-2">{volumeInfo.title}</h1>
              <p className="text-lg text-muted-foreground mb-2">
                by {volumeInfo.authors?.join(", ") || "Unknown Author"}
              </p>

              {volumeInfo.averageRating && (
                <div className="mb-4">
                  {renderRating(volumeInfo.averageRating)}
                  <span className="text-sm text-muted-foreground ml-2">({volumeInfo.ratingsCount || 0} ratings)</span>
                </div>
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-4">
                {volumeInfo.publishedDate && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Published: {volumeInfo.publishedDate}</span>
                  </div>
                )}
                {volumeInfo.pageCount && (
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    <span>{volumeInfo.pageCount} pages</span>
                  </div>
                )}
                {volumeInfo.publisher && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    <span>Publisher: {volumeInfo.publisher}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>
                    {chapters.reduce((total, chapter) => total + chapter.duration, 0) / 60} minutes ({chapters.length}{" "}
                    chapters)
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm line-clamp-4">{volumeInfo.description}</p>
                <Button variant="link" className="p-0 h-auto text-sm">
                  Read more
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => handlePlayChapter(chapters[0])}>
                  Start Listening
                </Button>
                <Button variant="outline" onClick={handleFavoriteToggle}>
                  {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                </Button>
              </div>
            </div>
          </div>

          <div id="audiobook-player" className="mb-8">
            <AudiobookPlayer
              title={volumeInfo.title}
              author={volumeInfo.authors?.[0] || "Unknown Author"}
              audioUrl={audioUrl}
              image={volumeInfo.imageLinks?.thumbnail}
              onFavoriteToggle={handleFavoriteToggle}
              isFavorite={isFavorite}
              chapters={chapters}
              currentChapter={currentChapter}
              onChapterChange={handleChapterChange}
              audiobookId={params.id}
              initialPosition={progress.position}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <Tabs defaultValue="chapters">
              <TabsList className="mb-6">
                <TabsTrigger value="chapters">Chapters</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="chapters">
                <ChapterList chapters={chapters} onPlay={handlePlayChapter} currentChapter={currentChapter} />
              </TabsContent>

              <TabsContent value="details">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <div
                      className="text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: volumeInfo.description || "No description available." }}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Book Information</h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                      {volumeInfo.publisher && (
                        <>
                          <dt className="font-medium">Publisher</dt>
                          <dd className="text-muted-foreground">{volumeInfo.publisher}</dd>
                        </>
                      )}
                      {volumeInfo.publishedDate && (
                        <>
                          <dt className="font-medium">Publication Date</dt>
                          <dd className="text-muted-foreground">{volumeInfo.publishedDate}</dd>
                        </>
                      )}
                      {volumeInfo.language && (
                        <>
                          <dt className="font-medium">Language</dt>
                          <dd className="text-muted-foreground">
                            {volumeInfo.language === "en" ? "English" : volumeInfo.language}
                          </dd>
                        </>
                      )}
                      {volumeInfo.pageCount && (
                        <>
                          <dt className="font-medium">Page Count</dt>
                          <dd className="text-muted-foreground">{volumeInfo.pageCount}</dd>
                        </>
                      )}
                      {volumeInfo.printType && (
                        <>
                          <dt className="font-medium">Print Type</dt>
                          <dd className="text-muted-foreground">{volumeInfo.printType}</dd>
                        </>
                      )}
                      {volumeInfo.categories && volumeInfo.categories.length > 0 && (
                        <>
                          <dt className="font-medium">Categories</dt>
                          <dd className="text-muted-foreground">{volumeInfo.categories.join(", ")}</dd>
                        </>
                      )}
                      {volumeInfo.industryIdentifiers && (
                        <>
                          <dt className="font-medium">ISBN</dt>
                          <dd className="text-muted-foreground">
                            {volumeInfo.industryIdentifiers.map((id: any) => `${id.type}: ${id.identifier}`).join(", ")}
                          </dd>
                        </>
                      )}
                    </dl>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Reader Reviews</h3>
                      <p className="text-muted-foreground">
                        {volumeInfo.ratingsCount || 0} reviews, {volumeInfo.averageRating || 0} average
                      </p>
                    </div>
                    <Button>Write a Review</Button>
                  </div>

                  {/* Sample reviews */}
                  <div className="space-y-6">
                    <div className="border-b pb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">Sarah Johnson</p>
                            <div className="flex items-center">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${
                                      star <= 5 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground ml-2">2 months ago</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground">
                        This audiobook kept me engaged from start to finish. The narrator did an excellent job bringing
                        the characters to life. Highly recommended for anyone who enjoys this genre!
                      </p>
                    </div>

                    <div className="border-b pb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">Michael Chen</p>
                            <div className="flex items-center">
                              <div className="flex">
                                {[1, 2, 3, 4].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${
                                      star <= 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                                <Star className="h-3 w-3 text-gray-300" />
                              </div>
                              <span className="text-xs text-muted-foreground ml-2">3 months ago</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground">
                        The story was compelling, but I found some parts to be a bit slow. The narration was excellent
                        though, which made up for the pacing issues.
                      </p>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    Load More Reviews
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="space-y-8">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Similar Audiobooks</h2>
              <div className="space-y-4">
                {relatedAudiobooks.map((related) => (
                  <Link href={`/audiobooks/${related.id}`} key={related.id} className="block">
                    <div className="flex items-center gap-3 group">
                      <div className="relative w-16 h-24 rounded-md overflow-hidden flex-shrink-0">
                        <Image
                          src={related.image || "/placeholder.svg"}
                          alt={related.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-purple-600 transition-colors">{related.title}</p>
                        <p className="text-sm text-muted-foreground">by {related.author}</p>
                        <Badge className="mt-1 text-xs bg-purple-100 text-purple-800 hover:bg-purple-200">
                          {related.category}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">About the Author</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                  <User className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">{volumeInfo.authors?.[0] || "Unknown Author"}</p>
                  <p className="text-sm text-muted-foreground">Author</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                {volumeInfo.authors?.[0] || "The author"} has written multiple bestselling books in the{" "}
                {volumeInfo.categories?.[0] || "fiction"} genre, captivating readers with engaging storytelling and
                memorable characters.
              </p>
              <Button variant="outline" className="w-full">
                View All Books by This Author
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Share This Audiobook</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const text = `Check out ${volumeInfo.title} by ${volumeInfo.authors?.[0] || "Unknown Author"}`
                    const url = window.location.href

                    if (navigator.share && window.isSecureContext) {
                      navigator
                        .share({
                          title: volumeInfo.title,
                          text: text,
                          url: url,
                        })
                        .catch((err) => {
                          console.error("Error sharing:", err)
                          // Fallback to clipboard
                          navigator.clipboard
                            .writeText(url)
                            .then(() =>
                              toast({
                                title: "Link copied",
                                description: "Audiobook link copied to clipboard",
                                duration: 3000,
                              }),
                            )
                            .catch(() =>
                              toast({
                                title: "Sharing failed",
                                description: "Please manually copy the URL from your browser's address bar",
                                variant: "destructive",
                                duration: 3000,
                              }),
                            )
                        })
                    } else {
                      // Fallback for browsers without Web Share API
                      navigator.clipboard
                        .writeText(url)
                        .then(() =>
                          toast({
                            title: "Link copied",
                            description: "Audiobook link copied to clipboard",
                            duration: 3000,
                          }),
                        )
                        .catch(() =>
                          toast({
                            title: "Sharing failed",
                            description: "Please manually copy the URL from your browser's address bar",
                            variant: "destructive",
                            duration: 3000,
                          }),
                        )
                    }
                  }}
                  className="w-full"
                >
                  Share Audiobook
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
