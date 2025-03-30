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
    // Get the path to kb-mcp-server
    const kbMcpServerPath = await findKbMcpServerPath();
    console.log(`📍 Found kb-mcp-server at: ${kbMcpServerPath}`);
    
    // Check if embeddings file exists
    if (!fs.existsSync(embeddingsPath)) {
      console.warn(`⚠️ Warning: Embeddings file not found at ${embeddingsPath}`);
      console.warn('⚠️ You will need to provide the correct embeddings file later');
    } else {
      console.log(`📍 Using embeddings file: ${embeddingsPath}`);
    }
    
    // Create the configuration object
    const config = {
      "mcpServers": {
        "finclip-rag-server": {
          "command": kbMcpServerPath,
          "args": [
            "--embeddings",
            embeddingsPath,
            "--enable-causal-boost"
          ],
          "cwd": projectDir
        }
      }
    };
    
    // Write the configuration to file
    const configPath = path.join(confDir, 'preproc-mcp.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log(`✅ Configuration generated at: ${configPath}`);
    
    // Create a sample .agent.env file if it doesn't exist
    const agentEnvPath = path.join(projectDir, '.agent.env');
    if (!fs.existsSync(agentEnvPath)) {
      const agentEnvContent = `# LLM Configuration
LLM_API_KEY=your_api_key_here
LLM_PROVIDER_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o
LLM_STREAM_MODE=true

# Agent Server Configuration
AGENT_HOST=localhost
AGENT_HTTP_PORT=5678
AGENT_STREAM_PORT=5679
AGENT_ENABLE_STREAMING=true
`;
      fs.writeFileSync(agentEnvPath, agentEnvContent);
      console.log(`✅ Sample .agent.env file created at: ${agentEnvPath}`);
    }
    
  } catch (error) {
    console.error('❌ Error generating configuration:', error.message);
    process.exit(1);
  }
}

generateConfig();
