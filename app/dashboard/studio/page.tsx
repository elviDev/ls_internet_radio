"use client"

import { useState, useEffect } from "react"
import { BroadcastStudioInterface } from "@/components/studio/broadcast-studio-interface"
import { ConnectionTest } from "@/components/debug/connection-test"
import { Card, CardContent } from "@/components/ui/card"
import { Activity } from "lucide-react"

interface BroadcastData {
  id: string
  title: string
  staff: Array<{
    id: string
    role: string
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
    isActive: boolean
  }>
  guests: Array<{
    id: string
    name: string
    title?: string
    role: string
  }>
}

export default function StudioPage() {
  const [broadcastData, setBroadcastData] = useState<BroadcastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCurrentBroadcast()
  }, [])

  const fetchCurrentBroadcast = async () => {
    try {
      // Try to get current live broadcast first
      const response = await fetch('/api/broadcasts/current')
      if (response.ok) {
        const data = await response.json()
        setBroadcastData(data)
      } else {
        // If no current broadcast, create a demo session
        setBroadcastData({
          id: 'studio-session-' + Date.now(),
          title: 'Studio Session',
          staff: [
            {
              id: 'host-1',
              role: 'HOST',
              user: {
                id: 'user-1',
                firstName: 'Studio',
                lastName: 'Host',
                email: 'host@example.com'
              },
              isActive: true
            }
          ],
          guests: []
        })
      }
    } catch (err) {
      console.error('Failed to fetch broadcast data:', err)
      setError('Failed to load broadcast data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading broadcast data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !broadcastData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'No broadcast data available'}</p>
              <button 
                onClick={fetchCurrentBroadcast}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Transform broadcast data to match component interface
  const staff = broadcastData.staff.map(s => ({
    id: s.id,
    name: `${s.user.firstName} ${s.user.lastName}`,
    role: s.role.toLowerCase().replace('_', '-') as 'host' | 'co-host' | 'sound-engineer' | 'producer',
    userId: s.user.id,
    isOnline: s.isActive
  }))

  const guests = broadcastData.guests.map(g => ({
    id: g.id,
    name: g.name,
    type: 'guest' as const,
    userId: g.id,
    isConnected: false
  }))
  
  return (
    <div className="p-6 space-y-8">
      <ConnectionTest />
      <BroadcastStudioInterface 
        broadcastId={broadcastData.id}
        stationName={broadcastData.title}
        staff={staff}
        guests={guests}
      />
    </div>
  )
}