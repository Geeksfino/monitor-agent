# Monitor Agent

<p align="center">
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/powered%20by-Bun-orange.svg" alt="Powered by Bun"></a>
  <a href="https://github.com/Geeksfino/finclip-agent"><img src="https://img.shields.io/badge/based%20on-finclip--agent-blue.svg" alt="Based on finclip-agent"></a>
</p>

A dedicated monitoring service for finclip-agent conversations. This service subscribes to conversation segments published by the NatsConversationHandler in finclip-agent and forwards them to a running cxagent instance for analysis.

This service runs as a Docker container managed by `supervisor`, running both the monitoring logic (`Monitor.ts`) and the underlying cxagent (`scripts/start.js`).

## Overview

The Monitor is designed to work alongside finclip-agent instances. It connects to a NATS server to receive conversation segments and forwards them to the embedded cxagent instance for analysis.

## Features

- **NATS Integration**: Subscribes to conversation segments published by finclip-agent.
- **Conversation Forwarding**: Forwards conversations to the embedded cxagent instance for analysis.
- **LLM-Powered Analysis**: Leverages cxagent's LLM capabilities for conversation analysis.
- **Dockerized**: Runs as a self-contained Docker image with `supervisor`.
- **Configurable**: NATS connection configurable via environment variables.
- **CI/CD**: Automatically built and published to GitHub Container Registry via GitHub Actions.

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose (recommended).
- Access to a NATS server.
- (Optional) [Bun](https://bun.sh/) v1.2.0 or higher for local development.

## Running with Docker

This is the recommended way to run the Monitor Agent.

### Building the Image

You can build the image locally:

```bash
# Navigate to the monitor-agent directory
cd monitor-agent

# Build the Docker image
docker build -t monitor-agent:latest .
```

Alternatively, use the pre-built image from GitHub Container Registry (see CI/CD section).

### Running the Container

The container requires the NATS server URL to be passed via an environment variable.

```bash
docker run -it --rm \
  -e MONITOR_NATS_URL="nats://your-nats-server:4222" \
  ghcr.io/geeksfino/monitor-agent:latest
```

**Replace `nats://your-nats-server:4222` with your actual NATS server address.**

**Connecting to Local NATS:**

If your NATS server is running directly on your Docker host machine (macOS or Windows), use `host.docker.internal` as the hostname:

```bash
docker run -it --rm \
  -e MONITOR_NATS_URL="nats://host.docker.internal:4222" \
  ghcr.io/geeksfino/monitor-agent:latest
```

**Using Local Configuration Files:**

You can override the configuration files baked into the image by mounting local files/directories using the `-v` flag. This is useful for development or providing custom settings without rebuilding the image.

```bash
# Run from the monitor-agent directory
docker run -it --rm \
  -v "$(pwd)/conf":/app/conf \
  -v "$(pwd)/brain.md":/app/brain.md \
  -e MONITOR_NATS_URL="nats://host.docker.internal:4222" \
  ghcr.io/geeksfino/monitor-agent:latest
```

This command mounts your local `./conf` directory over `/app/conf` and your local `./brain.md` over `/app/brain.md` inside the container.

## Configuration

### NATS Connection (`MONITOR_NATS_URL`)

- **Primary Method (Docker):** Set the `MONITOR_NATS_URL` environment variable when running the Docker container (e.g., `-e MONITOR_NATS_URL="nats://your-server:4222"`).
- **Fallback / Local Dev:** If the environment variable is not set, the service will attempt to read the URL from `conf/nats_subscriber.yml`. If that fails, it defaults to `nats://localhost:4222`.

```yaml
# conf/nats_subscriber.yml (Fallback Configuration)
enabled: true
nats:
  url: nats://localhost:4222 # Used if MONITOR_NATS_URL env var is not set
  subject: conversation.segments.>
```

### Agent LLM Configuration (`.agent.env`)

The underlying cxagent requires LLM API credentials. Create a `.agent.env` file in the root of *your local project checkout* if you plan to mount local configurations. **Do not commit this file.**

```env
# .agent.env (Example for OpenAI)
AGENT_OPENAI_API_KEY=your_openai_api_key
AGENT_OPENAI_MODEL=gpt-4-turbo
```

When running with Docker and mounting the `conf` directory, ensure the `.agent.env` file is present within the *mounted* directory if needed by the agent scripts started by supervisor. However, it's often better practice to pass secrets like API keys as environment variables directly to the `docker run` command (e.g., `-e AGENT_OPENAI_API_KEY=...`). *Note: The current Dockerfile/supervisor setup doesn't explicitly load `.agent.env`; this needs verification based on how `scripts/start.js` handles env vars.*

## Local Development / Testing

While Docker is recommended, you can run components locally for testing.

1.  **Install Dependencies:** `bun install`
2.  **Run Test Publisher:** Use the test script to send sample messages to your NATS server.
    ```bash
    bun run tests/test-publisher.ts
    ```
    *(Ensure your NATS server address in `tests/test-publisher.ts` and potentially `conf/nats_subscriber.yml` is correct for local testing)*.
3.  **Run Monitor Service Locally:**
    ```bash
    # Ensure MONITOR_NATS_URL is set appropriately in your shell or
    # rely on conf/nats_subscriber.yml
    bun scripts/run-monitor.js
    ```
4.  **Run Agent Locally:**
    ```bash
    # Requires .agent.env or environment variables for API keys
    bun scripts/start.js
    ```

## CI/CD

This project uses GitHub Actions to automatically build the Docker image and push it to GitHub Container Registry (GHCR) on every push to the `main` branch.

- **Workflow File:** `.github/workflows/docker-build.yml`
- **Published Image:** `ghcr.io/geeksfino/monitor-agent` (Tags: `latest` and commit SHA)
- **GHCR Package:** [https://github.com/orgs/Geeksfino/packages/container/package/monitor-agent](https://github.com/orgs/Geeksfino/packages/container/package/monitor-agent) (Adjust link if needed)

## Architecture

### Components

- **Monitor.ts**: Handles NATS subscription and forwards conversations to the cxagent HTTP API.
- **scripts/start.js**: Standard cxagent startup script.
- **scripts/run-monitor.js**: Script to run the Monitor.ts service.
- **conf/nats_subscriber.yml**: Fallback configuration for the NATS connection.
- **conf/supervisord.conf**: Supervisor configuration to manage the monitor and agent processes within Docker.
- **Dockerfile**: Defines the Docker image build process.

### Workflow (inside Docker container)

1.  `supervisord` starts both the `monitor` process (`run-monitor.js`) and the `agent` process (`start.js`).
2.  The Monitor connects to the NATS server (using `MONITOR_NATS_URL` primarily) and subscribes to conversation segments.
3.  When a segment is received, the Monitor formats it and sends it to the cxagent's HTTP API (running locally within the same container).
4.  The cxagent analyzes the conversation using its LLM capabilities.
5.  Analysis results are printed to the console (stdout via supervisor).

## Integration with finclip-agent

This monitoring service is designed to work with the `NatsConversationHandler` in finclip-agent.

1.  Ensure the `NatsConversationHandler` is configured and enabled in your finclip-agent instance(s).
2.  Configure the NATS server URL in both finclip-agent and the Monitor Agent (`MONITOR_NATS_URL`) to point to the same NATS server.
3.  Run finclip-agent(s) and the Monitor Agent Docker container.

Conversation segments published by finclip-agent will be picked up by the Monitor Agent and analyzed by the embedded cxagent.

## Future Enhancements

- Integration with notification providers (email, Matrix, Telegram) via MCP servers.
- Web interface for monitoring and configuration.
- Advanced filtering and pattern recognition.
- Persistent storage for conversation history and analysis results.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
