"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PodcastPlayer } from "@/components/podcast/podcast-player";
import { EpisodeList } from "@/components/podcast/episode-list";
import { PodcastComments } from "@/components/podcast/podcast-comments";
import { PodcastTranscript } from "@/components/podcast/podcast-transcript";
import {
  fetchPodcastEpisodes,
  toggleFavoritePodcast,
  checkIsFavorite,
} from "@/app/podcasts/actions";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Sample transcript data
const sampleTranscript = [
  {
    id: "1",
    speaker: "Host",
    content:
      "Welcome to this episode of our podcast. Today we're discussing the future of technology.",
    timestamp: "00:00:00",
  },
  {
    id: "2",
    speaker: "Guest",
    content:
      "Thanks for having me. I'm excited to share my thoughts on this topic.",
    timestamp: "00:00:15",
  },
  {
    id: "3",
    speaker: "Host",
    content:
      "Let's start with the basics. How do you see technology evolving in the next decade?",
    timestamp: "00:00:30",
  },
  {
    id: "4",
    speaker: "Guest",
    content:
      "That's a great question. I believe we're going to see unprecedented advances in artificial intelligence, quantum computing, and biotechnology.",
    timestamp: "00:00:45",
  },
  {
    id: "5",
    speaker: "Guest",
    content:
      "These technologies will converge to solve some of humanity's biggest challenges, from climate change to healthcare.",
    timestamp: "00:01:00",
  },
  {
    id: "6",
    speaker: "Host",
    content:
      "That sounds promising. Can you elaborate on how AI specifically will impact our daily lives?",
    timestamp: "00:01:15",
  },
  {
    id: "7",
    speaker: "Guest",
    content:
      "AI will become more integrated into everything we do, from personalized education to predictive healthcare.",
    timestamp: "00:01:30",
  },
  {
    id: "8",
    speaker: "Guest",
    content:
      "But it's important that we develop these technologies ethically and with proper oversight.",
    timestamp: "00:01:45",
  },
];

