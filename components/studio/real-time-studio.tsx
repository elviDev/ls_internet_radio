"use client"

import { UnifiedStudioInterface } from './unified-studio-interface'

interface RealTimeStudioProps {
  broadcastId: string
  userId: string
  isLive: boolean
  onGoLive: () => Promise<void>
  onEndBroadcast: () => Promise<void>
}

export function RealTimeStudio({ 
  broadcastId, 
  userId, 
  isLive, 
  onGoLive, 
  onEndBroadcast 
}: RealTimeStudioProps) {
  return (
    <UnifiedStudioInterface 
      broadcastId={broadcastId}
      stationName="LS Radio Live Studio"
    />
  )
}