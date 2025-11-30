#!/usr/bin/env node

/**
 * Get ngrok tunnel URLs and update environment variables
 * This script fetches the current tunnel URLs and can update your .env files
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

async function getTunnelUrls() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:4040/api/tunnels', (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const tunnels = JSON.parse(data);
                    resolve(tunnels.tunnels);
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function main() {
    try {
        console.log('🔍 Fetching ngrok tunnel URLs...\n');
        
        const tunnels = await getTunnelUrls();
        
        if (tunnels.length === 0) {
            console.log('❌ No active tunnels found');
            console.log('   Start tunnels with: npm run tunnel:start');
            return;
        }
        
        console.log('📡 Active Tunnel URLs:\n');
        
        const urls = {};
        
        tunnels.forEach(tunnel => {
            const name = tunnel.name;
            const url = tunnel.public_url;
            const localAddr = tunnel.config.addr;
            
            console.log(`   ${name.toUpperCase()}:`);
            console.log(`   🌐 Public: ${url}`);
            console.log(`   🏠 Local:  http://localhost:${localAddr}`);
            console.log('');
            
            urls[name] = url;
        });
        
        // Save URLs to a JSON file for other scripts to use
        const urlsFile = path.join(__dirname, '..', 'tunnel-urls.json');
        fs.writeFileSync(urlsFile, JSON.stringify(urls, null, 2));
        
        console.log('💾 URLs saved to tunnel-urls.json');
        console.log('🌐 Web Interface: http://localhost:4040');
        
        // Show environment variable suggestions
        if (urls.nextjs) {
            console.log('\n📝 Environment Variable Suggestions:');
            console.log(`   NEXT_PUBLIC_APP_URL=${urls.nextjs}`);
            if (urls.realtime) {
                console.log(`   NEXT_PUBLIC_REALTIME_URL=${urls.realtime}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error fetching tunnel URLs:', error.message);
        console.log('   Make sure ngrok is running: npm run tunnel:start');
    }
}

main();