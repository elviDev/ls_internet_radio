// Studio Controller - Main interface for radio broadcasting
// Handles multiple hosts, guests, callers, and audio mixing

import { UnifiedAudioSystem, AudioSource, AudioMetrics } from './unified-audio-system'

export interface StudioConfig {
  broadcastId: string
  stationName: string
  maxHosts: number
  maxGuests: number
  maxCallers: number
}

export interface HostConfig {
  id: string
  name: string
  role: 'main' | 'co-host'
  microphoneId?: string
  volume: number
}

export interface GuestConfig {
  id: string
  name: string
  type: 'guest' | 'caller'
  volume: number
}

export class StudioController {
  private audioSystem: UnifiedAudioSystem
  private config: StudioConfig
  private hosts = new Map<string, HostConfig>()
  private guests = new Map<string, GuestConfig>()
  private isLive = false
  private mainMicVolume = 1.0
  private guestMicVolume = 0.8

  constructor(config: StudioConfig) {
    this.config = config
    this.audioSystem = new UnifiedAudioSystem({
      broadcastId: config.broadcastId,
      sampleRate: 48000,
      channels: 2,
      bitrate: 128000,
      maxSources: config.maxHosts + config.maxGuests + config.maxCallers + 2 // +2 for music/effects
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    this.audioSystem.onMetricsUpdate = (metrics: AudioMetrics) => {
      this.onAudioMetrics?.(metrics)
    }

    this.audioSystem.onSourceRequest = (data: any) => {
      this.handleSourceRequest(data)
    }
  }

  // Initialize the studio
  async initialize(): Promise<void> {
    try {
      console.log('🎙️ Initializing studio controller...')
      await this.audioSystem.initialize()
      console.log('🎙️ Studio controller initialized successfully')
    } catch (error) {
      console.error('Failed to initialize studio:', error)
      // Don't throw error - allow studio to work without full audio system
      console.warn('🎙️ Studio will continue with limited functionality')
    }
  }

  // Add a host to the broadcast
  async addHost(hostConfig: HostConfig): Promise<void> {
    if (this.hosts.size >= this.config.maxHosts) {
      throw new Error('Maximum number of hosts reached')
    }

    try {
      console.log(`🎤 Adding host: ${hostConfig.name} (${hostConfig.role})`)
      
      // Add as audio source (microphone access handled inside)
      await this.audioSystem.addAudioSource({
        id: `host_${hostConfig.id}`,
        type: 'host',
        name: hostConfig.name,
        volume: hostConfig.volume,
        isMuted: false,
        isActive: true,
        priority: hostConfig.role === 'main' ? 10 : 8
      })

      this.hosts.set(hostConfig.id, hostConfig)
      console.log(`🎤 Successfully added host: ${hostConfig.name} (${hostConfig.role})`)
    } catch (error) {
      console.error(`Failed to add host ${hostConfig.name}:`, error)
      throw error
    }
  }

  // Add a guest to the broadcast
  async addGuest(guestConfig: GuestConfig): Promise<void> {
    if (this.guests.size >= this.config.maxGuests) {
      throw new Error('Maximum number of guests reached')
    }

    try {
      // Add as audio source (microphone access handled inside for guests)
      await this.audioSystem.addAudioSource({
        id: `guest_${guestConfig.id}`,
        type: 'guest',
        name: guestConfig.name,
        volume: guestConfig.volume,
        isMuted: false,
        isActive: true,
        priority: 5
      })

      this.guests.set(guestConfig.id, guestConfig)
      console.log(`👥 Added guest: ${guestConfig.name} (${guestConfig.type})`)
    } catch (error) {
      console.error(`Failed to add guest ${guestConfig.name}:`, error)
      throw error
    }
  }

  // Remove a host
  removeHost(hostId: string): void {
    const host = this.hosts.get(hostId)
    if (host) {
      this.audioSystem.removeAudioSource(`host_${hostId}`)
      this.hosts.delete(hostId)
      console.log(`🔇 Removed host: ${host.name}`)
    }
  }

  // Remove a guest
  removeGuest(guestId: string): void {
    const guest = this.guests.get(guestId)
    if (guest) {
      this.audioSystem.removeAudioSource(`guest_${guestId}`)
      this.guests.delete(guestId)
      console.log(`🔇 Removed guest: ${guest.name}`)
    }
  }

  // Control main microphone volume (affects all hosts)
  setMainMicVolume(volume: number): void {
    this.mainMicVolume = Math.max(0, Math.min(1, volume))
    
    // Update all host volumes
    for (const [hostId, host] of this.hosts) {
      const effectiveVolume = host.volume * this.mainMicVolume
      this.audioSystem.updateAudioSource(`host_${hostId}`, { volume: effectiveVolume })
    }

    console.log(`🎚️ Main mic volume set to ${Math.round(this.mainMicVolume * 100)}%`)
  }

  // Control guest microphone volume (affects all guests)
  setGuestMicVolume(volume: number): void {
    this.guestMicVolume = Math.max(0, Math.min(1, volume))
    
    // Update all guest volumes
    for (const [guestId, guest] of this.guests) {
      const effectiveVolume = guest.volume * this.guestMicVolume
      this.audioSystem.updateAudioSource(`guest_${guestId}`, { volume: effectiveVolume })
    }

    console.log(`🎚️ Guest mic volume set to ${Math.round(this.guestMicVolume * 100)}%`)
  }

  // Mute/unmute a specific source
  muteSource(sourceId: string, muted: boolean): void {
    // Determine the full source ID
    let fullSourceId = sourceId
    if (this.hosts.has(sourceId)) {
      fullSourceId = `host_${sourceId}`
    } else if (this.guests.has(sourceId)) {
      fullSourceId = `guest_${sourceId}`
    }

    this.audioSystem.updateAudioSource(fullSourceId, { isMuted: muted })
    console.log(`${muted ? '🔇' : '🔊'} ${muted ? 'Muted' : 'Unmuted'} source: ${sourceId}`)
  }

  // Set individual source volume
  setSourceVolume(sourceId: string, volume: number): void {
    let fullSourceId = sourceId
    if (this.hosts.has(sourceId)) {
      fullSourceId = `host_${sourceId}`
      const host = this.hosts.get(sourceId)!
      host.volume = volume
      // Apply main mic volume multiplier
      volume *= this.mainMicVolume
    } else if (this.guests.has(sourceId)) {
      fullSourceId = `guest_${sourceId}`
      const guest = this.guests.get(sourceId)!
      guest.volume = volume
      // Apply guest mic volume multiplier
      volume *= this.guestMicVolume
    }

    this.audioSystem.updateAudioSource(fullSourceId, { volume })
    console.log(`🎚️ Set volume for ${sourceId}: ${Math.round(volume * 100)}%`)
  }

  // Start the live broadcast
  async startBroadcast(): Promise<void> {
    if (this.isLive) {
      throw new Error('Broadcast is already live')
    }

    if (this.hosts.size === 0) {
      throw new Error('At least one host is required to start broadcast')
    }

    try {
      console.log('📻 Starting live broadcast...')
      await this.audioSystem.startBroadcast()
      this.isLive = true
      console.log('📻 Live broadcast started successfully')
      this.onBroadcastStateChange?.('live')
    } catch (error) {
      console.error('Failed to start broadcast:', error)
      throw error
    }
  }

  // Stop the live broadcast
  stopBroadcast(): void {
    if (!this.isLive) return

    this.audioSystem.stopBroadcast()
    this.isLive = false
    console.log('🛑 Live broadcast stopped')
    this.onBroadcastStateChange?.('stopped')
  }

  // Handle incoming call requests
  private handleSourceRequest(data: any): void {
    if (data.type === 'call-request') {
      this.onCallRequest?.(data)
    }
  }

  // Accept an incoming call
  async acceptCall(callData: any): Promise<void> {
    if (this.guests.size >= this.config.maxGuests) {
      throw new Error('Maximum number of guests/callers reached')
    }

    try {
      // Add caller as guest
      await this.addGuest({
        id: callData.callerId,
        name: callData.callerName || 'Caller',
        type: 'caller',
        volume: 0.8
      })

      console.log(`📞 Accepted call from ${callData.callerName}`)
    } catch (error) {
      console.error('Failed to accept call:', error)
      throw error
    }
  }

  // End a call
  endCall(callerId: string): void {
    this.removeGuest(callerId)
    console.log(`📞 Ended call with ${callerId}`)
  }

  // Get current studio status
  getStatus() {
    return {
      isLive: this.isLive,
      hosts: Array.from(this.hosts.values()),
      guests: Array.from(this.guests.values()),
      audioSources: this.audioSystem.getAudioSources(),
      metrics: this.audioSystem.getMetrics(),
      mainMicVolume: this.mainMicVolume,
      guestMicVolume: this.guestMicVolume
    }
  }

  // Get available microphones
  async getAvailableMicrophones(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter(device => device.kind === 'audioinput')
    } catch (error) {
      console.error('Failed to get microphones:', error)
      return []
    }
  }

  // Cleanup
  cleanup(): void {
    this.stopBroadcast()
    this.audioSystem.cleanup()
    this.hosts.clear()
    this.guests.clear()
    console.log('🧹 Studio controller cleaned up')
  }

  // Event callbacks
  public onBroadcastStateChange?: (state: 'live' | 'stopped') => void
  public onAudioMetrics?: (metrics: AudioMetrics) => void
  public onCallRequest?: (callData: any) => void
}

// Helper function to create a studio controller
export function createStudioController(config: StudioConfig): StudioController {
  return new StudioController(config)
}