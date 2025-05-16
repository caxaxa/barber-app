#!/usr/bin/env node

/**
 * Evolution API Webhook Test Utility
 * 
 * This script simulates an incoming webhook event from Evolution API to test
 * the webhook handler without needing to send actual WhatsApp messages.
 * 
 * Usage:
 *   node webhook-test.js <phone-number> <message>
 */

// Required for environment variables if using .env file
require('dotenv').config();

// Constants
const WEBHOOK_URL = process.env.REACT_APP_WEBHOOK_URL || 'https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in';
const API_KEY = process.env.REACT_APP_API_KEY || ''; // API Gateway key if needed
const INSTANCE_NAME = 'teste'; // Fixed instance name as currently configured

// Function to send a test webhook request
async function sendTestWebhook(phoneNumber, message) {
  try {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }
    
    if (!message) {
      throw new Error('Message is required');
    }
    
    // Normalize phone number if needed
    let normalizedNumber = phoneNumber;
    if (!normalizedNumber.includes('@')) {
      // Add WhatsApp suffix if not present
      normalizedNumber = `${normalizedNumber.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    }
    
    // Create a payload that mimics Evolution API webhook format
    const payload = {
      event: 'messages.upsert',
      instanceId: INSTANCE_NAME,
      data: {
        key: {
          remoteJid: normalizedNumber,
          fromMe: false,
          id: `SIMULATED-${Date.now()}`
        },
        message: {
          conversation: message
        },
        from: normalizedNumber,
        body: {
          text: message
        },
        type: 'text',
        timestamp: Date.now() / 1000
      }
    };
    
    console.log(`Sending test webhook to ${WEBHOOK_URL}`);
    console.log(`From: ${normalizedNumber}`);
    console.log(`Message: ${message}`);
    
    // Send the webhook
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add API key if available
    if (API_KEY) {
      headers['x-api-key'] = API_KEY;
    }
    
    console.log('Using headers:', Object.keys(headers));
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    // Check response
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook returned status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('\nWebhook Response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check for filtering
    if (data.blocked) {
      console.log(`\n⚠️ WARNING: Message was BLOCKED due to: ${data.blocked}`);
      console.log('Check your whitelist/blacklist settings in WhatsApp configuration.');
    } else {
      console.log('\n✅ SUCCESS: Webhook processed the message successfully!');
      console.log('Check your WhatsApp for a response from the bot.');
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('\n❌ ERROR sending test webhook:', error.message);
    return { success: false, error: error.message };
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const phoneNumber = args[0];
  const message = args.slice(1).join(' ');
  
  if (!phoneNumber || !message) {
    console.log('Usage: node webhook-test.js <phone-number> <message>');
    console.log('Example: node webhook-test.js +5511987654321 "Olá, gostaria de agendar um horário"');
    return;
  }
  
  await sendTestWebhook(phoneNumber, message);
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error.message);
  process.exit(1);
});