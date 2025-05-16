#!/usr/bin/env node

/**
 * Test Possible Webhook Endpoints
 * 
 * This script tries different API endpoints to find the correct one
 * for managing webhooks in Evolution API.
 * 
 * Usage:
 *   node test-webhook-url.js
 */

// Required for environment variables if using .env file
require('dotenv').config();

// Constants
const EVOLUTION_API_URL = process.env.REACT_APP_EVO_BASE_URL || 'https://evolution-api-production-ad04.up.railway.app';
const EVOLUTION_API_KEY = process.env.REACT_APP_EVO_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_ID = 'c8699861-27fb-4c82-8e35-d5531f604d88';
const INSTANCE_NAME = 'teste';

// Test different possible webhook endpoints
async function testEndpoints() {
  // Possible endpoint patterns
  const endpoints = [
    `/webhook/find/${INSTANCE_NAME}`,
    `/webhook/find/${INSTANCE_ID}`,
    `/webhook/get/${INSTANCE_NAME}`,
    `/webhook/get/${INSTANCE_ID}`,
    `/instance/webhook/${INSTANCE_NAME}`,
    `/instance/webhook/${INSTANCE_ID}`,
    `/instance/${INSTANCE_ID}/webhook`,
    `/instance/${INSTANCE_NAME}/webhook`,
    `/instances/${INSTANCE_ID}/webhook`,
    `/instances/${INSTANCE_NAME}/webhook`,
    `/webhook/${INSTANCE_ID}`,
    `/webhook/${INSTANCE_NAME}`,
    `/instance/settings/${INSTANCE_ID}`,
    `/instance/settings/${INSTANCE_NAME}`
  ];
  
  console.log(`Testing ${endpoints.length} possible webhook endpoints...\n`);
  
  for (const endpoint of endpoints) {
    try {
      const url = `${EVOLUTION_API_URL}${endpoint}`;
      console.log(`Testing: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        }
      });
      
      if (response.ok) {
        console.log(`✅ SUCCESS! Found working endpoint: ${endpoint}`);
        try {
          const data = await response.json();
          console.log('Response data:');
          console.log(JSON.stringify(data, null, 2));
        } catch (e) {
          console.log('Could not parse response as JSON');
        }
      } else {
        console.log(`❌ Failed with status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    console.log('---');
  }
  
  console.log('\nDone testing endpoints.');
}

// Run the test
testEndpoints().catch(error => {
  console.error('Unhandled error:', error.message);
});