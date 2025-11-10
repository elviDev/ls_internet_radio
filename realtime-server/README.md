# LS Internet Radio - TypeScript Realtime Server

A fully-featured TypeScript realtime server for live radio broadcasting with WebRTC audio streaming, chat system, and call management.

## 🚀 Features

- **TypeScript**: Full type safety and enhanced developer experience
- **Unified Audio System**: Multi-host broadcasting with audio mixing
- **Real-time Chat**: Enhanced chat with typing indicators and moderation
- **Call Management**: Phone-in calls with queue management
- **WebRTC Integration**: Low-latency audio streaming
- **Socket.IO**: Real-time bidirectional communication
- **RESTful API**: HTTP endpoints for broadcast and chat management

## 📁 Project Structure

```
realtime-server/
├── src/                    # TypeScript source code
│   ├── server.ts          # Main server entry point
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts       # Shared interfaces and types
│   ├── routes/            # HTTP API routes
│   │   ├── broadcast.ts   # Broadcast management endpoints
│   │   └── chat.ts        # Chat management endpoints
│   ├── handlers/          # Socket.IO event handlers
│   │   ├── unified-audio.ts # Audio streaming and mixing
│   │   └── chat.ts        # Real-time chat functionality
│   └── lib/               # Utility libraries
│       └── integration-example.ts # Frontend integration examples
├── dist/                  # Compiled JavaScript (generated)
├── routes/                # Legacy JavaScript files (deprecated)
├── handlers/              # Legacy JavaScript files (deprecated)
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── build.sh              # Build script
└── README.md             # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Install Dependencies
```bash
npm install
```

### Development Setup
```bash
# Install TypeScript dependencies
npm install -D typescript @types/node @types/express @types/cors @types/jsonwebtoken ts-node-dev

# Build TypeScript
npm run build

# Start development server with auto-reload
npm run dev
```

### Production Setup
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Configuration

Create a `.env` file in the realtime-server directory:

```env
PORT=3001
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

## 📡 API Endpoints

### Broadcast Management
- `GET /api/broadcast/active` - Get active broadcasts
- `GET /api/broadcast/:broadcastId/stats` - Get broadcast statistics
- `POST /api/broadcast/:broadcastId/start` - Start broadcast session
- `POST /api/broadcast/:broadcastId/end` - End broadcast session

### Chat Management
- `GET /api/chat/:broadcastId` - Get chat room info
- `GET /api/chat/:broadcastId/history` - Get chat history
- `PUT /api/chat/:broadcastId/settings` - Update chat settings (admin only)

### Health Check
- `GET /health` - Server health status

## 🔌 Socket.IO Events

### Broadcasting Events
- `join-as-broadcaster` - Join as broadcaster/host
- `join-broadcast` - Join as listener
- `broadcast-audio` - Stream audio data
- `add-audio-source` - Add audio source (mic, guest, etc.)
- `update-audio-source` - Update audio source settings
- `remove-audio-source` - Remove audio source

### Call Management Events
- `request-call` - Request to call the station
- `accept-call` - Accept incoming call
- `reject-call` - Reject incoming call
- `end-call` - End active call
- `get-call-queue` - Get current call queue

### Chat Events
- `join-chat` - Join chat room
- `send-message` - Send chat message
- `send-announcement` - Send announcement (staff only)
- `typing-start` - Start typing indicator
- `typing-stop` - Stop typing indicator
- `react-to-message` - React to message

### Server Events (Outgoing)
- `broadcaster-ready` - Broadcaster successfully connected
- `broadcast-info` - Broadcast information
- `listener-count` - Current listener count
- `audio-stream` - Audio stream data
- `new-message` - New chat message
- `user-joined` - User joined chat
- `user-left` - User left chat
- `incoming-call` - Incoming call request
- `call-accepted` - Call accepted
- `call-rejected` - Call rejected
- `broadcast-ended` - Broadcast ended
- `server-stats` - Server statistics

## 🎙️ Frontend Integration

