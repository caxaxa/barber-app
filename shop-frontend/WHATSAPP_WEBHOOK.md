# WhatsApp Webhook Configuration

This document provides instructions for configuring and troubleshooting your WhatsApp webhook integration using Evolution API.

## Current Configuration

Your WhatsApp integration is currently set up with:
- **Evolution API URL**: https://evolution-api-production-ad04.up.railway.app
- **API Key**: 429683C4C977415CAAFCCE10F7D57E11
- **Instance Name**: teste
- **Connected Phone**: 556796996672@s.whatsapp.net
- **Webhook URL**: https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in

## Webhook Configuration

The webhook is the critical component that allows your AWS Lambda function to receive and process WhatsApp messages. If messages aren't being processed, the issue is likely in the webhook configuration or the Lambda function handling.

### Using the Webhook Test Tool

1. Start your application (`npm start`)
2. Navigate to: `http://localhost:3000/webhook-test`
3. This tool allows you to:
   - Check connection status
   - Verify current webhook configuration
   - Set up a new webhook configuration
   - Send test messages to trigger the webhook

### Recommended Webhook Events

For your booking system, these events should be enabled:
- `messages.upsert` (incoming messages)
- `messages.update` (message status updates)
- `connection.update` (connection status changes)

### Testing via Browser Console

You can also run tests from your browser console:
```javascript
// Check connection status
window.webhookTest.checkConnection()

// Check current webhook configuration
window.webhookTest.checkWebhook()

// Set up webhook with specific events
window.webhookTest.setWebhook(['messages.upsert', 'messages.update'])

// Send a test message
window.webhookTest.sendMessage('+14155238886', 'Test message')

// Run complete setup and test
window.webhookTest.runFullTest()
```

## Common Issues and Solutions

1. **Webhook Not Receiving Events**
   - Ensure the webhook URL is correct: `https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in`
   - Make sure the events you need are selected (at minimum: `messages.upsert`)
   - Verify webhook is enabled in Evolution API

2. **Messages Not Being Processed**
   - Check AWS CloudWatch logs for your Lambda function
   - Verify your Lambda function correctly parses the Evolution API webhook payload
   - Make sure your Lambda has proper permissions

3. **Connection Issues**
   - If connection shows as closed, you may need to reconnect your WhatsApp instance
   - Generate a new QR code and scan it with your phone

4. **WhatsApp Business API Rate Limits**
   - Official WhatsApp Business API has rate limits
   - For testing, ensure you're within free tier limits

## Verifying Messages in AWS

To check if your webhook is being triggered:

1. Go to AWS CloudWatch
2. Open the logs for your Lambda function
3. Look for log entries when you send a test message
4. Verify the payload contains the message content
5. Check for any errors in processing

## Adjusting Lambda Function

If you're receiving webhook events but responses aren't being sent, your Lambda function might not be correctly formatted to call the Evolution API send endpoint.

The correct format for sending a message back is:
```javascript
const response = await fetch(`${evoBaseUrl}/message/sendText/${instanceName}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': evoApiKey
  },
  body: JSON.stringify({
    number: phoneNumber, // Just the number, no @c.us or + prefix
    text: messageText
  })
});
```

## Test from Lambda Side

You may also want to test your Lambda function directly by invoking it with a test event that mimics the Evolution API webhook payload.

Sample test event:
```json
{
  "body": {
    "event": "messages.upsert",
    "instance": "teste",
    "data": {
      "key": {
        "remoteJid": "556796996672@s.whatsapp.net",
        "fromMe": false,
        "id": "test-message-id"
      },
      "message": {
        "conversation": "Test message from webhook"
      }
    }
  }
}
```

## Additional Resources

- [Evolution API Documentation](https://doc.evolution-api.com/)
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/)