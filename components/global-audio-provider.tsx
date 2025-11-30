"use client";

import { createContext, useContext, useState, useEffect } from "react";
import LivePlayer from "@/components/live-player";
import { ChatWidget } from "@/components/chat/chat-widget";
import { useAuth } from "@/contexts/auth-context";
import { BroadcastProvider, useBroadcast } from "@/contexts/broadcast-context";

interface GlobalAudioContextType {
  isPlaying: boolean;
  currentProgram: any;
  setIsPlaying: (playing: boolean) => void;
  setCurrentProgram: (program: any) => void;
}

const GlobalAudioContext = createContext<GlobalAudioContextType | undefined>(
  undefined
);

export function useGlobalAudio() {
  const context = useContext(GlobalAudioContext);
  if (!context) {
    throw new Error("useGlobalAudio must be used within GlobalAudioProvider");
  }
  return context;
}

export function GlobalAudioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProgram, setCurrentProgram] = useState(null);
  const { user } = useAuth();

  // Try to use broadcast context if available
  let currentBroadcast: any = null;
  let isLive = false;

  try {
    const broadcast = useBroadcast();
    // keep a reference so we can read id safely where this provider is used
    currentBroadcast = broadcast;
    isLive = Boolean(broadcast?.isStreaming);
    console.log("🌍 GlobalAudioProvider got broadcast context:", {
      isStreaming: broadcast.isStreaming,
      connectionState: broadcast.connectionState,
    });
  } catch (error) {
    // BroadcastProvider not available in this context
    console.log("🌍 BroadcastProvider not available in GlobalAudioProvider");
  }

  return (
    <GlobalAudioContext.Provider
      value={{
        isPlaying,
        currentProgram,
        setIsPlaying,
        setCurrentProgram,
      }}
    >
      {children}
      <BroadcastProvider isBroadcaster={false}>
        <LivePlayer />
        {user && (
          <ChatWidget
            broadcastId={currentBroadcast?.id || "general-chat"}
            currentUser={{
              id: user.id,
              username: user.name || user.email || "User",
              avatar: user.profilePicture || undefined,
              role: user.role === "admin" ? "admin" : "listener",
            }}
            isLive={isLive}
            position="bottom-right"
          />
        )}
      </BroadcastProvider>
    </GlobalAudioContext.Provider>
  );
}
