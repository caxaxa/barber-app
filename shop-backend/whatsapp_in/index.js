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
    
    // Helper function to check if a number should be allowed based on whitelist/blacklist
    const checkNumberFilter = (number, whatsappConfig) => {
      // If WhatsApp integration is not enabled or config is missing, allow all
      if (!whatsappConfig?.enabled) return true;
      
      // Check if it's a group message
      const isGroup = number.includes('@g.us');
      if (isGroup && whatsappConfig.disableGroups) {
        console.log(`Blocking message from group chat: ${number}`);
        return { allowed: false, reason: 'group' };
      }
      
      // Apply number filtering based on whitelist/blacklist
      const filterMode = whatsappConfig.filterMode || 'whitelist';
      const filterNumbers = whatsappConfig.filterNumbers || [];
      
      // Check if filtering should be applied
      if (filterNumbers.length > 0) {
        // Normalize phone number for comparison
        const normalizedNumber = number.replace(/[^0-9+]/g, '');
        
        // Check if the number is in the filter list
        const isInList = filterNumbers.some(num => {
          const normalizedFilterNumber = num.replace(/[^0-9+]/g, '');
          return normalizedNumber.includes(normalizedFilterNumber) || 
                normalizedFilterNumber.includes(normalizedNumber);
        });
        
        // For whitelist: block if NOT in list
        // For blacklist: block if IN list
        const shouldBlock = (filterMode === 'whitelist') ? !isInList : isInList;
        
        if (shouldBlock) {
          console.log(`Blocking message from ${number} based on ${filterMode} configuration`);
          return { allowed: false, reason: filterMode };
        }
      } else if (filterMode === 'whitelist' && filterNumbers.length === 0) {
        // Empty whitelist means block all (unless it's just not configured)
        console.log(`Blocking message from ${number} - empty whitelist`);
        return { allowed: false, reason: 'emptyWhitelist' };
      }
      
      console.log(`Message from ${number} allowed by ${filterMode} filter check`);
      return { allowed: true };
    };
    
    // Get shop config first to check filtering
    let shopConfig;
    try {
      const configResponse = await axios.get(`${PUBLIC_URL}/public/config`, { 
        headers: publicApiHeaders, 
        params: { shop_id: shopId } 
      });
      shopConfig = configResponse.data;
      
      // Check if this number should be blocked
      const filterResult = checkNumberFilter(phoneNumber, shopConfig?.messaging?.whatsappIntegration);
      if (!filterResult.allowed) {
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            success: true, 
            blocked: filterResult.reason 
          })
        };
      }
    } catch (error) {
      console.error('Error fetching shop config for filtering:', error);
      // Continue processing if we can't check filters
    }
    
    // Get or create user context
    const contextKey = `${shopId}:${phoneNumber}`;
    let context = contextManager.getContext(shopId, phoneNumber);
    
    // If no context exists, fetch additional data and create context
    if (!context) {
      try {
        console.log(`Fetching worker data for shop ${shopId}`);
        
        // Only fetch workers since we already have config
        const workersResponse = await axios.get(`${PUBLIC_URL}/public/workers`, { 
          headers: publicApiHeaders, 
          params: { shop_id: shopId } 
        });
        
        // Build initial FSM context using the config we already fetched
        context = buildContext(
          shopId,
          shopConfig, // Use the config we already fetched
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