#!/usr/bin/env node

/**
 * Add Webhook Events Utility
 * 
 * This script specifically adds the necessary events to the webhook configuration
 * without changing the existing webhook URL or other settings.
 * 
 * Usage:
 *   node add-webhook-events.js
 */

// Required for environment variables if using .env file
require('dotenv').config();

// Constants
const EVOLUTION_API_URL = process.env.REACT_APP_EVO_BASE_URL || 'https://evolution-api-production-ad04.up.railway.app';
const EVOLUTION_API_KEY = process.env.REACT_APP_EVO_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
// Find instance ID and name
let INSTANCE_ID = 'c8699861-27fb-4c82-8e35-d5531f604d88'; // Actual instance ID
let INSTANCE_NAME = 'teste'; // User-friendly name
const WEBHOOK_URL = 'https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in';

async function addWebhookEvents() {
  try {
    console.log(`Getting current webhook configuration...`);
    
    // First, get the current webhook configuration
    const getResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!getResponse.ok) {
      throw new Error(`Failed to get instances: ${getResponse.status}`);
    }
    
    // Get all instances to find the correct one
    const instancesData = await getResponse.json();
    console.log('Instances:', instancesData);
    
    // Find instance by ID or name
    const instance = Array.isArray(instancesData) 
      ? instancesData.find(i => i.id === INSTANCE_ID || i.name === INSTANCE_NAME)
      : null;
    
    if (!instance) {
      throw new Error(`Instance not found with ID: ${INSTANCE_ID} or name: ${INSTANCE_NAME}`);
    }
    
    console.log('Found instance:', instance);
    
    // Update the constants with the correct values
    INSTANCE_ID = instance.id;
    INSTANCE_NAME = instance.name;
    
    // Get the webhook configuration
    const webhookResponse = await fetch(`${EVOLUTION_API_URL}/instance/webhook/${INSTANCE_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!getResponse.ok) {
      throw new Error(`Failed to get webhook config: ${getResponse.status}`);
    }
    
    const webhookData = await webhookResponse.json();
    console.log('Current webhook configuration:');
    console.log(JSON.stringify(webhookData, null, 2));
    
    // Get the existing events or initialize empty array
    const currentEvents = webhookData.events || [];
    
    // Define the events we need to add (in both lowercase and uppercase formats)
    const requiredEvents = [
      'messages.upsert',
      'messages.update',
      'connection.update',
      'status.instance',
      // Also add uppercase versions for compatibility
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE',
      'CONNECTION_UPDATE',
      'STATUS_INSTANCE'
    ];
    
    // Add the events if they don't already exist
    const newEvents = [...new Set([...currentEvents, ...requiredEvents])];
    
    // Prepare the updated webhook configuration
    // Keep the existing URL and other settings
    const payload = {
      url: webhookData.url || WEBHOOK_URL,
      events: newEvents,
      webhook_by_events: webhookData.webhook_by_events || false,
      webhook_base64: webhookData.webhook_base64 || true,
      enable: true
    };
    
    console.log('\nUpdating webhook with events:');
    console.log(newEvents.join(', '));
    
    // Update the webhook
    const updateResponse = await fetch(`${EVOLUTION_API_URL}/instance/webhook/${INSTANCE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(payload)
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update webhook: ${updateResponse.status}`);
    }
    
    const updateResult = await updateResponse.json();
    console.log('\nWebhook updated successfully!');
    
    // Verify the update
    const verifyResponse = await fetch(`${EVOLUTION_API_URL}/instance/webhook/${INSTANCE_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!verifyResponse.ok) {
      console.log('Could not verify update, but update request succeeded.');
      return { success: true, verified: false };
    }
    
    const verifyData = await verifyResponse.json();
    console.log('\nUpdated webhook configuration:');
    console.log(JSON.stringify(verifyData, null, 2));
    
    // Check if the events were properly added
    const addedAll = requiredEvents.every(event => 
      verifyData.events.includes(event)
    );
    
    if (addedAll) {
      console.log('\n✅ Successfully added all required webhook events!');
    } else {
      console.log('\n⚠️ Not all events were added. Check the configuration.');
    }
    
    // Check specifically for lowercase messages.upsert
    if (verifyData.events.includes('messages.upsert')) {
      console.log('✅ messages.upsert event is correctly configured');
    } else {
      console.log('❌ messages.upsert event is missing');
    }
    
    return { success: true, verified: true, data: verifyData };
  } catch (error) {
    console.error(`Error adding webhook events: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run the function
addWebhookEvents().catch(error => {
  console.error('Unhandled error:', error.message);
});