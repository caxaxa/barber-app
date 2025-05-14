import os
import json
import logging
import requests
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

# Setup logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

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
        # Parse request body
        body = json.loads(event['body'])
        
        # Extract message data
        session = body.get('instanceId')  # Using instanceId as shop_id
        phone = body.get('data', {}).get('from')
        raw_text = body.get('data', {}).get('body', {}).get('text', '')
        
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
            whatsapp_response = requests.post(
                f"{EVO_BASE}/message/sendText",
                headers={'apiKey': EVO_KEY},
                json={
                    'session': session,
                    'to': phone,
                    'text': formatted_reply
                },
                timeout=10
            )
            whatsapp_response.raise_for_status()
            
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