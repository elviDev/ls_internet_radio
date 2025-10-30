const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: dev ? '*' : false,
      methods: ['GET', 'POST']
    }
  })

  // Store active listeners and chat messages
  const listeners = new Map()
  const chatMessages = new Map()

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Join broadcast room
    socket.on('join-broadcast', (broadcastId, userInfo) => {
      socket.join(`broadcast-${broadcastId}`)
      
      const listener = {
        id: socket.id,
        broadcastId,
        joinedAt: new Date(),
        location: userInfo?.location || { city: 'Unknown', country: 'Unknown', countryCode: 'XX' },
        device: userInfo?.device || 'desktop',
        browser: userInfo?.browser || 'Unknown'
      }
      
      listeners.set(socket.id, listener)
      
      // Broadcast listener count update
      const broadcastListeners = Array.from(listeners.values())
        .filter(l => l.broadcastId === broadcastId)
      
      io.to(`broadcast-${broadcastId}`).emit('listener-count-update', {
        count: broadcastListeners.length,
        listeners: broadcastListeners
      })
    })

    // Handle chat messages
    socket.on('chat-message', (message) => {
      const chatMessage = {
        ...message,
        id: Date.now().toString(),
        timestamp: new Date()
      }

      if (!chatMessages.has(message.broadcastId)) {
        chatMessages.set(message.broadcastId, [])
      }
      
      chatMessages.get(message.broadcastId).push(chatMessage)
      
      // Broadcast to all listeners in the room
      io.to(`broadcast-${message.broadcastId}`).emit('new-chat-message', chatMessage)
    })

    // Handle stream status updates
    socket.on('stream-status', (broadcastId, status) => {
      socket.to(`broadcast-${broadcastId}`).emit('stream-status-update', status)
    })

    // Handle analytics updates
    socket.on('analytics-update', (broadcastId, analytics) => {
      socket.to(`broadcast-${broadcastId}`).emit('analytics-data', analytics)
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      const listener = listeners.get(socket.id)
      if (listener) {
        listeners.delete(socket.id)
        
        // Update listener count for the broadcast
        const broadcastListeners = Array.from(listeners.values())
          .filter(l => l.broadcastId === listener.broadcastId)
        
        io.to(`broadcast-${listener.broadcastId}`).emit('listener-count-update', {
          count: broadcastListeners.length,
          listeners: broadcastListeners
        })
      }
      console.log('Client disconnected:', socket.id)
    })
  })

  server
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log('> WebSocket server running')
    })
})