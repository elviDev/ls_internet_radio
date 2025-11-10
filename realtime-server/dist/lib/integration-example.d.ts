export declare class RadioStationIntegration {
    private realtimeClient;
    private audioSystem;
    private broadcastId;
    constructor(broadcastId: string);
    initializeBroadcaster(broadcasterInfo: {
        username: string;
        stationName: string;
    }): Promise<boolean>;
    initializeListener(listenerInfo?: any): Promise<boolean>;
    private setupBroadcasterHandlers;
    private setupListenerHandlers;
    startBroadcast(): Promise<boolean>;
    stopBroadcast(): void;
    addGuest(guestInfo: {
        name: string;
        type: 'guest' | 'caller';
    }): Promise<string>;
    acceptCall(callId: string): void;
    rejectCall(callId: string, reason?: string): void;
    requestCall(callerInfo: {
        name: string;
        location?: string;
    }): void;
    initializeChat(userInfo: {
        username: string;
        role?: string;
        userId?: string;
    }): void;
    sendChatMessage(content: string): void;
    sendAnnouncement(content: string, username: string): void;
    getStats(): void;
    cleanup(): void;
}
export declare function initializeBroadcasterExample(): Promise<void>;
export declare function initializeListenerExample(): Promise<void>;
//# sourceMappingURL=integration-example.d.ts.map