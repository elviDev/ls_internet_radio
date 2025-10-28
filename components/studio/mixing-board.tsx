"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Music,
  Headphones,
  Radio,
  Settings,
  Sliders,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  RotateCw,
  Zap,
  Activity,
  AlertTriangle
} from "lucide-react"

interface AudioChannel {
  id: string
  name: string
  type: "mic" | "music" | "effects" | "line"
  volume: number
  gain: number
  muted: boolean
  solo: boolean
  recording: boolean
  peak: number
  eq: {
    low: number
    mid: number
    high: number
  }
  compressor: {
    enabled: boolean
    threshold: number
    ratio: number
  }
  effects: {
    reverb: number
    echo: number
    chorus: number
  }
}

interface MixingBoardProps {
  isLive: boolean
  onChannelChange: (channelId: string, changes: Partial<AudioChannel>) => void
  onMasterVolumeChange: (volume: number) => void
  onCueChannel: (channelId: string) => void
}

export function MixingBoard({ 
  isLive, 
  onChannelChange, 
  onMasterVolumeChange,
  onCueChannel 
}: MixingBoardProps) {
  const [masterVolume, setMasterVolume] = useState(75)
  const [headphoneVolume, setHeadphoneVolume] = useState(60)
  const [recordingEnabled, setRecordingEnabled] = useState(false)
  const [channels, setChannels] = useState<AudioChannel[]>([
    {
      id: "mic1",
      name: "Main Mic",
      type: "mic",
      volume: 75,
      gain: 50,
      muted: false,
      solo: false,
      recording: true,
      peak: 0,
      eq: { low: 50, mid: 50, high: 50 },
      compressor: { enabled: true, threshold: 70, ratio: 3 },
      effects: { reverb: 10, echo: 0, chorus: 0 }
    },
    {
      id: "mic2",
      name: "Guest Mic",
      type: "mic",
      volume: 0,
      gain: 50,
      muted: true,
      solo: false,
      recording: false,
      peak: 0,
      eq: { low: 50, mid: 50, high: 50 },
      compressor: { enabled: true, threshold: 70, ratio: 3 },
      effects: { reverb: 5, echo: 0, chorus: 0 }
    },
    {
      id: "music",
      name: "Music",
      type: "music",
      volume: 60,
      gain: 45,
      muted: false,
      solo: false,
      recording: true,
      peak: 0,
      eq: { low: 55, mid: 50, high: 48 },
      compressor: { enabled: false, threshold: 80, ratio: 2 },
      effects: { reverb: 0, echo: 0, chorus: 0 }
    },
    {
      id: "effects",
      name: "SFX/Jingles",
      type: "effects",
      volume: 45,
      gain: 40,
      muted: false,
      solo: false,
      recording: true,
      peak: 0,
      eq: { low: 45, mid: 55, high: 60 },
      compressor: { enabled: true, threshold: 75, ratio: 4 },
      effects: { reverb: 15, echo: 5, chorus: 0 }
    }
  ])

  const peakMetersRef = useRef<{ [key: string]: NodeJS.Timeout }>({})

  // Simulate peak meters
  useEffect(() => {
    if (isLive) {
      channels.forEach(channel => {
        if (!channel.muted && channel.volume > 0) {
          peakMetersRef.current[channel.id] = setInterval(() => {
            const basePeak = (channel.volume / 100) * 80
            const variation = Math.random() * 20 - 10
            const newPeak = Math.max(0, Math.min(100, basePeak + variation))
            
            setChannels(prev => prev.map(ch => 
              ch.id === channel.id ? { ...ch, peak: newPeak } : ch
            ))
          }, 100)
        }
      })
    }

    return () => {
      Object.values(peakMetersRef.current).forEach(clearInterval)
    }
  }, [isLive, channels])

  const updateChannel = (channelId: string, changes: Partial<AudioChannel>) => {
    setChannels(prev => prev.map(ch => 
      ch.id === channelId ? { ...ch, ...changes } : ch
    ))
    onChannelChange(channelId, changes)
  }

  const handleMasterVolumeChange = (volume: number[]) => {
    setMasterVolume(volume[0])
    onMasterVolumeChange(volume[0])
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "mic": return Mic
      case "music": return Music
      case "effects": return Zap
      case "line": return Radio
      default: return Volume2
    }
  }

  const getPeakColor = (peak: number) => {
    if (peak > 90) return "bg-red-500"
    if (peak > 75) return "bg-yellow-500"
    if (peak > 50) return "bg-green-500"
    return "bg-blue-500"
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            Professional Mixing Board
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={recordingEnabled}
              onCheckedChange={setRecordingEnabled}
              disabled={!isLive}
            />
            <span className="text-sm">Recording</span>
            {recordingEnabled && (
              <Badge variant="destructive" className="animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full mr-1" />
                REC
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Individual Channels */}
          {channels.map((channel) => {
            const Icon = getChannelIcon(channel.type)
            return (
              <div key={channel.id} className="space-y-4 p-4 border rounded-lg bg-slate-50">
                {/* Channel Header */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{channel.name}</span>
                  </div>
                  
                  {/* Peak Meter */}
                  <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`absolute left-0 top-0 h-full transition-all duration-100 ${getPeakColor(channel.peak)}`}
                      style={{ width: `${channel.peak}%` }}
                    />
                    {channel.peak > 95 && (
                      <AlertTriangle className="absolute -top-6 right-0 h-4 w-4 text-red-500 animate-bounce" />
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Peak: {Math.round(channel.peak)}dB
                  </div>
                </div>

                {/* Channel Controls */}
                <div className="space-y-3">
                  {/* Gain */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Gain</label>
                    <Slider
                      value={[channel.gain]}
                      onValueChange={(value) => updateChannel(channel.id, { gain: value[0] })}
                      max={100}
                      step={1}
                      className="h-2"
                      disabled={!isLive}
                    />
                    <div className="text-xs text-center text-slate-500">{channel.gain}%</div>
                  </div>

                  {/* EQ */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium">EQ</label>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="space-y-1">
                        <Slider
                          value={[channel.eq.high]}
                          onValueChange={(value) => updateChannel(channel.id, { 
                            eq: { ...channel.eq, high: value[0] }
                          })}
                          max={100}
                          step={1}
                          orientation="vertical"
                          className="h-16"
                          disabled={!isLive}
                        />
                        <div className="text-xs text-center">HI</div>
                      </div>
                      <div className="space-y-1">
                        <Slider
                          value={[channel.eq.mid]}
                          onValueChange={(value) => updateChannel(channel.id, { 
                            eq: { ...channel.eq, mid: value[0] }
                          })}
                          max={100}
                          step={1}
                          orientation="vertical"
                          className="h-16"
                          disabled={!isLive}
                        />
                        <div className="text-xs text-center">MID</div>
                      </div>
                      <div className="space-y-1">
                        <Slider
                          value={[channel.eq.low]}
                          onValueChange={(value) => updateChannel(channel.id, { 
                            eq: { ...channel.eq, low: value[0] }
                          })}
                          max={100}
                          step={1}
                          orientation="vertical"
                          className="h-16"
                          disabled={!isLive}
                        />
                        <div className="text-xs text-center">LOW</div>
                      </div>
                    </div>
                  </div>

                  {/* Volume Fader */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Volume</label>
                    <Slider
                      value={[channel.volume]}
                      onValueChange={(value) => updateChannel(channel.id, { volume: value[0] })}
                      max={100}
                      step={1}
                      orientation="vertical"
                      className="h-24 mx-auto"
                      disabled={!isLive}
                    />
                    <div className="text-xs text-center text-slate-500">{channel.volume}%</div>
                  </div>

                  {/* Channel Buttons */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-1">
                      <Button
                        size="sm"
                        variant={channel.muted ? "destructive" : "outline"}
                        onClick={() => updateChannel(channel.id, { muted: !channel.muted })}
                        disabled={!isLive}
                        className="text-xs h-6"
                      >
                        MUTE
                      </Button>
                      <Button
                        size="sm"
                        variant={channel.solo ? "default" : "outline"}
                        onClick={() => updateChannel(channel.id, { solo: !channel.solo })}
                        disabled={!isLive}
                        className="text-xs h-6"
                      >
                        SOLO
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCueChannel(channel.id)}
                      disabled={!isLive}
                      className="w-full text-xs h-6"
                    >
                      CUE
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <Separator />

        {/* Master Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Master Volume */}
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-medium">Master Output</h4>
            </div>
            <div className="flex justify-center">
              <div className="space-y-2">
                <Slider
                  value={[masterVolume]}
                  onValueChange={handleMasterVolumeChange}
                  max={100}
                  step={1}
                  orientation="vertical"
                  className="h-32 mx-auto"
                  disabled={!isLive}
                />
                <div className="text-sm text-center text-slate-600">{masterVolume}%</div>
                <Badge variant="outline" className="w-full justify-center">
                  <Volume2 className="h-3 w-3 mr-1" />
                  MAIN
                </Badge>
              </div>
            </div>
          </div>

          {/* Headphone Monitor */}
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-medium">Headphone Monitor</h4>
            </div>
            <div className="flex justify-center">
              <div className="space-y-2">
                <Slider
                  value={[headphoneVolume]}
                  onValueChange={(value) => setHeadphoneVolume(value[0])}
                  max={100}
                  step={1}
                  orientation="vertical"
                  className="h-32 mx-auto"
                  disabled={!isLive}
                />
                <div className="text-sm text-center text-slate-600">{headphoneVolume}%</div>
                <Badge variant="outline" className="w-full justify-center">
                  <Headphones className="h-3 w-3 mr-1" />
                  CUE
                </Badge>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-medium">Master Controls</h4>
            </div>
            <div className="space-y-2">
              <Button 
                variant={recordingEnabled ? "destructive" : "outline"} 
                className="w-full"
                onClick={() => setRecordingEnabled(!recordingEnabled)}
                disabled={!isLive}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${recordingEnabled ? 'bg-white' : 'bg-red-500'}`} />
                  {recordingEnabled ? 'Stop Recording' : 'Start Recording'}
                </div>
              </Button>
              
              <Button variant="outline" className="w-full" disabled={!isLive}>
                <Settings className="h-4 w-4 mr-2" />
                Advanced
              </Button>
              
              <Button variant="outline" className="w-full" disabled={!isLive}>
                <Activity className="h-4 w-4 mr-2" />
                Analyzer
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}