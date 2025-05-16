/**
 * Direct webhook configuration script for Evolution API
 * 
 * This script can be run with Node.js to directly configure your webhook
 * without needing to start the full React application.
 * 
 * Usage:
 * 1. Save this file as configure-webhook.js
 * 2. Run it with: node configure-webhook.js
 */

const EVOLUTION_API_URL = 'https://evolution-api-production-ad04.up.railway.app';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'teste';
const WEBHOOK_URL = 'https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in';

// Required events for proper webhook operation
const WEBHOOK_EVENTS = [
  'messages.upsert',        // New messages
  'messages.update',        // Message status updates (read receipts)
  'connection.update',      // Connection status
  'status.instance',        // Instance status changes
  'MESSAGES_UPSERT',        // New messages (uppercase)
  'MESSAGES_UPDATE',        // Message updates (uppercase)
  'CONNECTION_UPDATE',      // Connection status (uppercase)
  'STATUS_INSTANCE'         // Instance status (uppercase)
];

// Use installed node-fetch module
const fetch = require('node-fetch');

/**
 * Configure the webhook in Evolution API
 */
async function configureWebhook() {
  console.log(`Setting up webhook for ${INSTANCE_NAME} instance...`);
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log(`Events: ${WEBHOOK_EVENTS.join(', ')}`);
  
  try {
    // First check connection status
    console.log('\nChecking connection status...');
    const connectionResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!connectionResponse.ok) {
      throw new Error(`HTTP error! Status: ${connectionResponse.status}`);
    }
    
    const connectionData = await connectionResponse.json();
    console.log(`Connection status: ${connectionData.state}`);
    
    if (connectionData.state !== 'open' && connectionData.state !== 'connected') {
      console.log('\n⚠️ WARNING: WhatsApp instance is not connected!');
      console.log('The webhook can still be configured, but no messages will be processed');
      console.log('until the WhatsApp instance is properly connected.');
    }
    
    // Now check current webhook configuration
    console.log('\nChecking current webhook configuration...');
    const currentConfigResponse = await fetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!currentConfigResponse.ok) {
      throw new Error(`HTTP error! Status: ${currentConfigResponse.status}`);
    }
    
    const currentConfig = await currentConfigResponse.json();
    console.log('Current webhook configuration:');
    
    if (currentConfig.webhook && currentConfig.webhook.url) {
      console.log(`URL: ${currentConfig.webhook.url}`);
      console.log(`Enabled: ${currentConfig.webhook.enabled}`);
      console.log(`Events: ${currentConfig.webhook.events.join(', ')}`);
    } else {
      console.log('No webhook currently configured');
    }
    
    // Now set the webhook
    console.log('\nConfiguring webhook...');
    const webhookResponse = await fetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        events: WEBHOOK_EVENTS,
        webhook_by_events: false,  // Use single URL for all events
        webhook_base64: true,      // Include media files as base64
        enable: true               // Enable the webhook
      })
    });
    
    if (!webhookResponse.ok) {
      throw new Error(`HTTP error! Status: ${webhookResponse.status}`);
    }
    
    const webhookData = await webhookResponse.json();
    
    if (webhookData.status === 'success') {
      console.log('\n✅ Webhook configured successfully!');
    } else {
      console.log('\n❌ Failed to configure webhook!');
      console.log(webhookData);
    }
    
    // Send a test message
    console.log('\nSending test message...');
    
    // Note: Evolution API doesn't need the + prefix
    const twilioNumber = '14155238886'; // Removed + sign
    
    const messageResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: twilioNumber,
        text: 'Test message from webhook configuration script'
      })
    });
    
    if (!messageResponse.ok) {
      throw new Error(`HTTP error! Status: ${messageResponse.status}`);
    }
    
    const messageData = await messageResponse.json();
    
    if (messageData.status === 'success') {
      console.log('\n✅ Test message sent successfully!');
    } else {
      console.log('\n❌ Failed to send test message!');
      console.log(messageData);
    }
    
    // Final summary and instructions
    console.log('\n---------------------------------------------');
    console.log('WEBHOOK CONFIGURATION COMPLETE');
    console.log('---------------------------------------------');
    console.log('Your WhatsApp webhook is now configured with:');
    console.log(`URL: ${WEBHOOK_URL}`);
    console.log(`Events: ${WEBHOOK_EVENTS.join(', ')}`);
    console.log('\nNext steps:');
    console.log('1. Check your AWS CloudWatch logs to verify webhook reception');
    console.log('2. If messages aren\'t being processed, verify your AWS Lambda function');
    console.log('3. To test direct message sending, use:');
    console.log(`   curl -X POST "${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}" \\`);
    console.log(`   -H "Content-Type: application/json" \\`);
    console.log(`   -H "apikey: ${EVOLUTION_API_KEY}" \\`);
    console.log('   -d \'{ "number": "14155238886", "text": "Test message" }\'');
    console.log('---------------------------------------------');
    
  } catch (error) {
    console.error('Error configuring webhook:', error);
  }
}

// Run the configuration immediately
configureWebhook();