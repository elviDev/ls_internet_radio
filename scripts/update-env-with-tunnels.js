#!/usr/bin/env node

/**
 * Update environment files with ngrok tunnel URLs
 * This script automatically updates your .env files with the current tunnel URLs
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

function updateEnvFile(filePath, updates) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${filePath} not found, skipping...`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    Object.entries(updates).forEach(([key, value]) => {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        const newLine = `${key}=${value}`;
        
        if (regex.test(content)) {
            content = content.replace(regex, newLine);
            modified = true;
            console.log(`   ✅ Updated ${key}`);
        } else {
            content += `\n${newLine}`;
            modified = true;
            console.log(`   ➕ Added ${key}`);
        }
    });
    
    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`💾 Updated ${filePath}`);
    }
}

async function main() {
    try {
        console.log('🔄 Updating environment files with ngrok URLs...\n');
        
        const tunnels = await getTunnelUrls();
        
        if (tunnels.length === 0) {
            console.log('❌ No active tunnels found');
            console.log('   Start tunnels first: npm run tunnel:start');
            return;
        }
        
        const urls = {};
        tunnels.forEach(tunnel => {
            urls[tunnel.name] = tunnel.public_url;
        });
        
        // Update main .env file
        if (urls.nextjs) {
            const mainEnvUpdates = {
                'NEXT_PUBLIC_APP_URL': urls.nextjs,
                'NEXT_PUBLIC_SITE_URL': urls.nextjs
            };
            
            if (urls.realtime) {
                mainEnvUpdates['NEXT_PUBLIC_REALTIME_URL'] = urls.realtime;
                mainEnvUpdates['NEXT_PUBLIC_WEBSOCKET_URL'] = urls.realtime;
            }
            
            console.log('📝 Updating main .env file:');
            updateEnvFile('.env', mainEnvUpdates);
            updateEnvFile('.env.local', mainEnvUpdates);
        }
        
        // Update realtime server .env file
        if (urls.realtime && urls.nextjs) {
            console.log('\n📝 Updating realtime server .env file:');
            const realtimeEnvUpdates = {
                'CORS_ORIGIN': urls.nextjs
            };
            
            updateEnvFile('realtime-server/.env', realtimeEnvUpdates);
        }
        
        console.log('\n✅ Environment files updated successfully!');
        console.log('🔄 Restart your servers to apply the new URLs');
        
    } catch (error) {
        console.error('❌ Error updating environment files:', error.message);
        console.log('   Make sure ngrok is running: npm run tunnel:start');
    }
}

main();