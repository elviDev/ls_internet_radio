"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  UnifiedAudioSystem,
  UnifiedAudioListener,
} from "@/lib/unified-audio-system";
import { RealtimeClient } from "@/lib/realtime-client";

interface StreamQualityMetrics {
  bitrate: number;
  latency: number;
  packetLoss: number;
  jitter: number;
}

interface ReceiverQualityMetrics {
  bufferHealth: number;
  audioDropouts: number;
  connectionQuality: "excellent" | "good" | "fair" | "poor";
}

interface BroadcastContextType {
  // Broadcaster (Studio) State
  isStreaming: boolean;
  isBroadcaster: boolean;
  audioLevel: number;
  streamQuality: StreamQualityMetrics | null;
  startBroadcast: (broadcastId: string) => Promise<void>;
  stopBroadcast: () => Promise<void>;

  // Listener (Public) State
  isListening: boolean;
  isConnected: boolean;
  receiverQuality: ReceiverQualityMetrics | null;
  joinBroadcast: (broadcastId: string) => Promise<void>;
  leaveBroadcast: () => void;

  // Shared Audio Controls
  volume: number;
  isMuted: boolean;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;

  // Connection State
  connectionState: "disconnected" | "connecting" | "connected" | "failed";
  error: string | null;
}

const BroadcastContext = createContext<BroadcastContextType | null>(null);

export function useBroadcast() {
  const context = useContext(BroadcastContext);
  if (!context) {
    throw new Error("useBroadcast must be used within a BroadcastProvider");
  }
  return context;
}

interface BroadcastProviderProps {
  children: React.ReactNode;
  userId?: string;
  isBroadcaster?: boolean;
}

