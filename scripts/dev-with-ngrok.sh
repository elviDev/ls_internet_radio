#!/bin/bash

# Complete Development Workflow with ngrok
# This script starts everything you need for development with ngrok tunnels

set -e  # Exit on any error

echo "🚀 Starting LS Internet Radio Development Environment with ngrok"
echo "================================================================"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    pkill -f ngrok 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "ts-node-dev" 2>/dev/null || true
    echo "✅ Cleanup complete"
    exit 0
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM

# Check if ngrok is authenticated
if ! ngrok config check &>/dev/null; then
    echo "❌ ngrok is not authenticated!"
    echo "   Please run: ngrok config add-authtoken YOUR_TOKEN"
    echo "   Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken"
    exit 1
fi

echo "✅ ngrok is authenticated"

# Start the realtime server in background
echo "🔧 Starting realtime server..."
cd realtime-server
npm run dev &
REALTIME_PID=$!
cd ..

# Wait a moment for the realtime server to start
sleep 3

# Start the Next.js app in background
echo "🌐 Starting Next.js application..."
npm run dev &
NEXTJS_PID=$!

# Wait for both servers to be ready
echo "⏳ Waiting for servers to start..."
sleep 5

# Check if servers are running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Realtime server failed to start on port 3001"
    cleanup
fi

if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Next.js app failed to start on port 3000"
    cleanup
fi

echo "✅ Both servers are running"

# Start ngrok tunnels (only nextjs to avoid free plan limits)
echo "📡 Starting ngrok tunnels..."
ngrok start --config ngrok.yml nextjs &
NGROK_PID=$!

# Wait for ngrok to establish tunnels
echo "⏳ Waiting for ngrok tunnels to establish..."
sleep 5

# Check if ngrok is running and get URLs
if ! curl -s http://localhost:4040/api/tunnels > /dev/null; then
    echo "❌ ngrok failed to start or establish tunnels"
    cleanup
fi

echo "✅ ngrok tunnels established"

# Get and display tunnel URLs
echo ""
echo "📡 Tunnel URLs:"
node scripts/get-tunnel-urls.js

# Update environment variables
echo ""
echo "🔄 Updating environment variables..."
node scripts/update-env-with-tunnels.js

echo ""
echo "🎉 Development environment is ready!"
echo "=================================="
echo ""
echo "📱 Access your app from anywhere using the tunnel URLs above"
echo "🌐 ngrok Web Interface: http://localhost:4040"
echo "🔍 Monitor traffic and debug: http://localhost:4040/inspect/http"
echo ""
echo "💡 Pro Tips:"
echo "   • Share the HTTPS URL with your second laptop"
echo "   • Use the ngrok web interface to inspect requests"
echo "   • All WebSocket connections will work through the tunnels"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep the script running
wait