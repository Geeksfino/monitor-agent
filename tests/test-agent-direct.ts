#!/usr/bin/env bun

/**
 * Direct test script for the agent API
 * This bypasses NATS and directly tests the HTTP endpoints
 */

// Configuration
const AGENT_HTTP_PORT = process.env.AGENT_HTTP_PORT || '6678';
const API_BASE_URL = `http://localhost:${AGENT_HTTP_PORT}`;

// Test payloads
const createSessionPayload = {
  owner: "test-user",
  description: "Hello world",
  enhancePrompt: false
};

const chatPayload = {
  sessionId: "", // Will be filled after createSession
  message: "What can you help me with today?"
};

/**
 * Test the createSession endpoint
 */
async function testCreateSession() {
  console.log("Testing createSession endpoint...");
  console.log(`POST ${API_BASE_URL}/createSession`);
  console.log("Payload:", JSON.stringify(createSessionPayload, null, 2));
  
  try {
    // Using node-fetch style
    const response = await fetch(`${API_BASE_URL}/createSession`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Connection': 'close',
      },
      body: JSON.stringify(createSessionPayload),
    });
    
    // Log response status
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    // Parse response
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));
    
    // Store session ID for chat test
    if (data && data.sessionId) {
      chatPayload.sessionId = data.sessionId;
      console.log(`Session created with ID: ${data.sessionId}`);
      return data.sessionId;
    } else {
      console.error("No sessionId in response");
      return null;
    }
  } catch (error) {
    console.error("Error testing createSession:", error);
    return null;
  }
}

/**
 * Test the chat endpoint
 */
async function testChat(sessionId: string) {
  if (!sessionId) {
    console.error("Cannot test chat without a valid sessionId");
    return;
  }
  
  console.log("\nTesting chat endpoint...");
  console.log(`POST ${API_BASE_URL}/chat`);
  console.log("Payload:", JSON.stringify(chatPayload, null, 2));
  
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Connection': 'close',
      },
      body: JSON.stringify(chatPayload),
    });
    
    // Log response status
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    // Parse response
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error testing chat:", error);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log("Starting direct agent API tests...");
  console.log(`Using API base URL: ${API_BASE_URL}`);
  
  // Test createSession first
  const sessionId = await testCreateSession();
  
  // If createSession succeeded, test chat
  if (sessionId) {
    await testChat(sessionId);
  }
  
  console.log("\nTests completed");
}

// Run the tests
runTests();
