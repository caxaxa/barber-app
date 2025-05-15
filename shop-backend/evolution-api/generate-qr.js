/**
 * Lambda function to generate QR code for WhatsApp Evolution API connection
 * 
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response with QR code URL or error message
 */
const axios = require('axios');

exports.handler = async (event) => {
  try {
    const { instanceId } = JSON.parse(event.body || '{}');
    
    if (!instanceId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({ error: 'instanceId is required' })
      };
    }
    
    // Environment variables for the Evolution API
    const EVO_BASE_URL = process.env.EVO_BASE_URL;
    const EVO_API_KEY = process.env.EVO_API_KEY;
    
    if (!EVO_BASE_URL || !EVO_API_KEY) {
      console.error('Missing environment variables: EVO_BASE_URL or EVO_API_KEY');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }
    
    // Call Evolution API to generate a QR code
    try {
      // First check if the instance exists
      const checkResponse = await axios.get(`${EVO_BASE_URL}/instance/fetchInstances`, {
        headers: { apiKey: EVO_API_KEY }
      });
      
      const instances = checkResponse.data.instances || [];
      const instanceExists = instances.some(instance => instance.instance === instanceId);
      
      if (!instanceExists) {
        // Create a new instance if it doesn't exist
        await axios.post(`${EVO_BASE_URL}/instance/create`, {
          instanceName: instanceId,
          webhook: `${process.env.API_URL}/public/whatsapp-webhook`,
          webhookByEvents: false
        }, {
          headers: { apiKey: EVO_API_KEY }
        });
      }
      
      // Connect to get QR code
      const response = await axios.post(`${EVO_BASE_URL}/instance/connect`, {
        instanceName: instanceId
      }, {
        headers: { apiKey: EVO_API_KEY }
      });
      
      if (response.data && response.data.qrcode) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
          },
          body: JSON.stringify({
            qrCodeUrl: response.data.qrcode,
            expiresAt: Date.now() + (45 * 1000) // QR code expires in 45 seconds
          })
        };
      } else {
        console.error('Evolution API response did not include QR code:', response.data);
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
          },
          body: JSON.stringify({ error: 'Failed to generate QR code' })
        };
      }
    } catch (apiError) {
      console.error('Error calling Evolution API:', apiError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({ error: 'Error communicating with WhatsApp API' })
      };
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};