/**
 * Test script to send a message to the Twilio test number
 */

const fetch = require('node-fetch');

const EVOLUTION_API_URL = 'https://evolution-api-production-ad04.up.railway.app';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'teste';
const TWILIO_TEST_NUMBER = '14155238886'; // Twilio test number without + prefix

async function sendTestMessage() {
  try {
    console.log(`Sending test message to Twilio (${TWILIO_TEST_NUMBER})...`);
    
    const payload = {
      number: TWILIO_TEST_NUMBER,
      text: 'Test message from Evolution API at ' + new Date().toISOString()
    };
    
    console.log('Sending payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    console.log('\nMessage should be delivered if the connection is active.');
    console.log('Remember to send a message back from the Twilio number to test reception.');
    console.log('To send a message from Twilio, use the sandbox by messaging: join <sandbox-code>');
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

sendTestMessage();