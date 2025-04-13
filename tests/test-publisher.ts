#!/usr/bin/env bun

import * as NATS from "nats";
import { v4 as uuidv4 } from "uuid";

/**
 * Test script to publish sample conversation segments to NATS
 * for testing the monitor-agent
 */

// NATS connection parameters
const natsUrl = process.env.NATS_URL || "nats://localhost:4222";
const subject = process.env.NATS_SUBJECT || "conversation.segments";

// Sample conversation data
const sampleConversations = [
  {
    id: uuidv4(),
    agentId: "agent-1",
    sessionId: uuidv4(),
    timestamp: new Date().toISOString(),
    messages: [
      {
        id: uuidv4(),
        sender: "user",
        content: "Hello, I need help with my account.",
        timestamp: new Date().toISOString()
      },
      {
        id: uuidv4(),
        sender: "agent",
        content: "I'd be happy to help with your account. What specific information do you need assistance with?",
        timestamp: new Date(Date.now() + 1000).toISOString()
      },
      {
        id: uuidv4(),
        sender: "user",
        content: "I can't remember my password. Can you reset it for me?",
        timestamp: new Date(Date.now() + 2000).toISOString()
      }
    ]
  },
  {
    id: uuidv4(),
    agentId: "agent-2",
    sessionId: uuidv4(),
    timestamp: new Date().toISOString(),
    messages: [
      {
        id: uuidv4(),
        sender: "user",
        content: "I'm trying to complete a sensitive transaction but it's failing.",
        timestamp: new Date().toISOString()
      },
      {
        id: uuidv4(),
        sender: "agent",
        content: "I understand you're having trouble with a sensitive transaction. Can you provide more details about what's happening?",
        timestamp: new Date(Date.now() + 1000).toISOString()
      },
      {
        id: uuidv4(),
        sender: "user",
        content: "I entered my credit card number 4111-1111-1111-1111 and my social security number 123-45-6789, but it still says invalid.",
        timestamp: new Date(Date.now() + 2000).toISOString()
      }
    ]
  },
  {
    id: uuidv4(),
    agentId: "agent-3",
    sessionId: uuidv4(),
    timestamp: new Date().toISOString(),
    messages: [
      {
        id: uuidv4(),
        sender: "user",
        content: "Can you help me understand GDPR compliance requirements?",
        timestamp: new Date().toISOString()
      },
      {
        id: uuidv4(),
        sender: "agent",
        content: "I'd be happy to help you understand GDPR compliance requirements. The General Data Protection Regulation is a comprehensive privacy law in the EU. What specific aspects are you interested in?",
        timestamp: new Date(Date.now() + 1000).toISOString()
      },
      {
        id: uuidv4(),
        sender: "user",
        content: "I need to know what personal data we can store and for how long.",
        timestamp: new Date(Date.now() + 2000).toISOString()
      }
    ]
  }
];

// Connect to NATS and publish sample conversations
async function publishSampleConversations() {
  console.log(`Connecting to NATS server at ${natsUrl}`);
  
  try {
    // Connect to NATS
    const nc = await NATS.connect({ servers: natsUrl });
    console.log("Connected to NATS server");
    
    // Publish each sample conversation
    for (const conversation of sampleConversations) {
      const data = JSON.stringify(conversation);
      nc.publish(subject, NATS.StringCodec().encode(data));
      console.log(`Published conversation: ${conversation.id}`);
      
      // Wait a bit between publishes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Close NATS connection
    await nc.drain();
    console.log("All sample conversations published. NATS connection closed.");
  } catch (error) {
    console.error("Error publishing to NATS:", error);
  }
}

// Run the publisher
publishSampleConversations();
