import os
import json
import logging
import requests
import datetime
from typing import Dict, Any, Optional, Tuple

# Import numbered options utilities
from numbered_options import (
    format_reply_with_options,
    process_numeric_input,
    ContextManager
)

# Environment variables
EVO_BASE = os.environ.get('EVO_BASE_URL', '').rstrip('/')
EVO_KEY = os.environ.get('EVO_API_KEY', '')
PUBLIC_URL = os.environ.get('PUBLIC_API_URL', '').rstrip('/')
PUBLIC_KEY = os.environ.get('PUBLIC_API_KEY', '')

# Setup enhanced logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Add a handler to log to a file for debugging
try:
    file_handler = logging.FileHandler('/tmp/whatsapp_debug.log')
    file_handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    logger.info("Enhanced logging initialized")
except Exception as e:
    logger.error(f"Could not set up file logging: {str(e)}")

# Initialize context manager
context_manager = ContextManager(ttl_seconds=3600)  # 1 hour TTL

def build_context(shop_id: str, config_data: Dict[str, Any], workers: list) -> Dict[str, Any]:
    """
    Build initial FSM context
    
    Args:
        shop_id: Shop identifier
        config_data: Shop configuration
        workers: List of workers
        
    Returns:
        Initial FSM context
    """
    account_type = 'enterprise' if len(workers) > 1 else 'individual'
    return {
        'shop_id': shop_id,
        'accountType': account_type,
        'workers': workers,
        'config': config_data,
        'step': 0
    }

def handle_message(text: str, context: Dict[str, Any]) -> Tuple[str, Dict[str, Any], Optional[Dict[str, Any]]]:
    """
    FSM implementation (placeholder for the real implementation)
    
    Args:
        text: User's input text
        context: FSM context
        
    Returns:
        Tuple of (reply_text, updated_context, appointment_data)
    """
    # This is a placeholder - you should import your actual FSM implementation
    # For example, you might import it from a module or implement it here
    
    # Clone context to avoid mutating the input
    ctx = json.loads(json.dumps(context))
    
    # Track what step we're on
    step = ctx.get('step', 0)
    reply = ''
    appointment = None
    
    # Get solo worker for individual accounts
    solo_worker = None
    if ctx.get('accountType') == 'individual':
        shop_id = ctx.get('shop_id', '')
        owner_name = ctx.get('config', {}).get('business', {}).get('ownerName', 'Profissional')
        solo_worker = {'worker_id': shop_id, 'name': owner_name}
    
    # FSM logic (should match the TypeScript version)
    if step == 0:
        # Initial greeting
        assistant_name = ctx.get('config', {}).get('assistant', {}).get('name', 'Amanda')
        business_name = ctx.get('config', {}).get('business', {}).get('name', 'Barbearia')
        reply = f"Olá! Sou {assistant_name}, assistente virtual da {business_name}. Qual é o seu nome, por favor?"
        ctx['step'] = 1
    
    elif step == 1:
        # Got the name
        ctx['clientName'] = text
        ctx['step'] = 2
        reply = f"Olá {text}! Qual serviço você gostaria de agendar?"
    
    elif step == 2:
        # Service selection
        ctx['selectedService'] = text
        ctx['step'] = 3
        
        if ctx.get('accountType') == 'individual':
            ctx['selectedWorker'] = solo_worker
            ctx['step'] = 4
            reply = f"Para qual data você gostaria de agendar seu {text} com {solo_worker['name']}?"
        else:
            reply = f"Qual profissional você prefere para o serviço de {text}?"
    
    elif step == 3:
        # Worker selection (enterprise only)
        worker_found = False
        for worker in ctx.get('workers', []):
            if worker['name'].lower() == text.lower() or str(worker.get('worker_id')) == text:
                ctx['selectedWorker'] = worker
                ctx['step'] = 4
                reply = f"Perfeito! Qual data você prefere para agendar com {worker['name']}?"
                worker_found = True
                break
        
        if not worker_found:
            reply = "Não encontrei esse profissional. Poderia escolher um da lista disponível?"
    
    elif step == 4:
        # Date selection (YYYY-MM-DD)
        if not text.strip().replace('-', '').isdigit() or text.count('-') != 2:
            reply = "Formato de data inválido. Use AAAA-MM-DD, por favor."
        else:
            ctx['selectedDate'] = text
            ctx['step'] = 5
            reply = f"Qual horário você prefere no dia {text}?"
    
    elif step == 5:
        # Time selection (HH:MM)
        if not text.strip().replace(':', '').isdigit() or text.count(':') != 1:
            reply = "Formato de horário inválido. Use HH:MM, por favor."
        else:
            ctx['selectedTime'] = text
            ctx['step'] = 6
            worker_name = ctx.get('selectedWorker', {}).get('name', 'profissional')
            service = ctx.get('selectedService', 'serviço')
            date = ctx.get('selectedDate', 'data')
            reply = f"Para confirmar: {service} com {worker_name} em {date} às {text}. Está correto? (Responda sim para confirmar)"
    
    elif step == 6:
        # Confirmation
        if text.lower() in ('sim', 's', 'yes', 'y'):
            # Create appointment data
            worker_id = ctx.get('selectedWorker', {}).get('worker_id', '')
            date = ctx.get('selectedDate', '')
            time = ctx.get('selectedTime', '')
            client_name = ctx.get('clientName', '')
            shop_id = ctx.get('shop_id', '')
            
            appointment = {
                'worker_id': worker_id,
                'date': date,
                'start_time': time,
                'client_name': client_name,
                'shop_id': shop_id
            }
            
            ctx['step'] = 0  # Reset for next booking
            reply = "✅ Agendamento confirmado! Obrigado por escolher nossos serviços."
        else:
            # Go back to service selection if user says no
            ctx['step'] = 2
            reply = "Tudo bem, vamos tentar novamente. Qual serviço você gostaria de agendar?"
    
    else:
        # Default fallback
        reply = "Desculpe, não entendi. Poderia repetir?"
    
    return reply, ctx, appointment

