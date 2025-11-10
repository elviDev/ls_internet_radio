"use client"

import { createContext, useContext, useState, useEffect } from "react"
import LivePlayer from "@/components/live-player"
import { ChatWidget } from "@/components/chat/chat-widget"

interface GlobalAudioContextType {
  isPlaying: boolean
  currentProgram: any
  setIsPlaying: (playing: boolean) => void
  setCurrentProgram: (program: any) => void
}

const GlobalAudioContext = createContext<GlobalAudioContextType | undefined>(undefined)

export function useGlobalAudio() {
  const context = useContext(GlobalAudioContext)
  if (!context) {
    throw new Error("useGlobalAudio must be used within GlobalAudioProvider")
  }
  return context
}

export function GlobalAudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentProgram, setCurrentProgram] = useState(null)
  const [userName, setUserName] = useState("")
  const [isUserNameSet, setIsUserNameSet] = useState(false)

  // Check for stored username on mount
  useEffect(() => {
    const storedUserName = localStorage.getItem("radio_user_name")
    if (storedUserName) {
      setUserName(storedUserName)
      setIsUserNameSet(true)
    }
  }, [])

  return (
    <GlobalAudioContext.Provider value={{
      isPlaying,
      currentProgram,
      setIsPlaying,
      setCurrentProgram
    }}>
      {children}
      <LivePlayer />
      {isUserNameSet && (
        <ChatWidget
          broadcastId="live-broadcast"
          currentUser={{
            id: `user_${userName}`,
            username: userName,
            role: 'listener'
          }}
          position="bottom-right"
        />
      )}
    </GlobalAudioContext.Provider>
  )
}