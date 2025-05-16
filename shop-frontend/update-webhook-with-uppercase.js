/**
 * Update Webhook with Uppercase Events
 * 
 * This script configures the Evolution API webhook to use uppercase event names,
 * which are required for proper webhook functionality.
 */

const fetch = require('node-fetch');

// Configuration
const EVOLUTION_API_URL = process.env.REACT_APP_EVO_BASE_URL || 'https://evolution-api-production-ad04.up.railway.app';
const EVOLUTION_API_KEY = process.env.REACT_APP_EVO_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'teste';
const WEBHOOK_URL = 'https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in';

// Required events in uppercase format (Evolution API requires uppercase format)
const WEBHOOK_EVENTS = [
  'MESSAGES_UPSERT',      // New messages
  'MESSAGES_UPDATE',      // Message updates
  'CONNECTION_UPDATE',    // Connection status
  'SEND_MESSAGE',         // Messages sent by the system
  'QRCODE_UPDATED'        // QR code updates
];

async function updateWebhook() {
  try {
    console.log(`Configuring webhook for instance "${INSTANCE_NAME}"...`);
    console.log(`Webhook URL: ${WEBHOOK_URL}`);
    console.log(`Events: ${WEBHOOK_EVENTS.join(', ')}`);
    
    // First get current webhook configuration
    console.log('\nChecking current webhook configuration...');
    const findResponse = await fetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!findResponse.ok) {
      console.log(`Failed to get current webhook: HTTP ${findResponse.status}`);
    } else {
      const currentConfig = await findResponse.json();
      console.log('Current webhook configuration:');
      console.log(JSON.stringify(currentConfig, null, 2));
    }
    
    // Set the new webhook configuration using the required format
    console.log('\nUpdating webhook configuration...');
    const webhookPayload = {
      webhook: {
        url: WEBHOOK_URL,
        events: WEBHOOK_EVENTS,
        enabled: true
      }
    };
    
    console.log('Webhook payload:');
    console.log(JSON.stringify(webhookPayload, null, 2));
    
    const setResponse = await fetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(webhookPayload)
    });
    
    if (!setResponse.ok) {
      console.error(`Failed to update webhook: HTTP ${setResponse.status}`);
      const errorText = await setResponse.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const webhookResult = await setResponse.json();
    console.log('\n✅ Webhook configured successfully!');
    console.log('Updated configuration:');
    console.log(JSON.stringify(webhookResult, null, 2));
    
    // Send a test message to validate the configuration
    console.log('\nSending test message to Twilio...');
    const twilioNumber = '14155238886'; // Twilio test number
    
    const messageResponse = await fetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: twilioNumber,
        text: `Test message from WhatsApp webhook configuration at ${new Date().toISOString()}`
      })
    });
    
    if (!messageResponse.ok) {
      console.error(`Failed to send test message: HTTP ${messageResponse.status}`);
      return;
    }
    
    const messageResult = await messageResponse.json();
    console.log('\n✅ Test message sent successfully!');
    console.log('Message details:');
    console.log(JSON.stringify(messageResult, null, 2));
    
    console.log('\n---------------------------------------------');
    console.log('WEBHOOK CONFIGURATION COMPLETE');
    console.log('---------------------------------------------');
    console.log('Your WhatsApp webhook is now configured with uppercase event names.');
    console.log('To test the webhook, send a message from the Twilio test number:');
    console.log('- Send a message from WhatsApp to +1 415 523 8886');
    console.log('- Or use the Twilio sandbox by sending "join <code>" to +1 415 523 8886');
    console.log('---------------------------------------------');
  } catch (error) {
    console.error('Error updating webhook:', error.message);
  }
}

// Run the configuration
updateWebhook();