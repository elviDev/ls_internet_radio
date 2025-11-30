#!/bin/bash

# Simple ngrok setup without account requirements
echo "🚀 Starting simple ngrok tunnels..."

# Start servers first
echo "🔧 Starting realtime server..."
cd realtime-server && npm run dev &
cd ..

echo "🌐 Starting Next.js app..."
npm run dev &

sleep 5

# Start simple HTTP tunnels (no auth required)
echo "📡 Starting ngrok tunnels..."
ngrok http 3000 --log=stdout &
sleep 2
ngrok http 3001 --log=stdout &

echo "✅ Tunnels started! Check http://localhost:4040 for URLs"

wait