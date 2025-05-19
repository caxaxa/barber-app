#!/bin/bash
# Test script for the WhatsApp webhook

# Replace with your API Gateway endpoint
WEBHOOK_URL="https://is8ccrbye3.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in"

# Tests to run (add the query parameter to the URL)
echo "1. Testing diagnostic endpoint..."
curl -X GET "$WEBHOOK_URL?diagnostic=true"
echo -e "\n\n"

echo "2. Testing message counter reset..."
curl -X GET "$WEBHOOK_URL?reset_counter=true"
echo -e "\n\n"

echo "3. Testing whitelist configuration..."
curl -X GET "$WEBHOOK_URL?whitelist_config=true"
echo -e "\n\n"

echo "4. Testing whitelist check for your number..."
curl -X GET "$WEBHOOK_URL?whitelist_test=556781229196"
echo -e "\n\n"

echo "5. Testing webhook directly with a mock payload..."
curl -X GET "$WEBHOOK_URL?test_webhook=true&phone=556781229196&text=Hello"
echo -e "\n\n"

echo "6. Testing Evolution API connectivity..."
curl -X GET "$WEBHOOK_URL?test_evo=true"
echo -e "\n\n"

echo "7. Adding your number to whitelist directly..."
curl -X GET "$WEBHOOK_URL?add_to_whitelist=556781229196"
echo -e "\n\n"

echo "Tests completed!"