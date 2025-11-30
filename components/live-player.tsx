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
  Radio,
  Signal,
  Share2,
  Copy,
  ExternalLink,
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
import { Badge } from "@/components/ui/badge";
import { useBroadcast } from "@/contexts/broadcast-context";

function LivePlayerInterface() {
  const broadcastContext = useBroadcast();
  const [currentShow, setCurrentShow] = useState("Loading...");
  const [currentBroadcast, setCurrentBroadcast] = useState<any>(null);
  const [upcomingBroadcast, setUpcomingBroadcast] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [isPlayingFallback, setIsPlayingFallback] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fallback streams for when no live broadcast is available
  const fallbackStreams = [
    "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service",
    "https://icecast.omroep.nl/radio1-bb-mp3",
    "https://playerservices.streamtheworld.com/api/livestream-redirect/TLPSTR01.mp3",
    "/demo-radio-clip.mp3",
    "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmsgBzmByvPkgysEKYPH8OM", // A simple beep tone
  ];

  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);

  // Fetch current broadcast and schedule data
  const fetchBroadcastData = async () => {
    try {
      // Fetch current/upcoming broadcast
      const currentResponse = await fetch('/api/broadcasts/current');
      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        // console.log('📻 Current broadcast API response:', currentData);
        
        // Handle direct response format from the API
        if (currentData.isLive) {
          setCurrentBroadcast(currentData);
          setCurrentShow(currentData.title);
          setFallbackMode(false);
          // Set broadcast ID for WebRTC sharing
          setStreamUrl(`${window.location.origin}?join=${currentData.slug}`);
        } else {
          // No live broadcast currently
          if (currentData.upcoming) {
            const startTime = new Date(currentData.upcoming.startTime);
            setCurrentShow(`Up next: ${currentData.upcoming.title} at ${startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`);
          } else {
            setCurrentShow("No live broadcasts at the moment");
          }
          setFallbackMode(true);
          setStreamUrl(null);
        }
      } else {
        // API call failed, try to get any active broadcast
        console.log('Current broadcast API failed with status:', currentResponse.status);
        setCurrentShow("Checking for live broadcasts...");
        setFallbackMode(true);
        setStreamUrl(null);
      }

      // Fetch schedule (optional)
      try {
        const scheduleResponse = await fetch('/api/broadcasts/schedule');
        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();
          setSchedule(scheduleData.schedule || []);
        }
      } catch (error) {
        console.log('Schedule fetch failed, continuing without schedule');
        setSchedule([]);
      }
    } catch (error) {
      console.error('Error fetching broadcast data:', error);
      setCurrentShow("Unable to load show info");
      setFallbackMode(true);
    }
  };

  // Sync with broadcast context state
  useEffect(() => {
    if (broadcastContext.isStreaming && broadcastContext.currentBroadcastId) {
      console.log('🎵 LivePlayer syncing with broadcast context:', {
        isStreaming: broadcastContext.isStreaming,
        broadcastId: broadcastContext.currentBroadcastId
      });
      
      // Fetch current broadcast details using the active broadcast ID
      const fetchActiveBroadcastDetails = async () => {
        try {
          console.log('🔍 LivePlayer fetching broadcast details for ID:', broadcastContext.currentBroadcastId);
          const response = await fetch(`/api/admin/broadcasts?id=${broadcastContext.currentBroadcastId}&single=true`);
          if (response.ok) {
            const broadcastData = await response.json();
            console.log('📡 LivePlayer got broadcast details:', {
              id: broadcastData.id,
              title: broadcastData.title,
              status: broadcastData.status,
              slug: broadcastData.slug
            });
            
            setCurrentBroadcast(broadcastData);
            setCurrentShow(broadcastData.title);
            setFallbackMode(false);
            setStreamUrl(`${window.location.origin}?join=${broadcastData.slug}`);
          } else {
            console.warn('LivePlayer: Broadcast details API failed with status:', response.status);
            // Fallback to generic live message
            setCurrentShow('Live Broadcast');
            setFallbackMode(false);
          }
        } catch (error) {
          console.warn('LivePlayer: Failed to fetch active broadcast details:', error);
          setCurrentShow('Live Broadcast');
          setFallbackMode(false);
        }
      };
      
      fetchActiveBroadcastDetails();
    } else if (!broadcastContext.isStreaming) {
      // Not streaming, fetch upcoming broadcasts
      fetchBroadcastData();
    }
  }, [broadcastContext.isStreaming, broadcastContext.currentBroadcastId]);

  // Check for URL parameters to auto-join broadcasts
  useEffect(() => {
    const checkAutoJoin = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const joinSlug = urlParams.get('join');
      
      if (joinSlug) {
        console.log('🔗 Auto-joining broadcast from URL:', joinSlug);
        try {
          // Fetch broadcast by slug
          const response = await fetch(`/api/admin/broadcasts/${joinSlug}`);
          if (response.ok) {
            const broadcastData = await response.json();
            if (broadcastData.status === 'LIVE') {
              setCurrentBroadcast(broadcastData);
              setCurrentShow(broadcastData.title);
              setFallbackMode(false);
              
              // Auto-join the broadcast
              await broadcastContext.joinBroadcast(broadcastData.id);
              console.log('✅ Auto-joined broadcast successfully');
              
              // Clean URL
              window.history.replaceState({}, '', window.location.pathname);
            } else {
              console.warn('⚠️ Broadcast is not live:', broadcastData.status);
            }
          }
        } catch (error) {
          console.error('❌ Failed to auto-join broadcast:', error);
        }
      }
    };

    checkAutoJoin();
  }, [broadcastContext]);

  // Fetch data on component mount and set up periodic refresh
  useEffect(() => {
    fetchBroadcastData();
    
    // Debug: Check what's in the database
    const checkDatabase = async () => {
      try {
        const debugResponse = await fetch('/api/debug/broadcasts');
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          console.log('🔍 Database debug:', debugData);
        }
      } catch (error) {
        console.log('Debug call failed:', error);
      }
    };
    checkDatabase();
    
    // Refresh every 30 seconds to keep data current
    const interval = setInterval(fetchBroadcastData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fallback audio setup for when there's no live broadcast
  useEffect(() => {
    if (!fallbackMode) return;
    
    const audioElement = document.createElement("audio");
    audioElement.src = fallbackStreams[currentStreamIndex];
    audioElement.preload = "none";
    audioElement.crossOrigin = "anonymous";
    audioRef.current = audioElement;

    const handleCanPlay = () => {
      setIsLoading(false);
      if (broadcastContext.isListening) {
        audioElement.play().catch(console.error);
      }
    };

    const handlePlay = () => {
      console.log("Fallback audio started playing");
    };

    const handlePause = () => {
      console.log("Fallback audio paused");
    };

    const handleError = (e: any) => {
      console.error("Fallback audio error:", e);
      if (currentStreamIndex < fallbackStreams.length - 1) {
        setCurrentStreamIndex((prevIndex) => prevIndex + 1);
      } else {
        console.warn("All fallback streams failed");
      }
    };

    const handleLoadStart = () => {
      console.log("Fallback audio loading started");
      setIsLoading(true);
    };

    audioElement.addEventListener("canplay", handleCanPlay);
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);
    audioElement.addEventListener("error", handleError);
    audioElement.addEventListener("loadstart", handleLoadStart);
    audioElement.volume = broadcastContext.volume / 100;
    audioElement.muted = broadcastContext.isMuted;

    return () => {
      audioElement.removeEventListener("canplay", handleCanPlay);
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
      audioElement.removeEventListener("error", handleError);
      audioElement.removeEventListener("loadstart", handleLoadStart);
      audioElement.pause();
      audioElement.remove();
    };
  }, [fallbackMode, currentStreamIndex, broadcastContext.isListening]);

  // Update fallback audio volume when changed
  useEffect(() => {
    if (audioRef.current && fallbackMode) {
      audioRef.current.volume = broadcastContext.volume / 100;
      audioRef.current.muted = broadcastContext.isMuted;
    }
  }, [broadcastContext.volume, broadcastContext.isMuted, fallbackMode]);

  // Update fallback audio source when stream index changes
  useEffect(() => {
    if (audioRef.current && fallbackMode && currentStreamIndex < fallbackStreams.length) {
      audioRef.current.src = fallbackStreams[currentStreamIndex];
      if (broadcastContext.isListening) {
        setIsLoading(true);
        audioRef.current.load();
      }
    }
  }, [currentStreamIndex, fallbackMode, broadcastContext.isListening]);

  const handlePlayError = (e: any) => {
    console.error("Play error:", e);
    setIsLoading(false);
  };

  const togglePlay = async () => {
    console.log('🎵 LivePlayer toggle play clicked. Current state:', {
      isListening: broadcastContext.isListening,
      currentBroadcast: !!currentBroadcast,
      currentBroadcastId: currentBroadcast?.id,
      connectionState: broadcastContext.connectionState,
      fallbackMode,
      broadcastContextId: broadcastContext.currentBroadcastId
    });

    if (broadcastContext.isListening) {
      // Stop listening to WebRTC broadcast
      console.log('🔌 Stopping WebRTC broadcast');
      broadcastContext.leaveBroadcast();
    } else if (isPlayingFallback) {
      // Stop fallback music
      if (audioRef.current) {
        audioRef.current.pause();
        console.log('⏸️ Paused fallback audio');
      }
      setIsPlayingFallback(false);
    } else {
      // Start listening
      setIsLoading(true);
      console.log('🎧 Starting to listen...');
      
      // Try live WebRTC broadcast first if available
      if (currentBroadcast && !fallbackMode) {
        console.log('📡 LivePlayer attempting to join live WebRTC broadcast:', {
          broadcastId: currentBroadcast.id,
          broadcastTitle: currentBroadcast.title,
          broadcastStatus: currentBroadcast.status
        });
        try {
          await broadcastContext.joinBroadcast(currentBroadcast.id);
          console.log('✅ LivePlayer successfully joined live WebRTC broadcast');
          setIsLoading(false);
          return;
        } catch (error) {
          console.error('❌ LivePlayer WebRTC broadcast connection failed:', error);
          setFallbackMode(true);
        }
      } else {
        console.log('⚠️ LivePlayer: No current broadcast or in fallback mode:', {
          hasBroadcast: !!currentBroadcast,
          fallbackMode,
          currentBroadcastId: currentBroadcast?.id
        });
      }
      
      // Fallback to music if no live broadcast or WebRTC failed
      if (fallbackMode || !currentBroadcast) {
        console.log('🎵 Using fallback audio mode');
        setFallbackMode(true);
        
        if (audioRef.current) {
          try {
            audioRef.current.load();
            const playPromise = audioRef.current.play();
            if (playPromise) {
              playPromise.then(() => {
                console.log('✅ Fallback audio started successfully');
                setIsPlayingFallback(true);
              }).catch(playError => {
                console.error('❌ Fallback audio failed:', playError);
                if (currentStreamIndex < fallbackStreams.length - 1) {
                  setCurrentStreamIndex((prevIndex) => prevIndex + 1);
                }
              });
            }
          } catch (playError) {
            console.error('❌ Fallback audio setup failed:', playError);
          }
        }
      }
      
      setIsLoading(false);
    }
  };

  const toggleMute = () => {
    broadcastContext.setMuted(!broadcastContext.isMuted);
  };

  const shareStream = async () => {
    if (!streamUrl || !currentBroadcast) return;
    
    const shareData = {
      title: `🎙️ Listen Live: ${currentBroadcast.title}`,
      text: `Join the live broadcast: ${currentBroadcast.title}`,
      url: streamUrl
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log('📤 Broadcast shared successfully');
      } catch (error) {
        console.log('📤 Share cancelled by user');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(streamUrl);
        console.log('📋 Share URL copied to clipboard');
        // Use a toast instead of alert if available
        if (typeof window !== 'undefined' && (window as any).toast) {
          (window as any).toast.success('Share link copied to clipboard!');
        } else {
          alert('Share link copied to clipboard!');
        }
      } catch (error) {
        console.error('❌ Failed to copy share URL:', error);
      }
    }
  };

  // Get connection status for display
  const isConnected = fallbackMode ? (audioRef.current && !audioRef.current.paused) : broadcastContext.isConnected;
  const connectionError = broadcastContext.error;
  const audioLevel = broadcastContext.audioLevel;
  
  // Determine effective connection state
  const getConnectionState = () => {
    if (fallbackMode) {
      // In fallback mode, check if we're playing any kind of audio
      if (isPlayingFallback) return 'connected';
      if (isLoading) return 'connecting';
      return 'disconnected';
    }
    return broadcastContext.connectionState;
  };
  
  const effectiveConnectionState = getConnectionState();
  
  // Network status simulation (remove in production - this shows "offline" issue)
  const networkStatus = navigator.onLine ? 'online' : 'offline';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="container mx-auto px-4 py-2">
        {connectionError && (
          <Alert variant="destructive" className="mb-2 py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={togglePlay}
              variant="ghost"
              size="icon"
              disabled={isLoading || (effectiveConnectionState === 'connecting' && !fallbackMode)}
              className="w-10 h-10 rounded-full bg-brand-100 hover:bg-purple-200 text-brand-700 dark:bg-brand-900 dark:hover:bg-brand-800 dark:text-brand-200"
            >
              {isLoading || (effectiveConnectionState === 'connecting' && !fallbackMode) ? (
                <div className="h-5 w-5 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" />
              ) : (broadcastContext.isListening || isPlayingFallback) ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {currentBroadcast ? "Live Now" : upcomingBroadcast ? "Coming Up" : "Radio Station"}
                </p>
                {currentBroadcast && !fallbackMode && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    <Radio className="h-3 w-3 mr-1 text-red-500" />
                    LIVE
                  </Badge>
                )}
                {fallbackMode && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    Music
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{currentShow}</p>
              {currentBroadcast?.hostUser && (
                <p className="text-xs text-muted-foreground">
                  with {currentBroadcast.hostUser.firstName} {currentBroadcast.hostUser.lastName}
                </p>
              )}
              {/* Connection status indicator */}
              <div className="flex items-center gap-1 mt-1">
                <Signal className={`h-3 w-3 ${
                  effectiveConnectionState === 'connected' ? 'text-green-500' : 
                  effectiveConnectionState === 'connecting' ? 'text-yellow-500' : 
                  'text-gray-400'
                }`} />
                <span className="text-xs text-muted-foreground">
                  {effectiveConnectionState === 'connected' ? (fallbackMode ? 'Playing Music' : 'Live Connected') : 
                   effectiveConnectionState === 'connecting' ? 'Connecting...' : 
                   fallbackMode ? 'Music Ready' : 'Offline'}
                </span>
                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <span className="text-xs text-blue-500 ml-2">
                    [Net: {networkStatus}, Mode: {fallbackMode ? 'fallback' : 'live'}, BC: {broadcastContext.connectionState}]
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4 w-1/3">
            <Button
              onClick={toggleMute}
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
            >
              {broadcastContext.isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            <Slider
              value={[broadcastContext.volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => broadcastContext.setVolume(value[0])}
              className="w-full"
            />
          </div>

          <div className="flex items-center">
            <div className="hidden sm:block">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-brand-500 rounded-full ${(broadcastContext.isListening || isPlayingFallback) ? 'animate-pulse' : ''}`}
                    style={{
                      animationDuration: `${0.5 + Math.random() * 0.5}s`,
                      height: `${
                        (broadcastContext.isListening || isPlayingFallback) ? Math.max(5, audioLevel * 0.3 + Math.floor(Math.random() * 10)) : 5
                      }px`,
                    }}
                  ></div>
                ))}
              </div>
            </div>
            {streamUrl && currentBroadcast && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={shareStream}
                className="mr-2"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
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

export default function LivePlayer() {
  return <LivePlayerInterface />;
}
