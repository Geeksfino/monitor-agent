#!/usr/bin/env bun

import * as NATS from "nats";
import * as yaml from "js-yaml";
import fs from "fs";
import path from "path";

/**
 * Simple Monitor class that connects to NATS and forwards messages to agent
 */
class Monitor {
  private natsConnection: NATS.NatsConnection | null = null;
  private natsSubscription: NATS.Subscription | null = null;
  private config: any;
  private agentUrl: string;
  private agentSessionId: string | null = null; // Single session ID for communicating with the agent
  
  /**
   * Create a new Monitor
   * @param agentUrl Base URL of the agent API endpoint (e.g., http://localhost:6678)
   * @param configPath Path to the NATS configuration file
   */
  constructor(agentUrl: string, configPath?: string, streamUrl?: string) {
    this.agentUrl = agentUrl;
    if (streamUrl) {
      (this as any).streamUrl = streamUrl; // Optionally store for future use
      console.log(`Using stream URL: ${streamUrl}`);
    }
    console.log(`Using agent URL: ${this.agentUrl}`);
    this.loadConfig(configPath);
  }
  
  /**
   * Load configuration from YAML file
   */
  private loadConfig(configPath?: string) {
    const defaultConfigPath = path.join(process.cwd(), 'conf', 'nats_subscriber.yml');
    const configFile = configPath || defaultConfigPath;
    
    try {
      const fileContents = fs.readFileSync(configFile, 'utf8');
      this.config = yaml.load(fileContents);
      console.log(`Loaded NATS configuration from ${configFile}`);
    } catch (error) {
      console.error(`Failed to load configuration from ${configFile}:`, error);
      this.config = {
        nats: {
          url: 'nats://localhost:4222',
          subject: 'conversation.segments.>'
        }
      };
      console.log('Using default configuration');
    }
  }
  
  /**
   * Connect to NATS server
   */
  async connect() {
    try {
      console.log(`Connecting to NATS server at ${this.config.nats.url}`);
      this.natsConnection = await NATS.connect({ servers: this.config.nats.url });
      console.log('Connected to NATS server');
    } catch (error) {
      console.error('Failed to connect to NATS server:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to conversation segments
   */
  async subscribe() {
    if (!this.natsConnection) {
      throw new Error('Not connected to NATS server');
    }
    
    try {
      const subject = this.config.nats.subject;
      console.log(`Subscribing to ${subject}`);
      
      this.natsSubscription = this.natsConnection.subscribe(subject);
      console.log(`Subscription active on ${subject}`);
      
      // Process messages
      for await (const msg of this.natsSubscription) {
        const data = msg.string();
        try {
          const segment = JSON.parse(data);
          console.log(`Received conversation segment: ${segment.id}`);
          console.log(`Segment data: ${JSON.stringify(segment, null, 2)}`);
          
          // Send to agent
          const response = await this.sendToAgent(segment);
          
          // Print response
          console.log('\n------- Agent Response -------');
          console.log(response);
          console.log('-----------------------------\n');
        } catch (error) {
          console.error('Error processing message:', error);
        }
      }
    } catch (error) {
      console.error('Error subscribing to NATS subject:', error);
      throw error;
    }
  }
  
  /**
   * Send message to agent
   */
  private async sendToAgent(segment: any): Promise<string> {
    try {
      // Format the complete conversation dialog
      interface Message {
        sender: string;
        content: string;
      }

      let messageContent = '';
      if (segment.messages && Array.isArray(segment.messages)) {
        // Build a conversation transcript
        messageContent = segment.messages.map((msg: Message) => {
          const role = msg.sender === 'user' ? 'User' : 'Assistant';
          return `${role}: ${msg.content}`;
        }).join('\n\n');
      } else {
        messageContent = segment.content || segment.message || JSON.stringify(segment);
      }

      // Create the natural language prompt for LLM
      const prompt = `Please analyze and evaluate the following conversation:\n\n${messageContent}`;
      
      let endpoint = '/createSession';
      let requestPayload;
      
      // If we have an existing agent session, use /chat
      if (this.agentSessionId) {
        endpoint = '/chat';
        requestPayload = {
          sessionId: this.agentSessionId,
          message: prompt
        };
        console.log(`Using existing agent session ${this.agentSessionId}`);
      } else {
        // First time sending to agent, create a new session
        requestPayload = {
          owner: 'user',
          description: prompt,
          enhancePrompt: false
        };
        console.log('Creating new agent session');
      }
      
      console.log(`Sending to agent: ${this.agentUrl}${endpoint}`);
      console.log(`Payload: ${JSON.stringify(requestPayload, null, 2)}`);
      
      // Make the request
      const response = await fetch(`${this.agentUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });
      
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        return `Error: ${response.status}`;
      }
      
      // Parse response data with proper typing
      interface CreateSessionResponse {
        sessionId: string;
      }
      
      interface ChatResponse {
        status: string;
      }
      
      const responseData = await response.json() as CreateSessionResponse | ChatResponse;
      
      // Store the agent's session ID when we get a new one
      if (!this.agentSessionId && 'sessionId' in responseData) {
        this.agentSessionId = responseData.sessionId;
        console.log(`Stored agent session ${responseData.sessionId}`);
      }
      
      return JSON.stringify(responseData, null, 2);
    } catch (error: any) {
      console.error('Error sending to agent:', error);
      return `Error: ${error?.message || 'Unknown error'}`;
    }
  }
  
  /**
   * Disconnect from NATS server
   */
  async disconnect() {
    if (this.natsSubscription) {
      try {
        await this.natsSubscription.unsubscribe();
        console.log('Unsubscribed from NATS subject');
      } catch (error) {
        console.error('Error unsubscribing from NATS subject:', error);
      }
      this.natsSubscription = null;
    }
    
    if (this.natsConnection) {
      try {
        await this.natsConnection.close();
        console.log('Disconnected from NATS server');
      } catch (error) {
        console.error('Error disconnecting from NATS server:', error);
      }
      this.natsConnection = null;
    }
  }
}

// Run the monitor if this file is executed directly
if (require.main === module) {
  (async () => {
    // Parse --api-base-url and --stream-url from arguments
    let apiBaseUrl = 'http://localhost:6678';
    let streamUrl: string | undefined = undefined;
    for (let i = 0; i < process.argv.length; i++) {
      if (process.argv[i] === '--api-base-url' && process.argv[i + 1]) {
        apiBaseUrl = process.argv[i + 1];
      }
      if (process.argv[i] === '--stream-url' && process.argv[i + 1]) {
        streamUrl = process.argv[i + 1];
      }
    }
    const monitor = new Monitor(apiBaseUrl);
    // Optionally, you can store streamUrl for future use, e.g., this.streamUrl = streamUrl;
    
    try {
      await monitor.connect();
      await monitor.subscribe();
      
      console.log('Monitor is running. Press Ctrl+C to exit.');
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('Shutting down...');
        await monitor.disconnect();
        process.exit(0);
      });
    } catch (error) {
      console.error('Error starting monitor:', error);
      process.exit(1);
    }
  })();
}
