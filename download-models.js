#!/usr/bin/env bun

import fs from 'fs';
import yaml from 'yaml';
import { spawn } from 'child_process';
import path from 'path';

console.log('🔍 Reading kb.yml file to identify required models...');

// Read the kb.yml file
let kbConfig;
try {
  const kbYaml = fs.readFileSync('./kb.yml', 'utf8');
  kbConfig = yaml.parse(kbYaml);
} catch (error) {
  console.error('❌ Error reading kb.yml file:', error.message);
  process.exit(1);
}

// Extract models from kb.yml
const embeddingModel = kbConfig.embeddings?.path || 'sentence-transformers/all-MiniLM-L6-v2';
console.log(`📌 Found embedding model: ${embeddingModel}`);

// Add any additional models that might be needed
const additionalModels = [];

// Combine all models
const modelsToDownload = [embeddingModel, ...additionalModels];

console.log('📦 Models to download:');
modelsToDownload.forEach(model => console.log(`  - ${model}`));

// Function to download a model using Python
const downloadModel = (model) => {
  return new Promise((resolve, reject) => {
    console.log(`⏳ Downloading model: ${model}...`);
    
    // Use the virtual environment Python
    const pythonPath = path.join(process.cwd(), '.venv', 'bin', 'python');
    
    const process = spawn(pythonPath, [
      '-c',
      `
import os
from huggingface_hub import snapshot_download
from sentence_transformers import SentenceTransformer

# Force download the model
model = "${model}"
if "sentence-transformers" in model:
    # This will download the model and cache it
    SentenceTransformer("${model}")
    print(f"✅ Successfully downloaded {model} using SentenceTransformer")
else:
    # Use snapshot_download for other models
    snapshot_download(repo_id=model, local_files_only=False)
    print(f"✅ Successfully downloaded {model} using snapshot_download")
      `
    ]);

    process.stdout.on('data', (data) => {
      console.log(data.toString().trim());
    });

    process.stderr.on('data', (data) => {
      console.error(data.toString().trim());
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Failed to download model: ${model}`));
      }
    });
  });
};

// Download all models sequentially
async function downloadAllModels() {
  for (const model of modelsToDownload) {
    try {
      await downloadModel(model);
    } catch (error) {
      console.error(error.message);
      // Continue with other models even if one fails
    }
  }
  console.log('🎉 Model download process completed!');
}

downloadAllModels();
