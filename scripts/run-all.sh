#!/bin/sh
# Combined script to run both cxagent and monitor

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "🚀 Starting both cxagent and NATS monitor..."

# Try to read port from .agent.env file first
AGENT_ENV_FILE="$PROJECT_ROOT/.agent.env"
if [ -f "$AGENT_ENV_FILE" ]; then
  # Extract port from .agent.env file
  ENV_PORT=$(grep "AGENT_HTTP_PORT" "$AGENT_ENV_FILE" | cut -d'=' -f2)
  if [ ! -z "$ENV_PORT" ]; then
    API_PORT="$ENV_PORT"
  else
    API_PORT="5678"
  fi
else
  API_PORT="5678"
fi

# Command line arguments override the env file setting
for arg in "$@"; do
  if [[ $arg == *"--port"* ]]; then
    API_PORT=$(echo $arg | sed 's/--port=//')
  fi
done

# Export the API port for the monitor to use
export AGENT_API_PORT=$API_PORT

# Start cxagent in the background
echo "🔹 Starting cxagent on port $API_PORT..."
bun "$PROJECT_ROOT/scripts/start.js" "$@" &
CXAGENT_PID=$!

# Give cxagent a moment to start up
sleep 2

# Start monitor in the background
echo "🔹 Starting NATS monitor (connecting to agent on port $API_PORT)..."
bun "$PROJECT_ROOT/scripts/run-monitor.js" &
MONITOR_PID=$!

# Function to handle cleanup on exit
cleanup() {
    echo "🛑 Stopping services..."
    kill $CXAGENT_PID 2>/dev/null
    kill $MONITOR_PID 2>/dev/null
    exit 0
}

# Set up trap for cleanup
trap cleanup INT TERM

echo "✅ Both services started. Press Ctrl+C to stop all services."

# Wait for both processes to finish
wait $CXAGENT_PID $MONITOR_PID
