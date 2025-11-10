import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

import chatRoutes from './routes/chat'
import broadcastRoutes from './routes/broadcast'
import streamRoutes from './routes/stream'
import unifiedAudioHandler from './handlers/unified-audio'
import chatHandler from './handlers/chat'

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
app.use('/stream', streamRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
})

// Add connection logging
io.on('connection', (socket) => {
  console.log(`🔗 Client connected: ${socket.id}`)
  
  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id}, reason: ${reason}`)
  })
  
  socket.on('error', (error) => {
    console.error(`🚨 Socket error for ${socket.id}:`, error)
  })
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