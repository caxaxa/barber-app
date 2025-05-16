# WhatsApp Webhook Troubleshooting Guide

If you're experiencing issues with incoming WhatsApp messages not being responded to by the bot, follow this troubleshooting guide to identify and fix the problem.

## Common Issues

### 1. WhatsApp Connection Status

**Problem**: WhatsApp is not properly connected to the Evolution API.

**Check**:
- Go to the WhatsApp Configuration page in the admin panel
- Click "Check Connection" button
- Verify that the status shows "Connected"

**Fix**:
- If disconnected, click "Generate QR Code" and scan it with your WhatsApp
- Wait a few moments and check the connection status again
- If it fails to connect, try generating a new QR code

### 2. Webhook Configuration

**Problem**: The webhook is not properly configured in Evolution API.

**Check**:
- Go to the WhatsApp Configuration page in the admin panel
- Verify the webhook URL is: `https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in`
- Click "Configure Webhook" button

**Fix**:
- If webhook configuration fails, check for any error messages
- Make sure your internet connection is stable
- Verify that the Evolution API service is running

### 3. Phone Number Filtering

**Problem**: Your phone number is being filtered out by the whitelist/blacklist settings.

**Check**:
- Go to the WhatsApp Configuration page in the admin panel
- Check the "Filter Mode" setting (Whitelist or Blacklist)
- If Whitelist: Ensure your phone number is in the list
- If Blacklist: Ensure your phone number is NOT in the list

**Fix**:
- Add your phone number to the whitelist if using whitelist mode
- Remove your phone number from the blacklist if using blacklist mode
- Alternatively, empty the whitelist completely to allow all numbers for testing

### 4. Testing the Webhook Directly

You can use the included webhook-test utility to test the webhook without sending actual WhatsApp messages:

```bash
cd /home/ubuntu/shop-frontend
node src/utils/webhook-test.js +1234567890 "Hello, I want to make an appointment"
```

This will simulate an incoming webhook event and show you if:
- The webhook endpoint is responding
- The message is being filtered (and why)
- There are any other errors in processing

### 5. Check AWS CloudWatch Logs

If you have access to AWS CloudWatch, check the Lambda function logs:

1. Go to AWS CloudWatch console
2. Navigate to Log Groups
3. Find the log group for the WhatsApp webhook Lambda function
4. Look for recent log entries around the time you sent messages
5. Check for any error messages or filtering indications

### 6. Debug Code Changes

We've added additional debugging code to help diagnose webhook issues:

1. The whitelist is now empty by default to allow all messages for testing
2. Additional logging has been added to the phone number filtering function
3. A new webhook-test utility has been created for direct testing

## Configuration Verification

To ensure your configuration is correctly set up:

1. **Connection Verification**:
   ```
   The WhatsApp account 556796996672 should be connected to the Evolution API instance "teste"
   ```

2. **Webhook Verification**:
   ```
   The webhook URL should be configured as:
   https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in
   
   With these events:
   - messages.upsert
   - messages.update
   - connection.update
   - status.instance
   ```

3. **Number Filtering**:
   ```
   For testing, the whitelist should be empty to allow all numbers,
   or should specifically include the number you're testing with.
   ```

## Technical Details

- The webhook handler extracts the message from: `payload.data.body.text`
- The sender's phone number is extracted from: `payload.data.from`
- The instance ID (shop ID) is extracted from: `payload.instanceId`
- If you're experiencing issues with specific message formats or group messages, check the `disableGroups` setting

## Contact Support

If you've tried all the steps above and are still experiencing issues, please contact support with:

1. Screenshots of your WhatsApp Configuration page
2. The phone number you're testing with
3. The exact message text you're sending
4. Any error messages you're seeing
5. Timestamps of when you sent test messages

This information will help us diagnose and fix any deeper issues with the WhatsApp integration.