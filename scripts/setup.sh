#!/bin/bash

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

echo "🚀 Setting up finclip-agent environment..."

# Check and install Bun
if command_exists bun; then
  BUN_VERSION=$(bun --version)
  echo "✅ Bun is already installed (version: $BUN_VERSION)"
else
  echo "⏳ Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
  echo "✅ Bun installed successfully"
fi

# Check and install Python
if command_exists python3; then
  PYTHON_VERSION=$(python3 --version)
  echo "✅ Python is already installed (version: $PYTHON_VERSION)"
else
  echo "❌ Python 3 is not installed. Please install Python 3.9+ manually."
  exit 1
fi

# Check and install uv
if command_exists uv; then
  UV_VERSION=$(uv --version)
  echo "✅ uv is already installed (version: $UV_VERSION)"
else
  echo "⏳ Installing uv..."
  curl -fsSL https://github.com/astral-sh/uv/releases/download/0.1.24/uv-installer.sh | bash
  # Source the cargo environment to add uv to PATH
  source $HOME/.cargo/env
  echo "✅ uv installed successfully"
fi

# Create and activate a virtual environment for Python packages
echo "⏳ Creating Python virtual environment..."
python3 -m venv .venv
source .venv/bin/activate

# Install kb-mcp-server using uv
echo "⏳ Installing kb-mcp-server..."
uv pip install kb-mcp-server
echo "✅ kb-mcp-server installed successfully"

# Install @finogeek/cxagent using Bun
echo "⏳ Installing @finogeek/cxagent..."
bun add @finogeek/cxagent
echo "✅ @finogeek/cxagent installed successfully"

# Create necessary directories
mkdir -p conf

echo "🎉 Setup completed successfully!"
