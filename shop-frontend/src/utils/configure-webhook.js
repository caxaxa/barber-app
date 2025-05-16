#!/usr/bin/env node

/**
 * Configure Webhook for Evolution API
 * 
 * This script configures the webhook for your existing Evolution API instance.
 * 
 * Usage:
 *   node configure-webhook.js
 */

// Required for environment variables if using .env file
require('dotenv').config();

// Constants
const EVOLUTION_API_URL = process.env.REACT_APP_EVO_BASE_URL || 'https://evolution-api-production-ad04.up.railway.app';
const EVOLUTION_API_KEY = process.env.REACT_APP_EVO_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'teste'; // Using 'teste' as instance name
const WEBHOOK_URL = 'https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in'; // Your webhook URL

// Function to configure webhook
async function configureWebhook() {
  try {
    console.log(`Configuring webhook for instance "${INSTANCE_NAME}"...`);
    console.log(`Evolution API URL: ${EVOLUTION_API_URL}`);
    console.log(`Webhook URL: ${WEBHOOK_URL}`);
    
    // Set events in the format expected by Evolution API
    // Note that we're including both lowercase and uppercase event names
    // to cover all possible formats
    const events = [
      'messages.upsert',
      'messages.update',
      'connection.update',
      'status.instance',
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE',
      'CONNECTION_UPDATE',
      'STATUS_INSTANCE'
    ];
    
    console.log('Events to monitor:');
    events.forEach(event => console.log(`- ${event}`));
    
    // Configure the webhook
    const response = await fetch(`${EVOLUTION_API_URL}/instance/webhook/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        webhook: {
          url: WEBHOOK_URL,
          events: events,
          webhook_by_events: false,
          webhook_base64: true,
          enable: true
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Failed to configure webhook: ${response.status}`);
      console.log(errorText);
      return { success: false, error: errorText };
    }
    
    console.log('✅ Webhook configured successfully!');
    
    // Verify the webhook configuration
    const verifyResponse = await fetch(`${EVOLUTION_API_URL}/instance/webhook/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!verifyResponse.ok) {
      console.log('⚠️ Could not verify webhook configuration');
      return { success: true, verified: false };
    }
    
    const verifyData = await verifyResponse.json();
    console.log('\nWebhook Configuration:');
    console.log(`Enabled: ${verifyData.enabled ? 'Yes' : 'No'}`);
    console.log(`URL: ${verifyData.url}`);
    console.log('Events:');
    if (verifyData.events && verifyData.events.length > 0) {
      verifyData.events.forEach(event => console.log(`- ${event}`));
    } else {
      console.log('No events configured');
    }
    
    return { success: true, verified: true, data: verifyData };
  } catch (error) {
    console.error(`Error configuring webhook: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run the main function
configureWebhook().catch(error => {
  console.error('Unhandled error:', error.message);
  process.exit(1);
});