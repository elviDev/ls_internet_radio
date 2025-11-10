# Unified Audio System for LS Internet Radio

## Overview

The Unified Audio System consolidates all audio processing, mixing, and streaming functionality into a clean, manageable architecture. This system replaces the scattered audio files and provides a single interface for multi-host radio broadcasting with professional audio mixing capabilities.

## Key Features

- **Multi-Host Support**: Up to 4 hosts can join a single broadcast
- **Guest Management**: Support for in-studio guests and phone callers
- **Audio Mixing**: Professional-grade audio mixing with individual volume controls
- **Master Controls**: Separate main mic and guest mic volume controls
- **Real-time Audio Processing**: Low-latency audio streaming with compression and level monitoring
- **Call Management**: Built-in phone call queue and management system
- **WebRTC Integration**: Seamless peer-to-peer audio streaming

## Architecture

### Core Components

1. **UnifiedAudioSystem** (`lib/unified-audio-system.ts`)
   - Main audio processing engine
   - Handles audio sources, mixing, and streaming
   - WebRTC integration for real-time communication

2. **StudioController** (`lib/studio-controller.ts`)
   - High-level interface for studio operations
   - Manages hosts, guests, and callers
   - Provides master volume controls

3. **Unified Audio Handler** (`realtime-server/handlers/unified-audio.js`)
   - Server-side audio management
   - WebSocket handling for real-time communication
   - Call queue and broadcast session management

4. **Studio Interface** (`components/studio/unified-studio-interface.tsx`)
   - React component for studio control
   - Real-time audio level monitoring
   - Call management interface

## Replaced Files

The following files have been consolidated into the unified system:

### Removed/Deprecated Files:
- `lib/audio-stream.ts` - Replaced by UnifiedAudioSystem
- `lib/audio-bridge.ts` - Functionality moved to UnifiedAudioSystem
- `lib/simple-audio-stream.ts` - Consolidated into UnifiedAudioSystem
- `lib/simple-audio-bridge.ts` - Consolidated into UnifiedAudioSystem
- `lib/webrtc-client.ts` - WebRTC functionality integrated into UnifiedAudioSystem
- `lib/realtime-client.ts` - Functionality moved to UnifiedAudioSystem
- `lib/streaming/audio-streaming.ts` - Consolidated into UnifiedAudioSystem
- `lib/streaming/audio-receiver.ts` - Consolidated into UnifiedAudioSystem
- `lib/streaming/webrtc-signaling.ts` - Integrated into unified handler
- `realtime-server/handlers/webrtc.js` - Replaced by unified-audio.js
- `realtime-server/handlers/audio-bridge.js` - Replaced by unified-audio.js

## Usage Examples

### Basic Studio Setup

```typescript
import { createStudioController } from '@/lib/studio-controller'

// Create studio controller
const studio = createStudioController({
  broadcastId: 'morning-show-001',
  stationName: 'LS Radio Morning Show',
  maxHosts: 3,
  maxGuests: 4,
  maxCallers: 2
})

// Initialize
await studio.initialize()

// Add main host
await studio.addHost({
  id: 'main-host',
  name: 'John Doe',
  role: 'main',
  volume: 1.0
})

// Start broadcast
await studio.startBroadcast()
```

### Multi-Host Configuration

```typescript
// Add multiple hosts
await studio.addHost({
  id: 'co-host-1',
  name: 'Jane Smith',
  role: 'co-host',
  volume: 0.9
})

await studio.addHost({
  id: 'co-host-2',
  name: 'Bob Wilson',
  role: 'co-host',
  volume: 0.9
})

// Control master volumes
studio.setMainMicVolume(0.8)    // 80% for all hosts
studio.setGuestMicVolume(0.6)   // 60% for all guests
```

### Guest and Caller Management

```typescript
// Add in-studio guest
await studio.addGuest({
  id: 'guest-1',
  name: 'Dr. Expert',
  type: 'guest',
  volume: 0.8
})

// Handle incoming calls
studio.onCallRequest = async (callData) => {
  console.log(`Incoming call from ${callData.callerName}`)
  
  // Accept the call
  await studio.acceptCall(callData)
}
```

