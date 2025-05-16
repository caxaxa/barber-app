#!/usr/bin/env node

/**
 * Direct Message Sender Utility
 * 
 * This script bypasses the webhook and sends a message directly to the Evolution API.
 * It's useful for testing if the Evolution API connection works correctly.
 * 
 * Usage:
 *   node send-direct-message.js <phone-number> <message>
 */

// Required for environment variables if using .env file
require('dotenv').config();

// Constants
const EVOLUTION_API_URL = process.env.REACT_APP_EVO_BASE_URL || 'https://evolution-api-production-ad04.up.railway.app';
const EVOLUTION_API_KEY = process.env.REACT_APP_EVO_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'teste'; // Fixed instance name as currently configured

// Function to normalize a phone number
function normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  
  // Handle WhatsApp number formats
  let normalizedNumber = phoneNumber;
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

// Function to send a message directly via Evolution API
async function sendDirectMessage(phoneNumber, message) {
  try {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }
    
    if (!message) {
      throw new Error('Message is required');
    }
    
    const normalizedNumber = normalizePhoneNumber(phoneNumber);
    console.log(`Sending WhatsApp message directly to ${normalizedNumber}`);
    console.log(`Message: ${message}`);
    
    // Send the message
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
    
    // Check response
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API responded with status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n✅ SUCCESS: Message sent directly via Evolution API!');
    console.log('This bypasses the webhook flow, so no response from the bot is expected.');
    console.log('To test the full flow, use the real WhatsApp app to send a message to your connected number.');
    
    return { success: true, data };
  } catch (error) {
    console.error('\n❌ ERROR sending message:', error.message);
    return { success: false, error: error.message };
  }
}

// Function to check connection status
async function checkConnection() {
  try {
    console.log(`Checking connection status for instance ${INSTANCE_NAME}...`);
    
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API responded with status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('\nConnection Status:');
    console.log(`State: ${data.state}`);
    console.log(`Connected: ${data.state === 'open' || data.state === 'connected' ? 'Yes' : 'No'}`);
    
    // Also try to get instance info
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
        if (infoData.instance?.me?.user) {
          console.log(`Connected Number: ${infoData.instance.me.user}`);
        }
      }
    } catch (error) {
      console.warn('Could not fetch instance info:', error.message);
    }
    
    return data;
  } catch (error) {
    console.error('\n❌ ERROR checking connection:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  // Check command
  if (args[0] === 'status') {
    await checkConnection();
    return;
  }
  
  const phoneNumber = args[0];
  const message = args.slice(1).join(' ');
  
  if (!phoneNumber || !message) {
    console.log('Usage:');
    console.log('  Check connection: node send-direct-message.js status');
    console.log('  Send message: node send-direct-message.js <phone-number> <message>');
    console.log('Example: node send-direct-message.js +5511987654321 "Olá, gostaria de agendar um horário"');
    return;
  }
  
  // First check connection
  try {
    await checkConnection();
  } catch (error) {
    console.log('Continuing anyway...');
  }
  
  // Then send message
  await sendDirectMessage(phoneNumber, message);
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error.message);
  process.exit(1);
});