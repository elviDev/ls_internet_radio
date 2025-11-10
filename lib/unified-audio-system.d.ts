export interface AudioSource {
    id: string;
    type: 'host' | 'guest' | 'caller' | 'music' | 'effects';
    name: string;
    stream?: MediaStream;
    volume: number;
    isMuted: boolean;
    isActive: boolean;
    priority: number;
    gainNode?: GainNode;
}
export interface BroadcastConfig {
    broadcastId: string;
    sampleRate: number;
    channels: number;
    bitrate: number;
    maxSources: number;
}
export interface AudioMetrics {
    inputLevel: number;
    outputLevel: number;
    peakLevel: number;
    activeSourceCount: number;
    listenerCount: number;
}
export declare class UnifiedAudioSystem {
    private audioContext;
    private socket;
    private config;
    private audioSources;
    private mixerNode;
    private compressorNode;
    private analyserNode;
    private destinationStream;
    private isActive;
    private metrics;
    constructor(config: BroadcastConfig);
    initialize(): Promise<void>;
    private setupAudioProcessing;
    private connectToServer;
    private setupSocketHandlers;
    addAudioSource(sourceConfig: Omit<AudioSource, 'gainNode'>): Promise<void>;
    connectSourceStream(sourceId: string, stream: MediaStream): Promise<void>;
    removeAudioSource(sourceId: string): void;
    updateAudioSource(sourceId: string, updates: Partial<AudioSource>): void;
    startBroadcast(): Promise<void>;
    private startAudioStreaming;
    stopBroadcast(): void;
    private handleIncomingCall;
    private getCallerAudioStream;
    private startLevelMonitoring;
    private updateMetrics;
    getAudioSources(): AudioSource[];
    getMetrics(): AudioMetrics;
    cleanup(): void;
    onMetricsUpdate?: (metrics: AudioMetrics) => void;
    onSourceRequest?: (data: any) => void;
}
export declare class UnifiedAudioListener {
    private broadcastId;
    private socket;
    private audioContext;
    private audioElement;
    private isListening;
    constructor(broadcastId: string);
    startListening(): Promise<void>;
    private playAudioData;
    stopListening(): void;
    setVolume(volume: number): void;
}
export declare function createAudioSystem(broadcastId: string): UnifiedAudioSystem;
export declare function createAudioListener(broadcastId: string): UnifiedAudioListener;
//# sourceMappingURL=unified-audio-system.d.ts.map