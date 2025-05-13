import os, json, logging, requests

EVO  = os.environ['EVO_BASE_URL'].rstrip('/')
EKEY = os.environ['EVO_API_KEY']

PUB_API  = os.environ['PUBLIC_API_URL'].rstrip('/')
PUB_KEY  = os.environ['PUBLIC_API_KEY']

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

    state   = body.get("context", {})   # send your own ctx in webhook if you want
    reply, new_state, appointment = handle_message(msg, phone, state)

    # 1) Send reply back through Evolution-API
    requests.post(
        f"{EVO}/message/sendText",
        headers={"apiKey": EKEY},
        json={"session": session, "to": phone, "text": reply},
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

    return {"statusCode": 200, "body": json.dumps({"ok": True, "context": new_state})}
