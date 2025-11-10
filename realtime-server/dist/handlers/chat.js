"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = chatHandler;
const chatRooms = new Map();
const userSessions = new Map();
const typingTimeouts = new Map();
function chatHandler(io) {
    io.on('connection', (socket) => {
        console.log('💬 Chat client connected:', socket.id);
        socket.on('join-chat', async (broadcastId, userInfo) => {
            console.log('👤 User joining chat:', broadcastId, userInfo);
            socket.join(`chat-${broadcastId}`);
            if (!chatRooms.has(broadcastId)) {
                const room = {
                    messages: [],
                    users: new Map(),
                    typingUsers: new Map(),
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
                };
                chatRooms.set(broadcastId, room);
            }
            const room = chatRooms.get(broadcastId);
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
            };
            room.users.set(socket.id, user);
            userSessions.set(socket.id, {
                userId: user.userId,
                username: user.username,
                broadcastId,
                joinTime: new Date(),
                messageCount: 0
            });
            room.stats.totalUsers++;
            socket.emit('chat-history', {
                messages: room.messages.slice(-50),
                settings: room.settings,
                userCount: room.users.size
            });
            socket.emit('users-online', {
                users: Array.from(room.users.values()).map(u => ({
                    id: u.id,
                    username: u.username,
                    role: u.role,
                    avatar: u.avatar,
                    isTyping: u.isTyping
                })),
                count: room.users.size
            });
            socket.to(`chat-${broadcastId}`).emit('user-joined', {
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    avatar: user.avatar
                },
                userCount: room.users.size,
                timestamp: new Date().toISOString()
            });
            console.log(`👥 User ${user.username} joined chat ${broadcastId} (${room.users.size} total users)`);
        });
        socket.on('send-message', async (broadcastId, messageData) => {
            const room = chatRooms.get(broadcastId);
            const user = room?.users.get(socket.id);
            if (!room || !user) {
                socket.emit('message-error', { error: 'Room or user not found' });
                return;
            }
            if (user.isMuted || user.isBanned) {
                socket.emit('message-error', { error: 'You are muted or banned' });
                return;
            }
            const content = messageData.content?.trim();
            if (!content || content.length === 0) {
                socket.emit('message-error', { error: 'Message cannot be empty' });
                return;
            }
            if (content.length > room.settings.maxMessageLength) {
                socket.emit('message-error', {
                    error: `Message too long. Maximum ${room.settings.maxMessageLength} characters.`
                });
                return;
            }
            // Rate limiting - check slow mode
            if (room.settings.slowMode > 0 && user.role === 'listener') {
                const timeSinceLastMessage = Date.now() - (user.lastMessageTime || 0);
                if (timeSinceLastMessage < room.settings.slowMode * 1000) {
                    const waitTime = Math.ceil((room.settings.slowMode * 1000 - timeSinceLastMessage) / 1000);
                    socket.emit('message-error', {
                        error: `Slow mode enabled. Please wait ${waitTime} seconds.`
                    });
                    return;
                }
            }
            // Stop typing indicator
            if (room.typingUsers.has(socket.id)) {
                room.typingUsers.delete(socket.id);
                user.isTyping = false;
                socket.to(`chat-${broadcastId}`).emit('user-stopped-typing', {
                    userId: socket.id,
                    username: user.username,
                    timestamp: new Date().toISOString()
                });
            }
            if (typingTimeouts.has(socket.id)) {
                clearTimeout(typingTimeouts.get(socket.id));
                typingTimeouts.delete(socket.id);
            }
            const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
            };
            room.messages.push(message);
            room.stats.totalMessages++;
            user.messageCount++;
            user.lastActivity = new Date();
            user.lastMessageTime = Date.now();
            const session = userSessions.get(socket.id);
            if (session) {
                session.messageCount++;
            }
            if (room.messages.length > 200) {
                room.messages = room.messages.slice(-200);
            }
            io.to(`chat-${broadcastId}`).emit('new-message', {
                ...message,
                broadcastId,
                userCount: room.users.size,
                totalMessages: room.stats.totalMessages
            });
            console.log(`💬 Message from ${user.username} in ${broadcastId}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);
        });
        socket.on('send-announcement', (broadcastId, announcementData) => {
            if (!announcementData.isStaff)
                return;
            const announcement = {
                id: Date.now().toString(),
                username: 'System',
                content: announcementData.content,
                messageType: 'announcement',
                timestamp: new Date()
            };
            const room = chatRooms.get(broadcastId);
            if (room) {
                room.messages.push(announcement);
            }
            io.to(`chat-${broadcastId}`).emit('new-message', announcement);
            io.to(`chat-${broadcastId}`).emit('announcement', announcement);
        });
        socket.on('react-to-message', (broadcastId, messageId, reaction) => {
            socket.to(`chat-${broadcastId}`).emit('message-reaction', {
                messageId,
                reaction,
                userId: socket.id
            });
        });
        socket.on('edit-message', (broadcastId, messageId, newContent) => {
            const room = chatRooms.get(broadcastId);
            const user = room?.users.get(socket.id);
            if (!room || !user) {
                socket.emit('message-error', { error: 'Room or user not found' });
                return;
            }
            const message = room.messages.find(msg => msg.id === messageId);
            if (!message) {
                socket.emit('message-error', { error: 'Message not found' });
                return;
            }
            if (message.userId !== user.userId) {
                socket.emit('message-error', { error: 'Not authorized to edit this message' });
                return;
            }
            message.content = newContent.trim();
            message.isEdited = true;
            io.to(`chat-${broadcastId}`).emit('message-edited', {
                messageId,
                newContent: message.content,
                editedAt: new Date().toISOString()
            });
        });
        socket.on('delete-message', (broadcastId, messageId) => {
            const room = chatRooms.get(broadcastId);
            const user = room?.users.get(socket.id);
            if (!room || !user) {
                socket.emit('message-error', { error: 'Room or user not found' });
                return;
            }
            const messageIndex = room.messages.findIndex(msg => msg.id === messageId);
            if (messageIndex === -1) {
                socket.emit('message-error', { error: 'Message not found' });
                return;
            }
            const message = room.messages[messageIndex];
            if (message.userId !== user.userId && user.role !== 'broadcaster' && user.role !== 'moderator') {
                socket.emit('message-error', { error: 'Not authorized to delete this message' });
                return;
            }
            room.messages.splice(messageIndex, 1);
            io.to(`chat-${broadcastId}`).emit('message-deleted', {
                messageId,
                deletedBy: user.username,
                deletedAt: new Date().toISOString()
            });
        });
        socket.on('typing-start', (broadcastId, username) => {
            const room = chatRooms.get(broadcastId);
            if (!room)
                return;
            const user = room.users.get(socket.id);
            if (!user)
                return;
            if (typingTimeouts.has(socket.id)) {
                clearTimeout(typingTimeouts.get(socket.id));
            }
            const typingInfo = {
                username: user.username,
                startTime: new Date()
            };
            room.typingUsers.set(socket.id, typingInfo);
            user.isTyping = true;
            user.lastActivity = new Date();
            socket.to(`chat-${broadcastId}`).emit('user-typing', {
                userId: socket.id,
                username: user.username,
                timestamp: new Date().toISOString()
            });
            const timeoutId = setTimeout(() => {
                if (room.typingUsers.has(socket.id)) {
                    room.typingUsers.delete(socket.id);
                    user.isTyping = false;
                    socket.to(`chat-${broadcastId}`).emit('user-stopped-typing', {
                        userId: socket.id,
                        username: user.username,
                        timestamp: new Date().toISOString()
                    });
                }
                typingTimeouts.delete(socket.id);
            }, 3000);
            typingTimeouts.set(socket.id, timeoutId);
        });
        socket.on('typing-stop', (broadcastId, username) => {
            const room = chatRooms.get(broadcastId);
            if (!room)
                return;
            const user = room.users.get(socket.id);
            if (!user)
                return;
            if (typingTimeouts.has(socket.id)) {
                clearTimeout(typingTimeouts.get(socket.id));
                typingTimeouts.delete(socket.id);
            }
            if (room.typingUsers.has(socket.id)) {
                room.typingUsers.delete(socket.id);
                user.isTyping = false;
                socket.to(`chat-${broadcastId}`).emit('user-stopped-typing', {
                    userId: socket.id,
                    username: user.username,
                    timestamp: new Date().toISOString()
                });
            }
        });
        socket.on('disconnect', async () => {
            console.log('💬 Chat client disconnected:', socket.id);
            if (typingTimeouts.has(socket.id)) {
                clearTimeout(typingTimeouts.get(socket.id));
                typingTimeouts.delete(socket.id);
            }
            for (const [broadcastId, room] of chatRooms.entries()) {
                const user = room.users.get(socket.id);
                if (user) {
                    if (room.typingUsers.has(socket.id)) {
                        room.typingUsers.delete(socket.id);
                        socket.to(`chat-${broadcastId}`).emit('user-stopped-typing', {
                            userId: socket.id,
                            username: user.username,
                            timestamp: new Date().toISOString()
                        });
                    }
                    room.users.delete(socket.id);
                    socket.to(`chat-${broadcastId}`).emit('user-left', {
                        user: {
                            id: user.id,
                            username: user.username,
                            role: user.role
                        },
                        userCount: room.users.size,
                        timestamp: new Date().toISOString()
                    });
                    console.log(`👋 User ${user.username} left chat ${broadcastId} (${room.users.size} remaining)`);
                }
            }
            userSessions.delete(socket.id);
        });
    });
    // Periodic cleanup
    setInterval(() => {
        const now = new Date();
        for (const [broadcastId, room] of chatRooms.entries()) {
            // Clean up old typing indicators
            for (const [socketId, typingInfo] of room.typingUsers.entries()) {
                if (now.getTime() - typingInfo.startTime.getTime() > 10000) {
                    room.typingUsers.delete(socketId);
                    const user = room.users.get(socketId);
                    if (user) {
                        user.isTyping = false;
                        io.to(`chat-${broadcastId}`).emit('user-stopped-typing', {
                            userId: socketId,
                            username: typingInfo.username,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }
            // Clean up empty rooms
            if (room.users.size === 0) {
                const roomAge = now.getTime() - room.stats.createdAt.getTime();
                if (roomAge > 30 * 60 * 1000) {
                    console.log(`🧹 Cleaning up empty chat room: ${broadcastId}`);
                    chatRooms.delete(broadcastId);
                }
            }
        }
        // Clean up orphaned timeouts
        for (const [socketId, timeoutId] of typingTimeouts.entries()) {
            let found = false;
            for (const room of chatRooms.values()) {
                if (room.users.has(socketId)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                clearTimeout(timeoutId);
                typingTimeouts.delete(socketId);
            }
        }
    }, 60000);
}
//# sourceMappingURL=chat.js.map