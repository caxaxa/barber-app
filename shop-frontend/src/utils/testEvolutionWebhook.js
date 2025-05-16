/**
 * Evolution API Webhook Test Script
 * 
 * This script helps verify your Evolution API webhook configuration
 * and tests both sending and receiving messages.
 */

// Configuration variables - update these with your actual values
const EVOLUTION_API_URL = 'https://evolution-api-production-ad04.up.railway.app';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'teste';
const WEBHOOK_URL = 'https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in';

/**
 * Check the current webhook configuration in Evolution API
 */
async function checkWebhookConfig() {
  try {
    console.log('Checking current webhook configuration...');
    
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Current webhook configuration:', data);
    
    return data;
  } catch (error) {
    console.error('Error checking webhook config:', error);
    return null;
  }
}

/**
 * Set the webhook configuration in Evolution API
 */
async function setWebhookConfig(events = ['messages.upsert']) {
  try {
    console.log(`Setting webhook to ${WEBHOOK_URL} for events: ${events.join(', ')}...`);
    
    const payload = {
      url: WEBHOOK_URL,
      events: events,
      webhook_by_events: false, // Keep it simple - one URL for all events
      webhook_base64: true, // Include media as base64
      enable: true // Enable the webhook
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
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Webhook configuration set:', data);
    
    return data;
  } catch (error) {
    console.error('Error setting webhook config:', error);
    return null;
  }
}

/**
 * Check the connection status of the instance
 */
async function checkConnectionStatus() {
  try {
    console.log('Checking connection status...');
    
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Connection status:', data);
    
    return data;
  } catch (error) {
    console.error('Error checking connection status:', error);
    return null;
  }
}

/**
 * Send a test message
 */
async function sendTestMessage(phone, message = 'Test message from webhook setup') {
  try {
    console.log(`Sending test message to ${phone}...`);
    
    // Normalize phone number (remove + and any non-numeric chars)
    let normalizedPhone = phone;
    if (normalizedPhone.startsWith('+')) {
      normalizedPhone = normalizedPhone.substring(1);
    }
    normalizedPhone = normalizedPhone.replace(/[^0-9]/g, '');
    
    const payload = {
      number: normalizedPhone,
      text: message
    };
    
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Message sent:', data);
    
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
}

/**
 * Check instance info
 */
async function checkInstanceInfo() {
  try {
    console.log('Getting instance info...');
    
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Instance info:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Error getting instance info:', error);
    return null;
  }
}

/**
 * Run a comprehensive test of the webhook configuration
 */
async function runCompleteWebhookTest() {
  // 1. Check connection status
  const connectionStatus = await checkConnectionStatus();
  if (!connectionStatus || connectionStatus.state !== 'open') {
    console.log('⚠️ WARNING: WhatsApp instance is not connected. Please ensure your phone is properly connected before proceeding.');
  }
  
  // 2. Get instance info
  await checkInstanceInfo();
  
  // 3. Check current webhook config
  const currentConfig = await checkWebhookConfig();
  
  // 4. Configure webhook with all important events
  const events = [
    'messages.upsert',        // New messages
    'messages.update',        // Message updates (read receipts, etc.)
    'connection.update',      // Connection status changes
    'presence.update',        // User presence updates
    'contacts.upsert',        // New contacts
    'groups.upsert'           // Group updates
  ];
  
  await setWebhookConfig(events);
  
  // 5. Verify the new configuration was set
  const updatedConfig = await checkWebhookConfig();
  
  // 6. Send a test message to Twilio number
  await sendTestMessage('+14155238886');
  
  // 7. Also send a test message to your number
  await sendTestMessage('+556796996672');
  
  console.log('\n---------------------------------------------');
  console.log('WEBHOOK TEST COMPLETED');
  console.log('---------------------------------------------');
  console.log('Check your AWS CloudWatch logs for Lambda invocations.');
  console.log('The webhook should have been configured to use:');
  console.log(` - URL: ${WEBHOOK_URL}`);
  console.log(` - Events: ${events.join(', ')}`);
  console.log('\nNext steps if messages still aren\'t being received:');
  console.log('1. Check your API Gateway logs in AWS CloudWatch');
  console.log('2. Verify your Lambda function is correctly processing webhook events');
  console.log('3. Make sure your Lambda has permission to be invoked by API Gateway');
  console.log('4. Test your API Gateway endpoint directly with a sample webhook payload');
  console.log('---------------------------------------------');
}

// Expose functions to window for browser console testing
if (typeof window !== 'undefined') {
  window.webhookTest = {
    checkConnection: checkConnectionStatus,
    checkWebhook: checkWebhookConfig,
    setWebhook: setWebhookConfig,
    sendMessage: sendTestMessage,
    checkInstance: checkInstanceInfo,
    runFullTest: runCompleteWebhookTest
  };
  
  console.log('Evolution API webhook test functions loaded.');
  console.log('Available in console via window.webhookTest:');
  console.log('  - checkConnection(): Check connection status');
  console.log('  - checkWebhook(): View current webhook config');
  console.log('  - setWebhook(events): Configure webhook');
  console.log('  - sendMessage(phone, message): Send test message');
  console.log('  - checkInstance(): Get instance info');
  console.log('  - runFullTest(): Run complete webhook test');
  console.log('\nExample usage:');
  console.log('  window.webhookTest.runFullTest()');
}

// Export functions for module use
export {
  checkConnectionStatus,
  checkWebhookConfig,
  setWebhookConfig,
  sendTestMessage,
  checkInstanceInfo,
  runCompleteWebhookTest
};