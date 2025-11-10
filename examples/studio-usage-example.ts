// Example usage of the Unified Audio System for radio broadcasting
// This demonstrates how to set up a multi-host radio show with call-in functionality

import { createStudioController } from '../lib/studio-controller'
import { createAudioListener } from '../lib/unified-audio-system'

// Example: Setting up a radio show with multiple hosts
async function setupRadioShow() {
  console.log('🎙️ Setting up radio show...')

  // Create studio controller
  const studio = createStudioController({
    broadcastId: 'morning-show-001',
    stationName: 'LS Radio Morning Show',
    maxHosts: 3,
    maxGuests: 4,
    maxCallers: 2
  })

  // Initialize the studio
  await studio.initialize()

  // Add main host
  await studio.addHost({
    id: 'john-doe',
    name: 'John Doe',
    role: 'main',
    volume: 1.0
  })

  // Add co-host
  await studio.addHost({
    id: 'jane-smith',
    name: 'Jane Smith',
    role: 'co-host',
    volume: 0.9
  })

  // Set up event handlers
  studio.onBroadcastStateChange = (state) => {
    console.log(`📻 Broadcast state changed: ${state}`)
  }

  studio.onAudioMetrics = (metrics) => {
    console.log(`🎚️ Audio levels - Input: ${metrics.inputLevel}%, Output: ${metrics.outputLevel}%`)
  }

  studio.onCallRequest = (callData) => {
    console.log(`📞 Incoming call from ${callData.callerName}`)
    
    // Auto-accept calls for demo (in real app, this would be manual)
    setTimeout(() => {
      studio.acceptCall(callData)
    }, 2000)
  }

  // Start the broadcast
  await studio.startBroadcast()
  console.log('📻 Radio show is now LIVE!')

  // Simulate some studio operations
  setTimeout(() => {
    console.log('🎚️ Adjusting main mic volume to 80%')
    studio.setMainMicVolume(0.8)
  }, 5000)

  setTimeout(() => {
    console.log('🎚️ Adjusting guest mic volume to 60%')
    studio.setGuestMicVolume(0.6)
  }, 10000)

  // Add a guest after 15 seconds
  setTimeout(async () => {
    console.log('👥 Adding guest to the show')
    await studio.addGuest({
      id: 'guest-expert',
      name: 'Dr. Expert',
      type: 'guest',
      volume: 0.8
    })
  }, 15000)

  return studio
}

// Example: Setting up a listener
async function setupListener() {
  console.log('🎧 Setting up listener...')

  const listener = createAudioListener('morning-show-001')
  
  await listener.startListening()
  console.log('🎧 Now listening to the radio show!')

  // Set volume to 75%
  listener.setVolume(75)

  return listener
}

// Example: Complete radio show simulation
async function runRadioShowDemo() {
  try {
    // Set up the studio
    const studio = await setupRadioShow()

    // Set up a listener (simulating audience)
    const listener = await setupListener()

    // Let the show run for 2 minutes
    console.log('⏰ Radio show will run for 2 minutes...')
    
    setTimeout(() => {
      console.log('🛑 Ending radio show demo')
      studio.stopBroadcast()
      listener.stopListening()
      studio.cleanup()
    }, 120000) // 2 minutes

  } catch (error) {
    console.error('❌ Error running radio show demo:', error)
  }
}

// Example: Advanced studio configuration
async function setupAdvancedStudio() {
  const studio = createStudioController({
    broadcastId: 'advanced-show-001',
    stationName: 'LS Radio Advanced Show',
    maxHosts: 4,
    maxGuests: 6,
    maxCallers: 3
  })

  await studio.initialize()

  // Add multiple hosts
  const hosts = [
    { id: 'host-1', name: 'Main Host', role: 'main' as const, volume: 1.0 },
    { id: 'host-2', name: 'Co-Host 1', role: 'co-host' as const, volume: 0.9 },
    { id: 'host-3', name: 'Co-Host 2', role: 'co-host' as const, volume: 0.9 }
  ]

  for (const host of hosts) {
    await studio.addHost(host)
    console.log(`🎤 Added ${host.name}`)
  }

  // Set up advanced audio controls
  studio.setMainMicVolume(0.85) // 85% for main mic
  studio.setGuestMicVolume(0.70) // 70% for guest mic

  // Start broadcast
  await studio.startBroadcast()
  console.log('📻 Advanced multi-host show is LIVE!')

  return studio
}

// Export examples for use
export {
  setupRadioShow,
  setupListener,
  runRadioShowDemo,
  setupAdvancedStudio
}

// If running directly, start the demo
if (typeof window !== 'undefined') {
  // Browser environment - can run the demo
  console.log('🎙️ Unified Audio System Demo Ready')
  console.log('Call runRadioShowDemo() to start the demo')
} else {
  // Node.js environment
  console.log('📝 Radio show examples loaded')
}