// Sample comments data
const sampleComments = [
  {
    id: "1",
    author: "John Doe",
    authorImage: "/placeholder.svg?height=100&width=100",
    content:
      "This episode was incredibly insightful! I especially enjoyed the discussion about ethical AI development.",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: "2",
    author: "Amanda Smith",
    authorImage: "/placeholder.svg?height=100&width=100",
    content:
      "Great episode! I have a question about the AI regulation frameworks mentioned around the 30-minute mark. Are there any resources you'd recommend to learn more about this topic?",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
];

export default function PodcastDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [podcastData, setPodcastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();

  const { id } = params;
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch podcast details and episodes
        const result = await fetchPodcastEpisodes(params.id);

        if (result.success) {
          setPodcastData(result.data);

          // Set the first episode as current if available
          if (result.data?.episodes && result.data.episodes.length > 0) {
            setCurrentEpisode(result.data.episodes[0]);
          }
        } else {
          setError(result.error || "Failed to load podcast");
        }

        // Check if this podcast is in favorites
        const favoriteResult = await checkIsFavorite(params.id);
        if (favoriteResult.success) {
          setIsFavorite(favoriteResult.isFavorite!);
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handlePlayEpisode = (episode: any) => {
    setCurrentEpisode(episode);

    // Scroll to player
    const playerElement = document.getElementById("podcast-player");
    if (playerElement) {
      playerElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFavoriteToggle = async () => {
    if (!podcastData?.podcast) return;

    try {
      const result = await toggleFavoritePodcast({
        id: params.id,
        title: podcastData.podcast.collectionName,
        image:
          podcastData.podcast.artworkUrl100?.replace("100x100", "600x600") ||
          "",
        artist: podcastData.podcast.artistName,
      });

      if (result.success) {
        setIsFavorite(result.isFavorite!);
        toast({
          title: result.isFavorite
            ? "Added to favorites"
            : "Removed from favorites",
          description: result.isFavorite
            ? `${podcastData.podcast.collectionName} has been added to your favorites`
            : `${podcastData.podcast.collectionName} has been removed from your favorites`,
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="w-full aspect-video rounded-xl mb-6" />
            <Skeleton className="w-full h-[200px] rounded-xl mb-8" />
            <Skeleton className="w-full h-[300px] rounded-xl" />
          </div>
          <div>
            <Skeleton className="w-full h-[200px] rounded-xl mb-8" />
            <Skeleton className="w-full h-[150px] rounded-xl mb-8" />
            <Skeleton className="w-full h-[100px] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-6 rounded-xl">
          <h2 className="text-2xl font-bold mb-2">Error Loading Podcast</h2>
          <p className="mb-4">{error}</p>
          <Button asChild>
            <Link href="/podcasts">Back to Podcasts</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!podcastData || !podcastData.podcast) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 p-6 rounded-xl">
          <h2 className="text-2xl font-bold mb-2">Podcast Not Found</h2>
          <p className="mb-4">
            The podcast you're looking for could not be found.
          </p>
          <Button asChild>
            <Link href="/podcasts">Browse Podcasts</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { podcast, episodes } = podcastData;

  // Get related podcasts (in a real app, this would come from an API)
  const relatedPodcasts = [
    {
      id: "1",
      title: "Digital Frontiers",
      host: "Michael Chen",
      image: "/placeholder.svg?height=400&width=400",
      category: "Technology",
    },
    {
      id: "2",
      title: "Innovation Today",
      host: "Priya Sharma",
      image: "/placeholder.svg?height=400&width=400",
      category: "Technology",
    },
    {
      id: "3",
      title: "Tech Insights",
      host: "James Wilson",
      image: "/placeholder.svg?height=400&width=400",
      category: "Technology",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-6">
            <Image
              src={
                podcast.artworkUrl100?.replace("100x100", "600x600") ||
                "/placeholder.svg?height=600&width=600"
              }
              alt={podcast.collectionName}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
              <div>
                <div className="text-sm font-medium text-brand-300 mb-2">
                  {podcast.primaryGenreName}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {podcast.collectionName}
                </h1>
                <p className="text-white/80">with {podcast.artistName}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src="/placeholder.svg?height=100&width=100"
                    alt={podcast.artistName}
                  />
                  <AvatarFallback>
                    {podcast.artistName
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{podcast.artistName}</p>
                  <p className="text-sm text-muted-foreground">
                    Host & Producer
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleFavoriteToggle}
              >
                <Avatar
                  className={isFavorite ? "text-red-500 fill-current" : ""}
                />
                {isFavorite ? "Following" : "Follow"}
              </Button>
            </div>

            <div className="space-y-4 mb-6">
              <h2 className="text-xl font-semibold">About This Podcast</h2>
              <p className="text-muted-foreground">
                {podcast.description ||
                  "No description available for this podcast."}
              </p>
            </div>
          </div>

          <div id="podcast-player" className="mb-8">
            {currentEpisode && (
              <PodcastPlayer
                title={currentEpisode.trackName || "Unknown Episode"}
                artist={podcast.artistName}
                audioUrl={currentEpisode.previewUrl || ""}
                image={podcast.artworkUrl100?.replace("100x100", "600x600")}
                onFavoriteToggle={handleFavoriteToggle}
                isFavorite={isFavorite}
              />
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <Tabs defaultValue="episodes">
              <TabsList className="mb-6">
                <TabsTrigger value="episodes">Episodes</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
              </TabsList>

              <TabsContent value="episodes">
                <EpisodeList
                  episodes={episodes || []}
                  onPlay={handlePlayEpisode}
                />
              </TabsContent>

              <TabsContent value="comments">
                <PodcastComments
                  initialComments={sampleComments}
                  podcastId={params.id}
                />
              </TabsContent>

              <TabsContent value="transcript">
                <PodcastTranscript
                  segments={sampleTranscript}
                  onJumpToTimestamp={(timestamp) => {
                    // In a real app, this would seek to the timestamp in the audio player
                    toast({
                      title: "Seeking to timestamp",
                      description: `Seeking to ${timestamp}`,
                    });
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="space-y-8">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Related Podcasts</h2>
              <div className="space-y-4">
                {relatedPodcasts.map((related) => (
                  <Link
                    href={`/podcasts/${related.id}`}
                    key={related.id}
                    className="block"
                  >
                    <div className="flex items-center gap-3 group">
                      <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                        <Image
                          src={related.image || "/placeholder.svg"}
                          alt={related.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-brand-600 transition-colors">
                          {related.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          with {related.host}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Subscribe</h2>
              <p className="text-muted-foreground mb-4">
                Never miss an episode. Subscribe to this podcast on your
                favorite platform.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full">
                  Apple Podcasts
                </Button>
                <Button variant="outline" className="w-full">
                  Spotify
                </Button>
                <Button variant="outline" className="w-full">
                  Google Podcasts
                </Button>
                <Button variant="outline" className="w-full">
                  RSS Feed
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Share This Podcast</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const text = `Check out ${podcast.collectionName} by ${podcast.artistName}`;
                    const url = window.location.href;

                    if (navigator.share && window.isSecureContext) {
                      navigator
                        .share({
                          title: podcast.collectionName,
                          text: text,
                          url: url,
                        })
                        .catch((err) => {
                          console.error("Error sharing:", err);
                          // Fallback to clipboard
                          navigator.clipboard
                            .writeText(url)
                            .then(() =>
                              toast({
                                title: "Link copied",
                                description: "Podcast link copied to clipboard",
                                duration: 3000,
                              })
                            )
                            .catch(() =>
                              toast({
                                title: "Sharing failed",
                                description:
                                  "Please manually copy the URL from your browser's address bar",
                                variant: "destructive",
                                duration: 3000,
                              })
                            );
                        });
                    } else {
                      // Fallback for browsers without Web Share API
                      navigator.clipboard
                        .writeText(url)
                        .then(() =>
                          toast({
                            title: "Link copied",
                            description: "Podcast link copied to clipboard",
                            duration: 3000,
                          })
                        )
                        .catch(() =>
                          toast({
                            title: "Sharing failed",
                            description:
                              "Please manually copy the URL from your browser's address bar",
                            variant: "destructive",
                            duration: 3000,
                          })
                        );
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                    <polyline points="16 6 12 2 8 6"></polyline>
                    <line x1="12" y1="2" x2="12" y2="15"></line>
                  </svg>
                  <span className="sr-only">Share</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
