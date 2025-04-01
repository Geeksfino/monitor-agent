#!/usr/bin/env bun

import { spawn } from 'child_process';
import path from 'path';

// Get all command line arguments
let args = process.argv.slice(2);

// Check if --inspect flag is present without --inspect-port
if (args.includes('--inspect') && !args.some(arg => arg.startsWith('--inspect-port'))) {
  // Add default inspect port 5173 as mentioned in the README
  args.push('--inspect-port', '5173');
}

// Path to the local cxagent executable
const cxagentPath = path.join(
  process.cwd(),
  'node_modules',
  '.bin',
  'cxagent'
);

console.log(`🚀 Starting FinClip Agent with args: ${args.join(' ')}`);

// Run cxagent with all passed arguments
const cxagentProcess = spawn(cxagentPath, args, {
  stdio: 'inherit',
  cwd: process.cwd()
});

cxagentProcess.on('error', (error) => {
  console.error('❌ Failed to start FinClip Agent:', error.message);
  process.exit(1);
});
