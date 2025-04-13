#!/usr/bin/env bun

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Get all command line arguments
let args = process.argv.slice(2);

// Check if Monitor.ts exists
const monitorPath = path.join(process.cwd(), 'Monitor.ts');
if (!fs.existsSync(monitorPath)) {
  console.error('❌ Monitor.ts not found at:', monitorPath);
  process.exit(1);
}

// Check for API port in environment
const apiPort = process.env.AGENT_API_PORT || process.env.API_PORT;
if (apiPort && !args.includes('--api-url')) {
  // Add API URL argument if port is specified in environment
  args.push('--api-url', `http://localhost:${apiPort}`);
}

console.log('🚀 Starting NATS Monitor...');

// Run the Monitor.ts file with Bun
const monitorProcess = spawn('bun', ['run', monitorPath, ...args], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: process.env
});

monitorProcess.on('error', (error) => {
  console.error('❌ Failed to start NATS Monitor:', error.message);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping NATS Monitor...');
  monitorProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping NATS Monitor...');
  monitorProcess.kill('SIGTERM');
});
