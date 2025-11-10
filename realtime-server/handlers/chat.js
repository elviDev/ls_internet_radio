// Enhanced chat handler with real-time features, typing indicators, and moderation
const { db, chat: chatDb } = require('../lib/database')
const chatRooms = new Map() // broadcastId -> { messages: [], users: Map, typingUsers: Map, settings: {} }
const userSessions = new Map() // socketId -> { userId, username, broadcastId, joinTime, messageCount }
const typingTimeouts = new Map() // socketId -> timeoutId

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('💬 Chat client connected:', socket.id)

    // Enhanced join chat room with better user tracking
    socket.on('join-chat', async (broadcastId, userInfo) => {
      console.log('👤 User joining chat:', broadcastId, userInfo)
      socket.join(`chat-${broadcastId}`)
      
      // Initialize chat room if it doesn't exist
      if (!chatRooms.has(broadcastId)) {
        chatRooms.set(broadcastId, {
          messages: [],
          users: new Map(), // socketId -> userInfo
          typingUsers: new Map(), // socketId -> { username, startTime }
          settings: {
            slowMode: 0,
            maxMessageLength: 500,
            allowEmojis: true,
            moderationEnabled: true
          },
          stats: {
            totalMessages: 0,
            totalUsers: 0,
            createdAt: new Date()
          }
        })
      }
      
      const room = chatRooms.get(broadcastId)
      const user = {
        id: socket.id,
        userId: userInfo.userId || socket.id,
        username: userInfo.username || 'Anonymous',
        role: userInfo.role || 'listener',
        avatar: userInfo.avatar,
        joinedAt: new Date(),
        lastActivity: new Date(),
        messageCount: 0,
        isTyping: false,
        isMuted: false,
        isBanned: false
      }
      
      // Add user to room and session tracking
      room.users.set(socket.id, user)
      userSessions.set(socket.id, {
        userId: user.userId,
        username: user.username,
        broadcastId,
        joinTime: new Date(),
        messageCount: 0
      })
      
      // Save user session to database
      try {
        await chatDb.saveUserSession({
          broadcastId,
          userId: user.userId,
          username: user.username,
          userAvatar: user.avatar,
          role: user.role
        })
      } catch (error) {
        console.error('Error saving user session to database:', error)
      }
      
      // Update stats
      room.stats.totalUsers++
      
      // Load and send chat history from database
      try {
        const dbMessages = await chatDb.getHistory(broadcastId, 50)
        const formattedMessages = dbMessages.map(msg => ({
          id: msg.id,
          userId: msg.userId,
          username: msg.username,
          userAvatar: msg.userAvatar,
          content: msg.content,
          messageType: msg.messageType,
          timestamp: msg.timestamp,
          likes: msg.likes,
          likedBy: msg.likedBy ? JSON.parse(msg.likedBy) : [],
          emojis: msg.emojis ? JSON.parse(msg.emojis) : {},
          isPinned: msg.isPinned,
          isHighlighted: msg.isHighlighted,
          replyTo: msg.replyTo,
          replyToMessage: msg.replyToMessage
        }))
        
        socket.emit('chat-history', {
          messages: formattedMessages,
          settings: room.settings,
          userCount: room.users.size
        })
      } catch (error) {
        console.error('Error loading chat history:', error)
        socket.emit('chat-history', {
          messages: room.messages.slice(-50),
          settings: room.settings,
          userCount: room.users.size
        })
      }
      
      // Send current online users
      socket.emit('users-online', {
        users: Array.from(room.users.values()).map(u => ({
          id: u.id,
          username: u.username,
          role: u.role,
          avatar: u.avatar,
          isTyping: u.isTyping
        })),
        count: room.users.size
      })
      
      // Notify room of new user
      socket.to(`chat-${broadcastId}`).emit('user-joined', {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          avatar: user.avatar
        },
        userCount: room.users.size,
        timestamp: new Date().toISOString()
      })
      
      console.log(`👥 User ${user.username} joined chat ${broadcastId} (${room.users.size} total users)`)
    })

    // Enhanced message handling with rate limiting and validation
    socket.on('send-message', async (broadcastId, messageData) => {
      const room = chatRooms.get(broadcastId)
      const user = room?.users.get(socket.id)
      
      if (!room || !user) {
        socket.emit('message-error', { error: 'Room or user not found' })
        return
      }
      
      // Check if user is muted or banned
      if (user.isMuted) {
        socket.emit('message-error', { error: 'You are muted' })
        return
      }
      
      if (user.isBanned) {
        socket.emit('message-error', { error: 'You are banned from this chat' })
        return
      }
      
      // Validate message content
      const content = messageData.content?.trim()
      if (!content || content.length === 0) {
        socket.emit('message-error', { error: 'Message cannot be empty' })
        return
      }
      
      if (content.length > room.settings.maxMessageLength) {
        socket.emit('message-error', { 
          error: `Message too long. Maximum ${room.settings.maxMessageLength} characters.` 
        })
        return
      }
      
      // Rate limiting - check slow mode
      if (room.settings.slowMode > 0 && user.role === 'listener') {
        const timeSinceLastMessage = Date.now() - (user.lastMessageTime || 0)
        if (timeSinceLastMessage < room.settings.slowMode * 1000) {
          const waitTime = Math.ceil((room.settings.slowMode * 1000 - timeSinceLastMessage) / 1000)
          socket.emit('message-error', { 
            error: `Slow mode enabled. Please wait ${waitTime} seconds.` 
          })
          return
        }
      }
      
      // Stop typing indicator
      if (room.typingUsers.has(socket.id)) {
        room.typingUsers.delete(socket.id)
        user.isTyping = false
        
        socket.to(`chat-${broadcastId}`).emit('user-stopped-typing', {
          userId: socket.id,
          username: user.username,
          timestamp: new Date().toISOString()
        })
      }
      
      // Clear typing timeout
      if (typingTimeouts.has(socket.id)) {
        clearTimeout(typingTimeouts.get(socket.id))
        typingTimeouts.delete(socket.id)
      }
      
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const message = {
        id: messageId,
        userId: user.userId,
        username: user.username,
        content: content,
        messageType: messageData.messageType || 'user',
        role: user.role,
        avatar: user.avatar,
        timestamp: new Date(),
        socketId: socket.id,
        likes: 0,
        likedBy: [],
        reactions: {},
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        replyTo: messageData.replyTo
      }
      
      // Store message in memory and database
      room.messages.push(message)
      room.stats.totalMessages++
      
      // Save message to database
      try {
        const dbMessage = await chatDb.saveMessage({
          broadcastId: state.currentBroadcast,
          userId: user.userId,
          username: user.username,
          userAvatar: user.avatar,
          content: content,
          messageType: messageData.messageType || 'user',
          replyTo: messageData.replyTo,
          timestamp: message.timestamp
        })
        
        // Update message with database ID
        message.id = dbMessage.id
      } catch (error) {
        console.error('Error saving message to database:', error)
        // Continue with in-memory message even if DB save fails
      }
      
      // Update user stats
      user.messageCount++
      user.lastActivity = new Date()
      user.lastMessageTime = Date.now()
      
      // Update session stats
      const session = userSessions.get(socket.id)
      if (session) {
        session.messageCount++
      }
      
      // Update user session in database
      try {
        await chatDb.updateUserSession(broadcastId, user.userId, {
          messageCount: user.messageCount,
          lastSeen: user.lastActivity
        })
      } catch (error) {
        console.error('Error updating user session in database:', error)
      }
      
      // Keep only last 200 messages
      if (room.messages.length > 200) {
        room.messages = room.messages.slice(-200)
      }
      
      // Broadcast message to room
      io.to(`chat-${broadcastId}`).emit('new-message', {
        ...message,
        userCount: room.users.size,
        totalMessages: room.stats.totalMessages
      })
      
      console.log(`💬 Message from ${user.username} in ${broadcastId}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`)
    })

    // Handle announcements (staff only)
    socket.on('send-announcement', (broadcastId, announcementData) => {
      if (!announcementData.isStaff) return
      
      const announcement = {
        id: Date.now().toString(),
        username: 'System',
        content: announcementData.content,
        type: 'announcement',
        timestamp: new Date(),
        author: announcementData.username
      }
      
      const room = chatRooms.get(broadcastId)
      if (room) {
        room.messages.push(announcement)
      }
      
      io.to(`chat-${broadcastId}`).emit('new-message', announcement)
      io.to(`chat-${broadcastId}`).emit('announcement', announcement)
    })

    // Handle message reactions
    socket.on('react-to-message', (broadcastId, messageId, reaction) => {
      socket.to(`chat-${broadcastId}`).emit('message-reaction', {
        messageId,
        reaction,
        userId: socket.id
      })
    })

    // Enhanced typing indicators with automatic cleanup
    socket.on('typing-start', (broadcastId, username) => {
      const room = chatRooms.get(broadcastId)
      if (!room) return
      
      const user = room.users.get(socket.id)
      if (!user) return
      
      // Clear any existing typing timeout
      if (typingTimeouts.has(socket.id)) {
        clearTimeout(typingTimeouts.get(socket.id))
      }
      
      // Add to typing users
      room.typingUsers.set(socket.id, {
        username: user.username,
        startTime: new Date()
      })
      
      // Update user status
      user.isTyping = true
      user.lastActivity = new Date()
      
      // Broadcast typing indicator
      socket.to(`chat-${broadcastId}`).emit('user-typing', {
        userId: socket.id,
        username: user.username,
        timestamp: new Date().toISOString()
      })
      
      // Auto-stop typing after 3 seconds
      const timeoutId = setTimeout(() => {
        if (room.typingUsers.has(socket.id)) {
          room.typingUsers.delete(socket.id)
          user.isTyping = false
          
          socket.to(`chat-${broadcastId}`).emit('user-stopped-typing', {
            userId: socket.id,
            username: user.username,
            timestamp: new Date().toISOString()
          })
        }
        typingTimeouts.delete(socket.id)
      }, 3000)
      
      typingTimeouts.set(socket.id, timeoutId)
    })

    socket.on('typing-stop', (broadcastId, username) => {
      const room = chatRooms.get(broadcastId)
      if (!room) return
      
      const user = room.users.get(socket.id)
      if (!user) return
      
      // Clear typing timeout
      if (typingTimeouts.has(socket.id)) {
        clearTimeout(typingTimeouts.get(socket.id))
        typingTimeouts.delete(socket.id)
      }
      
      // Remove from typing users
      if (room.typingUsers.has(socket.id)) {
        room.typingUsers.delete(socket.id)
        user.isTyping = false
        
        socket.to(`chat-${broadcastId}`).emit('user-stopped-typing', {
          userId: socket.id,
          username: user.username,
          timestamp: new Date().toISOString()
        })
      }
    })
    
    // Get typing users for a room
    socket.on('get-typing-users', (broadcastId) => {
      const room = chatRooms.get(broadcastId)
      if (room) {
        const typingUsers = Array.from(room.typingUsers.values())
        socket.emit('typing-users-update', {
          broadcastId,
          typingUsers,
          count: typingUsers.length
        })
      }
    })

    // Handle disconnect with proper cleanup
    socket.on('disconnect', async () => {
      console.log('💬 Chat client disconnected:', socket.id)
      
      // Clean up typing timeouts
      if (typingTimeouts.has(socket.id)) {
        clearTimeout(typingTimeouts.get(socket.id))
        typingTimeouts.delete(socket.id)
      }
      
      // Remove user from all rooms
      for (const [broadcastId, room] of chatRooms.entries()) {
        const user = room.users.get(socket.id)
        
        if (user) {
          // Remove from typing users
          if (room.typingUsers.has(socket.id)) {
            room.typingUsers.delete(socket.id)
            
            // Notify others that user stopped typing
            socket.to(`chat-${broadcastId}`).emit('user-stopped-typing', {
              userId: socket.id,
              username: user.username,
              timestamp: new Date().toISOString()
            })
          }
          
          // Remove user from room
          room.users.delete(socket.id)
          
          // Update user session in database (mark as offline)
          try {
            await chatDb.removeUserSession(broadcastId, user.userId)
          } catch (error) {
            console.error('Error updating user session in database:', error)
          }
          
          // Notify room of user leaving
          socket.to(`chat-${broadcastId}`).emit('user-left', {
            user: {
              id: user.id,
              username: user.username,
              role: user.role
            },
            userCount: room.users.size,
            timestamp: new Date().toISOString()
          })
          
          console.log(`👋 User ${user.username} left chat ${broadcastId} (${room.users.size} remaining)`)
        }
      }
      
      // Clean up session tracking
      userSessions.delete(socket.id)
    })
  })
  
  // Periodic cleanup for chat rooms
  setInterval(() => {
    const now = new Date()
    
    for (const [broadcastId, room] of chatRooms.entries()) {
      // Clean up old typing indicators (older than 10 seconds)
      for (const [socketId, typingInfo] of room.typingUsers.entries()) {
        if (now.getTime() - typingInfo.startTime.getTime() > 10000) {
          room.typingUsers.delete(socketId)
          
          const user = room.users.get(socketId)
          if (user) {
            user.isTyping = false
            
            // Notify others
            io.to(`chat-${broadcastId}`).emit('user-stopped-typing', {
              userId: socketId,
              username: typingInfo.username,
              timestamp: new Date().toISOString()
            })
          }
        }
      }
      
      // Clean up empty rooms (no users for 30 minutes)
      if (room.users.size === 0) {
        const roomAge = now.getTime() - room.stats.createdAt.getTime()
        if (roomAge > 30 * 60 * 1000) { // 30 minutes
          console.log(`🧹 Cleaning up empty chat room: ${broadcastId}`)
          chatRooms.delete(broadcastId)
        }
      }
    }
    
    // Clean up orphaned timeouts
    for (const [socketId, timeoutId] of typingTimeouts.entries()) {
      let found = false
      for (const room of chatRooms.values()) {
        if (room.users.has(socketId)) {
          found = true
          break
        }
      }
      if (!found) {
        clearTimeout(timeoutId)
        typingTimeouts.delete(socketId)
      }
    }
  }, 60000) // Every minute
}