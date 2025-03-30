# FinClip Chat Widget Embedding Demo

This directory contains resources for demonstrating how to embed the FinClip chat widget in web applications.

## Files

- `embed-demo.html`: Example HTML page showing how to embed the FinClip chat widget
- `nginx-cors-server.sh`: Sets up an Nginx server with CORS headers for testing
- `python-cors-server.sh`: Sets up a Python HTTP server with CORS headers for testing

## Purpose

These demo servers are provided for development and testing purposes only. They emulate the CORS setup that would be required in a production environment.

In a production environment, you would need to configure your web server with similar CORS settings to allow the chat widget to communicate with the FinClip agent API.

## Usage

You can run the demo servers using the following commands from the project root:

```bash
# Start the Nginx CORS server
bun run serve:nginx

# Start the Python CORS server
bun run serve:python
```

Both servers will serve the `embed-demo.html` file, which demonstrates how to embed the FinClip chat widget in your web applications.
