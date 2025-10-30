"use client"

import { useEffect } from 'react'
import { useAudioLevels } from '@/hooks/use-audio-levels'

interface AudioChannel {
  id: string
  name: string
  type: "mic" | "music" | "effects" | "line"
  volume: number
  muted: boolean
}

interface ChannelAudioMonitorProps {
  channel: AudioChannel
  onPeakUpdate: (channelId: string, peak: number) => void
}

export function ChannelAudioMonitor({ channel, onPeakUpdate }: ChannelAudioMonitorProps) {
  const audioData = useAudioLevels({
    channelId: channel.id,
    channelType: channel.type,
    enabled: true,
    muted: channel.muted,
    volume: channel.volume
  })

  useEffect(() => {
    onPeakUpdate(channel.id, audioData.peak)
  }, [audioData.peak, channel.id, onPeakUpdate])

  return null
}