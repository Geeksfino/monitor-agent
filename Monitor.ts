import * as NATS from "nats";
import * as yaml from "js-yaml";
import fs from "fs";
import path from "path";

/**
 * Monitor class for monitoring conversations from finclip-agent
 * 
 * This class subscribes to conversation segments published by the NatsConversationHandler
 * and forwards them to a running cxagent instance via HTTP API.
 */
export class Monitor {
  private nc: NATS.NatsConnection | null = null;
  private subscription: NATS.Subscription | null = null;
  private config: any;
  private baseApiUrl: string;
  // Track active sessions with a map of local ID to server ID
  private sessionMap: Map<string, string> = new Map();
  
  /**
   * Create a new Monitor
   * 
   * @param apiBaseUrl Base URL of the agent API endpoint (default based on env vars or http://localhost:5678)
   * @param configPath Path to the NATS configuration file
   */
  constructor(apiBaseUrl?: string, configPath?: string) {
    // Read API port from environment variables if available
    const apiPort = process.env.AGENT_API_PORT || process.env.API_PORT || '5678';
    const defaultApiUrl = `http://localhost:${apiPort}`;
    
    // Ensure the base URL doesn't end with a slash or contain endpoints
    let baseUrl = apiBaseUrl || defaultApiUrl;
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    if (baseUrl.includes('/api/') || baseUrl.includes('/chat') || baseUrl.includes('/createSession')) {
      console.warn('Warning: API URL should be the base URL without endpoints (e.g., http://localhost:6678)');
    }
    
    this.baseApiUrl = baseUrl;
    console.log(`Using agent API base URL: ${this.baseApiUrl}`);
    
    this.loadConfig(configPath);
  }
  
