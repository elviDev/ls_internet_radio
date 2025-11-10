"use client";

import { useState, useEffect } from "react";
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Play } from "lucide-react"

interface Podcast {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  image?: string;
  host?: {
    id: string;
    name: string;
    profileImage?: string;
  };
  genre?: {
    id: string;
    name: string;
  };
  stats: {
    episodes: number;
    favorites: number;
  };
  latestEpisode?: {
    id: string;
    title: string;
    duration?: number;
    publishedAt: string;
  };
}

export default function FeaturedPodcasts() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        const response = await fetch('/api/podcasts?featured=true&limit=4');
        if (response.ok) {
          const data = await response.json();
          setPodcasts(data.podcasts || []);
        }
      } catch (error) {
        console.error('Error fetching podcasts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPodcasts();
  }, []);

  const formatDuration = (duration?: number) => {
    if (!duration) return "Unknown";
    const minutes = Math.floor(duration / 60);
    return `${minutes} min`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200"></div>
            <CardContent className="p-4">
              <div className="h-3 bg-gray-200 rounded mb-1"></div>
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {podcasts.map((podcast) => (
        <Link href={`/podcasts/${podcast.id}`} key={podcast.id}>
          <Card className="overflow-hidden transition-all hover:shadow-md">
            <div className="relative aspect-square">
              <Image 
                src={podcast.image || "/placeholder.svg?height=400&width=400"} 
                alt={podcast.title} 
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
              <div className="text-xs font-medium text-brand-600 mb-1">
                {podcast.category?.replace('_', ' ') || 'Uncategorized'}
              </div>
              <h3 className="font-semibold text-lg mb-1 line-clamp-1">{podcast.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {podcast.host ? `with ${podcast.host.name}` : 'No host assigned'}
              </p>
              <div className="text-xs text-muted-foreground">
                {podcast.latestEpisode 
                  ? formatDuration(podcast.latestEpisode.duration)
                  : `${podcast.stats.episodes} episodes`
                }
              </div>
              {podcast.stats.favorites > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {podcast.stats.favorites} favorites
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
      {podcasts.length === 0 && !isLoading && (
        <div className="col-span-4 text-center py-8">
          <p className="text-muted-foreground">No podcasts available at the moment.</p>
        </div>
      )}
    </div>
  )
}
