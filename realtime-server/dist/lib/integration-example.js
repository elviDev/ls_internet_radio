"use strict";
// Integration Example: How Frontend Connects to TypeScript Backend
// This demonstrates the complete flow between frontend and backend
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadioStationIntegration = void 0;
exports.initializeBroadcasterExample = initializeBroadcasterExample;
exports.initializeListenerExample = initializeListenerExample;
// Integration Example: How Frontend Connects to TypeScript Backend
// Note: This example shows the integration pattern.
// In actual implementation, these would be imported from the frontend lib directory.
class RadioStationIntegration {
    constructor(broadcastId) {
        this.broadcastId = broadcastId;
        // In actual implementation:
        // this.realtimeClient = new RealtimeClient('http://localhost:3001')
        // this.audioSystem = new UnifiedAudioSystem({ ... })
    }
    // Initialize broadcaster (studio interface)
    async initializeBroadcaster(broadcasterInfo) {
        try {
            // 1. Initialize audio system
            await this.audioSystem.initialize();
            // 2. Connect to realtime server
            this.realtimeClient.joinAsBroadcaster(this.broadcastId, broadcasterInfo);
            // 3. Set up event handlers
            this.setupBroadcasterHandlers();
            // 4. Add main host audio source
            await this.audioSystem.addAudioSource({
                id: 'main-host',
                type: 'host',
                name: 'Main Host',
                volume: 1.0,
                isMuted: false,
                isActive: true,
                priority: 1
            });
            console.log('🎙️ Broadcaster initialized successfully');
            return true;
        }
        catch (error) {
            console.error('Failed to initialize broadcaster:', error);
            throw error;
        }
    }
    // Initialize listener (public interface)
    async initializeListener(listenerInfo) {
        try {
            // 1. Connect to realtime server as listener
            this.realtimeClient.joinBroadcast(this.broadcastId, listenerInfo);
            // 2. Set up event handlers
            this.setupListenerHandlers();
            console.log('🎧 Listener initialized successfully');
            return true;
        }
        catch (error) {
            console.error('Failed to initialize listener:', error);
            throw error;
        }
    }
    // Set up broadcaster event handlers
    setupBroadcasterHandlers() {
        // Broadcaster ready
        this.realtimeClient.onBroadcasterReady((data) => {
            console.log('📻 Broadcaster ready:', data);
        });
        // Listener count updates
        this.realtimeClient.onListenerCount((data) => {
            console.log('👥 Listener count:', data.count, 'Peak:', data.peak);
        });
        // Incoming call requests
        this.realtimeClient.onIncomingCall((call) => {
            console.log('📞 Incoming call:', call);
            // Handle call in UI - show accept/reject buttons
        });
        // Call queue updates
        this.realtimeClient.onCallQueueUpdate((data) => {
            console.log('📞 Call queue updated:', data.queue.length, 'calls pending');
        });
        // Audio source events
        this.realtimeClient.onAudioSourceAdded((data) => {
            console.log('🎤 Audio source added:', data.sourceId);
        });
        this.realtimeClient.onAudioSourceUpdated((data) => {
            console.log('🎛️ Audio source updated:', data.sourceId, data.updates);
        });
        this.realtimeClient.onAudioSourceRemoved((data) => {
            console.log('🔇 Audio source removed:', data.sourceId);
        });
    }
    // Set up listener event handlers
    setupListenerHandlers() {
        // Broadcast info
        this.realtimeClient.onBroadcastInfo((info) => {
            console.log('📻 Broadcast info:', info);
        });
        // Audio stream
        this.realtimeClient.onAudioStream((data) => {
            console.log('🎵 Received audio stream:', data.timestamp);
            // Handle audio playback
        });
        // Broadcast ended
        this.realtimeClient.onBroadcastEnded((data) => {
            console.log('📻 Broadcast ended:', data.reason);
            // Handle cleanup and UI updates
        });
    }
    // Start broadcasting
    async startBroadcast() {
        try {
            await this.audioSystem.startBroadcast();
            console.log('📻 Broadcast started');
            return true;
        }
        catch (error) {
            console.error('Failed to start broadcast:', error);
            throw error;
        }
    }
    // Stop broadcasting
    stopBroadcast() {
        this.audioSystem.stopBroadcast();
        console.log('🛑 Broadcast stopped');
    }
    // Add guest or caller
    async addGuest(guestInfo) {
        try {
            const sourceId = `${guestInfo.type}-${Date.now()}`;
            await this.audioSystem.addAudioSource({
                id: sourceId,
                type: guestInfo.type,
                name: guestInfo.name,
                volume: 0.8,
                isMuted: false,
                isActive: true,
                priority: guestInfo.type === 'caller' ? 2 : 3
            });
            console.log(`👤 Added ${guestInfo.type}: ${guestInfo.name}`);
            return sourceId;
        }
        catch (error) {
            console.error(`Failed to add ${guestInfo.type}:`, error);
            throw error;
        }
    }
    // Accept incoming call
    acceptCall(callId) {
        this.realtimeClient.acceptCall(callId);
        console.log('✅ Call accepted:', callId);
    }
    // Reject incoming call
    rejectCall(callId, reason) {
        this.realtimeClient.rejectCall(callId, reason);
        console.log('❌ Call rejected:', callId);
    }
    // Request to call the station (for listeners)
    requestCall(callerInfo) {
        this.realtimeClient.requestCall(this.broadcastId, callerInfo);
        console.log('📞 Call requested:', callerInfo.name);
    }
    // Chat integration
    initializeChat(userInfo) {
        // Join chat
        this.realtimeClient.joinChat(this.broadcastId, userInfo);
        // Set up chat handlers
        this.realtimeClient.onNewMessage((message) => {
            console.log('💬 New message:', message.username, ':', message.content);
        });
        this.realtimeClient.onUserJoined((data) => {
            console.log('👤 User joined chat:', data.user.username);
        });
        this.realtimeClient.onUserLeft((data) => {
            console.log('👋 User left chat:', data.user.username);
        });
        this.realtimeClient.onUserTyping((data) => {
            console.log('⌨️ User typing:', data.username);
        });
        console.log('💬 Chat initialized');
    }
    // Send chat message
    sendChatMessage(content) {
        this.realtimeClient.sendMessage(this.broadcastId, { content });
    }
    // Send announcement (staff only)
    sendAnnouncement(content, username) {
        this.realtimeClient.sendAnnouncement(this.broadcastId, content, username);
    }
    // Get current stats
    getStats() {
        this.realtimeClient.getBroadcastStats(this.broadcastId);
    }
    // Cleanup
    cleanup() {
        this.audioSystem.cleanup();
        this.realtimeClient.disconnect();
        console.log('🧹 Integration cleaned up');
    }
}
exports.RadioStationIntegration = RadioStationIntegration;
// Usage Examples:
// For Broadcaster (Studio Interface)
async function initializeBroadcasterExample() {
    const integration = new RadioStationIntegration('live-broadcast-1');
    try {
        await integration.initializeBroadcaster({
            username: 'DJ Mike',
            stationName: 'LS Radio 101.5'
        });
        // Initialize chat for broadcaster
        integration.initializeChat({
            username: 'DJ Mike',
            role: 'broadcaster',
            userId: 'dj-mike-001'
        });
        // Start broadcasting
        await integration.startBroadcast();
        // Add a co-host
        await integration.addGuest({
            name: 'Sarah Co-Host',
            type: 'guest'
        });
        console.log('🎙️ Broadcaster setup complete!');
    }
    catch (error) {
        console.error('Broadcaster setup failed:', error);
    }
}
// For Listener (Public Interface)
async function initializeListenerExample() {
    const integration = new RadioStationIntegration('live-broadcast-1');
    try {
        await integration.initializeListener({
            username: 'John Listener',
            location: 'New York'
        });
        // Initialize chat for listener
        integration.initializeChat({
            username: 'John Listener',
            role: 'listener',
            userId: 'listener-john-001'
        });
        // Request to call the station
        integration.requestCall({
            name: 'John from New York',
            location: 'New York, NY'
        });
        console.log('🎧 Listener setup complete!');
    }
    catch (error) {
        console.error('Listener setup failed:', error);
    }
}
//# sourceMappingURL=integration-example.js.map