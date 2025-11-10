require('dotenv').config()
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const chatRoutes = require('./routes/chat')
const broadcastRoutes = require('./routes/broadcast')
const unifiedAudioHandler = require('./handlers/unified-audio')
const chatHandler = require('./handlers/chat')

const app = express()
const server = createServer(app)

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// Routes
app.use('/api/chat', chatRoutes)
app.use('/api/broadcast', broadcastRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

// Initialize unified audio and chat handlers
const audioManager = unifiedAudioHandler(io)
chatHandler(io)

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`🚀 Realtime server running on port ${PORT}`)
  console.log(`📡 Unified Audio System and Socket.IO ready`)
  console.log(`🎙️ Multi-host broadcasting and audio mixing enabled`)
})