"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LivePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [currentShow, setCurrentShow] = useState("Morning Vibes with Alex");
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // List of fallback streams to try if one fails
  const audioStreams = [
    // BBC World Service - widely accessible public stream
    "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service",
    // Fallback to a static audio file if streams don't work
    "/demo-radio-clip.mp3",
  ];

  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);

  useEffect(() => {
    // Create audio element in the DOM for better browser compatibility
    const audioElement = document.createElement("audio");
    audioElement.src = audioStreams[currentStreamIndex];
    audioElement.preload = "none"; // Don't preload until user clicks play
    audioRef.current = audioElement;

    const handleCanPlay = () => {
      setIsLoading(false);
      if (isPlaying) {
        audioElement.play().catch(handlePlayError);
      }
    };

    const handleError = (e: any) => {
      console.error("Audio error:", e);

      // Try the next stream if available
      if (currentStreamIndex < audioStreams.length - 1) {
        setCurrentStreamIndex((prevIndex) => prevIndex + 1);
        setErrorMessage("Trying alternative audio source...");
      } else {
        setError(true);
        setIsLoading(false);
        setIsPlaying(false);
        setErrorMessage("Unable to play audio. Please try again later.");
      }
    };

    audioElement.addEventListener("canplay", handleCanPlay);
    audioElement.addEventListener("error", handleError);

    // Set initial volume
    audioElement.volume = isMuted ? 0 : volume / 100;

    return () => {
      audioElement.removeEventListener("canplay", handleCanPlay);
      audioElement.removeEventListener("error", handleError);
      audioElement.pause();
      audioElement.remove();
    };
  }, [currentStreamIndex]);

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Update audio source when stream index changes
  useEffect(() => {
    if (audioRef.current && currentStreamIndex < audioStreams.length) {
      audioRef.current.src = audioStreams[currentStreamIndex];

      if (isPlaying) {
        setIsLoading(true);
        audioRef.current.load();
      }
    }
  }, [currentStreamIndex]);

  const handlePlayError = (e: any) => {
    console.error("Play error:", e);
    setError(true);
    setIsLoading(false);
    setIsPlaying(false);
    setErrorMessage("Unable to play audio. Please try again later.");
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setError(false);
      setErrorMessage("");
      setIsLoading(true);

      // Load the audio first (important for mobile browsers)
      audioRef.current.load();

      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((e) => {
          // If the current stream fails, try the next one
          if (currentStreamIndex < audioStreams.length - 1) {
            setCurrentStreamIndex((prevIndex) => prevIndex + 1);
            setErrorMessage("Trying alternative audio source...");
          } else {
            handlePlayError(e);
          }
        });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Schedule data
  const schedule = [
    {
      time: "06:00 - 09:00",
      show: "Morning Vibes",
      host: "Alex Rivera",
      day: "Weekdays",
    },
    {
      time: "09:00 - 11:00",
      show: "Tech Talk",
      host: "Sarah Johnson",
      day: "Weekdays",
    },
    {
      time: "11:00 - 13:00",
      show: "Lunch Beats",
      host: "DJ Marcus",
      day: "Weekdays",
    },
    {
      time: "13:00 - 15:00",
      show: "Afternoon Acoustics",
      host: "Mia Chen",
      day: "Weekdays",
    },
    {
      time: "15:00 - 17:00",
      show: "Business Hour",
      host: "James Wilson",
      day: "Weekdays",
    },
    {
      time: "17:00 - 19:00",
      show: "Drive Time",
      host: "Elena Rodriguez",
      day: "Weekdays",
    },
    {
      time: "19:00 - 21:00",
      show: "Evening Discussions",
      host: "Jordan Taylor",
      day: "Mon, Wed, Fri",
    },
    {
      time: "21:00 - 00:00",
      show: "Night Waves",
      host: "DJ Luna",
      day: "Weekdays",
    },
    {
      time: "10:00 - 12:00",
      show: "Weekend Brunch",
      host: "Chris & Pat",
      day: "Weekends",
    },
    {
      time: "12:00 - 15:00",
      show: "Sports Central",
      host: "Mike Thompson",
      day: "Weekends",
    },
    {
      time: "15:00 - 18:00",
      show: "Cultural Corner",
      host: "Sophia Lee",
      day: "Weekends",
    },
    {
      time: "18:00 - 22:00",
      show: "Saturday Night Mix",
      host: "DJ Pulse",
      day: "Saturday",
    },
    {
      time: "18:00 - 22:00",
      show: "Sunday Slowdown",
      host: "Olivia Green",
      day: "Sunday",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="container mx-auto px-4 py-2">
        {error && (
          <Alert variant="destructive" className="mb-2 py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={togglePlay}
              variant="ghost"
              size="icon"
              disabled={isLoading}
              className="w-10 h-10 rounded-full bg-brand-100 hover:bg-purple-200 text-brand-700 dark:bg-brand-900 dark:hover:bg-brand-800 dark:text-brand-200"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <div>
              <p className="font-medium">Live Now</p>
              <p className="text-sm text-muted-foreground">{currentShow}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4 w-1/3">
            <Button
              onClick={toggleMute}
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            <Slider
              value={[volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0])}
              className="w-full"
            />
          </div>

          <div className="flex items-center">
            <div className="hidden sm:block">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-brand-500 rounded-full animate-pulse`}
                    style={{
                      animationDuration: `${0.5 + Math.random() * 0.5}s`,
                      height: `${
                        isPlaying ? 10 + Math.floor(Math.random() * 15) : 5
                      }px`,
                    }}
                  ></div>
                ))}
              </div>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="link" className="text-brand-600 ml-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh]">
                <SheetHeader>
                  <SheetTitle>Broadcast Schedule</SheetTitle>
                  <SheetDescription>
                    Check out our weekly programming schedule
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-full py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Weekdays</h3>
                      <div className="space-y-3">
                        {schedule
                          .filter((item) => item.day === "Weekdays")
                          .map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between p-3 rounded-lg bg-muted"
                            >
                              <div>
                                <p className="font-medium">{item.show}</p>
                                <p className="text-sm text-muted-foreground">
                                  with {item.host}
                                </p>
                              </div>
                              <div className="text-sm font-medium">
                                {item.time}
                              </div>
                            </div>
                          ))}
                      </div>

                      <h3 className="font-semibold text-lg mt-6 mb-4">
                        Special Shows
                      </h3>
                      <div className="space-y-3">
                        {schedule
                          .filter(
                            (item) =>
                              ![
                                "Weekdays",
                                "Weekends",
                                "Saturday",
                                "Sunday",
                              ].includes(item.day)
                          )
                          .map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between p-3 rounded-lg bg-muted"
                            >
                              <div>
                                <p className="font-medium">{item.show}</p>
                                <p className="text-sm text-muted-foreground">
                                  with {item.host}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {item.time}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {item.day}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-4">Weekends</h3>
                      <div className="space-y-3">
                        {schedule
                          .filter((item) => item.day === "Weekends")
                          .map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between p-3 rounded-lg bg-muted"
                            >
                              <div>
                                <p className="font-medium">{item.show}</p>
                                <p className="text-sm text-muted-foreground">
                                  with {item.host}
                                </p>
                              </div>
                              <div className="text-sm font-medium">
                                {item.time}
                              </div>
                            </div>
                          ))}
                      </div>

                      <h3 className="font-semibold text-lg mt-6 mb-4">
                        Saturday
                      </h3>
                      <div className="space-y-3">
                        {schedule
                          .filter((item) => item.day === "Saturday")
                          .map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between p-3 rounded-lg bg-muted"
                            >
                              <div>
                                <p className="font-medium">{item.show}</p>
                                <p className="text-sm text-muted-foreground">
                                  with {item.host}
                                </p>
                              </div>
                              <div className="text-sm font-medium">
                                {item.time}
                              </div>
                            </div>
                          ))}
                      </div>

                      <h3 className="font-semibold text-lg mt-6 mb-4">
                        Sunday
                      </h3>
                      <div className="space-y-3">
                        {schedule
                          .filter((item) => item.day === "Sunday")
                          .map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between p-3 rounded-lg bg-muted"
                            >
                              <div>
                                <p className="font-medium">{item.show}</p>
                                <p className="text-sm text-muted-foreground">
                                  with {item.host}
                                </p>
                              </div>
                              <div className="text-sm font-medium">
                                {item.time}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
}
