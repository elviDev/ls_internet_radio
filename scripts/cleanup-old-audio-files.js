#!/usr/bin/env node

// Cleanup script for old audio files that have been consolidated
// Run this after verifying the unified system works correctly

const fs = require('fs')
const path = require('path')

const filesToRemove = [
  // Old audio processing files (now consolidated)
  'lib/simple-audio-stream.ts',
  'lib/simple-audio-bridge.ts', 
  'lib/webrtc-client.ts',
  'lib/realtime-client.ts',
  'lib/audio-bridge.ts',
  
  // Old streaming files (now consolidated)
  'lib/streaming/audio-streaming.ts',
  'lib/streaming/audio-receiver.ts', 
  'lib/streaming/webrtc-signaling.ts',
  
  // Old server handlers (now consolidated)
  'realtime-server/handlers/webrtc.js',
  'realtime-server/handlers/audio-bridge.js'
]

const filesToBackup = [
  // Keep audio-stream.ts as it might have some useful utilities
  'lib/audio-stream.ts'
]

function backupFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath)
  const backupPath = fullPath + '.backup'
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.copyFileSync(fullPath, backupPath)
      console.log(`✅ Backed up: ${filePath} -> ${filePath}.backup`)
      return true
    } catch (error) {
      console.error(`❌ Failed to backup ${filePath}:`, error.message)
      return false
    }
  }
  return false
}

function removeFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath)
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath)
      console.log(`🗑️  Removed: ${filePath}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to remove ${filePath}:`, error.message)
      return false
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`)
    return false
  }
}

function main() {
  console.log('🧹 Starting cleanup of old audio files...')
  console.log('📝 These files have been consolidated into the Unified Audio System\n')
  
  let backupCount = 0
  let removeCount = 0
  
  // Backup important files first
  console.log('📦 Creating backups of important files...')
  for (const filePath of filesToBackup) {
    if (backupFile(filePath)) {
      backupCount++
    }
  }
  
  console.log('\n🗑️  Removing consolidated files...')
  
  // Remove consolidated files
  for (const filePath of filesToRemove) {
    if (removeFile(filePath)) {
      removeCount++
    }
  }
  
  console.log('\n📊 Cleanup Summary:')
  console.log(`   Backups created: ${backupCount}`)
  console.log(`   Files removed: ${removeCount}`)
  console.log(`   Total files processed: ${filesToRemove.length + filesToBackup.length}`)
  
  console.log('\n✨ Cleanup completed!')
  console.log('🎯 Your audio system is now using the unified architecture')
  console.log('📚 See UNIFIED_AUDIO_SYSTEM.md for documentation')
  
  if (backupCount > 0) {
    console.log('\n💡 Backup files created with .backup extension')
    console.log('   You can safely delete these after confirming everything works')
  }
}

// Safety check
function confirmCleanup() {
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  console.log('⚠️  WARNING: This will remove old audio files that have been consolidated.')
  console.log('📋 Files to be removed:')
  filesToRemove.forEach(file => console.log(`   - ${file}`))
  console.log('\n📋 Files to be backed up:')
  filesToBackup.forEach(file => console.log(`   - ${file}`))
  
  rl.question('\n❓ Are you sure you want to proceed? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      rl.close()
      main()
    } else {
      console.log('❌ Cleanup cancelled')
      rl.close()
    }
  })
}

// Check if running with --force flag
if (process.argv.includes('--force')) {
  main()
} else {
  confirmCleanup()
}