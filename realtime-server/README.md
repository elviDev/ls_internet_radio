# LS Internet Radio - Realtime Server

Separate Express server handling WebRTC audio streaming and Socket.IO chat functionality.

## Features

- **WebRTC Audio Streaming**: Direct peer-to-peer audio broadcasting
- **Real-time Chat**: Socket.IO powered chat with message persistence
- **User Management**: Online user tracking and presence
- **Moderation Tools**: Message moderation and announcements
- **Analytics**: Real-time listener statistics

## Setup

```bash
cd realtime-server
npm install
npm run dev
```

## Environment Variables

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=http://localhost:3000
```

## API Endpoints

### Chat
- `GET /api/chat/:broadcastId/history` - Get chat history
- `GET /api/chat/:broadcastId/users` - Get active users
- `DELETE /api/chat/:broadcastId/messages/:messageId` - Moderate message

### Broadcast
- `GET /api/broadcast/active` - Get active broadcasts
- `GET /api/broadcast/:broadcastId/stats` - Get broadcast statistics
- `POST /api/broadcast/:broadcastId/start` - Start broadcast session
- `POST /api/broadcast/:broadcastId/end` - End broadcast session

## Socket.IO Events

### WebRTC Events
- `join-as-broadcaster` - Broadcaster joins session
- `join-as-listener` - Listener joins session
- `broadcaster-offer` - WebRTC offer from broadcaster
- `listener-answer` - WebRTC answer from listener
- `ice-candidate` - ICE candidate exchange

### Chat Events
- `join-chat` - Join chat room
- `send-message` - Send chat message
- `send-announcement` - Send announcement (staff only)
- `react-to-message` - React to message
- `typing-start/stop` - Typing indicators

## Architecture

```
Next.js App (port 3000)
    ↓
Realtime Server (port 3001)
    ├── WebRTC Signaling
    ├── Socket.IO Chat
    └── REST API
```