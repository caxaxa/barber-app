/**
 * @fileoverview Utilities for handling text-based numbered options in WhatsApp chatbot flows.
 * Evolution API does not support clickable buttons, so we need to use text-based numbered lists.
 */

import { getSuggestedOptions } from '@barber-app/booking-fsm';

/**
 * Format a reply message with numbered options based on the current FSM context
 * @param {string} reply - The original reply message from the FSM
 * @param {object} context - The FSM context object
 * @returns {string} - Formatted reply with numbered options when applicable
 */
export function formatReplyWithOptions(reply, context) {
  // Add numbered options for current step if available
  const options = getSuggestedOptions(context);
  
  if (options && options.length > 0) {
    let formattedReply = `${reply}\n\n`;
    
    // Create numbered list for service or worker selection
    options.forEach((option, index) => {
      formattedReply += `${index + 1}. ${option}\n`;
    });
    
    return formattedReply.trim();
  }
  
  // Special handling for confirmation step
  if (context.step === 6) {
    return `${reply}\n\n1. Sim\n2. Não`;
  }
  
  // For date and time steps, add format hints
  if (context.step === 4) {
    return `${reply}\n\nPor favor, digite a data no formato AAAA-MM-DD (exemplo: 2025-05-15)`;
  }
  
  if (context.step === 5) {
    return `${reply}\n\nPor favor, digite o horário no formato HH:MM (exemplo: 14:30)`;
  }
  
  return reply;
}

/**
 * Process numeric responses by converting them to the corresponding text options
 * @param {string} text - The user's input text
 * @param {object} context - The current FSM context
 * @returns {string} - Processed text (converted option if numeric)
 */
export function processNumericInput(text, context) {
  // Strip whitespace and check if input is a number
  const numericInput = text.trim().match(/^(\d+)$/);
  if (!numericInput) return text;
  
  const optionIndex = parseInt(numericInput[1], 10) - 1;
  
  // Handle service selection (step 2)
  if (context.step === 2) {
    const services = getSuggestedOptions(context);
    if (services && optionIndex >= 0 && optionIndex < services.length) {
      return services[optionIndex];
    }
  }
  
  // Handle worker selection (step 3)
  if (context.step === 3) {
    const workers = getSuggestedOptions(context);
    if (workers && optionIndex >= 0 && optionIndex < workers.length) {
      return workers[optionIndex];
    }
  }
  
  // Handle confirmation (step 6)
  if (context.step === 6) {
    if (optionIndex === 0) return 'sim';
    if (optionIndex === 1) return 'não';
  }
  
  return text;
}

/**
 * Store user context between interactions
 * Uses a memory cache with key format: '{shopId}:{phoneNumber}'
 */
export class ContextManager {
  constructor() {
    this.contexts = new Map();
    
    // Optional: Set a cleanup interval to prevent memory leaks
    setInterval(() => this.cleanupOldContexts(), 3600000); // Clean every hour
  }
  
  /**
   * Get the key for storing a user's context
   * @param {string} shopId - The shop/instance ID
   * @param {string} phoneNumber - The user's phone number
   * @returns {string} - The storage key
   */
  getKey(shopId, phoneNumber) {
    return `${shopId}:${phoneNumber}`;
  }
  
  /**
   * Store a context for a user
   * @param {string} shopId - The shop/instance ID
   * @param {string} phoneNumber - The user's phone number
   * @param {object} context - The FSM context to store
   * @param {number} [ttl=3600000] - Time to live in ms (default: 1 hour)
   */
  setContext(shopId, phoneNumber, context, ttl = 3600000) {
    const key = this.getKey(shopId, phoneNumber);
    this.contexts.set(key, {
      context,
      expires: Date.now() + ttl
    });
  }
  
  /**
   * Get the stored context for a user
   * @param {string} shopId - The shop/instance ID
   * @param {string} phoneNumber - The user's phone number
   * @returns {object|null} - The stored context or null if not found/expired
   */
  getContext(shopId, phoneNumber) {
    const key = this.getKey(shopId, phoneNumber);
    const entry = this.contexts.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (entry.expires < Date.now()) {
      this.contexts.delete(key);
      return null;
    }
    
    return entry.context;
  }
  
  /**
   * Delete a user's context, e.g., after completing a booking
   * @param {string} shopId - The shop/instance ID
   * @param {string} phoneNumber - The user's phone number
   */
  deleteContext(shopId, phoneNumber) {
    const key = this.getKey(shopId, phoneNumber);
    this.contexts.delete(key);
  }
  
  /**
   * Clean up expired contexts to prevent memory leaks
   * @private
   */
  cleanupOldContexts() {
    const now = Date.now();
    for (const [key, entry] of this.contexts.entries()) {
      if (entry.expires < now) {
        this.contexts.delete(key);
      }
    }
  }
}

// Example usage in a webhook handler:
/*
import { handleMessage } from '@barber-app/booking-fsm';
import { formatReplyWithOptions, processNumericInput, ContextManager } from './numbered-options.js';

const contextManager = new ContextManager();

export const handler = async (event) => {
  const payload = JSON.parse(event.body);
  const shopId = payload.instanceId;
  const phoneNumber = payload.data?.from;
  const rawText = payload.data?.body?.text || '';
  
  // Get existing context or create new one
  let context = contextManager.getContext(shopId, phoneNumber) || buildInitialContext(shopId);
  
  // Process numeric input to convert to text option if needed
  const processedText = processNumericInput(rawText, context);
  
  // Run the FSM with the processed text
  const { reply, context: updatedContext, appointment } = handleMessage(processedText, context);
  
  // Save the updated context
  contextManager.setContext(shopId, phoneNumber, updatedContext);
  
  // Format the reply with numbered options
  const formattedReply = formatReplyWithOptions(reply, updatedContext);
  
  // Send the formatted reply to WhatsApp...
  
  // If appointment was created, clean up the context
  if (appointment) {
    contextManager.deleteContext(shopId, phoneNumber);
  }
  
  return { statusCode: 200 };
};
*/