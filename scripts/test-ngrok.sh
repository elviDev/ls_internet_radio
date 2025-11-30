#!/bin/bash

# ngrok Test Script
# This script tests the ngrok setup without starting the full development environment

echo "🧪 Testing ngrok setup..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed"
    exit 1
fi

echo "✅ ngrok is installed"

# Check if ngrok is authenticated
if ! ngrok config check &>/dev/null; then
    echo "❌ ngrok is not authenticated"
    echo "   Run: ngrok config add-authtoken YOUR_TOKEN"
    exit 1
fi

echo "✅ ngrok is authenticated"

# Check if config file exists
if [ ! -f "ngrok.yml" ]; then
    echo "❌ ngrok.yml not found"
    exit 1
fi

echo "✅ ngrok.yml configuration found"

# Test tunnel creation (just for a few seconds)
echo "🔧 Testing tunnel creation..."

# Start a simple HTTP server on port 8080 for testing
python3 -m http.server 8080 &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Start ngrok tunnel for the test server
ngrok http 8080 --log=stdout &
NGROK_PID=$!

# Wait for tunnel to establish
sleep 5

# Check if tunnel is working
if curl -s http://localhost:4040/api/tunnels | grep -q "public_url"; then
    echo "✅ ngrok tunnel test successful!"
    
    # Get the tunnel URL
    TUNNEL_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data['tunnels']:
    print(data['tunnels'][0]['public_url'])
")
    
    echo "🌐 Test tunnel URL: $TUNNEL_URL"
    echo "📊 Web interface: http://localhost:4040"
else
    echo "❌ ngrok tunnel test failed"
fi

# Cleanup
echo "🧹 Cleaning up test..."
kill $NGROK_PID 2>/dev/null || true
kill $SERVER_PID 2>/dev/null || true

echo "✅ ngrok test complete!"