# WhatsApp Integration Setup

This document explains how to set up and test the WhatsApp integration for your booking system.

## Current Configuration

Your WhatsApp integration is configured with the following parameters:

- **Evolution API URL**: https://evolution-api-production-ad04.up.railway.app
- **API Key**: 429683C4C977415CAAFCCE10F7D57E11
- **Instance Name**: teste
- **Connected Phone**: 556796996672@s.whatsapp.net

## Testing with Twilio

To test with the Twilio WhatsApp sandbox:

1. Add `+14155238886` to your whitelist in the WhatsApp config panel
2. Send a message to your connected WhatsApp number with the text:
   ```
   join example-brown
   ```
   (or whatever phrase Twilio provides for joining their sandbox)

3. Once connected to the sandbox, try sending a test message:
   ```
   Hello
   ```

## WhatsApp Number Formatting

When adding phone numbers to your whitelist, use the international format with the `+` sign:

```
+14155238886
+5511999999999
```

## Troubleshooting

If WhatsApp messages aren't being processed:

1. **Check the webhook connection**:
   - Verify Evolution API webhook is properly configured
   - URL should be: `https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in`
   - Ensure "MESSAGES_UPSERT" event is selected

2. **Check Evolution API connection**:
   - Verify instance "teste" is showing as CONNECTED in Evolution API dashboard
   - Phone session is active and not disconnected

3. **Check AWS Lambda logs**:
   - Review CloudWatch logs for your WhatsApp handler Lambda
   - Look for errors in processing messages or sending responses

4. **Test direct message sending**:
   You can test sending a message directly with this curl command:
   
   ```bash
   curl -X POST "https://evolution-api-production-ad04.up.railway.app/message/sendText/teste" \
     -H "Content-Type: application/json" \
     -H "apikey: 429683C4C977415CAAFCCE10F7D57E11" \
     -d '{
       "number": "14155238886",
       "text": "Test message from direct API call"
     }'
   ```

5. **Whitelist verification**:
   - Make sure the whitelist isn't empty (or if it is, we've modified the code to allow all numbers during testing)
   - Ensure phone numbers are formatted correctly

6. **Message format issue**:
   When sending messages from your Lambda to Evolution API, ensure the format is:
   
   ```javascript
   {
     "number": "14155238886", // No "@c.us" suffix needed
     "text": "Your booking response message"
   }
   ```

## Common Evolution API Issues

If you're still having problems:

1. Try disconnecting and reconnecting your WhatsApp instance
2. Clear the message queue in Evolution API
3. Verify your WhatsApp number hasn't been blocked or rate-limited
4. Check if Twilio sandbox session is still active (they expire after 24 hours)