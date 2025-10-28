"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Calendar, Download, Heart, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleArchiveFavorite, trackArchivePlay } from "@/app/archives/actions";
import { useToast } from "@/hooks/use-toast";
import type { ArchiveData } from "@/app/archives/actions";

interface ArchiveCardProps {
  archive: ArchiveData;
  viewMode?: "grid" | "list" | "horizontal";
  className?: string;
}

export function ArchiveCard({
  archive,
  viewMode = "grid",
  className,
}: ArchiveCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePlay = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await trackArchivePlay(archive.id);
      // Here you would typically trigger the actual audio player
      toast({
        title: "Playing",
        description: `Now playing: ${archive.title}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to play archive",
        variant: "destructive",
      });
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    try {
      const result = await toggleArchiveFavorite(archive.id);
      if (result.success) {
        setIsFavorite(result.isFavorite);
        toast({
          title: result.isFavorite ? "Added to favorites" : "Removed from favorites",
          description: result.isFavorite
            ? `${archive.title} has been added to your favorites`
            : `${archive.title} has been removed from your favorites`,
        });
      } else if (result.authRequired) {
        toast({
          title: "Please sign in",
          description: "Sign in to add archives to your favorites",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (archive.downloadUrl) {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = archive.downloadUrl;
      link.download = `${archive.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: `Downloading: ${archive.title}`,
      });
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: archive.title,
          text: archive.description,
          url: window.location.href + '/' + archive.id,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      const url = window.location.href + '/' + archive.id;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Archive link copied to clipboard",
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "podcast":
        return "bg-blue-600";
      case "broadcast":
        return "bg-green-600";
      case "audiobook":
        return "bg-purple-600";
      default:
        return "bg-brand-600";
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "podcast":
        return "Podcast";
      case "broadcast":
        return "Broadcast";
      case "audiobook":
        return "Audiobook";
      default:
        return "Archive";
    }
  };

  if (viewMode === "list") {
    return (
      <Link href={`/archives/${archive.id}`}>
        <Card className={cn("overflow-hidden hover:shadow-md transition-all", className)}>
          <div className="flex flex-col md:flex-row h-full">
            <div className="relative w-full md:w-1/4 aspect-video md:aspect-square">
              <Image
                src={archive.image || "/placeholder.svg"}
                alt={archive.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full bg-white hover:bg-white/90 h-12 w-12"
                  onClick={handlePlay}
                >
                  <Play className="h-5 w-5 text-purple-700 fill-current" />
                </Button>
              </div>
            </div>
            <CardContent className="p-6 w-full md:w-3/4">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <Badge className={cn("mb-2 text-white", getTypeColor(archive.type))}>
                    {archive.category}
                  </Badge>
                  <h3 className="text-xl font-semibold mb-1">{archive.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    with {archive.host}
                    {archive.guests && ` & ${archive.guests}`}
                  </p>
                </div>
                <div className="flex items-center mt-4 md:mt-0">
                  <div className="text-sm text-muted-foreground mr-4">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {archive.date}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {archive.duration}
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground mb-6 line-clamp-2">
                {archive.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  className="bg-brand-600 hover:bg-brand-700"
                  onClick={handlePlay}
                >
                  <Play className="h-4 w-4 mr-2" /> Play
                </Button>
                {archive.isDownloadable && (
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={handleFavorite} disabled={isLoading}>
                  <Heart className={cn("h-4 w-4", isFavorite && "fill-current text-red-500")} />
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  if (viewMode === "horizontal") {
    return (
      <Link href={`/archives/${archive.id}`}>
        <Card className={cn("overflow-hidden hover:shadow-md transition-all", className)}>
          <div className="flex h-full">
            <div className="relative w-1/3">
              <Image
                src={archive.image || "/placeholder.svg"}
                alt={archive.title}
                fill
                className="object-cover"
              />
              <div className="absolute top-3 left-3 bg-white/90 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                {getTypeName(archive.type)}
              </div>
            </div>
            <CardContent className="p-6 w-2/3">
              <div className="text-xs font-medium text-brand-600 dark:text-brand-400 mb-1">
                {archive.category}
              </div>
              <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                {archive.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Narrated by {archive.host}
              </p>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {archive.description}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {archive.duration}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {archive.date}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-brand-600 hover:bg-brand-700"
                  onClick={handlePlay}
                >
                  <Play className="h-3 w-3 mr-1" /> Listen
                </Button>
                <Button variant="outline" size="sm" onClick={handleFavorite} disabled={isLoading}>
                  <Heart className={cn("h-3 w-3", isFavorite && "fill-current text-red-500")} />
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  // Default grid view
  return (
    <Link href={`/archives/${archive.id}`}>
      <Card className={cn("overflow-hidden transition-all hover:shadow-md h-full", className)}>
        <div className="relative aspect-square">
          <Image
            src={archive.image || "/placeholder.svg"}
            alt={archive.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full bg-white hover:bg-white/90 h-12 w-12"
              onClick={handlePlay}
            >
              <Play className="h-5 w-5 text-purple-700 fill-current" />
            </Button>
          </div>
          <div className={cn("absolute top-3 left-3 text-white text-xs font-medium px-2 py-1 rounded-full", getTypeColor(archive.type))}>
            {getTypeName(archive.type)}
          </div>
          
          <div className="absolute top-3 right-3 flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full bg-white/80 hover:bg-white h-8 w-8"
              onClick={handleFavorite}
              disabled={isLoading}
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-current text-red-500")} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full bg-white/80 hover:bg-white h-8 w-8"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="text-xs font-medium text-brand-600 dark:text-brand-400 mb-1">
            {archive.category}
          </div>
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
            {archive.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            with {archive.host}
          </p>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {archive.description}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {archive.duration}
            </div>
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {archive.date}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}