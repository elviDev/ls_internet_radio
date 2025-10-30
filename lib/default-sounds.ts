export const defaultRadioSounds = [
  // Station Jingles
  {
    id: 'station-id-1',
    name: 'Station ID - Main',
    category: 'jingle' as const,
    duration: 15,
    volume: 85,
    hotkey: 'F1',
    fadeIn: 0,
    fadeOut: 1,
    color: 'bg-blue-500',
    tags: ['station', 'id', 'branding'],
    description: 'Main station identification jingle'
  },
  {
    id: 'news-intro',
    name: 'News Intro',
    category: 'jingle' as const,
    duration: 8,
    volume: 80,
    hotkey: 'F2',
    fadeIn: 0,
    fadeOut: 0.5,
    color: 'bg-red-500',
    tags: ['news', 'intro', 'serious'],
    description: 'Professional news segment introduction'
  },
  {
    id: 'weather-intro',
    name: 'Weather Update',
    category: 'jingle' as const,
    duration: 6,
    volume: 75,
    hotkey: 'F3',
    fadeIn: 0,
    fadeOut: 0.5,
    color: 'bg-blue-600',
    tags: ['weather', 'forecast', 'update'],
    description: 'Weather forecast segment opener'
  },

  // Transitions
  {
    id: 'swoosh-1',
    name: 'Swoosh Transition',
    category: 'transition' as const,
    duration: 3,
    volume: 70,
    hotkey: 'F4',
    fadeIn: 0,
    fadeOut: 0,
    color: 'bg-green-500',
    tags: ['transition', 'swoosh', 'smooth'],
    description: 'Smooth swoosh transition effect'
  },
  {
    id: 'whoosh-down',
    name: 'Whoosh Down',
    category: 'transition' as const,
    duration: 2,
    volume: 75,
    hotkey: 'F5',
    fadeIn: 0,
    fadeOut: 0,
    color: 'bg-green-600',
    tags: ['transition', 'whoosh', 'down'],
    description: 'Downward whoosh transition'
  },
  {
    id: 'zip-transition',
    name: 'Quick Zip',
    category: 'transition' as const,
    duration: 1,
    volume: 65,
    hotkey: 'F6',
    fadeIn: 0,
    fadeOut: 0,
    color: 'bg-green-400',
    tags: ['transition', 'zip', 'quick'],
    description: 'Fast zip transition sound'
  },

  // Sound Effects
  {
    id: 'applause-1',
    name: 'Applause',
    category: 'effect' as const,
    duration: 12,
    volume: 65,
    hotkey: 'F7',
    fadeIn: 0,
    fadeOut: 2,
    color: 'bg-yellow-500',
    tags: ['applause', 'crowd', 'positive'],
    description: 'Enthusiastic crowd applause'
  },
  {
    id: 'air-horn',
    name: 'Air Horn',
    category: 'effect' as const,
    duration: 4,
    volume: 90,
    hotkey: 'F8',
    fadeIn: 0,
    fadeOut: 0,
    color: 'bg-orange-500',
    tags: ['horn', 'attention', 'loud'],
    description: 'Classic air horn blast'
  },
  {
    id: 'drum-roll',
    name: 'Drum Roll',
    category: 'effect' as const,
    duration: 8,
    volume: 70,
    hotkey: 'F9',
    fadeIn: 0,
    fadeOut: 1,
    color: 'bg-yellow-600',
    tags: ['drums', 'suspense', 'buildup'],
    description: 'Suspenseful drum roll buildup'
  },
  {
    id: 'cash-register',
    name: 'Cash Register',
    category: 'effect' as const,
    duration: 3,
    volume: 75,
    hotkey: 'F10',
    fadeIn: 0,
    fadeOut: 0,
    color: 'bg-green-700',
    tags: ['money', 'cash', 'commercial'],
    description: 'Classic cash register cha-ching'
  },
  {
    id: 'phone-ring',
    name: 'Phone Ring',
    category: 'effect' as const,
    duration: 6,
    volume: 70,
    hotkey: 'F11',
    fadeIn: 0,
    fadeOut: 0,
    color: 'bg-blue-400',
    tags: ['phone', 'call', 'ring'],
    description: 'Old-style telephone ring'
  },
  {
    id: 'crowd-cheer',
    name: 'Crowd Cheer',
    category: 'effect' as const,
    duration: 10,
    volume: 80,
    hotkey: 'F12',
    fadeIn: 0,
    fadeOut: 2,
    color: 'bg-orange-400',
    tags: ['crowd', 'cheer', 'excitement'],
    description: 'Excited crowd cheering'
  },

  // Voice Clips
  {
    id: 'coming-up-next',
    name: 'Coming Up Next',
    category: 'voice' as const,
    duration: 6,
    volume: 80,
    hotkey: 'Ctrl+1',
    fadeIn: 0,
    fadeOut: 0.5,
    color: 'bg-purple-500',
    tags: ['voice', 'announcement', 'next'],
    description: 'Professional "Coming up next" announcement'
  },
  {
    id: 'stay-tuned',
    name: 'Stay Tuned',
    category: 'voice' as const,
    duration: 4,
    volume: 80,
    hotkey: 'Ctrl+2',
    fadeIn: 0,
    fadeOut: 0.5,
    color: 'bg-purple-600',
    tags: ['voice', 'announcement', 'stay'],
    description: 'Classic "Stay tuned" voice clip'
  },
  {
    id: 'now-playing',
    name: 'Now Playing',
    category: 'voice' as const,
    duration: 3,
    volume: 75,
    hotkey: 'Ctrl+3',
    fadeIn: 0,
    fadeOut: 0.5,
    color: 'bg-purple-400',
    tags: ['voice', 'music', 'now'],
    description: 'Now playing announcement'
  },
  {
    id: 'traffic-update',
    name: 'Traffic Update',
    category: 'voice' as const,
    duration: 5,
    volume: 80,
    hotkey: 'Ctrl+4',
    fadeIn: 0,
    fadeOut: 0.5,
    color: 'bg-purple-700',
    tags: ['voice', 'traffic', 'update'],
    description: 'Traffic report introduction'
  },

  // Music Beds
  {
    id: 'news-bed',
    name: 'News Background',
    category: 'music' as const,
    duration: 180,
    volume: 30,
    hotkey: 'Shift+1',
    loop: true,
    fadeIn: 2,
    fadeOut: 3,
    color: 'bg-indigo-500',
    tags: ['bed', 'news', 'serious'],
    description: 'Serious news background music'
  },
  {
    id: 'upbeat-bed',
    name: 'Upbeat Underscore',
    category: 'music' as const,
    duration: 120,
    volume: 35,
    hotkey: 'Shift+2',
    loop: true,
    fadeIn: 1.5,
    fadeOut: 2,
    color: 'bg-indigo-600',
    tags: ['underscore', 'upbeat', 'energy'],
    description: 'Energetic background music'
  },
  {
    id: 'commercial-bed',
    name: 'Commercial Background',
    category: 'music' as const,
    duration: 90,
    volume: 40,
    hotkey: 'Shift+3',
    loop: true,
    fadeIn: 1,
    fadeOut: 2,
    color: 'bg-indigo-400',
    tags: ['commercial', 'advertising', 'upbeat'],
    description: 'Commercial break background music'
  },
  {
    id: 'talk-bed',
    name: 'Talk Show Bed',
    category: 'music' as const,
    duration: 240,
    volume: 25,
    hotkey: 'Shift+4',
    loop: true,
    fadeIn: 3,
    fadeOut: 4,
    color: 'bg-indigo-700',
    tags: ['talk', 'conversation', 'subtle'],
    description: 'Subtle talk show background music'
  }
]

