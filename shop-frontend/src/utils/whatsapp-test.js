#!/usr/bin/env node

/**
 * WhatsApp Integration Test Utility
 * 
 * This script provides command-line utilities for testing the WhatsApp integration
 * with Evolution API. It allows checking connection status, configuring the webhook,
 * and sending test messages.
 * 
 * Usage:
 *   node whatsapp-test.js check-connection
 *   node whatsapp-test.js configure-webhook <webhook-url>
 *   node whatsapp-test.js send-message <phone-number> <message>
 *   node whatsapp-test.js get-webhook-config
 */

// Required for environment variables if using .env file
require('dotenv').config();

// Constants
const EVOLUTION_API_URL = process.env.REACT_APP_EVO_BASE_URL || 'https://evolution-api-production-ad04.up.railway.app';
const EVOLUTION_API_KEY = process.env.REACT_APP_EVO_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'teste'; // Fixed instance name as currently configured
const DEFAULT_WEBHOOK_URL = 'https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in';

// Helper function to normalize phone numbers
function normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  
  // Handle WhatsApp format
  let normalizedNumber = phoneNumber.toString().trim();
  if (normalizedNumber.includes('@')) {
    normalizedNumber = normalizedNumber.split('@')[0];
  }
  
  // Remove any non-numeric characters except +
  normalizedNumber = normalizedNumber.replace(/[^0-9+]/g, '');
  
  // Remove + sign if present (Evolution API doesn't use it)
  if (normalizedNumber.startsWith('+')) {
    normalizedNumber = normalizedNumber.substring(1);
  }
  
  return normalizedNumber;
}

// Check WhatsApp connection status
async function checkConnection() {
  try {
    console.log('Checking WhatsApp connection status...');
    
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Evolution API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    const isConnected = data.state === 'open' || data.state === 'connected';
    
    console.log('Connection Status:', isConnected ? 'Connected' : 'Disconnected');
    console.log('State:', data.state);
    console.log('\nFull Response:');
    console.log(JSON.stringify(data, null, 2));
    
    // If connected, also fetch instance info to get phone number
    if (isConnected) {
      try {
        const infoResponse = await fetch(`${EVOLUTION_API_URL}/instance/info/${INSTANCE_NAME}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY
          }
        });
        
        if (infoResponse.ok) {
          const infoData = await infoResponse.json();
          console.log('\nInstance Info:');
          console.log('Phone Number:', infoData.instance?.me?.user || 'Unknown');
          console.log('Name:', infoData.instance?.me?.name || 'Unknown');
        }
      } catch (error) {
        console.error('Error fetching instance info:', error.message);
      }
    }
    
    return { success: true, connected: isConnected, data };
  } catch (error) {
    console.error('Error checking connection:', error.message);
    return { success: false, error: error.message };
  }
}

// Configure webhook
async function configureWebhook(webhookUrl) {
  try {
    const targetUrl = webhookUrl || DEFAULT_WEBHOOK_URL;
    console.log(`Configuring webhook to: ${targetUrl}`);
    
    const events = [
      'messages.upsert',
      'messages.update',
      'connection.update',
      'status.instance'
    ];
    
    console.log('Events to monitor:', events.join(', '));
    
    const payload = {
      url: targetUrl,
      events: events,
      webhook_by_events: false,
      webhook_base64: true,
      enable: true
    };
    
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Evolution API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Webhook configured successfully!');
    console.log('\nFull Response:');
    console.log(JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error('Error configuring webhook:', error.message);
    return { success: false, error: error.message };
  }
}

// Get current webhook configuration
async function getWebhookConfig() {
  try {
    console.log('Getting current webhook configuration...');
    
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Evolution API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('Webhook Enabled:', data.enabled === true || data.enabled === 'true' ? 'Yes' : 'No');
    console.log('Webhook URL:', data.url || 'Not configured');
    console.log('Events:', (data.events || []).join(', '));
    console.log('\nFull Response:');
    console.log(JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error('Error getting webhook configuration:', error.message);
    return { success: false, error: error.message };
  }
}

// Send test message
async function sendMessage(phoneNumber, message) {
  try {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }
    
    if (!message) {
      throw new Error('Message is required');
    }
    
    const normalizedNumber = normalizePhoneNumber(phoneNumber);
    
    console.log(`Sending WhatsApp message to ${normalizedNumber}`);
    console.log(`Message: ${message}`);
    
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: normalizedNumber,
        text: message
      })
    });
    
    if (!response.ok) {
      throw new Error(`Evolution API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Message sent successfully!');
    console.log('Message ID:', data.key?.id || 'Unknown');
    console.log('\nFull Response:');
    console.log(JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error('Error sending message:', error.message);
    return { success: false, error: error.message };
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log('Please provide a command:');
    console.log('  node whatsapp-test.js check-connection');
    console.log('  node whatsapp-test.js configure-webhook [webhook-url]');
    console.log('  node whatsapp-test.js get-webhook-config');
    console.log('  node whatsapp-test.js send-message <phone-number> <message>');
    return;
  }
  
  switch (command) {
    case 'check-connection':
      await checkConnection();
      break;
      
    case 'configure-webhook':
      const webhookUrl = args[1];
      await configureWebhook(webhookUrl);
      break;
      
    case 'get-webhook-config':
      await getWebhookConfig();
      break;
      
    case 'send-message':
      const phoneNumber = args[1];
      const message = args.slice(2).join(' ');
      
      if (!phoneNumber || !message) {
        console.log('Usage: node whatsapp-test.js send-message <phone-number> <message>');
        return;
      }
      
      await sendMessage(phoneNumber, message);
      break;
      
    default:
      console.log(`Unknown command: ${command}`);
      console.log('Available commands: check-connection, configure-webhook, get-webhook-config, send-message');
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error.message);
  process.exit(1);
});