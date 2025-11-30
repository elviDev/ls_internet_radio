#!/bin/bash

# ngrok Tunnel Starter Script
# This script starts ngrok tunnels for both Next.js and realtime server

echo "🚀 Starting ngrok tunnels for LS Internet Radio..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Please install it first:"
    echo "   brew install ngrok/ngrok/ngrok"
    exit 1
fi

# Check if config file exists
if [ ! -f "ngrok.yml" ]; then
    echo "❌ ngrok.yml configuration file not found!"
    echo "   Please make sure ngrok.yml is in the project root."
    exit 1
fi

# Start ngrok with configuration file
echo "📡 Starting tunnels..."
echo "   - Next.js App (port 3000)"
echo "   - Realtime Server (port 3001)"
echo ""
echo "🌐 Web Interface: http://localhost:4040"
echo "📊 Tunnel Status: http://localhost:4040/status"
echo ""
echo "Press Ctrl+C to stop all tunnels"

ngrok start --config ngrok.yml --all