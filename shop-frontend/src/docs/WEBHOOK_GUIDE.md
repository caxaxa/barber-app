# Evolution API Webhook Guide

This guide provides detailed information about working with the Evolution API webhook for WhatsApp integration.

## Webhook Flow

When a user sends a message to your WhatsApp number, the following process occurs:

1. **Message Receipt**: A user sends a message to your WhatsApp number (currently 556796996672)
2. **Evolution API Processing**: Evolution API receives the message from WhatsApp
3. **Webhook Forwarding**: Evolution API forwards the message to your configured webhook URL
4. **Bot Processing**: Your Lambda function processes the message and generates a response
5. **Response Sending**: Your system sends the response back through Evolution API

## Testing Options

There are several ways to test your WhatsApp integration:

### Option 1: Real WhatsApp Testing (Recommended)

Send a message from your phone to the connected WhatsApp number (556796996672).

This tests the entire flow from end to end and is the most accurate.

### Option 2: Direct Message Sending

You can send a message directly through Evolution API, bypassing the webhook flow:

```bash
node src/utils/send-direct-message.js +YOUR_NUMBER "Your test message"
```

This allows you to check if:
- Evolution API is working
- Your WhatsApp account is connected
- Messages can be delivered to your phone

### Option 3: Check Connection Status

Verify if your WhatsApp account is properly connected:

```bash
node src/utils/send-direct-message.js status
```

This shows if the WhatsApp account is connected and ready to send/receive messages.

## Webhook Debugging

If you're experiencing issues with the webhook:

1. **Check AWS CloudWatch Logs**: Look for logs from the WhatsApp Lambda function
2. **Check Connection Status**: Ensure your WhatsApp account is connected
3. **Verify Webhook URL**: Make sure the webhook URL is correctly configured in Evolution API
4. **Check Phone Number Filtering**: Verify if your phone number is filtered by whitelist/blacklist settings

## Important URLs and Values

Here are the key URLs and values used in the integration:

- **Evolution API URL**: `https://evolution-api-production-ad04.up.railway.app`
- **API Key**: `429683C4C977415CAAFCCE10F7D57E11`
- **Instance Name**: `teste`
- **Connected Phone**: `556796996672`
- **Webhook URL**: `https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in`

## Common Webhook Issues

### 1. Authentication Token Error (403)

If you receive a "Missing Authentication Token" error when testing the webhook directly:

```
{"message":"Missing Authentication Token"}
```

This typically means:
- The URL format is incorrect (AWS API Gateway is strict about URL formats)
- The URL path must exactly match what's configured in API Gateway

### 2. Bot Not Responding to Messages

If the bot is not responding to WhatsApp messages:

1. **Check WhatsApp Connection**: Verify your WhatsApp account is connected
2. **Check Phone Number Filtering**: Make sure your number isn't being filtered out
3. **Check Lambda Execution**: Look at CloudWatch logs for errors
4. **Verify Webhook Configuration**: Ensure the webhook is properly configured

### 3. Evolution API Connection Issues

If you're having trouble connecting to Evolution API:

1. **Check API Key**: Verify the API key is correct
2. **Check Instance Name**: Make sure the instance name is 'teste'
3. **Check Service Status**: Verify Evolution API is running

## Webhook Payload Structure

When a message is received, Evolution API sends a payload to your webhook URL with this structure:

```json
{
  "event": "messages.upsert",
  "instanceId": "teste",
  "data": {
    "key": {
      "remoteJid": "5511987654321@s.whatsapp.net",
      "fromMe": false,
      "id": "MESSAGE_ID"
    },
    "message": {
      "conversation": "Message text here"
    },
    "from": "5511987654321@s.whatsapp.net",
    "body": {
      "text": "Message text here"
    },
    "type": "text",
    "timestamp": 1653555555
  }
}
```

Your webhook handler extracts:
- Phone number from `data.from`
- Message text from `data.body.text`
- Shop ID from `instanceId`