"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Radio,
  RadioIcon as RadioOff,
  ArrowLeft,
  Activity,
  Users,
  Clock,
  Signal,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Mic,
  Settings,
  BarChart3,
  MessageSquare,
  Music,
  Monitor,
  Wifi,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";

// Import our custom studio components
import { MixingBoard } from "@/components/studio/mixing-board";
import { AudioPlayer } from "@/components/studio/audio-player";
import { Soundboard } from "@/components/studio/soundboard";
import { AnalyticsDashboard } from "@/components/studio/analytics-dashboard";
import { EnhancedChat } from "@/components/studio/enhanced-chat";
import { AudioProvider } from "@/contexts/audio-context";
import { BroadcastProvider, useBroadcast } from "@/contexts/broadcast-context";
import {
  BroadcastStudioProvider,
  useBroadcastStudio,
} from "@/contexts/broadcast-studio-context";

type Broadcast = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: "LIVE" | "SCHEDULED" | "READY" | "ENDED";
  startTime: string;
  endTime?: string;
  streamUrl?: string;
  hostUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  banner?: {
    id: string;
    url: string;
    originalName: string;
    type: string;
  };
  staff: BroadcastStaff[];
  guests: BroadcastGuest[];
};

type BroadcastStaff = {
  id: string;
  role:
    | "HOST"
    | "CO_HOST"
    | "PRODUCER"
    | "SOUND_ENGINEER"
    | "GUEST"
    | "MODERATOR";
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    profileImage?: string;
  };
  isActive: boolean;
};

type BroadcastGuest = {
  id: string;
  name: string;
  title?: string;
  role: string;
};

type StreamStatus = {
  isConnected: boolean;
  quality: number;
  bitrate: number;
  latency: number;
  dropped: number;
  errors: string[];
};

type StudioMetrics = {
  cpuUsage: number;
  memoryUsage: number;
  networkStatus: "excellent" | "good" | "poor" | "offline";
  audioLevels: {
    input: number;
    output: number;
    peak: number;
  };
};

