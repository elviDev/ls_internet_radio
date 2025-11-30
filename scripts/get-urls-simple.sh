#!/bin/bash

echo "🔍 Getting ngrok tunnel URLs..."

if ! curl -s http://localhost:4040/api/tunnels > /dev/null; then
    echo "❌ ngrok not running. Start with: ./scripts/simple-ngrok.sh"
    exit 1
fi

echo "📡 Active Tunnels:"
curl -s http://localhost:4040/api/tunnels | python3 -c "
import json, sys
data = json.load(sys.stdin)
for tunnel in data['tunnels']:
    name = tunnel['name']
    url = tunnel['public_url']
    addr = tunnel['config']['addr']
    print(f'   {name}: {url} -> localhost:{addr}')
"

echo ""
echo "🌐 Web Interface: http://localhost:4040"