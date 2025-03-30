#!/usr/bin/env bun

import fs from 'fs';
import path from 'path';

console.log('🔍 Copying sample knowledge base files to contents directory...');

// Get the project directory
const projectDir = process.cwd();
const samplesDir = path.join(projectDir, 'knowledge-samples');
const contentsDir = path.join(projectDir, 'contents');

// Ensure contents directory exists
if (!fs.existsSync(contentsDir)) {
  fs.mkdirSync(contentsDir, { recursive: true });
  console.log('✅ Created contents directory');
}

// Get list of markdown files in samples directory
const sampleFiles = fs.readdirSync(samplesDir)
  .filter(file => file.endsWith('.md') && file !== 'README.md');

if (sampleFiles.length === 0) {
  console.error('❌ No sample files found in knowledge-samples directory');
  process.exit(1);
}

// Copy each sample file to contents directory
let copiedCount = 0;
for (const file of sampleFiles) {
  const sourcePath = path.join(samplesDir, file);
  const destPath = path.join(contentsDir, file);
  
  try {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied ${file} to contents directory`);
    copiedCount++;
  } catch (error) {
    console.error(`❌ Failed to copy ${file}: ${error.message}`);
  }
}

console.log(`\n🎉 Successfully copied ${copiedCount} sample files to contents directory`);
console.log('\n📝 Next steps:');
console.log('  1. Run "bun run kb:package" to build the knowledge base (creates kb.tar.gz)');
console.log('  2. Run "bun run kb:search" to test searching the knowledge base');
console.log('  3. Run "bun start" to start the agent with the sample knowledge base');
