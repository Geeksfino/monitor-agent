#!/usr/bin/env bun

import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 Starting finclip-agent setup...');

// Function to run a script and wait for it to complete
const runScript = (scriptPath) => {
  return new Promise((resolve, reject) => {
    const process = spawn('bash', [scriptPath], {
      stdio: 'inherit',
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });
  });
};

// Function to run a Bun script
const runBunScript = (scriptPath) => {
  return new Promise((resolve, reject) => {
    const process = spawn('bun', [scriptPath], {
      stdio: 'inherit',
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });
  });
};

// Run all scripts in sequence
async function runAllScripts() {
  try {
    // Step 1: Run setup script
    console.log('\n📋 Step 1: Setting up dependencies...');
    await runScript(path.join(process.cwd(), 'setup.sh'));
    
    // Step 2: Download models
    console.log('\n📋 Step 2: Downloading models...');
    await runBunScript(path.join(process.cwd(), 'download-models.js'));
    
    // Step 3: Generate configuration
    console.log('\n📋 Step 3: Generating configuration...');
    await runBunScript(path.join(process.cwd(), 'generate-config.js'));
    
    console.log('\n🎉 finclip-agent setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Edit .agent.env with your API key');
    console.log('  2. Run "bunx @finogeek/cxagent" to start the agent');
    console.log('  3. Create an HTML file to embed the chat widget (see README for details)');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

runAllScripts();
