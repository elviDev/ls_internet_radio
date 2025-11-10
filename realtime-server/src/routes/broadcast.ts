import express, { Request, Response } from 'express'
import { BroadcastSession } from '../types'

const router = express.Router()

// In-memory storage (replace with database in production)
const activeBroadcasts = new Map<string, BroadcastSession>()

// Get active broadcasts
router.get('/active', (req: Request, res: Response) => {
  const broadcasts = Array.from(activeBroadcasts.values()).map(broadcast => ({
    broadcastId: broadcast.broadcastId,
    broadcasterInfo: broadcast.broadcasterInfo,
    isLive: broadcast.isLive,
    listeners: broadcast.listeners.size,
    uptime: Date.now() - broadcast.stats.startTime.getTime()
  }))

  res.json({
    broadcasts,
    count: broadcasts.length
  })
})

// Get broadcast statistics
router.get('/:broadcastId/stats', (req: Request, res: Response) => {
  const { broadcastId } = req.params
  const broadcast = activeBroadcasts.get(broadcastId)
  
  if (!broadcast) {
    return res.status(404).json({ error: 'Broadcast not found' })
  }

  res.json({
    broadcastId,
    listeners: broadcast.listeners.size,
    duration: Date.now() - broadcast.stats.startTime.getTime(),
    startTime: broadcast.stats.startTime,
    isLive: broadcast.isLive,
    peakListeners: broadcast.stats.peakListeners,
    totalCalls: broadcast.stats.totalCalls,
    audioSources: broadcast.audioSources.size,
    activeCalls: broadcast.activeCalls.size
  })
})

// Start broadcast session
router.post('/:broadcastId/start', (req: Request, res: Response) => {
  const { broadcastId } = req.params
  
  if (activeBroadcasts.has(broadcastId)) {
    return res.status(409).json({ error: 'Broadcast already active' })
  }

  const broadcast: BroadcastSession = {
    broadcastId,
    broadcaster: null,
    broadcasterInfo: {
      username: 'Radio Host',
      stationName: 'LS Radio'
    },
    listeners: new Set(),
    audioSources: new Map(),
    callQueue: [],
    activeCalls: new Map(),
    isLive: false,
    stats: {
      startTime: new Date(),
      peakListeners: 0,
      totalCalls: 0,
      totalMessages: 0
    }
  }

  activeBroadcasts.set(broadcastId, broadcast)

  res.json({
    success: true,
    broadcastId,
    startTime: broadcast.stats.startTime
  })
})

// End broadcast session
router.post('/:broadcastId/end', (req: Request, res: Response) => {
  const { broadcastId } = req.params
  const broadcast = activeBroadcasts.get(broadcastId)
  
  if (!broadcast) {
    return res.status(404).json({ error: 'Broadcast not found' })
  }

  activeBroadcasts.delete(broadcastId)

  res.json({
    success: true,
    broadcastId,
    endTime: new Date(),
    stats: {
      duration: Date.now() - broadcast.stats.startTime.getTime(),
      peakListeners: broadcast.stats.peakListeners,
      totalCalls: broadcast.stats.totalCalls
    }
  })
})

export default router