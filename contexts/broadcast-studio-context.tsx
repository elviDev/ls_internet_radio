"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useBroadcast } from "./broadcast-context";

interface StudioMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkStatus: "excellent" | "good" | "poor" | "offline";
  audioLevels: {
    input: number;
    output: number;
    peak: number;
  };
}

interface StreamStatus {
  isConnected: boolean;
  quality: number;
  bitrate: number;
  latency: number;
  dropped: number;
  errors: string[];
}

interface BroadcastStudioContextType {
  // Live state
  isLive: boolean;
  broadcastDuration: string;
  startTime: Date | null;

  // Metrics
  studioMetrics: StudioMetrics;
  streamStatus: StreamStatus;
  currentListenerCount: number;
  peakListeners: number;

  // Actions
  startBroadcast: (broadcastId: string) => Promise<void>;
  stopBroadcast: () => Promise<void>;
  updateAudioLevels: (levels: {
    input: number;
    output: number;
    peak: number;
  }) => void;
}

const BroadcastStudioContext = createContext<BroadcastStudioContextType | null>(
  null
);

export function useBroadcastStudio() {
  const context = useContext(BroadcastStudioContext);
  if (!context) {
    throw new Error(
      "useBroadcastStudio must be used within a BroadcastStudioProvider"
    );
  }
  return context;
}

interface BroadcastStudioProviderProps {
  children: React.ReactNode;
  broadcastId: string; // This is actually the slug
}

export function BroadcastStudioProvider({
  children,
  broadcastId: broadcastSlug,
}: BroadcastStudioProviderProps) {
  const broadcastContext = useBroadcast();

  // Studio state
  const [isLive, setIsLive] = useState(false);
  const [broadcastDuration, setBroadcastDuration] = useState("00:00:00");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentListenerCount, setCurrentListenerCount] = useState(0);
  const [peakListeners, setPeakListeners] = useState(0);

  // Metrics
  const [studioMetrics, setStudioMetrics] = useState<StudioMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    networkStatus: "offline",
    audioLevels: { input: 0, output: 0, peak: 0 },
  });

  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    isConnected: false,
    quality: 0,
    bitrate: 0,
    latency: 0,
    dropped: 0,
    errors: [],
  });

  // Sync with broadcast context
  useEffect(() => {
    if (broadcastContext) {
      const contextIsLive = broadcastContext.isStreaming;
      setIsLive(contextIsLive);

      // Update stream status
      setStreamStatus({
        isConnected: contextIsLive,
        quality: broadcastContext.streamQuality?.bitrate
          ? (broadcastContext.streamQuality.bitrate / 128) * 100
          : 0,
        bitrate: broadcastContext.streamQuality?.bitrate || 0,
        latency: broadcastContext.streamQuality?.latency || 0,
        dropped: 0,
        errors: [],
      });

      // Update studio metrics
      setStudioMetrics((prev) => ({
        ...prev,
        cpuUsage: contextIsLive ? 25 : 0,
        networkStatus:
          broadcastContext.connectionState === "connected"
            ? "excellent"
            : "offline",
      }));

      // Reset listener count when not live
      if (!contextIsLive) {
        setCurrentListenerCount(0);
        setStartTime(null);
        setBroadcastDuration("00:00:00");
        setPeakListeners(0);
      } else if (!startTime) {
        setStartTime(new Date());
      }
    }
  }, [
    broadcastContext?.isStreaming,
    broadcastContext?.connectionState,
    broadcastContext?.streamQuality,
    startTime,
  ]);

  // Timer for live broadcast duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setBroadcastDuration(
          `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLive, startTime]);

  const startBroadcast = useCallback(async () => {
    if (broadcastContext && !broadcastContext.isStreaming) {
      // First get the actual broadcast ID from the database using slug
      try {
        const response = await fetch(`/api/admin/broadcasts/${broadcastSlug}`);
        if (response.ok) {
          const broadcast = await response.json();
          const actualBroadcastId = broadcast.id;

          console.log(
            "🎙️ Starting broadcast with ID:",
            actualBroadcastId,
            "for slug:",
            broadcastSlug
          );

          // Start WebRTC with actual ID
          await broadcastContext.startBroadcast(actualBroadcastId);

          // Update database status to LIVE using slug (API expects slug)
          const updateResponse = await fetch(
            `/api/admin/broadcasts/${broadcastSlug}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "LIVE" }),
            }
          );

          if (updateResponse.ok) {
            console.log("✅ Database updated: Broadcast is now LIVE");
          } else {
            console.error(
              "❌ Database update failed:",
              updateResponse.status,
              await updateResponse.text()
            );
          }
        } else {
          console.error("Failed to fetch broadcast details:", response.status);
        }
      } catch (error) {
        console.error("Failed to start broadcast:", error);
      }
    } else if (broadcastContext?.isStreaming) {
      console.log("🎙️ Broadcast already active, skipping duplicate start");
    }
  }, [broadcastContext, broadcastSlug]);

  const stopBroadcast = useCallback(async () => {
    if (broadcastContext && broadcastContext.isStreaming) {
      await broadcastContext.stopBroadcast();

      // Update database status to ENDED using slug
      try {
        await fetch(`/api/admin/broadcasts/${broadcastSlug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ENDED" }),
        });
        console.log("✅ Database updated: Broadcast ended");
      } catch (error) {
        console.error("Failed to update broadcast status in database:", error);
      }
    } else if (broadcastContext && !broadcastContext.isStreaming) {
      console.log("📻 Broadcast already stopped, skipping duplicate stop");
    }
  }, [broadcastContext, broadcastSlug]);

  const updateAudioLevels = useCallback(
    (levels: { input: number; output: number; peak: number }) => {
      setStudioMetrics((prev) => ({
        ...prev,
        audioLevels: levels,
      }));
    },
    []
  );

  const contextValue: BroadcastStudioContextType = {
    isLive,
    broadcastDuration,
    startTime,
    studioMetrics,
    streamStatus,
    currentListenerCount,
    peakListeners,
    startBroadcast,
    stopBroadcast,
    updateAudioLevels,
  };

  return (
    <BroadcastStudioContext.Provider value={contextValue}>
      {children}
    </BroadcastStudioContext.Provider>
  );
}
