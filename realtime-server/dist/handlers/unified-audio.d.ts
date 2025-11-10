import { Server } from 'socket.io';
import { BroadcastSession } from '../types';
export default function unifiedAudioHandler(io: Server): {
    getBroadcast: (broadcastId: string) => BroadcastSession;
    getAllBroadcasts: () => BroadcastSession[];
    getStats: () => {
        activeBroadcasts: number;
        totalConnections: number;
    };
};
//# sourceMappingURL=unified-audio.d.ts.map