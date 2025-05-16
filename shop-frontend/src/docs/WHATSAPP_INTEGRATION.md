# WhatsApp Integration Guide

This document provides comprehensive information about the WhatsApp integration in our booking system. It explains how the system integrates with WhatsApp, the message flow, webhook configuration, and common troubleshooting steps.

## Architecture Overview

Our WhatsApp integration uses the Evolution API as a bridge between our system and WhatsApp. Here's the overall architecture:

```
User WhatsApp <--> WhatsApp Network <--> Evolution API <--> Our Webhook <--> AWS Lambda <--> Business Logic
```

Key components:
- **Evolution API**: A third-party service that connects to WhatsApp and provides a REST API for sending/receiving messages
- **Webhook**: An HTTP endpoint that receives events from Evolution API when a new message arrives
- **AWS Lambda**: Processes incoming webhook events and runs our booking state machine logic

## Message Flow

### Outbound Messages (Our System to Customer)
1. Our system calls the Evolution API's message endpoint (`/message/sendText/{instanceName}`)
2. Evolution API sends the message to WhatsApp
3. WhatsApp delivers the message to the customer

### Inbound Messages (Customer to Our System)
1. Customer sends a message on WhatsApp
2. WhatsApp delivers it to Evolution API
3. Evolution API sends a webhook event to our configured webhook URL
4. Our Lambda function processes the incoming message
5. The booking state machine determines the appropriate response
6. Our system sends a response back through Evolution API

## Setup Instructions

### 1. Connect to WhatsApp

To connect your WhatsApp account:

1. In the admin panel, go to "WhatsApp Integration" settings
2. Ensure your phone number is entered correctly (with country code)
3. Click "Generate QR Code for Connection"
4. Scan the QR code with your WhatsApp app:
   - Open WhatsApp on your phone
   - Go to Settings > Linked Devices > Link a Device
   - Scan the displayed QR code
5. The connection status should change to "Connected" once complete

### 2. Configure Webhook

To receive messages from customers:

1. In the WhatsApp Configuration section, find "Webhook and Tests"
2. The default webhook URL should be pre-configured as:
   ```
   https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in
   ```
3. Click "Configure Webhook" to register this webhook with Evolution API
4. The system will configure the webhook to receive the following events:
   - `messages.upsert` - New messages
   - `messages.update` - Message updates (e.g., read receipts)
   - `connection.update` - Connection status changes
   - `status.instance` - Instance status updates

### 3. Phone Number Filtering

You can control which numbers receive automated responses:

1. Choose a filtering mode:
   - **Whitelist**: Only listed numbers receive responses (useful for testing)
   - **Blacklist**: All numbers except listed ones receive responses
2. Add numbers in the correct format (e.g., +14155238886)
3. Remember to include the Twilio test number (+14155238886) in your whitelist during testing

## Testing Your Integration

### Connection Status

Click "Check Connection" to verify that:
1. Your WhatsApp is properly connected
2. The webhook is correctly configured
3. The system can send/receive messages

### Send Test Message

To test sending capabilities:
1. Enter a test phone number (e.g., +14155238886 for Twilio testing)
2. Type a test message
3. Click "Send Test Message"
4. Check the response to confirm successful delivery

## Common Issues and Solutions

### Not Receiving Messages

If customers send messages but your system doesn't respond:

1. **Check Connection Status**: Ensure the WhatsApp connection shows as "Connected"
2. **Verify Webhook Configuration**: Make sure webhook is properly configured
3. **Check Phone Number Filtering**: Ensure the sender's number isn't blocked (or is whitelisted)
4. **Examine API Gateway Logs**: Check CloudWatch logs for your API Gateway/Lambda

### Failed to Send Messages

If you can't send messages:

1. **Connection State**: Ensure WhatsApp is connected (status check)
2. **Phone Number Format**: Make sure phone numbers are in the correct format (with country code)
3. **Evolution API Status**: Confirm the Evolution API service is running (https://evolution-api-production-ad04.up.railway.app)

### Connection Frequently Disconnects

If your WhatsApp connection keeps dropping:

1. **Regenerate QR Code**: Try connecting with a fresh QR code
2. **Check Phone Settings**: Make sure battery optimization isn't killing WhatsApp
3. **Stable Internet**: Ensure the phone has a stable internet connection
4. **One Device Only**: Don't connect the same WhatsApp account to multiple Evolution API instances

## Debugging with Evolution API

You can directly check the status of your instance at:
```
GET https://evolution-api-production-ad04.up.railway.app/instance/info/teste
```

Example response:
```json
{
  "instance": {
    "owner": "owner_name",
    "instanceName": "teste",
    "instanceId": "instance_id",
    "state": "open",
    "status": "connected",
    "me": {
      "id": "556796996672@s.whatsapp.net",
      "name": "Your WhatsApp Name"
    }
  }
}
```

## Technical Details

### Environment Variables

The WhatsApp integration uses these environment variables:

- `REACT_APP_EVO_BASE_URL`: Evolution API URL (default: https://evolution-api-production-ad04.up.railway.app)
- `REACT_APP_EVO_API_KEY`: Evolution API authentication key (default: 429683C4C977415CAAFCCE10F7D57E11)

### Configuration Object

The WhatsApp configuration is stored in the app config under `messaging.whatsappIntegration`:

```javascript
{
  enabled: true,
  phoneNumber: '+556796996672',
  instanceName: 'teste',
  filterMode: 'whitelist',
  filterNumbers: ['+14155238886'],
  disableGroups: true,
  webhookUrl: 'https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in',
  templates: {
    welcome: 'Olá {nome}! Bem-vindo ao nosso sistema de agendamentos.',
    // other templates...
  },
  notifications: {
    appointmentConfirmation: true,
    appointmentReminder: true,
    feedbackRequest: false
  }
}
```

## WhatsApp Message Filters

Messages are filtered based on:
1. Group messages (ignored if `disableGroups` is true)
2. Phone number whitelist/blacklist in `filterNumbers`

### Phone Number Formats

The system handles various phone number formats:
- International format with + sign: `+14155238886`
- International format without + sign: `14155238886`
- WhatsApp format with suffix: `14155238886@s.whatsapp.net` or `14155238886@c.us`

All formats are normalized before processing.

## Support

If you encounter issues with the WhatsApp integration, check:
1. This documentation
2. [Evolution API documentation](https://github.com/evolution-api/evolution-api)
3. CloudWatch logs for the webhook Lambda function
4. Contact system support with the following information:
   - Exact error messages
   - Steps to reproduce the issue
   - Phone numbers involved
   - Screenshots of the admin panel status