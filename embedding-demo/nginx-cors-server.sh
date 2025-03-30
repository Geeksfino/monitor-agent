#!/bin/bash

# Nginx CORS Server for FinClip Agent Demo
# This script starts Nginx with CORS headers to serve the embed-demo.html

PORT=8080
NGINX_CONF_DIR="/tmp/finclip-nginx"
NGINX_CONF_FILE="$NGINX_CONF_DIR/finclip-demo.conf"
CURRENT_DIR=$(pwd)

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "Error: Nginx is not installed or not in PATH"
    exit 1
fi

# Create temporary directory for Nginx configuration
mkdir -p "$NGINX_CONF_DIR"

# Create Nginx configuration file
cat > "$NGINX_CONF_FILE" << EOF
worker_processes 1;
error_log stderr;
daemon off;
pid $NGINX_CONF_DIR/nginx.pid;

events {
    worker_connections 1024;
}

http {
    access_log /dev/stdout combined;
    
    server {
        listen $PORT;
        server_name localhost;
        
        root $CURRENT_DIR;
        index embedding-demo/embed-demo.html;
        
        # Redirect root to embed-demo.html
        location = / {
            return 301 /embedding-demo/embed-demo.html;
        }
        
        # CORS headers for all responses
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
        
        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
        
        location / {
            try_files \$uri \$uri/ =404;
        }
    }
}
EOF

echo "Starting Nginx CORS server on port $PORT..."
echo "Access the demo at: http://localhost:$PORT/embed-demo.html"
echo "Make sure you have started the FinClip agent with: bun start"
echo "Press Ctrl+C to stop the server"

# Start Nginx with our configuration
nginx -c "$NGINX_CONF_FILE" -p "$NGINX_CONF_DIR"
