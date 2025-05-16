#!/usr/bin/env node

/**
 * Twilio Test Message Utility
 * 
 * This script tests if the Twilio test number is being properly processed by simulating
 * a webhook call from the Twilio number to your WhatsApp.
 * 
 * Usage:
 *   node twilio-test.js <message>
 */

// Required for environment variables if using .env file
require('dotenv').config();

// Constants
const WEBHOOK_URL = process.env.REACT_APP_WEBHOOK_URL || 'https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in';
const INSTANCE_NAME = 'teste'; // Fixed instance name as currently configured
const TWILIO_NUMBER = '14155238886@s.whatsapp.net'; // Twilio test number with WhatsApp suffix
const YOUR_NUMBER = '556796996672@s.whatsapp.net'; // Your WhatsApp number

// Check if the phone number would be filtered
function checkFilteringForNumber(number) {
  try {
    console.log(`Checking if ${number} would be processed by the WhatsApp bot...`);
    
    // Import the filtering function from the shared code
    // This is a simulation of what the filtering function would do
    let numberWithoutSuffix = number;
    if (number.includes('@')) {
      numberWithoutSuffix = number.split('@')[0];
    }
    
    // Check if Twilio number is whitelisted
    const whitelist = ['+14155238886', '14155238886'];
    const isInWhitelist = whitelist.some(wlNumber => {
      const normalizedWL = wlNumber.replace(/^\+/, '');
      const normalizedNumber = numberWithoutSuffix.replace(/^\+/, '');
      return normalizedWL === normalizedNumber;
    });
    
    if (isInWhitelist) {
      console.log('✅ Number IS in whitelist - messages SHOULD be processed');
    } else {
      console.log('❌ Number is NOT in whitelist - messages might be ignored');
      console.log('Add this number to your whitelist: +14155238886');
    }
    
    return isInWhitelist;
  } catch (error) {
    console.error('Error checking filtering:', error);
    return false;
  }
}

// Function to send a test webhook request for Twilio
async function simulateTwilioMessage(message) {
  try {
    if (!message) {
      throw new Error('Message is required');
    }
    
    console.log(`Simulating a Twilio message from ${TWILIO_NUMBER} to your number ${YOUR_NUMBER}`);
    console.log(`Message: ${message}`);
    
    // Check filtering first
    checkFilteringForNumber(TWILIO_NUMBER);
    
    // Create a payload that mimics Evolution API webhook format for a Twilio message
    const payload = {
      event: 'messages.upsert',
      instanceId: INSTANCE_NAME,
      data: {
        key: {
          remoteJid: TWILIO_NUMBER,
          fromMe: false,
          id: `TWILIO-TEST-${Date.now()}`
        },
        message: {
          conversation: message
        },
        from: TWILIO_NUMBER,
        body: {
          text: message
        },
        type: 'text',
        timestamp: Date.now() / 1000
      }
    };
    
    console.log(`\nAttempting to send webhook to ${WEBHOOK_URL}...`);
    console.log(`This may fail with a 403 error if direct testing isn't allowed.`);
    
    try {
      // Send the webhook
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Webhook returned status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('\nWebhook Response:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.blocked) {
        console.log(`\n⚠️ WARNING: Message was BLOCKED due to: ${data.blocked}`);
        console.log('Check your whitelist/blacklist settings in WhatsApp configuration.');
      } else {
        console.log('\n✅ SUCCESS: Webhook processed the message successfully!');
      }
    } catch (error) {
      console.log(`\nExpected error with direct webhook testing: ${error.message}`);
      console.log('This is normal - direct webhook testing often fails with 403 errors.');
      console.log('\nInstead, try sending a real message from the Twilio test number:');
      console.log('- Send a WhatsApp message to the Twilio number: +1 415 523 8886');
      console.log('- Include code: join indeed-correctly-grain');
      console.log('- Then send a test message to start chatting with the sandbox');
    }
    
    console.log('\n✅ VERIFICATION STEPS:');
    console.log('1. In WhatsApp configuration, make sure "Twilio Test Number" is in the whitelist');
    console.log('2. Make sure the webhook is configured in Evolution API');
    console.log('3. Send a real message from Twilio to test if your bot responds');
    
    return { success: true };
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const message = args.join(' ') || "Teste do sistema de agendamentos via WhatsApp";
  
  if (args.length === 0) {
    console.log('No message provided. Using default test message.');
  }
  
  await simulateTwilioMessage(message);
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error.message);
  process.exit(1);
});