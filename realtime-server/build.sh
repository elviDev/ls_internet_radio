#!/bin/bash

echo "🔨 Building TypeScript realtime server..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build TypeScript
echo "🏗️ Compiling TypeScript..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🚀 Start server with: npm start"
    echo "🔧 Development mode: npm run dev"
else
    echo "❌ Build failed!"
    exit 1
fi