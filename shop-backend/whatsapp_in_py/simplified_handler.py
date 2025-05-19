import os
import json
import logging
import requests
import datetime

# Environment variables
EVO_BASE = os.environ.get('EVO_BASE_URL', '').rstrip('/')
EVO_KEY = os.environ.get('EVO_API_KEY', '')
PUBLIC_URL = os.environ.get('PUBLIC_API_URL', '').rstrip('/')
PUBLIC_KEY = os.environ.get('PUBLIC_API_KEY', '')

# Setup logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    AWS Lambda handler for WhatsApp webhook from Evolution API
    
    Args:
        event: Lambda event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    try:
        # Log every incoming event for debugging
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Store last 10 events for diagnostics
        try:
            raw_event_file = '/tmp/last_10_events.json'
            last_events = []
            
            # Try to read existing events
            if os.path.exists(raw_event_file):
                try:
                    with open(raw_event_file, 'r') as f:
                        last_events = json.load(f)
                except:
                    last_events = []
            
            # Add timestamp to the event
            event_with_time = {
                'event': event,
                'timestamp': str(datetime.datetime.now())
            }
            
            # Add to list and keep only last 10
            last_events.append(event_with_time)
            last_events = last_events[-10:]
            
            # Save updated events
            with open(raw_event_file, 'w') as f:
                json.dump(last_events, f)
        except Exception as e:
            logger.error(f"Error storing event history: {str(e)}")
    
        # Check if this is a diagnostic request
        if event.get('queryStringParameters', {}).get('diagnostic') == 'true':
            counter_file = '/tmp/whatsapp_counter.json'
            try:
                # Check counter data
                if os.path.exists(counter_file):
                    with open(counter_file, 'r') as f:
                        counter_data = json.load(f)
                else:
                    counter_data = {"status": "No messages received yet"}
                    
                # Check if we have the last events file for debugging
                if os.path.exists(raw_event_file):
                    try:
                        with open(raw_event_file, 'r') as f:
                            last_events = json.load(f)
                    except:
                        last_events = []
                        
                logger.info(f"Diagnostic data: {counter_data}")
                
                # Get Lambda environment variables for debugging
                env_vars = {
                    'EVO_BASE': os.environ.get('EVO_BASE_URL', '').rstrip('/'),
                    'PUBLIC_URL': os.environ.get('PUBLIC_API_URL', '').rstrip('/'),
                    'EVO_KEY_SET': bool(os.environ.get('EVO_API_KEY')),
                    'PUBLIC_KEY_SET': bool(os.environ.get('PUBLIC_API_KEY'))
                }
                
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message_counts': counter_data,
                        'last_events': last_events[-5:] if last_events else [],  # Return last 5 events only
                        'env_vars': env_vars,
                        'timestamp': str(datetime.datetime.now()),
                        'lambda_status': 'running'
                    })
                }
            except Exception as e:
                logger.error(f"Error in diagnostic handler: {str(e)}")
                return {
                    'statusCode': 500,
                    'body': json.dumps({
                        'error': str(e),
                        'timestamp': str(datetime.datetime.now()),
                        'lambda_status': 'running with errors'
                    })
                }
    
        # Parse request body
        body = json.loads(event['body'])
        
        # Extract message data
        instance = body.get('instance') or body.get('session') or body.get('instanceId') or 'teste'
        logger.info(f"Using Evo instance: {instance}")
        
        # Extract and normalize phone number
        raw_from = ''
        if 'data' in body and 'from' in body['data']:
            raw_from = body['data']['from']
        elif 'from' in body:
            raw_from = body['from']
        
        # Ensure we have a valid phone number
        if not raw_from:
            logger.error(f"Could not extract 'from' field from payload: {json.dumps(body)}")
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing sender information',
                    'raw_payload': body
                })
            }
            
        phone = raw_from.replace('whatsapp:', '').lstrip('+')
        
        # Log phone information
        logger.info(f"RAW 'from' field: {raw_from}")
        logger.info(f"Normalized phone number: {phone}")
        
        # Extract the message text with fallbacks for different payload structures
        raw_text = ''
        if 'data' in body:
            if 'body' in body['data'] and isinstance(body['data']['body'], dict) and 'text' in body['data']['body']:
                raw_text = body['data']['body']['text']
            elif 'body' in body['data'] and isinstance(body['data']['body'], str):
                raw_text = body['data']['body']
                
        logger.info(f"Extracted message text: '{raw_text}'")
        
        # Add message counter for tracking received messages
        counter_file = '/tmp/whatsapp_counter.json'
        counter_data = {}
        
        # Try to read existing counter data
        try:
            if os.path.exists(counter_file):
                with open(counter_file, 'r') as f:
                    counter_data = json.load(f)
        except Exception as e:
            logger.error(f"Error reading counter file: {str(e)}")
            counter_data = {}
        
        # Update counter for this phone number
        counter_data[phone] = counter_data.get(phone, 0) + 1
        
        # Save updated counter
        try:
            with open(counter_file, 'w') as f:
                json.dump(counter_data, f)
            logger.info(f"Message count for {phone}: {counter_data[phone]}")
        except Exception as e:
            logger.error(f"Error writing counter file: {str(e)}")
        
        logger.info(f"Received message from {phone}: {raw_text}")
        
        # Send reply to WhatsApp via Evolution API
        try:
            url = f"{EVO_BASE}/message/sendText/{instance}"
            headers = {'apikey': EVO_KEY}   # must be lowercase "apikey"
            payload = {
                'number': phone,           # digits-only E.164
                'text': f"Message received and counted! This is message #{counter_data[phone]} from you."
            }
            
            resp = requests.post(url, headers=headers, json=payload, timeout=10)
            logger.info(f"Evo sendText response: {resp.status_code} {resp.text}")
            resp.raise_for_status()
            
            logger.info(f"Successfully sent message to {phone}")
        except Exception as e:
            logger.error(f"Error sending WhatsApp reply: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'Failed to send WhatsApp reply'})
            }
        
        return {
            'statusCode': 200,
            'body': json.dumps({'success': True})
        }
    
    except Exception as e:
        logger.error(f"Unhandled error in webhook handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }