/**
 * Simple webhook configuration for Evolution API
 */

const fetch = require('node-fetch');

const EVOLUTION_API_URL = 'https://evolution-api-production-ad04.up.railway.app';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'teste';
const WEBHOOK_URL = 'https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in';

// Use only the supported uppercase event names
const events = [
  'MESSAGES_UPSERT',      // New messages
  'MESSAGES_UPDATE',      // Message updates
  'CONNECTION_UPDATE',    // Connection status
  'SEND_MESSAGE'          // Messages sent by us
];

async function setWebhook() {
  try {
    console.log(`Configuring webhook for ${INSTANCE_NAME}...`);
    
    // First check the current configuration
    const getResponse = await fetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    // Log the raw response for debugging
    console.log('GET Response status:', getResponse.status);
    const getRawText = await getResponse.text();
    console.log('GET Response raw text:', getRawText);
    
    // Updated payload format with a webhook property
    const payload = {
      webhook: {
        url: WEBHOOK_URL,
        events: events,
        enabled: true
      }
    };
    
    console.log('Sending payload:', JSON.stringify(payload, null, 2));
    
    // Send the SET request
    const setResponse = await fetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    });
    
    // Log the raw response for debugging
    console.log('SET Response status:', setResponse.status);
    const rawText = await setResponse.text();
    console.log('SET Response raw text:', rawText);
    
    console.log('Webhook configuration attempt completed');
  } catch (error) {
    console.error('Error:', error);
  }
}

setWebhook();