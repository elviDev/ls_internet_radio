"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { saveArchiveProgress, getArchiveProgress } from "@/app/archives/actions";
import type { ArchiveData } from "@/app/archives/actions";
import { set } from "date-fns";

interface ArchivePlayerProps {
  archive: ArchiveData;
}

export function ArchivePlayer({ archive }: ArchivePlayerProps) {
  console.log("ArchivePlayer received archive data:", {
    id: archive.id,
    title: archive.title,
    audioFile: archive.audioFile,
    hasAudioFile: !!archive.audioFile
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load saved progress on component mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const result = await getArchiveProgress(archive.id);
        if (result.success && result.data?.position) {
          setCurrentTime(result.data.position);
          if (audioRef.current) {
            audioRef.current.currentTime = result.data.position;
          }
        }
      } catch (error) {
        console.error("Failed to load progress:", error);
      }
    };

    loadProgress();
  }, [archive.id]);

  // Save progress periodically
  useEffect(() => {
    const saveProgress = async () => {
      if (currentTime > 0) {
        try {
          await saveArchiveProgress(archive.id, currentTime);
        } catch (error) {
          console.error("Failed to save progress:", error);
        }
      }
    };

    const interval = setInterval(saveProgress, 30000); // Save every 30 seconds
    return () => clearInterval(interval);
  }, [archive.id, currentTime]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      const newTime = Math.max(0, currentTime - 15);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      const newTime = Math.min(duration, currentTime + 15);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleLoadedMetadata = () => {
    console.log("Audio metadata loaded successfully");
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
   
    }
  };

  const handleError = (e: any) => {
    console.error("Audio error:", e);
    setIsLoading(false);
    setHasError(true);
    setErrorMessage(`Failed to load audio file: ${archive.audioFile}`);
  };

  const handleCanPlay = () => {
    console.log("Audio can play");
    setIsLoading(false);
    setHasError(false);
  };

  const handleLoadStart = () => {
    console.log("Audio load started");
  };


  // Set audio source after component mounts
  useEffect(() => {
    if (audioRef.current && archive.audioFile) {
      audioRef.current.src = archive.audioFile;
      audioRef.current.load();
    }
  }, [archive.audioFile]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  if (hasError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          <p className="font-medium">Audio Error</p>
          <p className="text-sm mt-1">{errorMessage}</p>
          <p className="text-xs mt-2 opacity-75">Audio URL: {archive.audioFile || "Not provided"}</p>
          <a 
            href={archive.audioFile} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs underline mt-2 block"
          >
            Test direct link
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <div className="text-center text-muted-foreground">
          <p>Loading audio player...</p>
          <p className="text-xs mt-1 opacity-75">Audio URL: {archive.audioFile || "Not provided"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
      <div className="space-y-4">
        {/* Audio element */}
        <audio
          ref={audioRef}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}   
          onError={handleError}
          onCanPlay={handleCanPlay}
          onLoadStart={handleLoadStart}
          preload="metadata"
        />

        {/* Progress bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration}
            step={1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={skipBackward}
              className="h-10 w-10"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              onClick={togglePlayPause}
              className="h-12 w-12 rounded-full bg-brand-600 hover:bg-brand-700"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 text-white" />
              ) : (
                <Play className="h-5 w-5 text-white fill-current" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={skipForward}
              className="h-10 w-10"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Volume control */}
          <div className="flex items-center space-x-2 min-w-[120px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-8 w-8"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>
        </div>

        {/* Archive info */}
        <div className="text-center pt-2 border-t">
          <h4 className="font-medium text-sm text-muted-foreground">
            Now Playing: {archive.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {archive.host}
            {archive.guests && ` • ${archive.guests}`}
          </p>
        </div>
      </div>
    </div>
  );
}