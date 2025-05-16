#!/usr/bin/env node

/**
 * Update Webhook Events
 * 
 * This script updates the webhook configuration to include both lowercase
 * and uppercase event names for proper message handling.
 * 
 * Usage:
 *   node update-webhook-events.js
 */

// Required for environment variables if using .env file
require('dotenv').config();

// Constants
const EVOLUTION_API_URL = process.env.REACT_APP_EVO_BASE_URL || 'https://evolution-api-production-ad04.up.railway.app';
const EVOLUTION_API_KEY = process.env.REACT_APP_EVO_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'teste';
const WEBHOOK_URL = 'https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in';

// Update the webhook events
async function updateWebhookEvents() {
  try {
    console.log('Getting current webhook configuration...');
    
    // Get the current webhook configuration
    const getResponse = await fetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!getResponse.ok) {
      throw new Error(`Failed to get webhook configuration: ${getResponse.status}`);
    }
    
    const webhookData = await getResponse.json();
    console.log('Current webhook configuration:');
    console.log(JSON.stringify(webhookData, null, 2));
    
    // Get the current events
    const currentEvents = webhookData.events || [];
    
    // Add the required events in both lowercase and uppercase formats
    const requiredEvents = [
      'messages.upsert',
      'messages.update',
      'connection.update',
      'status.instance',
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE',
      'CONNECTION_UPDATE',
      'STATUS_INSTANCE'
    ];
    
    // Combine and deduplicate events
    const updatedEvents = [...new Set([...currentEvents, ...requiredEvents])];
    
    console.log('\nUpdating webhook with events:');
    console.log(updatedEvents.join(', '));
    
    // Update the webhook configuration using the required API format
    const updatePayload = {
      url: webhookData.url || WEBHOOK_URL,
      events: updatedEvents,
      webhook_by_events: webhookData.webhookByEvents || false,
      webhook_base64: webhookData.webhookBase64 || true,
      enable: webhookData.enabled || true
    };
    
    console.log('Update payload:');
    console.log(JSON.stringify(updatePayload, null, 2));
    
    // Use the correct endpoint to update webhook
    const updateResponse = await fetch(`${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(updatePayload)
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update webhook: ${updateResponse.status}`);
    }
    
    const updateResult = await updateResponse.json();
    console.log('\nWebhook updated successfully!');
    
    // Verify the update
    const verifyResponse = await fetch(`${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!verifyResponse.ok) {
      throw new Error(`Failed to verify webhook update: ${verifyResponse.status}`);
    }
    
    const verifyData = await verifyResponse.json();
    console.log('\nVerified webhook configuration:');
    console.log(JSON.stringify(verifyData, null, 2));
    
    // Check if all required events are now included
    const missingEvents = requiredEvents.filter(event => !verifyData.events.includes(event));
    
    if (missingEvents.length === 0) {
      console.log('\n✅ All required webhook events are now configured!');
    } else {
      console.log('\n⚠️ Some required events are still missing:');
      console.log(missingEvents.join(', '));
    }
    
    return { success: true, data: verifyData };
  } catch (error) {
    console.error(`Error updating webhook events: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run the update
updateWebhookEvents().catch(error => {
  console.error('Unhandled error:', error.message);
});