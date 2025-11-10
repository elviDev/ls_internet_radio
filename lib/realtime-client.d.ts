import { Socket } from 'socket.io-client';
export interface BroadcastInfo {
    broadcastId: string;
    broadcasterInfo: {
        username: string;
        stationName: string;
    };
    isLive: boolean;
    stats: {
        listeners: number;
        uptime: number;
    };
}
export interface CallRequest {
    callId: string;
    callerId: string;
    callerName: string;
    callerLocation: string;
    requestTime: Date;
    status: 'pending' | 'accepted' | 'rejected';
}
export declare class RealtimeClient {
    private socket;
    private serverUrl;
    constructor(serverUrl?: string);
    joinChat(broadcastId: string, userInfo: {
        username: string;
        role?: string;
        userId?: string;
        avatar?: string;
    }): void;
    sendMessage(broadcastId: string, message: {
        content: string;
        messageType?: string;
        replyTo?: string;
    }): void;
    sendAnnouncement(broadcastId: string, content: string, username: string): void;
    startTyping(broadcastId: string, username: string): void;
    stopTyping(broadcastId: string, username: string): void;
    reactToMessage(broadcastId: string, messageId: string, reaction: string): void;
    joinAsBroadcaster(broadcastId: string, broadcasterInfo?: {
        username?: string;
        stationName?: string;
    }): void;
    joinBroadcast(broadcastId: string, listenerInfo?: any): void;
    broadcastAudio(broadcastId: string, audioData: {
        audio: string;
        timestamp: number;
        metrics?: any;
    }): void;
    addAudioSource(broadcastId: string, sourceInfo: {
        type: 'host' | 'guest' | 'caller' | 'music' | 'effects';
        name: string;
        id?: string;
        volume?: number;
        isMuted?: boolean;
    }): void;
    updateAudioSource(broadcastId: string, sourceId: string, updates: any): void;
    removeAudioSource(broadcastId: string, sourceId: string): void;
    requestCall(broadcastId: string, callerInfo: {
        name: string;
        location?: string;
    }): void;
    acceptCall(callId: string): void;
    rejectCall(callId: string, reason?: string): void;
    endCall(callId: string): void;
    getCallQueue(broadcastId: string): void;
    getBroadcastStats(broadcastId: string): void;
    onNewMessage(callback: (message: any) => void): void;
    onChatHistory(callback: (data: {
        messages: any[];
        settings: any;
        userCount: number;
    }) => void): void;
    onUserJoined(callback: (data: {
        user: any;
        userCount: number;
        timestamp: string;
    }) => void): void;
    onUserLeft(callback: (data: {
        user: any;
        userCount: number;
        timestamp: string;
    }) => void): void;
    onUserTyping(callback: (data: {
        userId: string;
        username: string;
        timestamp: string;
    }) => void): void;
    onUserStoppedTyping(callback: (data: {
        userId: string;
        username: string;
        timestamp: string;
    }) => void): void;
    onBroadcasterReady(callback: (data: {
        broadcastId: string;
        capabilities: string[];
        serverTime: string;
    }) => void): void;
    onBroadcastInfo(callback: (info: BroadcastInfo) => void): void;
    onListenerCount(callback: (data: {
        count: number;
        peak: number;
    }) => void): void;
    onAudioStream(callback: (data: {
        audio: string;
        timestamp: number;
        metrics: any;
        broadcasterInfo: any;
    }) => void): void;
    onAudioSourceAdded(callback: (data: {
        broadcastId: string;
        sourceId: string;
        sourceInfo: any;
    }) => void): void;
    onAudioSourceUpdated(callback: (data: {
        broadcastId: string;
        sourceId: string;
        updates: any;
    }) => void): void;
    onAudioSourceRemoved(callback: (data: {
        broadcastId: string;
        sourceId: string;
    }) => void): void;
    onIncomingCall(callback: (call: CallRequest) => void): void;
    onCallPending(callback: (data: {
        callId: string;
        position: number;
    }) => void): void;
    onCallAccepted(callback: (data: {
        callId: string;
        broadcasterId: string;
        instructions: string;
    }) => void): void;
    onCallRejected(callback: (data: {
        callId: string;
        reason: string;
    }) => void): void;
    onCallEnded(callback: (data: {
        callId: string;
        reason: string;
    }) => void): void;
    onCallTimeout(callback: (data: {
        callId: string;
        reason: string;
    }) => void): void;
    onCallError(callback: (data: {
        message: string;
    }) => void): void;
    onCallQueueUpdate(callback: (data: {
        queue: CallRequest[];
        activeCalls: any[];
    }) => void): void;
    onBroadcastStats(callback: (stats: any) => void): void;
    onBroadcastEnded(callback: (data: {
        reason: string;
        stats: any;
        endTime: string;
    }) => void): void;
    onServerStats(callback: (stats: {
        activeBroadcasts: number;
        totalConnections: number;
        totalListeners: number;
        totalCalls: number;
        uptime: number;
    }) => void): void;
    onMessageError(callback: (error: {
        error: string;
    }) => void): void;
    onAnnouncement(callback: (announcement: any) => void): void;
    onMessageReaction(callback: (data: {
        messageId: string;
        reaction: string;
        userId: string;
    }) => void): void;
    editMessage(broadcastId: string, messageId: string, newContent: string): void;
    deleteMessage(broadcastId: string, messageId: string): void;
    onMessageEdited(callback: (data: {
        messageId: string;
        newContent: string;
        editedAt: string;
    }) => void): void;
    onMessageDeleted(callback: (data: {
        messageId: string;
        deletedBy: string;
        deletedAt: string;
    }) => void): void;
    disconnect(): void;
    isConnected(): boolean;
    getSocket(): Socket<import("@socket.io/component-emitter").DefaultEventsMap, import("@socket.io/component-emitter").DefaultEventsMap>;
}
//# sourceMappingURL=realtime-client.d.ts.map