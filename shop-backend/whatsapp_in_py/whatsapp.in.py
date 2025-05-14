import os, json, logging, requests

EVO  = os.environ['EVO_BASE_URL'].rstrip('/')
EKEY = os.environ['EVO_API_KEY']

PUB_API  = os.environ['PUBLIC_API_URL'].rstrip('/')
PUB_KEY  = os.environ['PUBLIC_API_KEY']

# Store conversation context for each user
USER_CONTEXTS = {}

# Available services - should match the FSM defaults
DEFAULT_SERVICES = [
    'Corte de cabelo',
    'Barba',
    'Corte e barba',
    'Sobrancelha',
    'Hidratação',
]

def get_suggested_options(ctx: dict):
    """Return options based on current step"""
    step = ctx.get('step', 0)
    
    if step == 2:  # Service selection
        return DEFAULT_SERVICES
    elif step == 3:  # Worker selection
        return [worker['name'] for worker in ctx.get('workers', [])]
    
    return []

def format_reply_with_numbered_options(reply: str, ctx: dict):
    """Add numbered options to the reply when appropriate"""
    options = get_suggested_options(ctx)
    
    # Add numbered options if available
    if options:
        formatted_reply = reply + "\n\n"
        for i, option in enumerate(options, 1):
            formatted_reply += f"{i}. {option}\n"
        return formatted_reply
    
    # Special case for confirmation
    if ctx.get('step') == 6:
        return reply + "\n\n1. Sim\n2. Não"
    
    return reply

def process_user_input(text: str, ctx: dict):
    """Convert numeric responses to corresponding options"""
    # Check if input is just a number
    if text.strip().isdigit():
        option_index = int(text.strip()) - 1
        options = get_suggested_options(ctx)
        
        # Handle service or worker selection (steps 2 & 3)
        if ctx.get('step') in [2, 3] and options and 0 <= option_index < len(options):
            return options[option_index]
        
        # Handle confirmation (step 6)
        if ctx.get('step') == 6:
            if option_index == 0:
                return 'sim'
            if option_index == 1:
                return 'não'
    
    return text  # Default: return original text

# ─────────────────────────────────────────────────────────────
# optional: a _tiny_ Python port of the FSM – just stub here
def handle_message(text: str, phone: str, ctx: dict):
    """Very small example – replace with real FSM logic."""
    if "oi" in text.lower():
        reply = "Olá! Qual serviço você gostaria de agendar?"
        ctx['step'] = 1
        return reply, ctx, None

    # … full state machine goes here …

    return "Desculpe, não entendi.", ctx, None
# ─────────────────────────────────────────────────────────────

def lambda_handler(event, _ctx):
    body = json.loads(event['body'])
    session = body["session"]           # Evolution session name
    msg     = body["message"]["text"]
    phone   = body["message"]["from"]

    
    ALLOWED = {"5567999123456", "5511987654321"}      #  ➜ whitelist
    BLOCKED = {"558899995555"}                        #  ➜ blacklist

    jid = body["message"]["key"]["remoteJid"].split("@")[0]

    if jid in BLOCKED or (ALLOWED and jid not in ALLOWED):
        return { "statusCode": 204 }      # silently ignore

    # Get or initialize user context
    context_key = f"{session}:{phone}"
    if context_key in USER_CONTEXTS:
        state = USER_CONTEXTS[context_key]
    else:
        state = body.get("context", {})   # send your own ctx in webhook if you want
    
    # Process numeric input if applicable
    processed_text = process_user_input(msg, state)
    
    reply, new_state, appointment = handle_message(processed_text, phone, state)
    
    # Store updated context
    USER_CONTEXTS[context_key] = new_state
    
    # Format reply with numbered options
    formatted_reply = format_reply_with_numbered_options(reply, new_state)

    # 1) Send reply back through Evolution-API
    requests.post(
        f"{EVO}/message/sendText",
        headers={"apiKey": EKEY},
        json={"session": session, "to": phone, "text": formatted_reply},
        timeout=10,
    )

    # 2) Book appointment via your **public** endpoint (optional)
    if appointment:
        requests.post(
            f"{PUB_API}/public/appointments/book",
            headers={"x-api-key": PUB_KEY},
            json=appointment,
            timeout=10,
        )
        # Clear context after successful booking
        if context_key in USER_CONTEXTS:
            del USER_CONTEXTS[context_key]

    return {"statusCode": 200, "body": json.dumps({"ok": True, "context": new_state})}