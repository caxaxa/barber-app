#!/usr/bin/env node

/**
 * WhatsApp Webhook Diagnostics Tool
 * 
 * This script performs a thorough check of all components in the WhatsApp integration
 * to help identify where messages might be getting lost.
 * 
 * Usage:
 *   node webhook-diagnostics.js
 */

// Required for environment variables if using .env file
require('dotenv').config();

// Constants
const EVOLUTION_API_URL = process.env.REACT_APP_EVO_BASE_URL || 'https://evolution-api-production-ad04.up.railway.app';
const EVOLUTION_API_KEY = process.env.REACT_APP_EVO_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'teste';
const WEBHOOK_URL = process.env.REACT_APP_WEBHOOK_URL || 'https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in';
const TWILIO_NUMBER = '14155238886';
const YOUR_NUMBER = '556796996672';

// Function to check Evolution API connection
async function checkEvolutionAPIConnection() {
  console.log('\n🔍 CHECKING EVOLUTION API CONNECTION');
  try {
    // 1. Check if the API is accessible
    console.log('1. Testing API accessibility...');
    const testResponse = await fetch(`${EVOLUTION_API_URL}/instance/info/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!testResponse.ok) {
      console.log('❌ Evolution API is not accessible:');
      console.log(`   Status: ${testResponse.status}`);
      try {
        const errorText = await testResponse.text();
        console.log(`   Error: ${errorText}`);
      } catch (e) {
        console.log('   Could not read error response');
      }
      return { success: false, error: 'API not accessible' };
    }
    
    console.log('✅ Evolution API is accessible');
    
    // 2. Check WhatsApp connection state
    console.log('\n2. Checking WhatsApp connection state...');
    const stateResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!stateResponse.ok) {
      console.log('❌ Could not check connection state:');
      console.log(`   Status: ${stateResponse.status}`);
      return { success: false, error: 'Could not check connection state' };
    }
    
    const stateData = await stateResponse.json();
    const isConnected = stateData.state === 'open' || stateData.state === 'connected';
    
    if (isConnected) {
      console.log('✅ WhatsApp is connected');
      console.log(`   State: ${stateData.state}`);
    } else {
      console.log(`❌ WhatsApp is not connected (state: ${stateData.state})`);
    }
    
    // 3. Get more detailed instance info
    console.log('\n3. Getting instance details...');
    const infoResponse = await fetch(`${EVOLUTION_API_URL}/instance/info/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!infoResponse.ok) {
      console.log('❌ Could not get instance info:');
      console.log(`   Status: ${infoResponse.status}`);
    } else {
      const infoData = await infoResponse.json();
      console.log('✅ Got instance info:');
      
      if (infoData.instance?.me?.user) {
        console.log(`   Connected Number: ${infoData.instance.me.user}`);
      } else {
        console.log('   No connected number found in instance info');
      }
      
      if (infoData.instance?.status) {
        console.log(`   Status: ${infoData.instance.status}`);
      }
    }
    
    return { 
      success: true, 
      connected: isConnected,
      state: stateData.state
    };
  } catch (error) {
    console.log(`❌ Error checking Evolution API: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Function to check webhook configuration
async function checkWebhookConfiguration() {
  console.log('\n🔍 CHECKING WEBHOOK CONFIGURATION');
  try {
    // 1. Check if webhook is configured
    console.log('1. Getting current webhook configuration...');
    const webhookResponse = await fetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!webhookResponse.ok) {
      console.log('❌ Could not get webhook configuration:');
      console.log(`   Status: ${webhookResponse.status}`);
      return { success: false, error: 'Could not get webhook configuration' };
    }
    
    const webhookData = await webhookResponse.json();
    
    // Check if webhook is enabled
    const webhookEnabled = webhookData.enabled === true || webhookData.enabled === 'true';
    if (webhookEnabled) {
      console.log('✅ Webhook is enabled');
    } else {
      console.log('❌ Webhook is not enabled');
    }
    
    // Check webhook URL
    if (webhookData.url) {
      console.log(`✅ Webhook URL is set to: ${webhookData.url}`);
      
      if (webhookData.url !== WEBHOOK_URL) {
        console.log('⚠️ WARNING: Webhook URL does not match expected URL:');
        console.log(`   Expected: ${WEBHOOK_URL}`);
        console.log(`   Actual:   ${webhookData.url}`);
      }
    } else {
      console.log('❌ No webhook URL is configured');
    }
    
    // Check events
    if (webhookData.events && webhookData.events.length > 0) {
      console.log('✅ Webhook events configured:');
      webhookData.events.forEach(event => {
        console.log(`   - ${event}`);
      });
      
      // Check for essential events
      const essentialEvents = ['messages.upsert', 'messages.update'];
      const missingEvents = essentialEvents.filter(event => !webhookData.events.includes(event));
      
      if (missingEvents.length > 0) {
        console.log('⚠️ WARNING: Missing essential webhook events:');
        missingEvents.forEach(event => {
          console.log(`   - ${event}`);
        });
      }
    } else {
      console.log('❌ No webhook events configured');
    }
    
    return {
      success: true,
      enabled: webhookEnabled,
      url: webhookData.url,
      events: webhookData.events,
      rawData: webhookData
    };
  } catch (error) {
    console.log(`❌ Error checking webhook configuration: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Function to configure webhook (if needed)
async function configureWebhook() {
  console.log('\n🔧 CONFIGURING WEBHOOK');
  try {
    // Set webhook parameters
    const webhookUrl = WEBHOOK_URL;
    const events = [
      'messages.upsert',
      'messages.update',
      'connection.update',
      'status.instance'
    ];
    
    console.log(`Setting webhook URL to: ${webhookUrl}`);
    console.log('Configuring events:');
    events.forEach(event => {
      console.log(`   - ${event}`);
    });
    
    // Configure webhook
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        url: webhookUrl,
        events: events,
        webhook_by_events: false,
        webhook_base64: true,
        enable: true
      })
    });
    
    if (!response.ok) {
      console.log('❌ Failed to configure webhook:');
      console.log(`   Status: ${response.status}`);
      try {
        const errorText = await response.text();
        console.log(`   Error: ${errorText}`);
      } catch (e) {
        console.log('   Could not read error response');
      }
      return { success: false, error: 'Failed to configure webhook' };
    }
    
    const data = await response.json();
    console.log('✅ Webhook configured successfully');
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.log(`❌ Error configuring webhook: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Function to send a test message
async function sendTestMessage() {
  console.log('\n🔍 SENDING TEST MESSAGE');
  try {
    // 1. Send a test message to confirm sending works
    console.log('1. Sending test message...');
    
    const normalizedNumber = TWILIO_NUMBER.replace(/[^0-9+]/g, '');
    const testMessage = `Test message from diagnostic tool at ${new Date().toISOString()}`;
    
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: normalizedNumber,
        text: testMessage
      })
    });
    
    if (!response.ok) {
      console.log('❌ Failed to send test message:');
      console.log(`   Status: ${response.status}`);
      try {
        const errorText = await response.text();
        console.log(`   Error: ${errorText}`);
      } catch (e) {
        console.log('   Could not read error response');
      }
      return { success: false, error: 'Failed to send test message' };
    }
    
    const data = await response.json();
    console.log('✅ Test message sent successfully:');
    console.log(`   To: ${normalizedNumber}`);
    console.log(`   Message: ${testMessage}`);
    
    if (data.key?.id) {
      console.log(`   Message ID: ${data.key.id}`);
    }
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.log(`❌ Error sending test message: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('🔍 STARTING WHATSAPP WEBHOOK DIAGNOSTICS');
  console.log('=======================================');
  console.log(`Evolution API URL: ${EVOLUTION_API_URL}`);
  console.log(`Instance Name: ${INSTANCE_NAME}`);
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log('=======================================');
  
  // Check Evolution API connection
  const connectionResult = await checkEvolutionAPIConnection();
  
  // Check webhook configuration
  const webhookResult = await checkWebhookConfiguration();
  
  // If webhook is not configured or URL is wrong, configure it
  if (!webhookResult.success || !webhookResult.enabled || webhookResult.url !== WEBHOOK_URL) {
    console.log('\n⚠️ Webhook needs to be configured. Configuring now...');
    await configureWebhook();
  }
  
  // Send a test message
  if (connectionResult.success && connectionResult.connected) {
    await sendTestMessage();
  } else {
    console.log('\n❌ Cannot send test message because WhatsApp is not connected');
  }
  
  // Print final diagnostics report
  console.log('\n📋 DIAGNOSTICS SUMMARY');
  console.log('====================');
  console.log(`Evolution API: ${connectionResult.success ? '✅ Accessible' : '❌ Not accessible'}`);
  console.log(`WhatsApp Connection: ${(connectionResult.success && connectionResult.connected) ? '✅ Connected' : '❌ Not connected'}`);
  console.log(`Webhook Configuration: ${(webhookResult.success && webhookResult.enabled) ? '✅ Configured' : '❌ Not configured'}`);
  
  console.log('\n📋 TROUBLESHOOTING RECOMMENDATIONS');
  console.log('===============================');
  
  if (!connectionResult.success || !connectionResult.connected) {
    console.log('1. ❌ WhatsApp is not properly connected:');
    console.log('   - Generate a new QR code and scan it with your WhatsApp');
    console.log('   - Check if the Evolution API service is running');
    console.log('   - Verify your API key is correct');
  } else {
    console.log('1. ✅ WhatsApp connection is good');
  }
  
  if (!webhookResult.success || !webhookResult.enabled || webhookResult.url !== WEBHOOK_URL) {
    console.log('2. ❌ Webhook is not properly configured:');
    console.log('   - Run the webhook configuration again');
    console.log('   - Check if the webhook URL is correct');
    console.log('   - Verify the webhook events include messages.upsert');
  } else {
    console.log('2. ✅ Webhook configuration is good');
  }
  
  console.log('\n3. Check Lambda function logs:');
  console.log('   - Look at CloudWatch logs for the webhook Lambda function');
  console.log('   - Check if incoming messages are being received');
  console.log('   - Check for any errors in processing messages');
  
  console.log('\n4. Testing with Twilio:');
  console.log('   - Send a message from your phone to Twilio (+1 415 523 8886)');
  console.log('   - Include the Twilio join code if not already connected');
  console.log('   - Then send a test message and see if your bot responds');
  
  console.log('\n5. Check phone number filtering:');
  console.log('   - Make sure Twilio number (14155238886) is not being filtered');
  console.log('   - Use empty whitelist or explicitly add the Twilio number');
  
  console.log('\nFor more detailed instructions, refer to:');
  console.log('- src/docs/WEBHOOK_GUIDE.md');
  console.log('- src/docs/TWILIO_TESTING.md');
  console.log('- src/docs/WEBHOOK_TROUBLESHOOTING.md');
}

// Run the diagnostics
runDiagnostics().catch(error => {
  console.error(`Error running diagnostics: ${error.message}`);
});