#!/usr/bin/env bun

import { spawn } from 'child_process';
import path from 'path';

// Get all command line arguments
const args = process.argv.slice(2);

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