// Generate audio data URLs for demo sounds (simple tones)
export function generateDemoAudio(sound: typeof defaultRadioSounds[0]): string {
  try {
    const sampleRate = 44100
    const duration = Math.min(sound.duration, 5) // Limit to 5 seconds for demo
    const samples = sampleRate * duration
    
    // Create WAV header
    const buffer = new ArrayBuffer(44 + samples * 2)
    const view = new DataView(buffer)
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + samples * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, samples * 2, true)
    
    // Generate audio based on sound type
    let frequency = 440
    let waveType = 'sine'
    
    switch (sound.category) {
      case 'jingle':
        frequency = 523 // C5
        waveType = 'complex'
        break
      case 'transition':
        frequency = 659 // E5
        waveType = 'sweep'
        break
      case 'effect':
        frequency = 330 // E4
        waveType = 'noise'
        break
      case 'voice':
        frequency = 220 // A3
        waveType = 'formant'
        break
      case 'music':
        frequency = 440 // A4
        waveType = 'chord'
        break
    }
    
    // Generate samples
    for (let i = 0; i < samples; i++) {
      let sample = 0
      const t = i / sampleRate
      
      switch (waveType) {
        case 'sine':
          sample = Math.sin(frequency * 2 * Math.PI * t)
          break
        case 'complex':
          sample = Math.sin(frequency * 2 * Math.PI * t) * 0.5 +
                  Math.sin(frequency * 3 * 2 * Math.PI * t) * 0.3 +
                  Math.sin(frequency * 5 * 2 * Math.PI * t) * 0.2
          break
        case 'sweep':
          const sweepFreq = frequency + (frequency * t)
          sample = Math.sin(sweepFreq * 2 * Math.PI * t)
          break
        case 'noise':
          sample = (Math.random() - 0.5) * 2
          break
        case 'formant':
          sample = Math.sin(frequency * 2 * Math.PI * t) * 
                  Math.sin(frequency * 2.5 * 2 * Math.PI * t)
          break
        case 'chord':
          sample = Math.sin(frequency * 2 * Math.PI * t) * 0.4 +
                  Math.sin(frequency * 1.25 * 2 * Math.PI * t) * 0.3 +
                  Math.sin(frequency * 1.5 * 2 * Math.PI * t) * 0.3
          break
      }
      
      // Apply envelope
      const envelope = Math.min(1, t * 10) * Math.min(1, (duration - t) * 10)
      sample *= envelope * 0.3
      
      // Convert to 16-bit PCM
      const pcmSample = Math.max(-32768, Math.min(32767, sample * 32767))
      view.setInt16(44 + i * 2, pcmSample, true)
    }
    
    const audioBlob = new Blob([buffer], { type: 'audio/wav' })
    return URL.createObjectURL(audioBlob)
  } catch (error) {
    console.error('Error generating demo audio:', error)
    return ''
  }
}