### Basic Setup
```typescript
import { RealtimeClient } from '../lib/realtime-client'
import { UnifiedAudioSystem } from '../lib/unified-audio-system'

// Initialize realtime client
const client = new RealtimeClient('http://localhost:3001')

// For broadcasters
client.joinAsBroadcaster('broadcast-id', {
  username: 'DJ Mike',
  stationName: 'LS Radio'
})

// For listeners
client.joinBroadcast('broadcast-id')
```

### Audio System Integration
```typescript
// Initialize audio system
const audioSystem = new UnifiedAudioSystem({
  broadcastId: 'broadcast-id',
  sampleRate: 48000,
  channels: 2,
  bitrate: 128000,
  maxSources: 8
})

await audioSystem.initialize()
await audioSystem.startBroadcast()

// Add audio sources
await audioSystem.addAudioSource({
  id: 'main-host',
  type: 'host',
  name: 'Main Host',
  volume: 1.0,
  isMuted: false,
  isActive: true,
  priority: 1
})
```

### Chat Integration
```typescript
// Join chat
client.joinChat('broadcast-id', {
  username: 'User123',
  role: 'listener'
})

// Send message
client.sendMessage('broadcast-id', {
  content: 'Hello everyone!'
})

// Listen for messages
client.onNewMessage((message) => {
  console.log(`${message.username}: ${message.content}`)
})
```

### Call Management
```typescript
// For listeners - request call
client.requestCall('broadcast-id', {
  name: 'John from NYC',
  location: 'New York'
})

// For broadcasters - handle calls
client.onIncomingCall((call) => {
  // Show UI to accept/reject
  client.acceptCall(call.callId)
  // or
  client.rejectCall(call.callId, 'Busy right now')
})
```

## 🔍 Type Safety

The TypeScript backend provides comprehensive type definitions:

```typescript
interface BroadcastSession {
  broadcastId: string
  broadcaster: string | null
  broadcasterInfo: BroadcasterInfo
  listeners: Set<string>
  audioSources: Map<string, AudioSourceInfo>
  callQueue: CallRequest[]
  activeCalls: Map<string, ActiveCall>
  isLive: boolean
  stats: BroadcastStats
}

interface ChatMessage {
  id: string
  userId: string
  username: string
  content: string
  messageType: 'user' | 'system' | 'announcement'
  timestamp: Date
  // ... more properties
}
```

## 🚦 Development Commands

```bash
# Type checking
npm run type-check

# Build TypeScript
npm run build

# Development with auto-reload
npm run dev

# Production start
npm start

# Build script (alternative)
./build.sh
```

## 🔄 Migration from JavaScript

The server automatically handles migration from the old JavaScript version:

1. **Automatic Fallback**: If TypeScript version isn't built, falls back to JavaScript
2. **Deprecation Warnings**: Old files show migration instructions
3. **Gradual Migration**: Can run both versions during transition

## 🐛 Troubleshooting

### Build Issues
```bash
# Clean and rebuild
rm -rf dist/
npm run build
```

### Port Conflicts
```bash
# Check what's using port 3001
lsof -i :3001

# Kill process if needed
kill -9 <PID>
```

### TypeScript Errors
```bash
# Check types without building
npm run type-check
```

## 📊 Performance

- **Low Latency**: WebRTC for sub-second audio streaming
- **Scalable**: Socket.IO with clustering support
- **Memory Efficient**: Automatic cleanup of inactive sessions
- **Type Safe**: Compile-time error checking

## 🔐 Security Features

- **CORS Protection**: Configurable origin restrictions
- **Rate Limiting**: Prevents spam and abuse
- **Helmet.js**: Security headers
- **Input Validation**: TypeScript type checking
- **Session Management**: Automatic cleanup

## 📈 Monitoring

The server provides real-time statistics:

```typescript
// Server stats
{
  activeBroadcasts: number
  totalConnections: number
  totalListeners: number
  totalCalls: number
  uptime: number
}

// Broadcast stats
{
  broadcastId: string
  isLive: boolean
  listeners: number
  peakListeners: number
  audioSources: number
  activeCalls: number
  uptime: number
}
```

## 🤝 Contributing

1. Use TypeScript for all new code
2. Follow existing type definitions
3. Add comprehensive error handling
4. Include JSDoc comments for public APIs
5. Test with both broadcaster and listener scenarios

## 📄 License

This project is part of the LS Internet Radio system.