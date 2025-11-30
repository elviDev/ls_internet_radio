"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const chat_1 = __importDefault(require("./routes/chat"));
const broadcast_1 = __importDefault(require("./routes/broadcast"));
const stream_1 = __importDefault(require("./routes/stream"));
const unified_audio_1 = __importDefault(require("./handlers/unified-audio"));
const chat_2 = __importDefault(require("./handlers/chat"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
// Routes
app.use('/api/chat', chat_1.default);
app.use('/api/broadcast', broadcast_1.default);
app.use('/stream', stream_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Socket.IO setup
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
});
// Add connection logging
io.on('connection', (socket) => {
    console.log(`🔗 Client connected: ${socket.id}`);
    socket.on('disconnect', (reason) => {
        console.log(`❌ Client disconnected: ${socket.id}, reason: ${reason}`);
    });
    socket.on('error', (error) => {
        console.error(`🚨 Socket error for ${socket.id}:`, error);
    });
});
// Initialize unified audio and chat handlers
const audioManager = (0, unified_audio_1.default)(io);
(0, chat_2.default)(io);
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Realtime server running on port ${PORT}`);
    console.log(`📡 Unified Audio System and Socket.IO ready`);
    console.log(`🎙️ Multi-host broadcasting and audio mixing enabled`);
});
//# sourceMappingURL=server.js.map