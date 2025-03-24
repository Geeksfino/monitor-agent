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

// Function to check if a model is already downloaded
const checkModelExists = (model) => {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Checking if model already exists: ${model}...`);
    
    // Use the virtual environment Python
    const pythonPath = path.join(process.cwd(), '.venv', 'bin', 'python');
    
    const pythonProcess = spawn(pythonPath, [
      '-c',
      `
import os
import sys
from huggingface_hub import try_to_load_from_cache, snapshot_download

model = "${model}"

if "sentence-transformers" in model:
    # Check if sentence-transformer model exists in cache
    try:
        from sentence_transformers import SentenceTransformer
        # Try to load the model without downloading
        try:
            # Just check if files exist, don't actually load the model
            from sentence_transformers.util import snapshot_download
            cache_folder = snapshot_download(model, local_files_only=True, ignore_errors=True)
            if cache_folder:
                print(f"✅ Model {model} already exists in cache")
                sys.exit(0)
            else:
                sys.exit(1)
        except Exception:
            sys.exit(1)
    except Exception as e:
        sys.exit(1)
else:
    # For other models, check if they exist in the Hugging Face cache
    try:
        files = try_to_load_from_cache(repo_id=model, filename="*")
        if files:
            print(f"✅ Model {model} already exists in cache")
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception:
        sys.exit(1)
      `
    ]);

    let output = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      // Just collect stderr but don't print it
      output += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        console.log(output.trim());
        resolve(true); // Model exists
      } else {
        resolve(false); // Model doesn't exist or error occurred
      }
    });
  });
};

// Function to download a model using Python
const downloadModel = (model) => {
  return new Promise((resolve, reject) => {
    console.log(`⏳ Downloading model: ${model}...`);
    
    // Use the virtual environment Python
    const pythonPath = path.join(process.cwd(), '.venv', 'bin', 'python');
    
    const pythonProcess = spawn(pythonPath, [
      '-c',
      `
import os
from huggingface_hub import snapshot_download
from sentence_transformers import SentenceTransformer

# Download the model
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

    pythonProcess.stdout.on('data', (data) => {
      console.log(data.toString().trim());
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(data.toString().trim());
    });

    pythonProcess.on('close', (code) => {
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
      // Check if model already exists
      const exists = await checkModelExists(model);
      
      if (!exists) {
        console.log(`ℹ️ Model ${model} not found in cache, downloading...`);
        await downloadModel(model);
      } else {
        console.log(`✅ Using existing model: ${model}`);
      }
    } catch (error) {
      console.error(`❌ Error processing model ${model}:`, error.message);
      // Continue with other models even if one fails
    }
  }
  console.log('🎉 Model download process completed!');
}

downloadAllModels();
