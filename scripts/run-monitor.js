#!/usr/bin/env bun

/**
 * Script to run the Monitor2.ts file
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Get the path to the Monitor2.ts file
const monitorPath = path.join(process.cwd(), 'Monitor2.ts');

// Check if the file exists
if (!fs.existsSync(monitorPath)) {
  console.error(`Error: ${monitorPath} does not exist`);
  process.exit(1);
}

// Get command line arguments
const args = process.argv.slice(2);

// Read .agent.env file to get HTTP and STREAM ports
const agentEnvPath = path.join(process.cwd(), '.agent.env');
let httpPort = '6678';
let streamPort = '6679';

if (fs.existsSync(agentEnvPath)) {
  console.log('Reading .agent.env file for configuration');
  const envContent = fs.readFileSync(agentEnvPath, 'utf-8');
  // Extract AGENT_HTTP_PORT using regex
  const httpPortMatch = envContent.match(/AGENT_HTTP_PORT=([0-9]+)/);
  if (httpPortMatch && httpPortMatch[1]) {
    httpPort = httpPortMatch[1];
    console.log(`Found AGENT_HTTP_PORT=${httpPort} in .agent.env`);
  }
  // Extract AGENT_STREAM_PORT using regex
  const streamPortMatch = envContent.match(/AGENT_STREAM_PORT=([0-9]+)/);
  if (streamPortMatch && streamPortMatch[1]) {
    streamPort = streamPortMatch[1];
    console.log(`Found AGENT_STREAM_PORT=${streamPort} in .agent.env`);
  }
}

// Pass API and stream URLs as arguments
if (!args.includes('--api-base-url')) {
  args.push('--api-base-url', `http://localhost:${httpPort}`);
}
if (!args.includes('--stream-url')) {
  args.push('--stream-url', `http://localhost:${streamPort}`);
}

console.log('🚀 Starting NATS Monitor2...');

// Run the Monitor2.ts file with Bun
const monitorProcess = spawn('bun', ['run', monitorPath, ...args], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: process.env
});

monitorProcess.on('error', (error) => {
  console.error(`Error starting monitor: ${error.message}`);
  process.exit(1);
});

monitorProcess.on('close', (code) => {
  console.log(`Monitor exited with code ${code}`);
  process.exit(code);
});
