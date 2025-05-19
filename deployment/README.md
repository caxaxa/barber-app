# WhatsApp Webhook Lambda Function - Enhanced Debugging

This package contains an updated version of the WhatsApp webhook Lambda function with enhanced debugging and improved phone number handling to ensure your test messages are properly processed.

## Deployment Instructions

1. Download the `whatsapp_in_py.zip` file
2. Login to the AWS Management Console
3. Navigate to Lambda service
4. Find and select the function `WhatsappInPYHook`
5. Go to the "Code" tab
6. Click "Upload from" > ".zip file"
7. Upload the `whatsapp_in_py.zip` file
8. Click "Save"

## Testing the Webhook

1. After deploying the updated code, use the included `test_webhook.sh` script to verify functionality
2. Make the script executable: `chmod +x test_webhook.sh`
3. Run the script: `./test_webhook.sh`

## New Features & Improvements

1. **Enhanced Message Format Handling**: Better compatibility with different Evolution API payload formats
2. **Improved Phone Number Recognition**: More flexible matching of phone numbers with and without country codes
3. **Webhook Testing Endpoint**: Direct testing of the webhook via URL parameters
4. **Evolution API Connection Test**: Verify connectivity to Evolution API
5. **Debug Event History**: Last 10 events are stored for diagnostic purposes
6. **Expanded Whitelist Formats**: Multiple phone number formats are now recognized

## Diagnostic Endpoints

The updated Lambda function includes several diagnostic endpoints you can access via URL parameters:

- `?diagnostic=true` - Check message counter and Lambda status
- `?reset_counter=true` - Reset the message counter
- `?whitelist_config=true` - View the current whitelist configuration
- `?whitelist_test=PHONE_NUMBER` - Test if a specific phone number is whitelisted
- `?test_webhook=true&phone=PHONE_NUMBER&text=MESSAGE` - Test the webhook with a mock message
- `?test_evo=true` - Test connectivity to Evolution API
- `?add_to_whitelist=PHONE_NUMBER` - Add a phone number directly to the whitelist

Replace `PHONE_NUMBER` with the actual phone number you want to test (e.g., `556781229196`).

## Troubleshooting

If messages still aren't being processed correctly:

1. Reset the counter: `?reset_counter=true`
2. Send a test message from WhatsApp
3. Check the diagnostic endpoint: `?diagnostic=true`
4. View logs in AWS CloudWatch for detailed debug information
5. Test webhook directly: `?test_webhook=true&phone=556781229196`
6. Verify Evolution API connectivity: `?test_evo=true`

## Contact

If you encounter any issues or have questions, please reach out for assistance.