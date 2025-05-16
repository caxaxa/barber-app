#!/usr/bin/env node

/**
 * Create Evolution API Instance Utility
 * 
 * This script creates the "teste" instance in Evolution API if it doesn't exist.
 * 
 * Usage:
 *   node create-instance.js
 */

// Required for environment variables if using .env file
require('dotenv').config();

// Constants
const EVOLUTION_API_URL = process.env.REACT_APP_EVO_BASE_URL || 'https://evolution-api-production-ad04.up.railway.app';
const EVOLUTION_API_KEY = process.env.REACT_APP_EVO_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'teste';

// Function to create instance
async function createInstance() {
  try {
    console.log(`Creating instance "${INSTANCE_NAME}" in Evolution API...`);
    
    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        instanceName: INSTANCE_NAME,
        token: EVOLUTION_API_KEY,
        webhook: {
          url: 'https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in',
          events: [
            'messages.upsert',
            'messages.update',
            'connection.update',
            'status.instance'
          ],
          webhook_by_events: false,
          webhook_base64: true,
          enable: true
        }
      })
    });
    
    let responseText;
    try {
      responseText = await response.text();
    } catch (e) {
      responseText = 'Could not read response text';
    }
    
    if (!response.ok) {
      console.log(`❌ Failed to create instance: ${response.status}`);
      console.log(responseText);
      return { success: false, error: responseText };
    }
    
    console.log('✅ Instance created successfully');
    console.log(responseText);
    
    // Now generate QR code
    console.log('\nGenerating QR code for connection...');
    
    const qrResponse = await fetch(`${EVOLUTION_API_URL}/instance/qrcode/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!qrResponse.ok) {
      console.log(`❌ Failed to generate QR code: ${qrResponse.status}`);
      try {
        const qrErrorText = await qrResponse.text();
        console.log(qrErrorText);
      } catch (e) {
        console.log('Could not read QR response');
      }
      return { success: true, qrcode: null };
    }
    
    const qrData = await qrResponse.json();
    
    console.log('✅ QR code generated');
    
    // Print instructions
    console.log('\n=== INSTRUCTIONS ===');
    console.log('1. Scan the QR code with your WhatsApp app');
    console.log('2. Wait for the connection to be established');
    console.log('3. Configure the webhook with:');
    console.log('   node src/utils/webhook-diagnostics.js');
    console.log('\nQR Code URL:');
    
    // Extract QR code from various response formats
    let qrCode = null;
    if (qrData.qrcode) {
      qrCode = qrData.qrcode;
    } else if (qrData.base64) {
      qrCode = qrData.base64;
    }
    
    if (qrCode) {
      console.log(qrCode);
    } else {
      console.log('Could not extract QR code from response');
    }
    
    return { success: true, qrcode: qrCode };
  } catch (error) {
    console.error(`Error creating instance: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run the main function
createInstance().catch(error => {
  console.error('Unhandled error:', error.message);
  process.exit(1);
});