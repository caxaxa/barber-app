#!/usr/bin/env node

/**
 * Direct Backend Test Utility
 * 
 * This script bypasses the Evolution API and webhook flow and directly calls
 * the backend API that processes WhatsApp messages. This is useful for testing
 * if the backend API works correctly regardless of webhook configuration.
 * 
 * Usage:
 *   node direct-backend-test.js <phone-number> <message>
 */

// Required for environment variables if using .env file
require('dotenv').config();

// Constants
const API_URL = process.env.REACT_APP_API_URL || 'https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod';
const PUBLIC_API_KEY = process.env.REACT_APP_PUBLIC_API_KEY || '';
const SHOP_ID = 'teste'; // Same as instance name in Evolution API

// Function to directly call the message processing API
async function sendDirectToBackend(phoneNumber, message) {
  try {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }
    
    if (!message) {
      throw new Error('Message is required');
    }
    
    // Normalize the phone number if needed
    let phoneNumberFormatted = phoneNumber;
    if (!phoneNumberFormatted.includes('@')) {
      phoneNumberFormatted = `${phoneNumberFormatted.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    }
    
    console.log(`Making direct API call to backend to process message`);
    console.log(`Phone: ${phoneNumberFormatted}`);
    console.log(`Message: ${message}`);
    console.log(`Shop ID: ${SHOP_ID}`);
    
    // Create a payload similar to what the webhook would receive
    const payload = {
      event: 'messages.upsert',
      instanceId: SHOP_ID,
      data: {
        key: {
          remoteJid: phoneNumberFormatted,
          fromMe: false,
          id: `DIRECT-TEST-${Date.now()}`
        },
        message: {
          conversation: message
        },
        from: phoneNumberFormatted,
        body: {
          text: message
        },
        type: 'text',
        timestamp: Date.now() / 1000
      },
      // Add a special flag to bypass filtering (backend needs to support this)
      _bypassFiltering: true
    };
    
    // Try calling the webhook endpoint directly
    const url = `${API_URL}/whatsapp-in`;
    console.log(`Calling API endpoint: ${url}`);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add API key if available
    if (PUBLIC_API_KEY) {
      headers['x-api-key'] = PUBLIC_API_KEY;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    // Check response
    let responseText;
    try {
      responseText = await response.text();
    } catch (e) {
      responseText = 'Could not read response text';
    }
    
    if (!response.ok) {
      console.log(`❌ API responded with status ${response.status}:`);
      console.log(responseText);
      
      // Try calling the public API if direct webhook call fails
      console.log('\nTrying alternative public API endpoint...');
      
      // Since the webhook might be protected, try using the public message API
      // This is a placeholder - you'll need to implement the actual public API
      // endpoint that can process messages
      const publicApiUrl = `${API_URL}/public/message`;
      console.log(`Calling public API: ${publicApiUrl}`);
      
      const publicResponse = await fetch(publicApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': PUBLIC_API_KEY || 'default-key'
        },
        body: JSON.stringify({
          phoneNumber: phoneNumberFormatted.split('@')[0],
          message: message,
          shopId: SHOP_ID
        })
      });
      
      if (!publicResponse.ok) {
        console.log(`❌ Public API also failed with status ${publicResponse.status}`);
        try {
          const publicErrorText = await publicResponse.text();
          console.log(publicErrorText);
        } catch (e) {
          console.log('Could not read public API response');
        }
        throw new Error('Both API endpoints failed');
      }
      
      console.log('✅ Public API call succeeded');
      return { success: true, method: 'public-api' };
    }
    
    console.log('✅ Direct API call succeeded:');
    console.log(responseText);
    
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (e) {
      jsonResponse = { success: true, rawResponse: responseText };
    }
    
    return { 
      success: true, 
      data: jsonResponse,
      method: 'direct-webhook'
    };
  } catch (error) {
    console.error(`Error calling backend API: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Function to try several different phone number formats
async function tryMultipleFormats(baseNumber, message) {
  const formats = [
    baseNumber,                               // As provided
    `${baseNumber}@s.whatsapp.net`,           // With WhatsApp suffix
    baseNumber.replace(/^\+/, ''),            // Without + prefix
    `+${baseNumber.replace(/^\+/, '')}`,      // With + prefix
    `${baseNumber.replace(/[^0-9]/g, '')}`,   // Only digits
  ];
  
  console.log(`🔍 TRYING MULTIPLE PHONE NUMBER FORMATS`);
  
  let successfulFormat = null;
  
  for (const format of formats) {
    console.log(`\nTrying format: ${format}`);
    const result = await sendDirectToBackend(format, message);
    
    if (result.success) {
      console.log(`✅ Success with format: ${format}`);
      successfulFormat = format;
      break;
    } else {
      console.log(`❌ Failed with format: ${format}`);
    }
  }
  
  if (successfulFormat) {
    console.log(`\n✅ Found working format: ${successfulFormat}`);
    return { success: true, workingFormat: successfulFormat };
  } else {
    console.log(`\n❌ All formats failed`);
    return { success: false, error: 'All phone number formats failed' };
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const phoneNumber = args[0] || '14155238886'; // Default to Twilio number
  const message = args.slice(1).join(' ') || "Teste do sistema de agendamentos via WhatsApp";
  
  console.log(`📱 DIRECT BACKEND TEST UTILITY`);
  console.log(`==============================`);
  console.log(`Phone Number: ${phoneNumber}`);
  console.log(`Message: ${message}`);
  console.log(`API URL: ${API_URL}`);
  console.log(`==============================\n`);
  
  if (args.length === 0) {
    console.log('No phone number provided. Using default Twilio number.');
  }
  
  await tryMultipleFormats(phoneNumber, message);
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error.message);
  process.exit(1);
});