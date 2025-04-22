#!/usr/bin/env bun

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

console.log('🔧 Generating MCP configuration...');

// Get the project directory
const projectDir = process.cwd();
const confDir = path.join(projectDir, 'conf');
const embeddingsPath = path.join(projectDir, 'kb.tar.gz');

// Ensure conf directory exists
if (!fs.existsSync(confDir)) {
  fs.mkdirSync(confDir, { recursive: true });
}

// Find the path to kb-mcp-server in the virtual environment
const findKbMcpServerPath = () => {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(projectDir, '.venv', 'bin', 'python');
    
    const process = spawn(pythonPath, [
      '-c',
      `
import os
import sys
import site

# Get the site-packages directory
site_packages = site.getsitepackages()[0]

# Find the kb-mcp-server executable
bin_dir = os.path.join(os.path.dirname(os.path.dirname(sys.executable)), 'bin')
kb_mcp_server_path = os.path.join(bin_dir, 'kb-mcp-server')

if os.path.exists(kb_mcp_server_path):
    print(kb_mcp_server_path)
else:
    print("ERROR: kb-mcp-server not found")
      `
    ]);

    let output = '';
    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      console.error(data.toString().trim());
    });

    process.on('close', (code) => {
      if (code === 0 && !output.includes('ERROR')) {
        resolve(output.trim());
      } else {
        reject(new Error('Failed to find kb-mcp-server path'));
      }
    });
  });
};

// Generate the configuration file
async function generateConfig() {
  try {
    // Get the path to kb-mcp-server (Keep this for now, but it's likely unused)
    // const kbMcpServerPath = await findKbMcpServerPath(); 
    // console.log(`📍 Found kb-mcp-server at: ${kbMcpServerPath}`);
    
    // Check if embeddings file exists (Keep this check for now, but likely unused)
    // if (!fs.existsSync(embeddingsPath)) {
    //   console.warn(`⚠️ Warning: Embeddings file not found at ${embeddingsPath}`);
    //   console.warn('⚠️ You will need to provide the correct embeddings file later');
    // } else {
    //   console.log(`📍 Using embeddings file: ${embeddingsPath}`);
    // }

    // ---- REMOVED brain.md GENERATION ----
    
    // ---- REMOVED mcp_config.json GENERATION ----

    // ---- REMOVED preproc-mcp.json GENERATION ----

    // ---- REMOVED .agent.env GENERATION ----
    
    console.log('✅ Configuration generation script finished (no files generated).');
    
  } catch (error) {
    console.error('❌ Error during configuration script execution:', error.message);
    // Decide if this should still exit the process
    // process.exit(1); 
  }
}

generateConfig();
