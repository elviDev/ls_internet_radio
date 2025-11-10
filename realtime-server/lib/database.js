// Database client for realtime server
const { PrismaClient } = require('@prisma/client')

let prisma = null

function createPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    })

    // Handle graceful shutdown
    process.on('beforeExit', async () => {
      console.log('🔌 Disconnecting from database...')
      await prisma.$disconnect()
    })

    process.on('SIGINT', async () => {
      console.log('🔌 Disconnecting from database...')
      await prisma.$disconnect()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      console.log('🔌 Disconnecting from database...')
      await prisma.$disconnect()
      process.exit(0)
    })

    console.log('🗄️ Database client initialized')
  }

  return prisma
}

// Export singleton instance
module.exports = {
  db: createPrismaClient(),
  
  // Utility functions for chat operations
  chat: {
    // Save a chat message to database
    async saveMessage(messageData) {
      const db = createPrismaClient()
      
      try {
        const message = await db.chatMessage.create({
          data: {
            broadcastId: messageData.broadcastId,
            userId: messageData.userId,
            username: messageData.username,
            userAvatar: messageData.userAvatar || null,
            content: messageData.content,
            messageType: messageData.messageType || 'user',
            replyTo: messageData.replyTo || null,
            timestamp: messageData.timestamp || new Date(),
            emojis: messageData.emojis ? JSON.stringify(messageData.emojis) : null,
            likedBy: messageData.likedBy ? JSON.stringify(messageData.likedBy) : null,
          }
        })
        
        return message
      } catch (error) {
        console.error('Error saving chat message:', error)
        throw error
      }
    },

    // Get chat history for a broadcast
    async getHistory(broadcastId, limit = 50, offset = 0) {
      const db = createPrismaClient()
      
      try {
        const messages = await db.chatMessage.findMany({
          where: {
            broadcastId,
            isModerated: false
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: limit,
          skip: offset,
          include: {
            replyToMessage: {
              select: {
                id: true,
                username: true,
                content: true
              }
            }
          }
        })
        
        return messages.reverse() // Return in chronological order
      } catch (error) {
        console.error('Error fetching chat history:', error)
        throw error
      }
    },

    // Update message (for likes, pins, etc.)
    async updateMessage(messageId, updates) {
      const db = createPrismaClient()
      
      try {
        const message = await db.chatMessage.update({
          where: { id: messageId },
          data: updates
        })
        
        return message
      } catch (error) {
        console.error('Error updating chat message:', error)
        throw error
      }
    },

    // Moderate a message
    async moderateMessage(messageId, moderatorId, action, reason) {
      const db = createPrismaClient()
      
      try {
        // Update message
        const message = await db.chatMessage.update({
          where: { id: messageId },
          data: {
            isModerated: true,
            moderationReason: reason,
            moderatedBy: moderatorId,
            moderatedAt: new Date()
          }
        })

        // Log moderation action
        await db.chatModerationAction.create({
          data: {
            broadcastId: message.broadcastId,
            messageId: messageId,
            targetUserId: message.userId,
            moderatorId: moderatorId,
            actionType: action,
            reason: reason
          }
        })
        
        return message
      } catch (error) {
        console.error('Error moderating message:', error)
        throw error
      }
    },

    // Save user session
    async saveUserSession(sessionData) {
      const db = createPrismaClient()
      
      try {
        const session = await db.chatUserSession.upsert({
          where: {
            broadcastId_userId: {
              broadcastId: sessionData.broadcastId,
              userId: sessionData.userId
            }
          },
          update: {
            username: sessionData.username,
            userAvatar: sessionData.userAvatar,
            role: sessionData.role,
            isOnline: true,
            lastSeen: new Date(),
            isTyping: sessionData.isTyping || false
          },
          create: {
            broadcastId: sessionData.broadcastId,
            userId: sessionData.userId,
            username: sessionData.username,
            userAvatar: sessionData.userAvatar || null,
            role: sessionData.role || 'listener',
            isOnline: true,
            joinedAt: new Date(),
            lastSeen: new Date(),
            messageCount: 0
          }
        })
        
        return session
      } catch (error) {
        console.error('Error saving user session:', error)
        throw error
      }
    },

    // Update user session
    async updateUserSession(broadcastId, userId, updates) {
      const db = createPrismaClient()
      
      try {
        const session = await db.chatUserSession.update({
          where: {
            broadcastId_userId: {
              broadcastId,
              userId
            }
          },
          data: {
            ...updates,
            lastSeen: new Date()
          }
        })
        
        return session
      } catch (error) {
        console.error('Error updating user session:', error)
        throw error
      }
    },

    // Remove user session (when user leaves)
    async removeUserSession(broadcastId, userId) {
      const db = createPrismaClient()
      
      try {
        await db.chatUserSession.update({
          where: {
            broadcastId_userId: {
              broadcastId,
              userId
            }
          },
          data: {
            isOnline: false,
            leftAt: new Date()
          }
        })
      } catch (error) {
        console.error('Error removing user session:', error)
        throw error
      }
    },

    // Get active users in a broadcast
    async getActiveUsers(broadcastId) {
      const db = createPrismaClient()
      
      try {
        const users = await db.chatUserSession.findMany({
          where: {
            broadcastId,
            isOnline: true
          },
          orderBy: {
            joinedAt: 'desc'
          }
        })
        
        return users
      } catch (error) {
        console.error('Error fetching active users:', error)
        throw error
      }
    }
  },

  // Utility functions for broadcast operations
  broadcast: {
    // Save broadcast recording info
    async saveBroadcastRecording(broadcastData) {
      const db = createPrismaClient()
      
      try {
        // Check if broadcast exists
        const existingBroadcast = await db.liveBroadcast.findUnique({
          where: { id: broadcastData.broadcastId }
        })

        if (existingBroadcast) {
          // Update existing broadcast with recording info
          const broadcast = await db.liveBroadcast.update({
            where: { id: broadcastData.broadcastId },
            data: {
              recordingUrl: broadcastData.recordingUrl,
              status: broadcastData.status || 'ENDED',
              endTime: broadcastData.endTime || new Date()
            }
          })
          
          return broadcast
        } else {
          console.warn(`Broadcast ${broadcastData.broadcastId} not found in database`)
          return null
        }
      } catch (error) {
        console.error('Error saving broadcast recording:', error)
        throw error
      }
    },

    // Create archive from broadcast
    async createArchive(broadcastId, archiveData) {
      const db = createPrismaClient()
      
      try {
        // Get broadcast info
        const broadcast = await db.liveBroadcast.findUnique({
          where: { id: broadcastId },
          include: {
            hostUser: true,
            program: true
          }
        })

        if (!broadcast) {
          throw new Error('Broadcast not found')
        }

        // Create archive entry
        const archive = await db.archive.create({
          data: {
            title: archiveData.title || broadcast.title,
            slug: archiveData.slug || `${broadcast.slug}-archive`,
            description: archiveData.description || broadcast.description,
            host: broadcast.hostUser.firstName + ' ' + broadcast.hostUser.lastName,
            type: 'BROADCAST',
            status: 'ACTIVE',
            duration: archiveData.duration,
            audioFile: archiveData.audioFile,
            downloadUrl: archiveData.downloadUrl,
            coverImage: archiveData.coverImage || broadcast.banner?.url,
            originalAirDate: broadcast.startTime,
            broadcastId: broadcastId,
            createdById: broadcast.hostId,
            tags: archiveData.tags ? JSON.stringify(archiveData.tags) : null,
            metadata: JSON.stringify({
              originalBroadcastId: broadcastId,
              programId: broadcast.programId,
              autoRecord: broadcast.autoRecord,
              quality: broadcast.quality
            })
          }
        })

        return archive
      } catch (error) {
        console.error('Error creating archive:', error)
        throw error
      }
    },

    // Get broadcast info
    async getBroadcastInfo(broadcastId) {
      const db = createPrismaClient()
      
      try {
        const broadcast = await db.liveBroadcast.findUnique({
          where: { id: broadcastId },
          include: {
            hostUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                profileImage: true
              }
            },
            program: {
              select: {
                title: true,
                category: true
              }
            }
          }
        })
        
        return broadcast
      } catch (error) {
        console.error('Error fetching broadcast info:', error)
        throw error
      }
    }
  },

  // Analytics functions
  analytics: {
    // Save listener analytics
    async saveListenerAnalytics(data) {
      const db = createPrismaClient()
      
      try {
        const analytics = await db.listenerAnalytics.create({
          data: {
            broadcastId: data.broadcastId,
            listenerCount: data.listenerCount,
            peakListeners: data.peakListeners || data.listenerCount,
            geoData: data.geoData ? JSON.stringify(data.geoData) : null,
            deviceData: data.deviceData ? JSON.stringify(data.deviceData) : null
          }
        })
        
        return analytics
      } catch (error) {
        console.error('Error saving listener analytics:', error)
        throw error
      }
    }
  }
}