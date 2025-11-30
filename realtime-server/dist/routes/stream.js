"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastAudioData = broadcastAudioData;
const express_1 = require("express");
const router = (0, express_1.Router)();
// In-memory store for active streams
const activeStreams = new Map();
// Stream a live broadcast
router.get('/broadcast/:broadcastId/stream.mp3', (req, res) => {
    const { broadcastId } = req.params;
    const clientId = req.ip + '-' + Date.now();
    console.log(`📻 Stream request for broadcast ${broadcastId} from ${req.ip}`);
    // Set headers for audio streaming
    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.setHeader('Transfer-Encoding', 'chunked');
    // Check if stream exists
    let stream = activeStreams.get(broadcastId);
    if (!stream) {
        // Create new stream entry
        stream = {
            broadcastId,
            startTime: new Date(),
            listeners: new Map(),
            audioBuffer: []
        };
        activeStreams.set(broadcastId, stream);
    }
    // Add listener
    stream.listeners.set(clientId, res);
    console.log(`👂 Added listener ${clientId} to broadcast ${broadcastId}. Total: ${stream.listeners.size}`);
    // Send any buffered audio
    stream.audioBuffer.forEach(chunk => {
        if (!res.destroyed) {
            res.write(chunk);
        }
    });
    // Handle client disconnect
    req.on('close', () => {
        const stream = activeStreams.get(broadcastId);
        if (stream) {
            stream.listeners.delete(clientId);
            console.log(`👋 Removed listener ${clientId} from broadcast ${broadcastId}. Total: ${stream.listeners.size}`);
            // Clean up empty streams
            if (stream.listeners.size === 0) {
                activeStreams.delete(broadcastId);
                console.log(`🧹 Cleaned up empty stream for broadcast ${broadcastId}`);
            }
        }
    });
    // Keep connection alive
    const keepAlive = setInterval(() => {
        if (!res.destroyed) {
            res.write(Buffer.alloc(0)); // Send empty chunk to keep alive
        }
        else {
            clearInterval(keepAlive);
        }
    }, 30000);
});
// Get stream info
router.get('/broadcast/:broadcastId/info', (req, res) => {
    const { broadcastId } = req.params;
    const stream = activeStreams.get(broadcastId);
    if (!stream) {
        return res.status(404).json({ error: 'Stream not found' });
    }
    res.json({
        broadcastId: stream.broadcastId,
        startTime: stream.startTime,
        listenerCount: stream.listeners.size,
        isLive: true
    });
});
// List all active streams
router.get('/streams', (req, res) => {
    const streams = Array.from(activeStreams.entries()).map(([id, stream]) => ({
        broadcastId: id,
        startTime: stream.startTime,
        listenerCount: stream.listeners.size,
        streamUrl: `${req.protocol}://${req.get('host')}/stream/broadcast/${id}/stream.mp3`
    }));
    res.json({ streams });
});
// Function to broadcast audio data to all listeners of a stream
function broadcastAudioData(broadcastId, audioData) {
    const stream = activeStreams.get(broadcastId);
    if (!stream)
        return;
    // Add to buffer (keep last 10 seconds worth)
    stream.audioBuffer.push(audioData);
    if (stream.audioBuffer.length > 100) { // Assuming ~100ms chunks
        stream.audioBuffer.shift();
    }
    // Send audio data to all HTTP listeners
    for (const [clientId, response] of stream.listeners.entries()) {
        if (!response.destroyed) {
            try {
                response.write(audioData);
            }
            catch (error) {
                console.error(`Failed to write to client ${clientId}:`, error);
                stream.listeners.delete(clientId);
            }
        }
        else {
            stream.listeners.delete(clientId);
        }
    }
}
exports.default = router;
//# sourceMappingURL=stream.js.map