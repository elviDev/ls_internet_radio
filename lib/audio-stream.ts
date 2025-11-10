// DEPRECATED: Use UnifiedAudioSystem instead
// This file is kept for backward compatibility

import { UnifiedAudioSystem, createAudioSystem } from './unified-audio-system'

// Legacy AudioStreamManager - redirects to UnifiedAudioSystem
export class AudioStreamManager {
  private unifiedSystem: UnifiedAudioSystem | null = null
  private audioContext: AudioContext | null = null
  private isRecording = false
  private listeners: ((data: Float32Array) => void)[] = []
  async initialize(): Promise<void> {
    console.warn('⚠️ AudioStreamManager is deprecated. Use UnifiedAudioSystem instead.')
    
    try {
      // Create unified audio system
      this.unifiedSystem = createAudioSystem('legacy-broadcast')
      await this.unifiedSystem.initialize()
      
      console.log('✅ Legacy audio stream initialized via UnifiedAudioSystem')

      // Create audio context for legacy effects/listening
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.error('Failed to initialize legacy audio stream:', error)
      throw error
    }
  }

  async startRecording(): Promise<void> {
    if (!this.unifiedSystem) {
      throw new Error('Audio system not initialized')
    }

    try {
      // Add a default host source
      await this.unifiedSystem.addAudioSource({
        id: 'legacy-host',
        type: 'host',
        name: 'Legacy Host',
        volume: 1.0,
        isMuted: false,
        isActive: true,
        priority: 10
      })

      // Start broadcast
      await this.unifiedSystem.startBroadcast()
      this.isRecording = true

      console.log('✅ Legacy recording started via UnifiedAudioSystem')
    } catch (error) {
      console.error('Failed to start legacy recording:', error)
      throw error
    }
  }

  stopRecording(): void {
    if (this.unifiedSystem && this.isRecording) {
      this.unifiedSystem.stopBroadcast()
      this.isRecording = false
      console.log('✅ Legacy recording stopped')
    }
  }

  private processAudioData(analyser: AnalyserNode): void {
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Float32Array(bufferLength)

    const processFrame = () => {
      if (!this.isRecording) return

      analyser.getFloatFrequencyData(dataArray)
      
      // Notify listeners with audio data
      this.listeners.forEach(listener => listener(dataArray))

      requestAnimationFrame(processFrame)
    }

    processFrame()
  }

  // Add listener for audio data
  addAudioDataListener(callback: (data: Float32Array) => void): void {
    this.listeners.push(callback)
  }

  // Remove listener
  removeAudioDataListener(callback: (data: Float32Array) => void): void {
    const index = this.listeners.indexOf(callback)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  // Get audio levels for UI
  getAudioLevels(): { input: number; output: number; peak: number } {
    if (!this.unifiedSystem) {
      return { input: 0, output: 0, peak: 0 }
    }

    const metrics = this.unifiedSystem.getMetrics()
    return {
      input: metrics.inputLevel,
      output: metrics.outputLevel,
      peak: metrics.peakLevel
    }
  }

  // Apply audio effects
  applyEffect(type: 'reverb' | 'echo' | 'compressor', intensity: number): void {
    if (!this.audioContext) return

    switch (type) {
      case 'reverb': {
        // simple reverb using ConvolverNode with a small impulse
        const convolver = this.audioContext.createConvolver()
        const rate = this.audioContext.sampleRate
        const length = rate * 0.5
        const impulse = this.audioContext.createBuffer(2, length, rate)
        for (let ch = 0; ch < 2; ch++) {
          const channelData = impulse.getChannelData(ch)
          for (let i = 0; i < length; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, intensity)
          }
        }
        convolver.buffer = impulse
        convolver.connect(this.audioContext.destination)
        break
      }
      case 'echo': {
        const delay = this.audioContext.createDelay()
        const feedback = this.audioContext.createGain()
        delay.delayTime.value = Math.min(1, Math.max(0, intensity * 0.5))
        feedback.gain.value = 0.4
        delay.connect(feedback)
        feedback.connect(delay)
        delay.connect(this.audioContext.destination)
        break
      }
      case 'compressor': {
        const comp = this.audioContext.createDynamicsCompressor()
        comp.threshold.value = -24 * intensity
        comp.knee.value = 30
        comp.ratio.value = 12
        comp.attack.value = 0.003
        comp.release.value = 0.25
        comp.connect(this.audioContext.destination)
        break
      }
    }
  }

  // Cleanup
  cleanup(): void {
    this.stopRecording()
    
    if (this.unifiedSystem) {
      this.unifiedSystem.cleanup()
      this.unifiedSystem = null
    }

    if (this.audioContext) {
      try {
        this.audioContext.close()
      } catch (e) {
        console.warn('Failed to close audio context', e)
      }
      this.audioContext = null
    }

    this.listeners = []
  }
}

// Audio file management
export class AudioFileManager {
  private audioContext: AudioContext | null = null
  private audioBuffers: Map<string, AudioBuffer> = new Map()

  async initialize(): Promise<void> {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }

  async loadAudioFile(url: string, id: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized')
    }

    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      
      this.audioBuffers.set(id, audioBuffer)
      return audioBuffer
    } catch (error) {
      console.error('Failed to load audio file:', error)
      throw error
    }
  }

  playAudioBuffer(id: string, volume: number = 1): AudioBufferSourceNode | null {
    if (!this.audioContext) return null

    const buffer = this.audioBuffers.get(id)
    if (!buffer) return null

    const source = this.audioContext.createBufferSource()
    const gainNode = this.audioContext.createGain()
    
    source.buffer = buffer
    gainNode.gain.value = volume
    
    source.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    source.start()
    return source
  }

  generateTone(frequency: number, duration: number): AudioBuffer | null {
    if (!this.audioContext) return null

    const sampleRate = this.audioContext.sampleRate
    const length = sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < length; i++) {
      data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3
    }

    return buffer
  }
}