### Audio Level Monitoring

```typescript
studio.onAudioMetrics = (metrics) => {
  console.log(`Input: ${metrics.inputLevel}%`)
  console.log(`Output: ${metrics.outputLevel}%`)
  console.log(`Peak: ${metrics.peakLevel}%`)
  console.log(`Active Sources: ${metrics.activeSourceCount}`)
  console.log(`Listeners: ${metrics.listenerCount}`)
}
```

### Listener Setup

```typescript
import { createAudioListener } from '@/lib/unified-audio-system'

const listener = createAudioListener('morning-show-001')
await listener.startListening()
listener.setVolume(75) // 75% volume
```

## Audio Flow

1. **Input Sources**: Microphones from hosts, guests, and callers
2. **Individual Processing**: Each source has its own gain control and mute capability
3. **Master Mixing**: Main mic and guest mic volume controls affect their respective groups
4. **Audio Processing**: Compression and level monitoring applied to the mixed signal
5. **Output Streaming**: Processed audio streamed to all listeners via WebRTC

## Master Volume Controls

### Main Mic Volume
- Controls volume for all hosts (main host and co-hosts)
- Multiplied with individual host volumes
- Gives the main host control over all host audio levels

### Guest Mic Volume
- Controls volume for all guests and callers
- Multiplied with individual guest volumes
- Allows host to control guest audio levels independently

## Call Management

The system includes a built-in call queue and management system:

1. **Call Requests**: Listeners can request to call in
2. **Call Queue**: Incoming calls are queued for host review
3. **Call Acceptance**: Hosts can accept/reject calls from the interface
4. **Audio Integration**: Accepted callers are automatically added as audio sources
5. **Call Termination**: Hosts can end calls, removing callers from the broadcast

## Server Configuration

The realtime server has been updated to use the unified audio handler:

```javascript
// realtime-server/server.js
const unifiedAudioHandler = require('./handlers/unified-audio')
const audioManager = unifiedAudioHandler(io)
```

## React Component Integration

Use the provided React component for a complete studio interface:

```tsx
import { UnifiedStudioInterface } from '@/components/studio/unified-studio-interface'

<UnifiedStudioInterface 
  broadcastId="morning-show-001"
  stationName="LS Radio Morning Show"
/>
```

## Benefits of the Unified System

1. **Simplified Architecture**: Single system instead of multiple scattered files
2. **Better Maintainability**: Centralized audio processing logic
3. **Professional Features**: Master volume controls and audio mixing
4. **Scalability**: Support for multiple hosts and guests
5. **Real-time Performance**: Optimized for low-latency broadcasting
6. **Integrated Call Management**: Built-in phone call functionality
7. **Clean API**: Simple, intuitive interface for developers

## Migration Guide

If you were using the old scattered audio files, here's how to migrate:

### Old Way:
```typescript
// Multiple imports and complex setup
import { AudioBroadcaster } from '@/lib/audio-bridge'
import { WebRTCBroadcaster } from '@/lib/webrtc-client'
import { AudioStreamManager } from '@/lib/audio-stream'
// ... complex initialization
```

### New Way:
```typescript
// Single import and simple setup
import { createStudioController } from '@/lib/studio-controller'

const studio = createStudioController(config)
await studio.initialize()
await studio.startBroadcast()
```

## Troubleshooting

### Common Issues:

1. **Microphone Access Denied**
   - Ensure browser permissions are granted
   - Use HTTPS in production

2. **Audio Not Streaming**
   - Check WebSocket connection to realtime server
   - Verify broadcast is started with `startBroadcast()`

3. **No Audio Levels**
   - Ensure at least one host is added
   - Check microphone is working and not muted

4. **Calls Not Working**
   - Verify realtime server is running
   - Check WebRTC connectivity

## Future Enhancements

- Music and sound effect integration
- Advanced audio effects (reverb, echo, EQ)
- Recording functionality
- Multi-language support
- Advanced analytics and reporting

## Support

For issues or questions about the Unified Audio System, check the examples in `/examples/studio-usage-example.ts` or refer to the component documentation.