function StudioInterface() {
  const router = useRouter();
  const params = useParams();
  const broadcastSlug = params.slug as string;

  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("console");
  const [listeners, setListeners] = useState<any[]>([]);

  // Use unified studio context
  const {
    isLive,
    broadcastDuration,
    startTime,
    studioMetrics,
    streamStatus,
    currentListenerCount,
    peakListeners,
    updateAudioLevels,
  } = useBroadcastStudio();

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Fetch broadcast data
  useEffect(() => {
    if (broadcastSlug) {
      fetchBroadcast();
    }
  }, [broadcastSlug]);

  // Initialize audio monitoring
  useEffect(() => {
    const initAudioMonitoring = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;

        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.3;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        startAudioLevelMonitoring();
      } catch (error) {
        console.error("Failed to initialize audio monitoring:", error);
      }
    };

    initAudioMonitoring();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startAudioLevelMonitoring = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    let lastUpdateTime = 0;

    const updateLevels = (currentTime: number) => {
      if (!analyserRef.current) return;

      // Update at 60fps for smooth real-time feedback
      if (currentTime - lastUpdateTime >= 16) {
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        let peak = 0;
        // Focus on mid-frequency range for voice detection
        const startFreq = Math.floor(dataArray.length * 0.1);
        const endFreq = Math.floor(dataArray.length * 0.8);

        for (let i = startFreq; i < endFreq; i++) {
          const value = dataArray[i];
          sum += value * value; // Square for better sensitivity
          if (value > peak) peak = value;
        }

        const avgSquared = sum / (endFreq - startFreq);
        const rms = Math.sqrt(avgSquared) / 255;

        // More responsive levels with immediate updates
        const inputLevel = Math.min(100, rms * 400);
        const peakLevel = Math.min(100, (peak / 255) * 150);

        // Update audio levels through studio context
        updateAudioLevels({
          input: Math.round(inputLevel * 10) / 10,
          output: Math.round(inputLevel * 0.9 * 10) / 10,
          peak: Math.round(peakLevel * 10) / 10,
        });

        lastUpdateTime = currentTime;
      }

      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    animationFrameRef.current = requestAnimationFrame(updateLevels);
  };

  const fetchBroadcast = async () => {
    try {
      const response = await fetch(`/api/admin/broadcasts/${broadcastSlug}`);
      if (response.ok) {
        const data = await response.json();
        setBroadcast(data);
        if (data.status === "LIVE" && data.startTime) {
          // startTime is managed by studio context now
        }
      } else {
        toast.error("Failed to load broadcast");
      }
    } catch (error) {
      console.error("Error fetching broadcast:", error);
      toast.error("Error loading broadcast");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndBroadcast = async () => {
    try {
      // Update broadcast status in database
      const response = await fetch(`/api/admin/broadcasts/${broadcastSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ENDED" }),
      });

      if (response.ok) {
        const updatedBroadcast = await response.json();
        setBroadcast(updatedBroadcast);
        toast.success("📻 Broadcast ended successfully");

        setTimeout(() => {
          router.push("/dashboard/broadcasts");
        }, 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update broadcast status");
      }
    } catch (error) {
      console.error("Error ending broadcast:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to end broadcast");
      } else {
        toast.error("Failed to end broadcast");
      }
    }
  };

  const updateProgramInfo = (newInfo: any) => {
    if (isLive && broadcast) {
      const programInfo = {
        title: newInfo.title || broadcast.title,
        description: newInfo.description || broadcast.description,
        host: `${broadcast.hostUser.firstName} ${broadcast.hostUser.lastName}`,
        currentTrack: newInfo.currentTrack,
        ...newInfo,
      };
      // TODO: Send program info via WebRTC signaling
      toast.success("📡 Program info updated for listeners");
    }
  };

  const getStatusIndicator = () => {
    if (isLive) {
      return (
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="h-6 w-6 text-red-500" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold text-red-600">LIVE</div>
            <div className="text-xs text-gray-500">{broadcastDuration}</div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <RadioOff className="h-6 w-6 text-gray-400" />
        <div>
          <div className="text-sm font-medium text-gray-600">OFF AIR</div>
          <div className="text-xs text-gray-500">Ready to broadcast</div>
        </div>
      </div>
    );
  };

  const getNetworkStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "poor":
        return "text-yellow-600";
      default:
        return "text-red-600";
    }
  };

  const getAudioLevelGradient = (level: number) => {
    if (level < 20) return "bg-gradient-to-r from-gray-400 to-gray-500";
    if (level < 40) return "bg-gradient-to-r from-green-400 to-green-600";
    if (level < 60) return "bg-gradient-to-r from-yellow-400 to-yellow-600";
    if (level < 80) return "bg-gradient-to-r from-orange-400 to-orange-600";
    return "bg-gradient-to-r from-red-400 to-red-600";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-900 mx-auto"></div>
          <p className="text-slate-500">Loading broadcast studio...</p>
        </div>
      </div>
    );
  }

  if (!broadcast) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-300 mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Broadcast Not Found
            </h2>
            <p className="text-slate-500 text-center mb-6">
              The broadcast you're looking for doesn't exist or has been
              removed.
            </p>
            <Button onClick={() => router.push("/dashboard/broadcasts")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Broadcasts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AudioProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="container mx-auto px-6 py-8">
          {/* Studio Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard/broadcasts")}
                className="hover:bg-white/80 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  {broadcast.title}
                </h1>
                <p className="text-slate-500 mt-1">
                  Professional Broadcasting Studio • Host:{" "}
                  {broadcast.hostUser.firstName} {broadcast.hostUser.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {getStatusIndicator()}
              <Separator orientation="vertical" className="h-8" />
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                <span>{currentListenerCount} listeners</span>
                {peakListeners > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Peak: {peakListeners}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Test Mode Banner */}
          {!isLive && broadcast && (
            <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                    <div>
                      <h3 className="font-semibold text-blue-900">
                        Studio Test Mode Active
                      </h3>
                      <p className="text-sm text-blue-700">
                        All studio controls are enabled for testing. Configure
                        your setup and test functionality before going live.
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-blue-300 text-blue-700"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Testing
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stream Status Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Signal
                      className={`h-4 w-4 ${streamStatus.isConnected ? "text-green-500" : "text-red-500"}`}
                    />
                    {streamStatus.isConnected && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Stream</div>
                    <div className="text-sm font-medium">
                      {streamStatus.isConnected ? "Connected" : "Offline"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-xs text-gray-500">Quality</div>
                    <div className="text-sm font-medium">
                      {streamStatus.quality.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="text-xs text-gray-500">Bitrate</div>
                    <div className="text-sm font-medium">
                      {Math.round(streamStatus.bitrate)} kbps
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <div>
                    <div className="text-xs text-gray-500">Latency</div>
                    <div className="text-sm font-medium">
                      {Math.round(streamStatus.latency)}ms
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="text-xs text-gray-500">CPU</div>
                    <div className="text-sm font-medium">
                      {Math.round(studioMetrics.cpuUsage)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`h-4 w-4 ${getNetworkStatusColor(studioMetrics.networkStatus)}`}
                  />
                  <div>
                    <div className="text-xs text-gray-500">Network</div>
                    <div
                      className={`text-sm font-medium capitalize ${getNetworkStatusColor(studioMetrics.networkStatus)}`}
                    >
                      {studioMetrics.networkStatus}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Studio Interface */}
          <div className="space-y-6">
            {/* Broadcast Status Info */}
            {isLive ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6 text-center">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-red-900">
                        🔴 You're Live!
                      </h3>
                      <p className="text-red-700">
                        Broadcasting for {broadcastDuration} •{" "}
                        {currentListenerCount} listeners
                      </p>
                      <p className="text-sm text-red-600">
                        Use the mixing board controls below to manage your live
                        stream
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : broadcast?.status === "READY" ? (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6 text-center">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-green-900">
                        🎙️ Studio Ready
                      </h3>
                      <p className="text-green-700">
                        Studio is prepared and all systems are ready. Use the
                        "Go Live" button on the mixing board below to start
                        broadcasting.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : broadcast?.status === "SCHEDULED" ? (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6 text-center">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-blue-900">
                        📅 Broadcast Scheduled
                      </h3>
                      <p className="text-blue-700">
                        This broadcast is scheduled. Please use "Prepare Studio"
                        from the broadcasts page first.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={() => router.push("/dashboard/broadcasts")}
                      variant="outline"
                      className="px-8 py-4 text-lg"
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Back to Broadcasts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="p-6 text-center">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        ❌ Studio Unavailable
                      </h3>
                      <p className="text-gray-700">
                        This broadcast is not available for studio access.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={() => router.push("/dashboard/broadcasts")}
                      variant="outline"
                      className="px-8 py-4 text-lg"
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Back to Broadcasts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Staff/Guest Info */}
            {broadcast && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Broadcast Team</span>
                    <Badge variant="outline">
                      {broadcast.staff.length + broadcast.guests.length} members
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Staff */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">
                        Staff ({broadcast.staff.length})
                      </h4>
                      <div className="space-y-1">
                        {broadcast.staff.map((staff) => (
                          <div
                            key={staff.id}
                            className="flex items-center justify-between p-2 bg-slate-50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">
                                {staff.user.firstName.charAt(0)}
                                {staff.user.lastName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {staff.user.firstName} {staff.user.lastName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {staff.role.replace("_", " ")}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={staff.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {staff.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Guests */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">
                        Guests ({broadcast.guests.length})
                      </h4>
                      <div className="space-y-1">
                        {broadcast.guests.map((guest) => (
                          <div
                            key={guest.id}
                            className="flex items-center justify-between p-2 bg-green-50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium">
                                {guest.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {guest.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {guest.title || guest.role}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Guest
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audio Level Display */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Audio Input</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full ${getAudioLevelGradient(studioMetrics.audioLevels.input)}`}
                          style={{
                            width: `${studioMetrics.audioLevels.input}%`,
                            boxShadow:
                              studioMetrics.audioLevels.input > 50
                                ? "0 0 8px rgba(255, 165, 0, 0.6)"
                                : "none",
                          }}
                        />
                      </div>
                      <span
                        className={`text-xs w-12 font-mono ${
                          studioMetrics.audioLevels.input > 80
                            ? "text-red-600 font-bold"
                            : studioMetrics.audioLevels.input > 60
                              ? "text-orange-600"
                              : studioMetrics.audioLevels.input > 20
                                ? "text-green-600"
                                : "text-gray-500"
                        }`}
                      >
                        {Math.round(studioMetrics.audioLevels.input)}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Output</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3  rounded-full transition-all duration-100 ${getAudioLevelGradient(studioMetrics.audioLevels.output)}`}
                          style={{
                            width: `${studioMetrics.audioLevels.output}%`,
                            boxShadow:
                              studioMetrics.audioLevels.output > 50
                                ? "0 0 6px rgba(147, 51, 234, 0.5)"
                                : "none",
                          }}
                        />
                      </div>
                      <span
                        className={`text-xs w-12 font-mono ${
                          studioMetrics.audioLevels.output > 80
                            ? "text-red-600 font-bold"
                            : studioMetrics.audioLevels.output > 60
                              ? "text-orange-600"
                              : studioMetrics.audioLevels.output > 20
                                ? "text-green-600"
                                : "text-gray-500"
                        }`}
                      >
                        {Math.round(studioMetrics.audioLevels.output)}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Signal
                        className={`h-4 w-4 ${isLive ? "text-green-500" : "text-red-500"}`}
                      />
                      <span className="text-sm font-medium">Connection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isLive ? "default" : "secondary"}>
                        {isLive ? "connected" : "offline"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Studio Tabs - Available for all broadcast statuses */}
            {broadcast && (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
              >
                <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm border">
                  <TabsTrigger
                    value="console"
                    className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Console
                  </TabsTrigger>
                  <TabsTrigger
                    value="player"
                    className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                  >
                    <Music className="h-4 w-4 mr-2" />
                    Player
                  </TabsTrigger>
                  <TabsTrigger
                    value="soundboard"
                    className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Soundboard
                  </TabsTrigger>
                  <TabsTrigger
                    value="analytics"
                    className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger
                    value="chat"
                    className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="console" className="space-y-6">
                  {!isLive && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Test Mode
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        Studio is in test mode. You can configure all settings
                        and test functionality before going live.
                      </p>
                    </div>
                  )}

                  <MixingBoard
                    isLive={true}
                    onChannelChange={() => {}}
                    onMasterVolumeChange={() => {}}
                    onCueChannel={() => {}}
                    broadcastId={broadcast?.id}
                  />
                </TabsContent>

                <TabsContent value="player" className="space-y-6">
                  {!isLive && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Audio Player Test Mode
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        Test your playlists, crossfade settings, and track
                        selection before going live.
                      </p>
                    </div>
                  )}
                  <AudioPlayer
                    isLive={true} // Always enable for testing
                    onTrackChange={(track) => {
                      console.log("Track changed:", track);
                      // Send current track info to listeners
                      if (isLive) {
                        updateProgramInfo({ currentTrack: track });
                      }
                    }}
                    onPlaylistChange={(playlist) => {
                      console.log("Playlist changed:", playlist);
                      // Could update scheduled content
                    }}
                  />
                </TabsContent>

                <TabsContent value="soundboard" className="space-y-6">
                  {!isLive && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Soundboard Test Mode
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        Test your sound effects, jingles, and audio cues. All
                        sounds will play as tests.
                      </p>
                    </div>
                  )}
                  <Soundboard
                    isLive={true} // Always enable for testing
                    onSoundPlay={(sound) => {
                      console.log("Sound playing:", sound);
                      // Could trigger audio playback through WebAudio API
                    }}
                    onSoundStop={(soundId) => {
                      console.log("Sound stopped:", soundId);
                      // Could stop audio playback
                    }}
                  />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  {!isLive && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Analytics Preview
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        Preview your analytics dashboard. Real data will appear
                        when broadcast goes live.
                      </p>
                    </div>
                  )}
                  <AnalyticsDashboard
                    isLive={isLive}
                    listeners={listeners}
                    onListenerUpdate={setListeners}
                  />
                </TabsContent>

                <TabsContent value="chat" className="space-y-6">
                  {!isLive && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Chat System Test
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        Test your chat moderation tools and practice sending
                        announcements. Messages will be simulated.
                      </p>
                    </div>
                  )}
                  <EnhancedChat
                    isLive={isLive}
                    hostId={broadcast.hostUser.id}
                    broadcastId={broadcast.id}
                    onMessageSend={(message, type) => {
                      console.log("Message sent:", message, type);
                      // Only show toast for important announcements
                      if (type === "announcement") {
                        if (isLive) {
                          toast.success(
                            "📢 Announcement sent to all listeners"
                          );
                        } else {
                          toast.success(
                            "🧪 Test: Announcement would be sent to listeners"
                          );
                        }
                      }
                      // Could send message via WebSocket to all listeners
                    }}
                    onUserAction={(userId, action) => {
                      console.log("User action:", userId, action);
                      // Only show toast for significant moderation actions
                      if (action === "ban") {
                        if (isLive) {
                          toast.success("🚫 User banned successfully");
                        } else {
                          toast.success(
                            "🧪 Test: User would be banned in live mode"
                          );
                        }
                      }
                      // Could send moderation action via API
                    }}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </AudioProvider>
  );
}

export default function StudioPage() {
  const params = useParams();
  const broadcastSlug = params.slug as string;

  return (
    <BroadcastProvider isBroadcaster={true}>
      <BroadcastStudioProvider broadcastId={broadcastSlug}>
        <StudioInterface />
      </BroadcastStudioProvider>
    </BroadcastProvider>
  );
}