export function BroadcastProvider({
  children,
  userId,
  isBroadcaster = false,
}: BroadcastProviderProps) {
  // Broadcaster state
  const [isStreaming, setIsStreaming] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [streamQuality, setStreamQuality] =
    useState<StreamQualityMetrics | null>(null);
  const [audioSystem, setAudioSystem] = useState<UnifiedAudioSystem | null>(
    null
  );

  // Listener state
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [receiverQuality, setReceiverQuality] =
    useState<ReceiverQualityMetrics | null>(null);
  const [audioListener, setAudioListener] =
    useState<UnifiedAudioListener | null>(null);

  // Realtime client
  const [realtimeClient, setRealtimeClient] = useState<RealtimeClient | null>(
    null
  );

  // Shared state
  const [volume, setVolumeState] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionState, setConnectionState] = useState<
    "disconnected" | "connecting" | "connected" | "failed"
  >("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [currentBroadcastId, setCurrentBroadcastId] = useState<string | null>(
    null
  );

  // Initialize realtime client (singleton pattern)
  useEffect(() => {
    if (!realtimeClient) {
      console.log("🔗 Initializing RealtimeClient");
      const client = new RealtimeClient("http://localhost:3001");
      setRealtimeClient(client);

      return () => {
        console.log("🔗 Cleaning up RealtimeClient");
        client.disconnect();
      };
    }
  }, [realtimeClient]);

  // Audio level monitoring
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (audioSystem || audioListener) {
      interval = setInterval(() => {
        if (audioSystem) {
          const metrics = audioSystem.getMetrics();
          setAudioLevel(metrics.inputLevel);
        }
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [audioSystem, audioListener]);

  // WebRTC signaling integration
  useEffect(() => {
    if (currentBroadcastId && realtimeClient) {
      console.log("🔗 Setting up WebRTC signaling for broadcast:", currentBroadcastId)

      // Set up WebRTC signaling event handlers
      realtimeClient.onBroadcasterReady((data) => {
        console.log("📻 Broadcaster ready:", data);
        if (isBroadcaster) {
          setConnectionState("connected");
          setIsStreaming(true);
          setIsConnected(true);
        }
      });

      realtimeClient.onBroadcastInfo((info) => {
        console.log("📡 Broadcast info received:", info);
        // Only update connection for listeners, not broadcasters
        if (!isBroadcaster) {
          setIsConnected(info.isLive);
          if (info.isLive) {
            setConnectionState("connected");
          }
        }
        // Update streaming state consistently for both roles
        if (info.isLive !== isStreaming) {
          setIsStreaming(info.isLive);
        }
      });

      realtimeClient.onListenerCount((data) => {
        console.log("👥 Listener count updated:", data.count);
        // This will be used by the studio context
      });

      realtimeClient.onBroadcastEnded((data) => {
        console.log("🔚 Broadcast ended:", data.reason);
        // Reset all states
        setIsStreaming(false);
        setIsListening(false);
        setIsConnected(false);
        setConnectionState("disconnected");
        setError(null);
      });

      // Connection state monitoring
      const socket = realtimeClient.getSocket();
      
      socket.on('connect', () => {
        console.log("✅ WebRTC signaling connected");
        if (connectionState === "failed") {
          setConnectionState("connected");
          setError(null);
        }
      });

      socket.on('connect_error', (error) => {
        console.error("❌ WebRTC signaling connection error:", error);
        setConnectionState("failed");
        setError("Failed to connect to broadcast server");
      });

      socket.on('disconnect', (reason) => {
        console.warn("⚠️  WebRTC signaling disconnected:", reason);
        if (isStreaming || isListening) {
          setConnectionState("connecting");
          setError("Connection lost, attempting to reconnect...");
        }
      });

      socket.on('reconnect', () => {
        console.log("🔄 WebRTC signaling reconnected");
        if (connectionState === "connecting" || connectionState === "failed") {
          setConnectionState("connected");
          setError(null);
        }
      });
    }

    // Cleanup function
    return () => {
      if (realtimeClient) {
        const socket = realtimeClient.getSocket();
        socket.off('connect');
        socket.off('connect_error');
        socket.off('disconnect');
        socket.off('reconnect');
      }
    };
  }, [currentBroadcastId, realtimeClient, isBroadcaster, connectionState, isStreaming, isListening]);

  // Broadcaster functions
  const startBroadcast = useCallback(
    async (broadcastId: string) => {
      if (!isBroadcaster || !realtimeClient) {
        throw new Error("Only broadcasters can start streaming");
      }

      try {
        console.log("🎙️ Starting WebRTC broadcast for:", broadcastId);
        setConnectionState("connecting");
        setError(null);

        // Initialize unified audio system for WebRTC
        const system = new UnifiedAudioSystem({
          broadcastId,
          sampleRate: 48000,
          channels: 2,
          bitrate: 128000,
          maxSources: 8,
        });

        // Set up metrics callback
        system.onMetricsUpdate = (metrics) => {
          setAudioLevel(metrics.inputLevel);
        };

        // Initialize audio system first
        await system.initialize();
        setAudioSystem(system);

        // Join as broadcaster via WebRTC signaling
        console.log("📡 Joining as broadcaster via WebRTC signaling");
        realtimeClient.joinAsBroadcaster(broadcastId, {
          username: "Radio Host",
          stationName: "WaveStream",
        });

        // Start the WebRTC broadcast
        await system.startBroadcast();
        
        // Update state
        setIsStreaming(true);
        setIsConnected(true);
        setCurrentBroadcastId(broadcastId);
        setConnectionState("connected");

        // Set realistic stream quality metrics
        setStreamQuality({
          bitrate: 128000,
          latency: 50, // Lower latency for WebRTC
          packetLoss: 0,
          jitter: 2,
        });

        console.log("✅ WebRTC broadcast started successfully");
      } catch (error) {
        console.error("❌ Failed to start WebRTC broadcast:", error);
        setError(
          error instanceof Error ? error.message : "Failed to start broadcast"
        );
        setConnectionState("failed");
        setIsStreaming(false);
        setIsConnected(false);
        
        // Clean up on error
        if (audioSystem) {
          audioSystem.cleanup();
          setAudioSystem(null);
        }
        
        throw error;
      }
    },
    [isBroadcaster, realtimeClient, audioSystem]
  );

  const stopBroadcast = useCallback(async () => {
    if (!isStreaming || !audioSystem) return;

    try {
      audioSystem.stopBroadcast();
      setAudioSystem(null);
      setIsStreaming(false);
      setConnectionState("disconnected");
      setAudioLevel(0);
      setCurrentBroadcastId(null);
      setStreamQuality(null);

      console.log("Broadcast stopped successfully");
    } catch (error) {
      console.error("Failed to stop broadcast:", error);
      setError(
        error instanceof Error ? error.message : "Failed to stop broadcast"
      );
    }
  }, [isStreaming, audioSystem]);

  // Listener functions
  const joinBroadcast = useCallback(
    async (broadcastId: string) => {
      if (isBroadcaster || !realtimeClient) {
        throw new Error("Broadcasters cannot join as listeners");
      }

      try {
        console.log("🎧 Joining WebRTC broadcast as listener:", broadcastId);
        setConnectionState("connecting");
        setError(null);

        // Join broadcast via WebRTC signaling first
        console.log("📡 Joining broadcast via WebRTC signaling");
        realtimeClient.joinBroadcast(broadcastId, {
          role: "listener",
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });

        // Initialize WebRTC audio listener
        const listener = new UnifiedAudioListener(broadcastId);
        await listener.startListening();
        
        // Apply current volume settings
        listener.setVolume(volume);
        listener.setMuted(isMuted);

        // Update state
        setAudioListener(listener);
        setIsListening(true);
        setIsConnected(true);
        setCurrentBroadcastId(broadcastId);
        setConnectionState("connected");

        console.log("✅ Successfully joined WebRTC broadcast as listener");
      } catch (error) {
        console.error("❌ Failed to join WebRTC broadcast:", error);
        setError(
          error instanceof Error ? error.message : "Failed to join broadcast"
        );
        setConnectionState("failed");
        setIsListening(false);
        setIsConnected(false);
        
        // Clean up on error
        if (audioListener) {
          audioListener.stopListening();
          setAudioListener(null);
        }
        
        throw error;
      }
    },
    [isBroadcaster, realtimeClient, volume, isMuted, audioListener]
  );

  const leaveBroadcast = useCallback(() => {
    if (!isListening || !audioListener) return;

    try {
      console.log("🔌 Leaving WebRTC broadcast");
      
      // Stop WebRTC listener
      audioListener.stopListening();
      setAudioListener(null);

      // Notify server we're leaving
      if (realtimeClient && currentBroadcastId) {
        realtimeClient.getSocket().emit('leave-broadcast', currentBroadcastId);
      }

      // Reset states
      setIsListening(false);
      setIsConnected(false);
      setConnectionState("disconnected");
      setAudioLevel(0);
      setCurrentBroadcastId(null);
      setError(null);

      console.log("✅ Successfully left WebRTC broadcast");
    } catch (error) {
      console.error("❌ Failed to leave WebRTC broadcast:", error);
      setError(
        error instanceof Error ? error.message : "Failed to leave broadcast"
      );
    }
  }, [isListening, audioListener, realtimeClient, currentBroadcastId]);

  // Audio control functions
  const setVolume = useCallback(
    (newVolume: number) => {
      setVolumeState(newVolume);

      if (audioListener) {
        audioListener.setVolume(newVolume);
      }
    },
    [audioListener]
  );

  const setMuted = useCallback(
    (muted: boolean) => {
      setIsMuted(muted);

      if (audioListener) {
        audioListener.setMuted(muted);
      }
    },
    [audioListener]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioSystem) {
        audioSystem.cleanup();
      }
      if (audioListener) {
        audioListener.stopListening();
      }
      if (realtimeClient) {
        realtimeClient.disconnect();
      }
    };
  }, [audioSystem, audioListener, realtimeClient]);

  const contextValue: BroadcastContextType = {
    // Broadcaster state
    isStreaming,
    isBroadcaster,
    audioLevel,
    streamQuality,
    startBroadcast,
    stopBroadcast,

    // Listener state
    isListening,
    isConnected,
    receiverQuality,
    joinBroadcast,
    leaveBroadcast,

    // Shared audio controls
    volume,
    isMuted,
    setVolume,
    setMuted,

    // Connection state
    connectionState,
    error,
  };

  return (
    <BroadcastContext.Provider value={contextValue}>
      {children}
    </BroadcastContext.Provider>
  );
}
