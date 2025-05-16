# Testing WhatsApp Bot with Twilio

This guide explains how to test your WhatsApp bot using the Twilio test number.

## Twilio WhatsApp Sandbox

Twilio provides a sandbox environment for testing WhatsApp interactions without needing a verified WhatsApp Business account. The Twilio test number is:

```
+1 415 523 8886
```

## Setting Up Twilio Testing

1. **Connect to Twilio Sandbox**:
   - From your real WhatsApp app, send a message to `+1 415 523 8886`
   - Include the code: `join indeed-correctly-grain` (or the code provided by Twilio)
   - You should receive a confirmation message from Twilio

2. **Configure Your WhatsApp Bot**:
   - Go to WhatsApp Configuration in the admin panel
   - Make sure the Twilio test number is in your whitelist:
     - Add `+14155238886` to the whitelist if using whitelist mode
     - Remove `+14155238886` from the blacklist if using blacklist mode

3. **Ensure Webhook is Configured**:
   - Click "Configure Webhook" to ensure Evolution API knows where to send messages
   - Verify your WhatsApp is connected using "Check Connection"

## Testing Process

1. **Send a Message to Twilio**:
   - From your real WhatsApp app, send a message to the Twilio number:
     ```
     Olá, gostaria de agendar um horário
     ```

2. **Twilio Forward to Your Bot**:
   - Twilio will forward your message to your WhatsApp account (556796996672)
   - Evolution API receives this message and sends it to your webhook
   - Your bot processes the message and sends a response

3. **Check Response**:
   - You should receive a response from your bot via Twilio
   - The response will be forwarded back through your WhatsApp account

## Troubleshooting

### 1. No Response from Bot

If you're not getting a response:

1. **Check Whitelist Configuration**:
   - Ensure `+14155238886` is explicitly in your whitelist
   - Twilio's number should be whitelisted for testing

2. **Verify Webhook Configuration**:
   - Run this command to check if messages are properly processed:
     ```
     node src/utils/twilio-test.js
     ```
   - This simulates a message from Twilio and checks filtering

3. **Check Connection Status**:
   - Run this to verify your WhatsApp connection:
     ```
     node src/utils/send-direct-message.js status
     ```
   - It should show the connection state and connected number

### 2. Message Format Issues

Twilio may format messages differently:

1. **Check for special characters or formatting** in your test messages
2. **Start with simple text messages** before trying more complex formats
3. **Look for errors in your Lambda logs** if messages are being received but not processed

## Understanding the Flow

When testing with Twilio, the message flow is:

1. You → Twilio number (via WhatsApp)
2. Twilio → Your WhatsApp (via forwarding)
3. Your WhatsApp → Evolution API
4. Evolution API → Your webhook
5. Your bot processes and sends response
6. Response → Evolution API
7. Evolution API → Your WhatsApp
8. Your WhatsApp → Twilio
9. Twilio → You (via WhatsApp)

## Code Modifications

The code has been updated to specifically handle the Twilio test number:

1. **Added special handling** in the filtering logic for the Twilio number
2. **Explicitly whitelisted** the Twilio number in the default configuration
3. **Created a Twilio test utility** to simulate and verify Twilio message processing

Try using the real WhatsApp-to-Twilio flow for the most accurate testing, as direct webhook testing may be blocked by API Gateway security.

Remember that all Twilio sandbox conversations expire after 72 hours of inactivity, so you may need to rejoin the sandbox periodically.