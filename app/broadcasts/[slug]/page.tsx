"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { BroadcastPage } from "@/components/public/broadcast-page"
import { toast } from "sonner"

interface Broadcast {
  id: string
  title: string
  description: string
  status: "LIVE" | "SCHEDULED" | "ENDED"
  startTime: string
  hostUser: {
    firstName: string
    lastName: string
    profileImage?: string
  }
  banner?: {
    url: string
  }
  currentListeners: number
  totalListeners: number
}

export default function PublicBroadcastPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState<string>()
  const [userId, setUserId] = useState<string>()

  useEffect(() => {
    fetchBroadcast()
    
    const storedUsername = localStorage.getItem("radio_user_name")
    if (storedUsername) {
      setUsername(storedUsername)
      setUserId(`user_${storedUsername}`)
    } else {
      const anonymousName = `Listener${Math.floor(Math.random() * 1000)}`
      setUsername(anonymousName)
      setUserId(`user_${anonymousName}`)
    }
  }, [slug])

  const fetchBroadcast = async () => {
    try {
      const response = await fetch(`/api/admin/broadcasts/${slug}`)
      if (response.ok) {
        const data = await response.json()
        setBroadcast(data)
      } else {
        toast.error("Broadcast not found")
      }
    } catch (error) {
      console.error("Error fetching broadcast:", error)
      toast.error("Failed to load broadcast")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading broadcast...</p>
        </div>
      </div>
    )
  }

  if (!broadcast) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Broadcast Not Found</h1>
          <p className="text-gray-600">The broadcast you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <BroadcastPage
      broadcast={broadcast}
      username={username}
      userId={userId}
    />
  )
}