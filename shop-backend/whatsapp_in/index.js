import axios from 'axios';
import { handleMessage } from '@barber-app/booking-fsm';
import { buildContext } from './fsm-wrapper.js';
import { 
  formatReplyWithOptions, 
  processNumericInput, 
  ContextManager 
} from './numbered-options.js';

// Environment variables
const EVO_BASE = process.env.EVO_BASE_URL;
const EVO_KEY = process.env.EVO_API_KEY;
const PUBLIC_URL = process.env.PUBLIC_API_URL;
const PUBLIC_KEY = process.env.PUBLIC_API_KEY;

// Initialize context manager
const contextManager = new ContextManager();

/**
 * Evolution-API webhook handler for WhatsApp messages
 * @param {Object} event - API Gateway Lambda event
 * @returns {Object} - API Gateway response
 */
export const handler = async (event) => {
  try {
    // Parse the incoming webhook payload
    const payload = JSON.parse(event.body);
    const shopId = payload.instanceId;                // Using instanceId as shop_id
    const phoneNumber = payload.data?.from;
    const rawText = payload.data?.body?.text || '';
    
    console.log(`Received message from ${phoneNumber}: "${rawText}"`);
    
    // Create API call headers
    const publicApiHeaders = { 'x-api-key': PUBLIC_KEY };
    const evolutionApiHeaders = { 'apiKey': EVO_KEY };
    
    // Get or create user context
    const contextKey = `${shopId}:${phoneNumber}`;
    let context = contextManager.getContext(shopId, phoneNumber);
    
    // If no context exists, fetch shop and worker data
    if (!context) {
      try {
        console.log(`Fetching initial data for shop ${shopId}`);
        
        // Make parallel API calls to get config and workers
        const [configResponse, workersResponse] = await Promise.all([
          axios.get(`${PUBLIC_URL}/public/config`, { 
            headers: publicApiHeaders, 
            params: { shop_id: shopId } 
          }),
          axios.get(`${PUBLIC_URL}/public/workers`, { 
            headers: publicApiHeaders, 
            params: { shop_id: shopId } 
          })
        ]);
        
        // Build initial FSM context
        context = buildContext(
          shopId,
          configResponse.data,
          workersResponse.data.workers || []
        );
        
        console.log(`Created initial context for ${phoneNumber}`);
      } catch (error) {
        console.error('Error fetching shop data:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to fetch shop data' })
        };
      }
    }
    
    // Process numeric input if needed (convert numbers to text options)
    const processedText = processNumericInput(rawText, context);
    
    if (processedText !== rawText) {
      console.log(`Processed numeric input "${rawText}" to "${processedText}"`);
    }
    
    // Run the FSM to get the response
    const { reply, context: updatedContext, appointment } = handleMessage(processedText, context);
    
    // Save the updated context
    contextManager.setContext(shopId, phoneNumber, updatedContext);
    
    // Format the reply with numbered options
    const formattedReply = formatReplyWithOptions(reply, updatedContext);
    
    console.log(`Sending reply to ${phoneNumber}: "${formattedReply}"`);
    
    // If an appointment was created, book it through the public API
    if (appointment) {
      try {
        console.log(`Booking appointment for ${appointment.client_name}`);
        await axios.post(
          `${PUBLIC_URL}/public/appointments/book`,
          { ...appointment, shop_id: shopId },
          { headers: publicApiHeaders }
        );
        
        // Clear the context after successful booking
        contextManager.deleteContext(shopId, phoneNumber);
        console.log(`Appointment booked successfully, context cleared`);
      } catch (error) {
        console.error('Error booking appointment:', error);
        // Don't fail the request if booking fails, still send the success message
      }
    }
    
    // Send the reply back to WhatsApp via Evolution API
    try {
      await axios.post(
        `${EVO_BASE}/message/send`,
        {
          instanceId: shopId,
          message: formattedReply,
          chatId: phoneNumber
        },
        { headers: evolutionApiHeaders }
      );
      
      console.log(`Successfully sent message to ${phoneNumber}`);
    } catch (error) {
      console.error('Error sending WhatsApp reply:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to send WhatsApp reply' })
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Unhandled error in webhook handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};