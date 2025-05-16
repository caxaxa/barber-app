/**
 * Utility functions for testing WhatsApp integration
 */

/**
 * Send a test message to the specified phone number via Evolution API
 * This is a utility function that can be called from the browser console for testing
 * 
 * @param {string} phoneNumber - The recipient phone number (with or without + sign)
 * @param {string} message - The message to send
 * @returns {Promise<Object>} - The response from Evolution API
 */
export async function sendTestWhatsAppMessage(phoneNumber, message = 'Test message from booking system') {
  try {
    // Normalize the phone number (remove any @ suffix and non-numeric chars except +)
    let normalizedNumber = phoneNumber;
    if (normalizedNumber.includes('@')) {
      normalizedNumber = normalizedNumber.split('@')[0];
    }
    normalizedNumber = normalizedNumber.replace(/[^0-9+]/g, '');
    
    // Remove + sign if present (Evolution API doesn't need it)
    if (normalizedNumber.startsWith('+')) {
      normalizedNumber = normalizedNumber.substring(1);
    }
    
    console.log(`Sending test message to ${normalizedNumber}`);
    
    // Evolution API parameters
    const evoBaseUrl = process.env.REACT_APP_EVO_BASE_URL || 'https://evolution-api-production-ad04.up.railway.app';
    const evoApiKey = process.env.REACT_APP_EVO_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
    const instanceName = 'teste'; // Fixed instance name that's already connected
    
    // Create payload for Evolution API
    const payload = {
      number: normalizedNumber,
      text: message
    };
    
    // Send message via Evolution API
    const response = await fetch(`${evoBaseUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evoApiKey
      },
      body: JSON.stringify(payload)
    });
    
    // Parse response
    const data = await response.json();
    console.log('Message sending response:', data);
    
    return {
      success: true,
      message: 'Message sent successfully',
      response: data
    };
  } catch (error) {
    console.error('Error sending test message:', error);
    return {
      success: false,
      message: `Error sending message: ${error.message}`,
      error
    };
  }
}

/**
 * Check the connection status of the WhatsApp instance
 * 
 * @returns {Promise<Object>} - Connection status information
 */
export async function checkWhatsAppConnection() {
  try {
    const evoBaseUrl = process.env.REACT_APP_EVO_BASE_URL || 'https://evolution-api-production-ad04.up.railway.app';
    const evoApiKey = process.env.REACT_APP_EVO_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
    const instanceName = 'teste';
    
    const response = await fetch(`${evoBaseUrl}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evoApiKey
      }
    });
    
    const data = await response.json();
    console.log('Connection status:', data);
    
    return {
      success: true,
      connected: data?.state === 'open' || data?.state === 'connected',
      status: data
    };
  } catch (error) {
    console.error('Error checking connection status:', error);
    return {
      success: false,
      connected: false,
      error: error.message
    };
  }
}

// Expose functions to window for easy testing from browser console
if (typeof window !== 'undefined') {
  window.whatsappTest = {
    sendTestMessage: sendTestWhatsAppMessage,
    checkConnection: checkWhatsAppConnection
  };
  
  console.log('WhatsApp test functions available in console via window.whatsappTest');
  console.log('Example usage:');
  console.log('  window.whatsappTest.checkConnection()');
  console.log('  window.whatsappTest.sendTestMessage("+14155238886", "Hello from test")');
}