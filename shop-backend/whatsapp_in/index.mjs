import axios from 'axios';
import { handleMessage, getSuggestedOptions } from '@barber-app/booking-fsm';
import { buildContext } from './fsm-wrapper.js';

const EVO_BASE   = process.env.EVO_BASE_URL;
const EVO_KEY    = process.env.EVO_API_KEY;
const PUBLIC_URL = process.env.PUBLIC_API_URL;
const PUBLIC_KEY = process.env.PUBLIC_API_KEY;

// Store conversation context for each user
const userContexts = new Map();

/**
 * Format options as a numbered list for text-based interaction
 * @param {string} reply - The original reply message
 * @param {object} context - The FSM context
 * @returns {string} - Formatted reply with numbered options when applicable
 */
function formatReplyWithNumberedOptions(reply, context) {
  const options = getSuggestedOptions(context);
  
  // Only add numbered options if there are options available
  if (options && options.length > 0) {
    let formattedReply = reply + '\n\n';
    
    // Add each option with its number
    options.forEach((option, index) => {
      formattedReply += `${index + 1}. ${option}\n`;
    });
    
    return formattedReply;
  }
  
  // Handle confirmation step (step 6) specially
  if (context.step === 6) {
    return reply + '\n\n1. Sim\n2. Não';
  }
  
  return reply;
}

/**
 * Process user input - convert numbers to corresponding options
 * @param {string} text - User's input text 
 * @param {object} context - Current conversation context
 * @returns {string} - Processed text (option text if number was input)
 */
function processUserInput(text, context) {
  // Check if input is just a number 
  const numMatch = text.trim().match(/^(\d+)$/);
  if (!numMatch) return text; // Not a numbered response
  
  const optionIndex = parseInt(numMatch[1], 10) - 1;
  const options = getSuggestedOptions(context);
  
  // Handle service or worker selection (steps 2 & 3)
  if ((context.step === 2 || context.step === 3) && options && options[optionIndex]) {
    return options[optionIndex];
  }
  
  // Handle confirmation (step 6)
  if (context.step === 6) {
    if (optionIndex === 0) return 'sim';
    if (optionIndex === 1) return 'não';
  }
  
  return text; // Default: return original text
}

/**
 * Evolution-API webhook handler
 * POST body is: { instanceId, data: { from, body, ... } }
 */
export const handler = async (event) => {
  try {
    const payload = JSON.parse(event.body);
    const from = payload.data?.from;
    const text = payload.data?.body?.text ?? '';

    // ---- fetch config/workers for this tenant -----------------
    const shopId = payload.instanceId;             // we'll use instanceId === shop_id
    const headers = { 'x-api-key': PUBLIC_KEY };

    // Get user's existing context or fetch new data
    const contextKey = `${shopId}:${from}`;
    let ctx;

    if (userContexts.has(contextKey)) {
      ctx = userContexts.get(contextKey);
    } else {
      const [cfgRes, workersRes] = await Promise.all([
        axios.get(`${PUBLIC_URL}/public/config`, { headers, params: { shop_id: shopId } }),
        axios.get(`${PUBLIC_URL}/public/workers`, { headers, params: { shop_id: shopId } })
      ]);
      ctx = buildContext(shopId, cfgRes.data, workersRes.data.workers);
    }

    // Process user input to handle numbered responses
    const processedText = processUserInput(text, ctx);

    // ---- run FSM ---------------------------------------------
    const { reply, context, appointment } = handleMessage(processedText, ctx);
    
    // Store updated context
    userContexts.set(contextKey, context);

    // Format the reply with numbered options
    const formattedReply = formatReplyWithNumberedOptions(reply, context);

    // Book automatically if FSM produced one
    if (appointment) {
      await axios.post(`${PUBLIC_URL}/public/appointments/book`, appointment, { headers });
      // Clear context after successful booking
      userContexts.delete(contextKey);
    }

    // ---- send reply back to WhatsApp -------------------------
    await axios.post(`${EVO_BASE}/message/send`, {
      instanceId: payload.instanceId,
      message: formattedReply,
      chatId: from
    }, { headers: { apiKey: EVO_KEY } });

    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};