def diagnostic_handler(event, context):
    """
    Diagnostic handler to check message counter
    
    Args:
        event: Lambda event
        context: Lambda context
        
    Returns:
        Message counter data
    """
    counter_file = '/tmp/whatsapp_counter.json'
    raw_event_file = '/tmp/last_10_events.json'
    try:
        # Check counter data
        if os.path.exists(counter_file):
            with open(counter_file, 'r') as f:
                counter_data = json.load(f)
        else:
            counter_data = {"status": "No messages received yet"}
            
        # Check if we have the last events file for debugging
        last_events = []
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
        
        # Add a timestamp check to verify the Lambda is running
        response = {
            'statusCode': 200,
            'body': json.dumps({
                'message_counts': counter_data,
                'last_events': last_events[-5:] if last_events else [],  # Return last 5 events only
                'env_vars': env_vars,
                'timestamp': str(datetime.datetime.now()),
                'lambda_status': 'running'
            })
        }
        
        return response
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

def check_whitelist(phone_number):
    """
    Check if the phone number is in the whitelist by loading config data
    
    Args:
        phone_number: Phone number to check
        
    Returns:
        Boolean indicating if the number is allowed
    """
    try:
        # Always log the raw phone number format for debugging
        logger.info(f"Checking whitelist for raw phone number: {phone_number}")
        
        # Hardcoded whitelist for testing with multiple formats for better matching
        whitelist = [
            '+14155238886', '14155238886', 'whatsapp:+14155238886', 'whatsapp:14155238886',
            '+556796996672', '556796996672', 'whatsapp:+556796996672', 'whatsapp:556796996672',
            '+556781229196', '556781229196', 'whatsapp:+556781229196', 'whatsapp:556781229196'
        ]
        
        # Check direct whitelist first if it exists
        if hasattr(lambda_handler, 'direct_whitelist') and lambda_handler.direct_whitelist:
            whitelist = lambda_handler.direct_whitelist
            logger.info(f"Using direct whitelist: {whitelist}")
        else:
            # Try to get the whitelist from the config API
            try:
                headers = {'x-api-key': PUBLIC_KEY}
                config_response = requests.get(
                    f"{PUBLIC_URL}/public/config",
                    headers=headers,
                    params={'shop_id': 'teste'},
                    timeout=10
                )
                
                if config_response.ok:
                    config_data = config_response.json()
                    whitelist_from_config = config_data.get('messaging', {}).get('whatsappIntegration', {}).get('filterNumbers', [])
                    if whitelist_from_config:
                        # Expand the whitelist to include multiple formats for each number
                        expanded_whitelist = []
                        for num in whitelist_from_config:
                            # Strip any prefixes for consistency
                            clean_num = num.replace('whatsapp:', '').replace('@c.us', '').replace('+', '')
                            # Add all possible formats
                            expanded_whitelist.extend([
                                f"+{clean_num}", 
                                clean_num,
                                f"whatsapp:+{clean_num}",
                                f"whatsapp:{clean_num}"
                            ])
                        whitelist = expanded_whitelist
                        logger.info(f"Loaded and expanded whitelist from config: {whitelist}")
            except Exception as e:
                logger.error(f"Error fetching whitelist from config: {str(e)}")
        
        # Try multiple normalization approaches for better matching
        possible_formats = [
            phone_number,  # Original format
            phone_number.replace('whatsapp:', '').replace('@c.us', ''),  # Remove WhatsApp prefixes
            phone_number.replace('whatsapp:', '').replace('@c.us', '').lstrip('+'),  # Also remove + prefix
            phone_number.replace('whatsapp:', '').replace('@c.us', '').replace('+', ''),  # Remove all special chars
            # Add with 'whatsapp:' prefix if not already there
            f"whatsapp:{phone_number}" if not phone_number.startswith('whatsapp:') else phone_number,
            # With + prefix if not already there
            f"+{phone_number.replace('whatsapp:', '').replace('@c.us', '').replace('+', '')}"
        ]
        
        # Log all possible formats we're checking for extreme debugging
        logger.info(f"Checking formats: {possible_formats}")
        
        # Check all possible formats against the whitelist
        is_whitelisted = False
        for format_to_try in possible_formats:
            if format_to_try in whitelist:
                is_whitelisted = True
                logger.info(f"Found match: {format_to_try} is in whitelist")
                break
            
            # Also try the endsWith approach
            normalized = format_to_try.replace('whatsapp:', '').replace('@c.us', '').replace('+', '')
            for num in whitelist:
                clean_num = num.replace('whatsapp:', '').replace('@c.us', '').replace('+', '')
                if normalized.endswith(clean_num) or clean_num.endswith(normalized):
                    is_whitelisted = True
                    logger.info(f"Found suffix match: {normalized} with {clean_num}")
                    break
            
            if is_whitelisted:
                break
                
        # Special case: always allow these test numbers (with any prefix/format)
        normalized = phone_number.replace('whatsapp:', '').replace('@c.us', '').replace('+', '')
        if any(test_num in normalized for test_num in ['14155238886', '556796996672', '556781229196']):
            is_whitelisted = True
            logger.info(f"Special case: {normalized} contains a test number")
        
        logger.info(f"Final whitelist check for {phone_number}: allowed={is_whitelisted}")
        return is_whitelisted
    except Exception as e:
        logger.error(f"Error in whitelist check: {str(e)}")
        # Default to allowing the message in case of error
        return True

