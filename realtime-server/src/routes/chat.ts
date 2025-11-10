import express, { Request, Response } from 'express'
import { ChatRoom } from '../types'

const router = express.Router()

// In-memory storage (replace with database in production)
const chatRooms = new Map<string, ChatRoom>()

// Get chat room info
router.get('/:broadcastId', (req: Request, res: Response) => {
  const { broadcastId } = req.params
  const room = chatRooms.get(broadcastId)
  
  if (!room) {
    return res.status(404).json({ error: 'Chat room not found' })
  }

  res.json({
    broadcastId,
    userCount: room.users.size,
    messageCount: room.messages.length,
    settings: room.settings,
    stats: room.stats
  })
})

// Get chat history
router.get('/:broadcastId/history', (req: Request, res: Response) => {
  const { broadcastId } = req.params
  const { limit = 50 } = req.query
  const room = chatRooms.get(broadcastId)
  
  if (!room) {
    return res.status(404).json({ error: 'Chat room not found' })
  }

  const messages = room.messages
    .slice(-Number(limit))
    .map(msg => ({
      id: msg.id,
      username: msg.username,
      content: msg.content,
      timestamp: msg.timestamp,
      messageType: msg.messageType,
      likes: msg.likes
    }))

  res.json({ messages })
})

// Update chat settings (admin only)
router.put('/:broadcastId/settings', (req: Request, res: Response) => {
  const { broadcastId } = req.params
  const { slowMode, maxMessageLength, allowEmojis, moderationEnabled } = req.body
  
  const room = chatRooms.get(broadcastId)
  if (!room) {
    return res.status(404).json({ error: 'Chat room not found' })
  }

  if (slowMode !== undefined) room.settings.slowMode = slowMode
  if (maxMessageLength !== undefined) room.settings.maxMessageLength = maxMessageLength
  if (allowEmojis !== undefined) room.settings.allowEmojis = allowEmojis
  if (moderationEnabled !== undefined) room.settings.moderationEnabled = moderationEnabled

  res.json({
    success: true,
    settings: room.settings
  })
})

// Edit message
router.put('/:broadcastId/messages/:messageId', (req: Request, res: Response) => {
  const { broadcastId, messageId } = req.params
  const { content, userId } = req.body
  
  const room = chatRooms.get(broadcastId)
  if (!room) {
    return res.status(404).json({ error: 'Chat room not found' })
  }

  const message = room.messages.find(msg => msg.id === messageId)
  if (!message) {
    return res.status(404).json({ error: 'Message not found' })
  }

  if (message.userId !== userId) {
    return res.status(403).json({ error: 'Not authorized to edit this message' })
  }

  message.content = content
  message.isEdited = true

  res.json({ success: true, message })
})

// Delete message
router.delete('/:broadcastId/messages/:messageId', (req: Request, res: Response) => {
  const { broadcastId, messageId } = req.params
  const { userId } = req.body
  
  const room = chatRooms.get(broadcastId)
  if (!room) {
    return res.status(404).json({ error: 'Chat room not found' })
  }

  const messageIndex = room.messages.findIndex(msg => msg.id === messageId)
  if (messageIndex === -1) {
    return res.status(404).json({ error: 'Message not found' })
  }

  const message = room.messages[messageIndex]
  if (message.userId !== userId) {
    return res.status(403).json({ error: 'Not authorized to delete this message' })
  }

  room.messages.splice(messageIndex, 1)
  res.json({ success: true })
})

export default router
export { chatRooms }