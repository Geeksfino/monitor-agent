# Monitor Agent

<p align="center">
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/powered%20by-Bun-orange.svg" alt="Powered by Bun"></a>
  <a href="https://github.com/Geeksfino/finclip-agent"><img src="https://img.shields.io/badge/based%20on-finclip--agent-blue.svg" alt="Based on finclip-agent"></a>
</p>

A dedicated monitoring service for finclip-agent conversations. This service subscribes to conversation segments published by the NatsConversationHandler in finclip-agent and forwards them to a running cxagent instance for analysis.

## Overview

The Monitor is designed to work alongside finclip-agent instances. It connects to a NATS server to receive conversation segments and forwards them to a cxagent instance for analysis.

## Features

- **NATS Integration**: Subscribes to conversation segments published by finclip-agent
- **Conversation Forwarding**: Forwards conversations to a cxagent instance for analysis
- **LLM-Powered Analysis**: Leverages cxagent's LLM capabilities for conversation analysis
- **Simple Architecture**: Minimal code that focuses on connecting NATS to cxagent

## Prerequisites

- [Bun](https://bun.sh/) v1.2.0 or higher
- NATS server running (default: nats://localhost:4222)
- finclip-agent with NatsConversationHandler configured
- cxagent instance running (default: http://localhost:5678)

## Setup

1. Clone this repository
2. Run `bun install` to install dependencies
3. Configure the NATS connection in `conf/nats_subscriber.yml`
4. Start a cxagent instance with `bun start`
5. Start the monitor with `bun monitor`

## Configuration

### NATS Configuration

The NATS connection is configured using the `conf/nats_subscriber.yml` file:

```yaml
# NATS Subscriber Configuration
enabled: true

# NATS server connection
nats:
  url: nats://localhost:4222
  subject: conversation.segments.>
```

### Environment Configuration

Create a `.agent.env` file in the root of the project with your LLM API key for the cxagent:

```
AGENT_OPENAI_API_KEY=your_openai_api_key
AGENT_OPENAI_MODEL=gpt-4-turbo
```

## Usage

### Starting the cxagent

Start the cxagent with:

```
bun start
```

### Starting the Monitor

Start the monitor with:

```
bun monitor
```

The monitor will connect to the NATS server and start forwarding conversation segments to the cxagent.

### Testing

A test publisher script is included to test the monitor without a running finclip-agent instance:

```
bun run tests/test-publisher.ts
```

This will publish sample conversation segments to the NATS server for the monitor to process.

## Architecture

### Components

- **Monitor.ts**: Handles NATS subscription and forwards conversations to cxagent
- **conf/nats_subscriber.yml**: Configuration for the NATS connection

### Workflow

1. The Monitor connects to the NATS server and subscribes to the configured subject
2. When a conversation segment is received, it formats the conversation for analysis
3. The formatted conversation is sent to the cxagent via its HTTP API
4. The cxagent analyzes the conversation using its LLM capabilities
5. The analysis results are printed to the console

## Integration with finclip-agent

This monitoring service is designed to work with the NatsConversationHandler in finclip-agent. To enable conversation monitoring in finclip-agent:

1. Ensure the NatsConversationHandler is configured in finclip-agent
2. Configure the NATS server URL to match in both finclip-agent and the monitor
3. Start finclip-agent, cxagent, and the monitor

The NatsConversationHandler in finclip-agent will publish conversation segments to the NATS server, and the monitor will forward them to the cxagent for analysis.

## Future Enhancements

- Integration with notification providers (email, Matrix, Telegram) via MCP servers
- Web interface for monitoring and configuration
- Advanced filtering and pattern recognition
- Persistent storage for conversation history and analysis results

## License

This project is licensed under the MIT License - see the LICENSE file for details.