def lambda_handler(event, context):
    """
    AWS Lambda handler for WhatsApp webhook from Evolution API
    
    Args:
        event: Lambda event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
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
    
    # Reset message counter if requested
    if event.get('queryStringParameters', {}).get('reset_counter') == 'true':
        try:
            counter_file = '/tmp/whatsapp_counter.json'
            # Reset counter data
            with open(counter_file, 'w') as f:
                json.dump({"status": "Reset at " + str(datetime.datetime.now())}, f)
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Message counter reset',
                    'timestamp': str(datetime.datetime.now())
                })
            }
        except Exception as e:
            logger.error(f"Error resetting counter: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': str(e)
                })
            }
    
    # Check if this is a diagnostic request
    if event.get('queryStringParameters', {}).get('diagnostic') == 'true':
        return diagnostic_handler(event, context)
        
    # Check if this is a whitelist test
    if event.get('queryStringParameters', {}).get('whitelist_test'):
        test_number = event.get('queryStringParameters', {}).get('whitelist_test')
        result = check_whitelist(test_number)
        return {
            'statusCode': 200,
            'body': json.dumps({
                'phone': test_number,
                'allowed': result,
                'timestamp': str(datetime.datetime.now())
            })
        }
        
    # Check if this is a whitelist config check
    if event.get('queryStringParameters', {}).get('whitelist_config') == 'true':
        try:
            # Hardcoded whitelist for testing
            whitelist = ['+14155238886', '+556796996672', '+556781229196']
            
            # Try to get the whitelist from the config API
            try:
                headers = {'x-api-key': PUBLIC_KEY}
                config_response = requests.get(
                    f"{PUBLIC_URL}/public/config",
                    headers=headers,
                    params={'shop_id': 'teste'},
                    timeout=10
                )
                
                if config_response.ok:
                    config_data = config_response.json()
                    whitelist_from_config = config_data.get('messaging', {}).get('whatsappIntegration', {}).get('filterNumbers', [])
                    if whitelist_from_config:
                        whitelist = whitelist_from_config
                        logger.info(f"Loaded whitelist from config: {whitelist}")
            except Exception as e:
                logger.error(f"Error fetching whitelist from config: {str(e)}")
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'whitelist': whitelist,
                    'timestamp': str(datetime.datetime.now())
                })
            }
        except Exception as e:
            logger.error(f"Error getting whitelist config: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': str(e)
                })
            }
    
    # Check if this is a direct add to whitelist request
    if event.get('queryStringParameters', {}).get('add_to_whitelist'):
        try:
            number_to_add = event.get('queryStringParameters', {}).get('add_to_whitelist')
            logger.info(f"Directly adding {number_to_add} to whitelist")
            
            # Ensure it has the + prefix
            if not number_to_add.startswith('+'):
                number_to_add = '+' + number_to_add
            
            # Create a simple in-memory cache at module level
            if not hasattr(lambda_handler, 'direct_whitelist'):
                lambda_handler.direct_whitelist = ['+14155238886', '+556796996672', '+556781229196']
            
            # Add the number if not already in the list
            if number_to_add not in lambda_handler.direct_whitelist:
                lambda_handler.direct_whitelist.append(number_to_add)
                
            logger.info(f"Current direct whitelist: {lambda_handler.direct_whitelist}")
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'success': True,
                    'message': f"Added {number_to_add} to direct whitelist",
                    'current_whitelist': lambda_handler.direct_whitelist,
                    'timestamp': str(datetime.datetime.now())
                })
            }
        except Exception as e:
            logger.error(f"Error adding to whitelist: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': str(e)
                })
            }
    
    # Webhook testing endpoint
    if event.get('queryStringParameters', {}).get('test_webhook') == 'true':
        try:
            # Get optional params or use defaults
            phone = event.get('queryStringParameters', {}).get('phone', '556781229196')
            body_text = event.get('queryStringParameters', {}).get('text', 'Test message')
            instance = event.get('queryStringParameters', {}).get('instance', 'teste')
            
            # Create mock webhook payload
            mock_event = {
                'body': json.dumps({
                    'instance': instance,
                    'data': {
                        'from': phone if phone.startswith('+') else '+' + phone,
                        'body': {
                            'text': body_text
                        }
                    }
                })
            }
            
            logger.info(f"Testing webhook with mock payload: {json.dumps(mock_event)}")
            
            # Process the mock event
            test_result = lambda_handler(mock_event, context)
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'success': True,
                    'message': 'Test webhook processed',
                    'mock_payload': mock_event,
                    'handler_result': test_result,
                    'timestamp': str(datetime.datetime.now())
                })
            }
        except Exception as e:
            logger.error(f"Error in webhook test: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': str(e),
                    'timestamp': str(datetime.datetime.now())
                })
            }
    
    # Test Evolution API connectivity
    if event.get('queryStringParameters', {}).get('test_evo') == 'true':
        try:
            # Check if we have the required environment variables
            if not EVO_BASE or not EVO_KEY:
                return {
                    'statusCode': 400,
                    'body': json.dumps({
                        'error': 'Missing Evolution API configuration',
                        'evo_base_set': bool(EVO_BASE),
                        'evo_key_set': bool(EVO_KEY)
                    })
                }
            
            # Get the instance name from the query string or use default
            instance = event.get('queryStringParameters', {}).get('instance', 'teste')
            
            # Test fetching instance info
            try:
                info_url = f"{EVO_BASE}/instance/connectionState/{instance}"
                headers = {'apikey': EVO_KEY}
                
                logger.info(f"Testing Evolution API connection to {info_url}")
                info_response = requests.get(info_url, headers=headers, timeout=10)
                
                if info_response.ok:
                    info_data = info_response.json()
                    
                    # If we're connected, try sending a test message to the webhook owner
                    test_message_result = None
                    if info_data.get('state') == 'open':
                        try:
                            # Get phone from query params or use default
                            test_phone = event.get('queryStringParameters', {}).get('phone', '556781229196')
                            if not test_phone.startswith('+'):
                                test_phone = '+' + test_phone
                                
                            send_url = f"{EVO_BASE}/message/sendText/{instance}"
                            send_payload = {
                                'number': test_phone.replace('+', ''),  # Evolution API expects E.164 without +
                                'text': f"🧪 Test message from Lambda function at {datetime.datetime.now()}"
                            }
                            
                            logger.info(f"Sending test message to {test_phone}")
                            send_response = requests.post(send_url, headers=headers, json=send_payload, timeout=10)
                            
                            if send_response.ok:
                                test_message_result = {
                                    'success': True,
                                    'status_code': send_response.status_code,
                                    'response': send_response.json()
                                }
                            else:
                                test_message_result = {
                                    'success': False,
                                    'status_code': send_response.status_code,
                                    'error': send_response.text
                                }
                        except Exception as e:
                            test_message_result = {
                                'success': False,
                                'error': str(e)
                            }
                    
                    return {
                        'statusCode': 200,
                        'body': json.dumps({
                            'success': True,
                            'evolution_api_status': info_data,
                            'test_message_result': test_message_result,
                            'timestamp': str(datetime.datetime.now())
                        })
                    }
                else:
                    return {
                        'statusCode': info_response.status_code,
                        'body': json.dumps({
                            'success': False,
                            'error': f"Evolution API returned status {info_response.status_code}",
                            'response': info_response.text,
                            'timestamp': str(datetime.datetime.now())
                        })
                    }
            except Exception as e:
                return {
                    'statusCode': 500,
                    'body': json.dumps({
                        'success': False,
                        'error': f"Error connecting to Evolution API: {str(e)}",
                        'timestamp': str(datetime.datetime.now())
                    })
                }
        except Exception as e:
            logger.error(f"Error in Evolution API test: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': str(e),
                    'timestamp': str(datetime.datetime.now())
                })
            }
    try:
        # Parse request body
        body = json.loads(event['body'])
        
        # Extract message data - handle different Evolution API versions
        # Evo v2 sends "instance" (or "session"); default to "teste" if missing
        session = body.get('instance') or body.get('session') or body.get('instanceId') or 'teste'
        logger.info(f"Using Evo instance: {session}")
        
        # Extract and normalize phone number
        # Handle different Evolution API payload structures
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
        
        # Extreme debug for phone numbers
        logger.info(f"RAW 'from' field: {raw_from}")
        logger.info(f"Normalized phone number: {phone}")
        logger.info(f"Full message body: {json.dumps(body)}")
        
        # Check if the phone is whitelisted
        is_allowed = check_whitelist(raw_from)
        logger.info(f"Whitelist check result for {raw_from}: {is_allowed}")
        
        # Extract the message text with fallbacks for different payload structures
        raw_text = ''
        # Try all known message formats from Evolution API
        if 'data' in body:
            if 'body' in body['data'] and isinstance(body['data']['body'], dict) and 'text' in body['data']['body']:
                raw_text = body['data']['body']['text']
            elif 'body' in body['data'] and isinstance(body['data']['body'], str):
                raw_text = body['data']['body']
            elif 'content' in body['data'] and isinstance(body['data']['content'], str):
                raw_text = body['data']['content']
            elif 'message' in body['data'] and 'conversation' in body['data']['message']:
                raw_text = body['data']['message']['conversation']
        
        # If we still don't have text, check other common locations
        if not raw_text and 'body' in body:
            if isinstance(body['body'], dict) and 'text' in body['body']:
                raw_text = body['body']['text']
            elif isinstance(body['body'], str):
                raw_text = body['body']
                
        # If we still don't have text, try to extract from message.extendedTextMessage
        if not raw_text and 'message' in body and 'extendedTextMessage' in body['message']:
            raw_text = body['message']['extendedTextMessage'].get('text', '')
            
        logger.info(f"Extracted message text: '{raw_text}'")
        
        # If we still don't have text, log warning but continue with empty text
        if not raw_text:
            logger.warning(f"Could not extract text from message payload: {json.dumps(body)}")
            raw_text = ''
        
        # Always log the message for diagnostic purposes, even if not whitelisted
        logger.info(f"Message from {phone} (allowed: {is_allowed}): {raw_text}")
        
        # If the number is not whitelisted, log but don't process further
        if not is_allowed:
            logger.warning(f"Message from {phone} was blocked by whitelist")
            return {
                'statusCode': 200,  # Still return 200 to avoid webhook errors
                'body': json.dumps({
                    'status': 'blocked',
                    'reason': 'whitelist'
                })
            }
        
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
        
        # Get or initialize user context
        ctx = context_manager.get_context(session, phone)
        
        if not ctx:
            try:
                logger.info(f"Fetching initial data for shop {session}")
                
                # Create request headers
                headers = {'x-api-key': PUBLIC_KEY}
                
                # Fetch shop config
                config_response = requests.get(
                    f"{PUBLIC_URL}/public/config",
                    headers=headers,
                    params={'shop_id': session},
                    timeout=10
                )
                config_response.raise_for_status()
                config_data = config_response.json()
                
                # Fetch workers
                workers_response = requests.get(
                    f"{PUBLIC_URL}/public/workers",
                    headers=headers,
                    params={'shop_id': session},
                    timeout=10
                )
                workers_response.raise_for_status()
                workers_data = workers_response.json().get('workers', [])
                
                # Build initial context
                ctx = build_context(session, config_data, workers_data)
                
                logger.info(f"Created initial context for {phone}")
            except Exception as e:
                logger.error(f"Error fetching shop data: {str(e)}")
                return {
                    'statusCode': 500,
                    'body': json.dumps({'error': 'Failed to fetch shop data'})
                }
        
        # Process numeric input if needed
        processed_text = process_numeric_input(raw_text, ctx)
        
        if processed_text != raw_text:
            logger.info(f"Processed numeric input '{raw_text}' to '{processed_text}'")
        
        # Run FSM to get the response
        reply, updated_context, appointment = handle_message(processed_text, ctx)
        
        # Save the updated context
        context_manager.set_context(session, phone, updated_context)
        
        # Format the reply with numbered options
        formatted_reply = format_reply_with_options(reply, updated_context)
        
        logger.info(f"Sending reply to {phone}: {formatted_reply}")
        
        # If an appointment was created, book it through the public API
        if appointment:
            try:
                logger.info(f"Booking appointment for {appointment.get('client_name')}")
                
                book_response = requests.post(
                    f"{PUBLIC_URL}/public/appointments/book",
                    headers={'x-api-key': PUBLIC_KEY},
                    json=appointment,
                    timeout=10
                )
                book_response.raise_for_status()
                
                # Clear the context after successful booking
                context_manager.delete_context(session, phone)
                logger.info("Appointment booked successfully, context cleared")
            except Exception as e:
                logger.error(f"Error booking appointment: {str(e)}")
                # Continue with the flow even if booking fails
        
        # Send reply to WhatsApp via Evolution API
        try:
            url = f"{EVO_BASE}/message/sendText/{session}"
            headers = {'apikey': EVO_KEY}   # must be lowercase "apikey"
            payload = {
                'number': phone,           # digits-only E.164
                'text': formatted_reply
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
        
        # Periodically clean up expired contexts (1% chance per request)
        import random
        if random.random() < 0.01:
            removed = context_manager.cleanup_expired()
            if removed > 0:
                logger.info(f"Cleaned up {removed} expired contexts")
        
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