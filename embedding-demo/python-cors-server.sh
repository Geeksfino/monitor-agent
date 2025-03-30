#!/bin/bash

# Python CORS Server for FinClip Agent Demo
# This script starts a Python HTTP server with CORS headers to serve the embed-demo.html

PORT=${PORT:-8080}
PYTHON_CMD="python3"

# Check if Python 3 is available
if ! command -v $PYTHON_CMD &> /dev/null; then
    PYTHON_CMD="python"
    if ! command -v $PYTHON_CMD &> /dev/null; then
        echo "Error: Python is not installed or not in PATH"
        exit 1
    fi
fi

echo "Starting Python CORS server on port $PORT..."
echo "Access the demo at: http://localhost:$PORT/embedding-demo/embed-demo.html"
echo "Make sure you have started the FinClip agent with: bun start"
echo "Press Ctrl+C to stop the server"

# Create a temporary Python script to handle CORS
cat > /tmp/cors_server.py << 'EOF'
import http.server
import socketserver
import os
import sys

PORT = int(os.environ.get('PORT', 8080))
DEFAULT_FILE = 'embedding-demo/embed-demo.html'

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Override to serve default file for root path
        if path == '/' or path == '':
            print(f"Serving default file: {DEFAULT_FILE}")
            return os.path.join(os.getcwd(), DEFAULT_FILE)
        return super().translate_path(path)
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept')
        super().end_headers()
    
    def do_OPTIONS(self):
        # Handle OPTIONS requests for CORS preflight
        self.send_response(200)
        self.end_headers()

with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
EOF

# Run the Python server
$PYTHON_CMD /tmp/cors_server.py
