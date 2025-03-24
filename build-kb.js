#!/usr/bin/env bun

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to run a command and stream output
const runCommand = (command, args, cwd = process.cwd()) => {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
      cwd,
      stdio: ['inherit', 'pipe', 'pipe']
    });
    
    proc.stdout.on('data', (data) => {
      process.stdout.write(data.toString());
    });
    
    proc.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command exited with code ${code}`));
      }
    });
  });
};

// Function to ask a question
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Main function
async function main() {
  console.log('🔧 Knowledge Base Builder');
  console.log('========================\n');
  
  // Check if kb.yml exists
  if (!fs.existsSync('./kb.yml')) {
    console.error('❌ kb.yml not found. Please create a kb.yml file first.');
    process.exit(1);
  }
  
  // Check if content directory exists
  const contentDir = './contents';
  if (!fs.existsSync(contentDir)) {
    console.log('⚠️ Content directory not found. Creating...');
    fs.mkdirSync(contentDir, { recursive: true });
    console.log('✅ Created content directory at ./contents');
    console.log('ℹ️ Please add your documents to the contents directory before building the knowledge base.');
    
    const continue_anyway = await askQuestion('Continue anyway? (y/n): ');
    if (continue_anyway.toLowerCase() !== 'y') {
      console.log('Exiting. Please add documents and try again.');
      process.exit(0);
    }
  } else {
    // Check if content directory is empty
    const files = fs.readdirSync(contentDir);
    if (files.length === 0) {
      console.log('⚠️ Content directory is empty. Please add documents before building the knowledge base.');
      const continue_anyway = await askQuestion('Continue anyway? (y/n): ');
      if (continue_anyway.toLowerCase() !== 'y') {
        console.log('Exiting. Please add documents and try again.');
        process.exit(0);
      }
    } else {
      console.log(`ℹ️ Found ${files.length} files/directories in the content directory.`);
    }
  }
  
  try {
    // Check if Python virtual environment exists
    const venvPath = './.venv';
    if (!fs.existsSync(venvPath)) {
      console.log('⚠️ Python virtual environment not found. Please run setup first.');
      console.log('   bun run setup');
      process.exit(1);
    }
    
    const kbBuildPath = path.join(venvPath, 'bin', 'kb-build');
    if (!fs.existsSync(kbBuildPath)) {
      console.log('⚠️ kb-build not found. Please run setup first.');
      console.log('   bun run setup');
      process.exit(1);
    }
    
    // Ask user what they want to do
    console.log('\nWhat would you like to do?');
    console.log('1. Build knowledge base');
    console.log('2. Build knowledge base with debug output');
    console.log('3. Export knowledge base');
    console.log('4. Search knowledge base');
    console.log('5. Search knowledge base with graph retrieval');
    
    const choice = await askQuestion('\nEnter your choice (1-5): ');
    
    switch (choice) {
      case '1':
        console.log('\n🔨 Building knowledge base...\n');
        await runCommand(kbBuildPath, ['--config', 'kb.yml']);
        break;
      case '2':
        console.log('\n🔨 Building knowledge base with debug output...\n');
        await runCommand(kbBuildPath, ['--config', 'kb.yml', '--debug']);
        break;
      case '3':
        console.log('\n📦 Packaging knowledge base...\n');
        await runCommand(kbBuildPath, ['--config', 'kb.yml', '--export', 'finclip.tar.gz']);
        break;
      case '4':
        console.log('\n🔍 Searching knowledge base...\n');
        await runCommand(path.join(venvPath, 'bin', 'kb-search'), ['--config', 'kb.yml']);
        break;
      case '5':
        console.log('\n🔍 Searching knowledge base with graph retrieval...\n');
        await runCommand(path.join(venvPath, 'bin', 'kb-search'), ['--config', 'kb.yml', '--graph']);
        break;
      default:
        console.log('Invalid choice. Exiting.');
        process.exit(1);
    }
    
    console.log('\n✅ Operation completed successfully!');
    
    // If we built or packaged the knowledge base, check if we need to update the config
    if (['1', '2', '3'].includes(choice)) {
      const updateConfig = await askQuestion('\nUpdate MCP configuration with the new knowledge base? (y/n): ');
      
      if (updateConfig.toLowerCase() === 'y') {
        console.log('\n🔧 Updating MCP configuration...');
        await runCommand('bun', ['generate-config.js']);
        console.log('✅ MCP configuration updated successfully!');
      }
    }
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
