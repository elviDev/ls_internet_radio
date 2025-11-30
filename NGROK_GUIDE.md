# 🚀 ngrok Integration Guide for LS Internet Radio

## Overview

This project is configured with ngrok to create secure tunnels to your local development environment, allowing you to:
- Access your app from any device/network
- Share your development work with team members
- Test webhooks and external integrations
- Monitor and debug HTTP traffic

## Quick Start

### 1. First Time Setup

1. **Install ngrok** (already done):
   ```bash
   brew install ngrok/ngrok/ngrok
   ```

2. **Get your auth token**:
   - Go to [ngrok.com](https://ngrok.com) and sign up
   - Copy your auth token from the dashboard
   - Run: `ngrok config add-authtoken YOUR_TOKEN_HERE`

3. **Start development with tunnels**:
   ```bash
   npm run dev:tunnel
   ```

### 2. Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev:tunnel` | Start complete dev environment with ngrok |
| `npm run tunnel:start` | Start ngrok tunnels only |
| `npm run tunnel:status` | Check tunnel status |
| `npm run tunnel:urls` | Get current tunnel URLs |
| `npm run tunnel:update-env` | Update .env files with tunnel URLs |
| `npm run tunnel:stop` | Stop all ngrok tunnels |

## How It Works

### Architecture

```
Internet → ngrok Cloud → Your Local Machine
                      ├── Next.js App (port 3000)
                      └── Realtime Server (port 3001)
```

### Tunnel Configuration

The `ngrok.yml` file configures two tunnels:
- **nextjs**: Tunnels your Next.js app (port 3000)
- **realtime**: Tunnels your Socket.IO server (port 3001)

Both tunnels support:
- HTTPS and HTTP protocols
- WebSocket connections
- Request inspection
- Traffic monitoring

## Usage Scenarios

### 1. Remote Development
Access your local development from anywhere:
```bash
npm run dev:tunnel
# Share the HTTPS URL with your second laptop
```

### 2. Mobile Testing
Test your app on real mobile devices:
```bash
npm run tunnel:urls
# Use the HTTPS URL on your phone/tablet
```

### 3. Client Demos
Show your work to clients without deploying:
```bash
npm run dev:tunnel
# Share the professional HTTPS URL
```

### 4. Webhook Testing
Receive webhooks from external services:
```bash
npm run tunnel:urls
# Use the tunnel URL as your webhook endpoint
```

## Monitoring & Debugging

### ngrok Web Interface
- **URL**: http://localhost:4040
- **Features**:
  - Live request inspection
  - Response replay
  - Traffic statistics
  - Tunnel status

### Request Inspection
1. Open http://localhost:4040/inspect/http
2. Make requests to your tunnel URLs
3. See detailed request/response data
4. Replay requests for debugging

## Security Features

### Built-in Security
- **HTTPS by default**: All tunnels use TLS encryption
- **Request filtering**: Block malicious requests
- **Access logs**: Monitor who accesses your tunnels
- **IP restrictions**: Limit access by IP (paid plans)

### Best Practices
1. **Don't share tunnel URLs publicly**
2. **Use HTTPS URLs only**
3. **Monitor the web interface for suspicious activity**
4. **Regenerate auth tokens periodically**

## Advanced Configuration

### Custom Domains (Paid Plans)
```yaml
tunnels:
  nextjs:
    addr: 3000
    proto: http
    hostname: myapp.ngrok.io
```

### Basic Authentication
```yaml
tunnels:
  nextjs:
    addr: 3000
    proto: http
    auth: "username:password"
```

### IP Restrictions
```yaml
tunnels:
  nextjs:
    addr: 3000
    proto: http
    cidr_allow:
      - "192.168.1.0/24"
```

## Troubleshooting

### Common Issues

#### 1. "ngrok not authenticated"
```bash
ngrok config add-authtoken YOUR_TOKEN_HERE
```

#### 2. "Port already in use"
```bash
# Stop existing tunnels
npm run tunnel:stop

# Check what's using the port
lsof -i :4040
```

#### 3. "Tunnel connection failed"
```bash
# Check if your local servers are running
curl http://localhost:3000
curl http://localhost:3001/health

# Restart the development environment
npm run dev:tunnel
```

#### 4. "Environment variables not updating"
```bash
# Manually update environment variables
npm run tunnel:update-env

# Restart your servers after updating
```

### Logs and Debugging

#### ngrok Logs
```bash
# View ngrok logs
tail -f /tmp/ngrok.log
```

#### Check Tunnel Status
```bash
# Get detailed status
npm run tunnel:status

# Get URLs programmatically
npm run tunnel:urls
```

## Performance Considerations

### Free Plan Limitations
- **Concurrent tunnels**: 1 tunnel at a time
- **Requests per minute**: 20
- **Bandwidth**: 1GB/month

### Optimization Tips
1. **Use HTTPS URLs**: Better performance and security
2. **Monitor bandwidth**: Check usage in ngrok dashboard
3. **Close unused tunnels**: Free up resources
4. **Use local development**: When external access isn't needed

## Integration with Your App

### Environment Variables
The scripts automatically update these variables:
```bash
# Main app
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
NEXT_PUBLIC_REALTIME_URL=https://def456.ngrok.io

# Realtime server
CORS_ORIGIN=https://abc123.ngrok.io
```

### WebSocket Configuration
Your Socket.IO connections will automatically work through ngrok tunnels:
```javascript
// This works with both local and tunnel URLs
const socket = io(process.env.NEXT_PUBLIC_REALTIME_URL)
```

## Team Collaboration

### Sharing Your Development
1. Start your development environment:
   ```bash
   npm run dev:tunnel
   ```

2. Share the HTTPS URL with team members

3. They can access your local development in real-time

### Code Review Sessions
1. Start tunnels during code review calls
2. Share your screen and the tunnel URL
3. Reviewers can interact with your app directly

## Production Considerations

### When NOT to Use ngrok
- **Production deployments**: Use proper hosting
- **Sensitive data**: Don't expose production databases
- **High traffic**: ngrok has bandwidth limits
- **Long-term hosting**: Use dedicated servers

### Migration Path
1. **Development**: Use ngrok for local development
2. **Staging**: Deploy to staging environment
3. **Production**: Use proper hosting (Vercel, AWS, etc.)

## Support and Resources

### Official Resources
- [ngrok Documentation](https://ngrok.com/docs)
- [ngrok Dashboard](https://dashboard.ngrok.com)
- [ngrok Status Page](https://status.ngrok.com)

### Community
- [ngrok GitHub](https://github.com/inconshreveable/ngrok)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/ngrok)

### Getting Help
1. Check the ngrok web interface (http://localhost:4040)
2. Review logs in `/tmp/ngrok.log`
3. Use `npm run tunnel:status` for diagnostics
4. Check this guide's troubleshooting section

---

**Happy tunneling! 🚇**