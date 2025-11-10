"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeClient = void 0;
const socket_io_client_1 = require("socket.io-client");
class RealtimeClient {
    constructor(serverUrl = 'http://localhost:3001') {
        this.serverUrl = serverUrl;
        this.socket = (0, socket_io_client_1.io)(serverUrl, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
    }
    // Chat methods
    joinChat(broadcastId, userInfo) {
        this.socket.emit('join-chat', broadcastId, userInfo);
    }
    sendMessage(broadcastId, message) {
        this.socket.emit('send-message', broadcastId, message);
    }
    sendAnnouncement(broadcastId, content, username) {
        this.socket.emit('send-announcement', broadcastId, {
            content,
            username,
            isStaff: true
        });
    }
    startTyping(broadcastId, username) {
        this.socket.emit('typing-start', broadcastId, username);
    }
    stopTyping(broadcastId, username) {
        this.socket.emit('typing-stop', broadcastId, username);
    }
    reactToMessage(broadcastId, messageId, reaction) {
        this.socket.emit('react-to-message', broadcastId, messageId, reaction);
    }
    // Broadcasting methods
    joinAsBroadcaster(broadcastId, broadcasterInfo) {
        this.socket.emit('join-as-broadcaster', broadcastId, broadcasterInfo);
    }
    joinBroadcast(broadcastId, listenerInfo) {
        this.socket.emit('join-broadcast', broadcastId, listenerInfo);
    }
    broadcastAudio(broadcastId, audioData) {
        this.socket.emit('broadcast-audio', broadcastId, audioData);
    }
    addAudioSource(broadcastId, sourceInfo) {
        this.socket.emit('add-audio-source', broadcastId, sourceInfo);
    }
    updateAudioSource(broadcastId, sourceId, updates) {
        this.socket.emit('update-audio-source', broadcastId, sourceId, updates);
    }
    removeAudioSource(broadcastId, sourceId) {
        this.socket.emit('remove-audio-source', broadcastId, sourceId);
    }
    // Call management
    requestCall(broadcastId, callerInfo) {
        this.socket.emit('request-call', broadcastId, callerInfo);
    }
    acceptCall(callId) {
        this.socket.emit('accept-call', callId);
    }
    rejectCall(callId, reason) {
        this.socket.emit('reject-call', callId, reason);
    }
    endCall(callId) {
        this.socket.emit('end-call', callId);
    }
    getCallQueue(broadcastId) {
        this.socket.emit('get-call-queue', broadcastId);
    }
    getBroadcastStats(broadcastId) {
        this.socket.emit('get-broadcast-stats', broadcastId);
    }
    // Event listeners
    onNewMessage(callback) {
        this.socket.on('new-message', callback);
    }
    onChatHistory(callback) {
        this.socket.on('chat-history', callback);
    }
    onUserJoined(callback) {
        this.socket.on('user-joined', callback);
    }
    onUserLeft(callback) {
        this.socket.on('user-left', callback);
    }
    onUserTyping(callback) {
        this.socket.on('user-typing', callback);
    }
    onUserStoppedTyping(callback) {
        this.socket.on('user-stopped-typing', callback);
    }
    onBroadcasterReady(callback) {
        this.socket.on('broadcaster-ready', callback);
    }
    onBroadcastInfo(callback) {
        this.socket.on('broadcast-info', callback);
    }
    onListenerCount(callback) {
        this.socket.on('listener-count', callback);
    }
    onAudioStream(callback) {
        this.socket.on('audio-stream', callback);
    }
    onAudioSourceAdded(callback) {
        this.socket.on('audio-source-added', callback);
    }
    onAudioSourceUpdated(callback) {
        this.socket.on('audio-source-updated', callback);
    }
    onAudioSourceRemoved(callback) {
        this.socket.on('audio-source-removed', callback);
    }
    onIncomingCall(callback) {
        this.socket.on('incoming-call', callback);
    }
    onCallPending(callback) {
        this.socket.on('call-pending', callback);
    }
    onCallAccepted(callback) {
        this.socket.on('call-accepted', callback);
    }
    onCallRejected(callback) {
        this.socket.on('call-rejected', callback);
    }
    onCallEnded(callback) {
        this.socket.on('call-ended', callback);
    }
    onCallTimeout(callback) {
        this.socket.on('call-timeout', callback);
    }
    onCallError(callback) {
        this.socket.on('call-error', callback);
    }
    onCallQueueUpdate(callback) {
        this.socket.on('call-queue-update', callback);
    }
    onBroadcastStats(callback) {
        this.socket.on('broadcast-stats', callback);
    }
    onBroadcastEnded(callback) {
        this.socket.on('broadcast-ended', callback);
    }
    onServerStats(callback) {
        this.socket.on('server-stats', callback);
    }
    onMessageError(callback) {
        this.socket.on('message-error', callback);
    }
    onAnnouncement(callback) {
        this.socket.on('announcement', callback);
    }
    onMessageReaction(callback) {
        this.socket.on('message-reaction', callback);
    }
    editMessage(broadcastId, messageId, newContent) {
        this.socket.emit('edit-message', broadcastId, messageId, newContent);
    }
    deleteMessage(broadcastId, messageId) {
        this.socket.emit('delete-message', broadcastId, messageId);
    }
    onMessageEdited(callback) {
        this.socket.on('message-edited', callback);
    }
    onMessageDeleted(callback) {
        this.socket.on('message-deleted', callback);
    }
    // Utility methods
    disconnect() {
        this.socket.disconnect();
    }
    isConnected() {
        return this.socket.connected;
    }
    getSocket() {
        return this.socket;
    }
}
exports.RealtimeClient = RealtimeClient;
//# sourceMappingURL=realtime-client.js.map