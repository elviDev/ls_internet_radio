# 🚀 ngrok Quick Reference

## Essential Commands

```bash
# 🎯 ONE COMMAND TO RULE THEM ALL
npm run dev:tunnel          # Start everything with ngrok

# 🔧 Individual Commands
npm run tunnel:start         # Start ngrok tunnels only
npm run tunnel:status        # Check tunnel status
npm run tunnel:urls          # Get current URLs
npm run tunnel:update-env    # Update environment variables
npm run tunnel:stop          # Stop all tunnels
npm run tunnel:test          # Test ngrok setup
```

## Quick Setup (First Time)

1. **Get auth token**: https://dashboard.ngrok.com/get-started/your-authtoken
2. **Authenticate**: `ngrok config add-authtoken YOUR_TOKEN`
3. **Start development**: `npm run dev:tunnel`

## URLs You'll Get

- **Next.js App**: `https://abc123.ngrok.io` (your main app)
- **Realtime Server**: `https://def456.ngrok.io` (WebSocket/Socket.IO)
- **Web Interface**: `http://localhost:4040` (monitoring)

## Share with Your Second Laptop

1. Run `npm run dev:tunnel`
2. Copy the HTTPS URL from the output
3. Open that URL on your second laptop
4. Everything works including WebSockets! 🎉

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Not authenticated" | `ngrok config add-authtoken YOUR_TOKEN` |
| "Port in use" | `npm run tunnel:stop` then retry |
| "No tunnels found" | `npm run tunnel:start` |
| URLs not updating | `npm run tunnel:update-env` |

## Pro Tips

- 🌐 Always use HTTPS URLs (more secure)
- 📊 Monitor traffic at http://localhost:4040
- 🔄 Restart servers after updating environment variables
- 📱 Perfect for mobile testing
- 🤝 Great for client demos

## What Gets Tunneled

✅ **Works Through ngrok**:
- HTTP/HTTPS requests
- WebSocket connections
- Socket.IO real-time features
- File uploads/downloads
- API calls
- Static assets

❌ **Doesn't Work**:
- Database connections (use local DB)
- File system access (local only)
- Environment-specific features

---

**Need help?** Check `NGROK_GUIDE.md` for detailed documentation.