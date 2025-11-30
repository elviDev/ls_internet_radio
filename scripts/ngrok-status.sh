#!/bin/bash

# ngrok Status Checker Script
# This script shows the current status of ngrok tunnels

echo "🔍 Checking ngrok tunnel status..."

# Check if ngrok is running
if ! pgrep -f "ngrok" > /dev/null; then
    echo "❌ ngrok is not running"
    echo "   Start tunnels with: npm run tunnel:start"
    exit 1
fi

echo "✅ ngrok is running!"
echo ""

# Get tunnel information from ngrok API
echo "📡 Active Tunnels:"
curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[] | "   \(.name): \(.public_url) -> \(.config.addr)"' 2>/dev/null || {
    echo "   Unable to fetch tunnel details (jq not installed or ngrok API unavailable)"
    echo "   Visit http://localhost:4040 for tunnel details"
}

echo ""
echo "🌐 Web Interface: http://localhost:4040"
echo "📊 API Endpoint: http://localhost:4040/api/tunnels"