  /**
   * Load configuration from YAML file
   * 
   * @param configPath Path to the NATS configuration file
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
        enabled: true,
        nats: {
          url: 'nats://localhost:4222',
          subject: 'conversation.segments.>'
        },
        filters: {
          severity_levels: []
        }
      };
      console.log('Using default configuration');
    }
  }
  
  /**
   * Connect to NATS server
   */
  async connect() {
    if (!this.config.enabled) {
      console.log('NATS subscriber is disabled in configuration');
      return;
    }
    
    try {
      console.log(`Connecting to NATS server at ${this.config.nats.url}`);
      this.nc = await NATS.connect({ servers: this.config.nats.url });
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
    if (!this.nc) {
      throw new Error('Not connected to NATS server');
    }
    
    try {
      const subject = this.config.nats.subject;
      console.log(`Subscribing to ${subject}`);
      
      this.subscription = this.nc.subscribe(subject);
      console.log(`Subscription active on ${subject}`);
      
      // Process messages
      for await (const msg of this.subscription) {
        const data = msg.string();
        try {
          const segment = JSON.parse(data);
          console.log(`Received conversation segment: ${segment.id}`);
          
          // Check if we should process this message based on filters
          if (!this.shouldProcessMessage(segment)) {
            console.log(`Skipping segment ${segment.id} (didn't match filters)`);
            continue;
          }
          
          // Forward to agent
          const conversationText = this.formatConversation(segment);
          const response = await this.forwardToAgent(conversationText, segment);
          
          // Print a formatted response
          console.log('\n------- Agent Analysis -------');
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
   * Format conversation segment for agent
   * 
   * @param segment Conversation segment
   * @returns Formatted conversation text
   */
  private formatConversation(segment: any): string {
    // Simple formatting for now, can be expanded later
    if (segment.text) {
      return segment.text;
    } else if (segment.content) {
      return segment.content;
    } else if (segment.message) {
      // Handle direct message property
      return segment.message;
    } else if (segment.messages && Array.isArray(segment.messages)) {
      // Handle array of messages
      return segment.messages
        .map((msg: any) => {
          const role = msg.role || msg.sender || 'unknown';
          const content = msg.content || msg.text || '';
          return `${role}: ${content}`;
        })
        .join('\n');
    } else {
      // For debugging, log the segment structure
      console.log('Unknown segment format:', JSON.stringify(segment, null, 2));
      return JSON.stringify(segment);
    }
  }
  
  /**
   * Check if a message should be processed based on configuration filters
   * 
   * @param segment Conversation segment to check
   * @returns Whether the message should be processed
   */
  private shouldProcessMessage(segment: any): boolean {
    // If no filters are configured, process all messages
    if (!this.config.filters || Object.keys(this.config.filters).length === 0) {
      return true;
    }
    
    // Check for keyword filters
    if (this.config.filters.keywords && Array.isArray(this.config.filters.keywords)) {
      const text = this.formatConversation(segment).toLowerCase();
      for (const keyword of this.config.filters.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          console.log(`Message matched keyword filter: ${keyword}`);
          return true;
        }
      }
    } else {
      // No keyword filters, so don't filter on keywords
      return true;
    }
    
    return false;
  }
  
  /**
   * Forward conversation segment to agent
   * 
   * @param conversationText Conversation text
   * @param segment Original conversation segment
   * @returns Agent response
   */
  private async forwardToAgent(conversationText: string, segment: any): Promise<string> {
    try {
      // Extract the customer support session ID for grouping related conversations
      const customerSessionId = segment.sessionId || segment.id?.split('-')[0] || 'unknown';
      
      // Create a stable monitor session ID based on the customer session
      // This helps us group related conversations from the same customer support session
      const monitorSessionKey = `cs-session-${customerSessionId}`;
      
      // Check if we already have a monitor agent session for this customer support session
      const serverSessionId = this.sessionMap.get(monitorSessionKey);
      const isNewSession = !serverSessionId;
      
      // For API calls, use the server-assigned session ID if available
      const sessionId = serverSessionId || monitorSessionKey;
      
      // Determine which endpoint to use
      // First message uses createSession, subsequent messages use chat
      const endpoint = isNewSession ? 'createSession' : 'chat';
      const apiUrl = `${this.baseApiUrl}/${endpoint}`;
      
      // Debug info
      if (isNewSession) {
        console.log(`Customer Session: ${customerSessionId}, Monitor Session Key: ${monitorSessionKey}, New session: ${isNewSession}`);
      } else {
        console.log(`Customer Session: ${customerSessionId}, Monitor Session Key: ${monitorSessionKey}, Server ID: ${serverSessionId}, New session: ${isNewSession}`);
      }
      
      console.log(`Sending to ${isNewSession ? 'createSession' : 'chat'} endpoint: ${apiUrl}`);
      
      // Prepare the request payload
      // Both endpoints need the actual message content
      const payload: {
        sessionId: string;
        message: string;
        stream: boolean;
        metadata?: {
          source: string;
          timestamp: string;
          customerSessionId?: string; // Include original customer session ID as metadata
        };
      } = {
        // For chat endpoint, use the server-assigned session ID
        sessionId: sessionId,
        message: conversationText,
        stream: false,
        metadata: {
          source: 'monitor',
          timestamp: new Date().toISOString(),
          customerSessionId: customerSessionId // Include the original session ID as metadata
        }
      };
      
      // Log the request payload for debugging
      console.log('Request payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        // Try to get more detailed error information
        let errorDetail = '';
        try {
          const errorData = await response.text();
          errorDetail = errorData ? `: ${errorData}` : '';
        } catch (e) {
          // Ignore error parsing issues
        }
        throw new Error(`HTTP error! status: ${response.status}${errorDetail}`);
      }
      
      const responseData = await response.json();
      
      // If this is a new session, store the session ID returned by the server
      if (isNewSession && responseData && typeof responseData === 'object') {
        // For createSession, the response contains the actual sessionId from the server
        if ('sessionId' in responseData) {
          const newServerSessionId = responseData.sessionId as string;
          // Map the customer support session to the monitor agent session ID
          this.sessionMap.set(monitorSessionKey, newServerSessionId);
          console.log(`Created new monitor session for customer session ${customerSessionId} (Server ID: ${newServerSessionId})`);
          // Return confirmation of session creation
          return `Monitor session created with ID: ${newServerSessionId} for customer session: ${customerSessionId}`;
        }
      }
      
      // For regular chat messages or if no sessionId in response
      if (typeof responseData === 'object' && responseData !== null) {
        if ('response' in responseData) {
          return String(responseData.response);
        } else if ('status' in responseData) {
          return String(responseData.status);
        }
      }
      
      // Fallback
      return 'No response from agent';
    } catch (error) {
      console.error('Error sending conversation to agent API:', error);
      throw error;
    }
  }
  
  /**
   * Disconnect from NATS server
   */
  async disconnect() {
    if (this.subscription) {
      try {
        await this.subscription.unsubscribe();
        console.log('Unsubscribed from NATS subject');
      } catch (error) {
        console.error('Error unsubscribing from NATS subject:', error);
      }
      this.subscription = null;
    }
    
    if (this.nc) {
      try {
        await this.nc.close();
        console.log('Disconnected from NATS server');
      } catch (error) {
        console.error('Error disconnecting from NATS server:', error);
      }
      this.nc = null;
    }
  }
}

// Run the monitor if this file is executed directly
if (require.main === module) {
  (async () => {
    // Check for command line arguments for API URL
    let apiUrl;
    const args = process.argv.slice(2);
    const apiUrlIndex = args.findIndex(arg => arg === '--api-url');
    if (apiUrlIndex >= 0 && apiUrlIndex < args.length - 1) {
      apiUrl = args[apiUrlIndex + 1];
    }
    
    const monitor = new Monitor(apiUrl);
    
    try {
      await monitor.connect();
      console.log('Monitor is running. Press Ctrl+C to exit.');
      await monitor.subscribe();
    } catch (error) {
      console.error('Error starting monitor:', error);
      process.exit(1);
    }
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down monitor...');
      await monitor.disconnect();
      process.exit(0);
    });
  })();
}
