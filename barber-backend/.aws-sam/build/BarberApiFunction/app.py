import json
import os
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal
from urllib.parse import parse_qs
from datetime import datetime, timedelta

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────
def json_safe(item: dict):
    """
    Recursively walk a dict returned by boto3 DDB client and
    convert:
      • Decimal → int/float
      • set     → list
    """
    safe = {}
    for k, v in item.items():
        if isinstance(v, Decimal):
            safe[k] = int(v) if v % 1 == 0 else float(v)
        elif isinstance(v, set):
            safe[k] = list(v)
        elif isinstance(v, dict):
            safe[k] = json_safe(v)
        else:
            safe[k] = v
    return safe

def extract_shop_id(event, default="demo-shop"):
    """Read ?shop_id=… from query-string, fallback to default."""
    qs = event.get("rawQueryString") or ""
    params = dict(pair.split("=", 1) for pair in qs.split("&") if "=" in pair)
    return params.get("shop_id", default)


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)

SHOP_KEY = 'shop_id'          # partition key
SORT_KEY = 'sort_key'         # range key  =>  "{date}#{start_time}#{barber_id}"

def build_sort_key(date_, time_, barber_id):
    return f"{date_}#{time_}#{barber_id}"

def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body, cls=DecimalEncoder)
    }

# ──────────────────────────────────────────────
# AWS objects
# ──────────────────────────────────────────────
APPOINTMENTS_TABLE = os.environ.get('APPOINTMENTS_TABLE', 'Appointments')
BARBERS_TABLE      = os.environ.get('BARBERS_TABLE', 'Barbers')
CONFIGS_TABLE = os.environ.get('CONFIGS_TABLE', 'Configs')

dynamodb = boto3.resource('dynamodb')

configs_table = dynamodb.Table(CONFIGS_TABLE)
appointments_table = dynamodb.Table(APPOINTMENTS_TABLE)
barbers_table      = dynamodb.Table(BARBERS_TABLE)

# ──────────────────────────────────────────────
# Lambda entry
# ──────────────────────────────────────────────
def lambda_handler(event, context):
    raw_path = event.get('rawPath') or event.get('path', '')
    method   = event.get('requestContext', {}).get('http', {}).get('method', '')

    # strip stage prefix if present (/Prod or /dev)
    segments = [seg for seg in raw_path.split('/') if seg]
    if segments and segments[0].lower() in {'prod', 'dev', 'stage'}:
        path = '/' + '/'.join(segments[1:])
    else:
        path = raw_path

    # CORS pre-flight
    if method == 'OPTIONS':
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            "body": ""
        }

    # ─────────────── routes ────────────────
    if path == '/barbers'            and method == 'GET':
        return get_barbers(event)

    if path == '/appointments'       and method == 'GET':
        return get_appointments(event)

    if path == '/appointments/all'   and method == 'GET':
        return get_all_appointments(event)

    if path == '/appointments/book'  and method == 'POST':
        return book_appointment(event)
    if path == '/config' and method == 'GET':
        return get_config(event)

    if path == '/config' and method == 'PUT':
        return put_config(event)    

    return response(404, {"message": "Not Found"})


# ──────────────────────────────────────────────
# GET /barbers?shop_id=xyz
# ──────────────────────────────────────────────
def get_barbers(event):
    shop_id = event['queryStringParameters'].get('shop_id')
    if not shop_id:
        return response(400, {"message": "Missing shop_id"})

    try:
        res   = barbers_table.query(
                  KeyConditionExpression=Key('shop_id').eq(shop_id)
                )
        items = [json_safe(item) for item in res.get('Items', [])]
        return response(200, {"barbers": items})

    except Exception as e:
        print("Error querying barbers table:", e)
        return response(500, {
            "message": "Error querying barbers table",
            "error"  : str(e)
        })


# ──────────────────────────────────────────────
# GET /appointments?shop_id=xyz&date=YYYY-MM-DD
# ──────────────────────────────────────────────
def get_appointments(event):
    qs   = parse_qs(event.get("rawQueryString", ""))
    date = qs.get("date",    [None])[0]
    shop = qs.get("shop_id", [None])[0]

    if not shop:
        return response(400, {"message": "Missing shop_id"})

    try:
        if date:
            data = appointments_table.query(
                KeyConditionExpression=Key(SHOP_KEY).eq(shop) &
                                       Key(SORT_KEY).begins_with(date)
            )
        else:                             # just give me every appt for that shop
            data = appointments_table.query(
                KeyConditionExpression=Key(SHOP_KEY).eq(shop)
            )
        return response(200, {"appointments": data.get('Items', [])})
    except Exception as e:
        print("Query error:", e)
        return response(500, {"message": "Query failed", "error": str(e)})

# ──────────────────────────────────────────────
# GET /appointments/all?shop_id=xyz  (dev tool)
# ──────────────────────────────────────────────
def get_all_appointments(event):
    qs   = parse_qs(event.get("rawQueryString", ""))
    shop = qs.get("shop_id", [None])[0]

    try:
        if shop:
            data = appointments_table.query(
                KeyConditionExpression=Key(SHOP_KEY).eq(shop)
            )
            items = data.get('Items', [])
        else:                           # full table scan – dev only
            items = appointments_table.scan().get('Items', [])
        return response(200, {"appointments": items})
    except Exception as e:
        print("Scan error:", e)
        return response(500, {"message": "Error", "error": str(e)})
    
# ──────────────────────────────────────────────
# CONFIG FUNCTIONS GET and PUT
# ──────────────────────────────────────────────

def get_config(event):
    shop = (event.get("queryStringParameters") or {}).get("shop_id")
    if not shop:
        return response(400, {"message": "Missing shop_id"})

    res = configs_table.get_item(Key={"shop_id": shop})
    return response(200, res.get("Item", {}))


def put_config(event):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError as e:
        return response(400, {"message": "Invalid JSON", "error": str(e)})

    shop = body.get("shop_id")
    if not shop:
        return response(400, {"message": "shop_id required in body"})

    item = {**body, "shop_id": shop}
    configs_table.put_item(Item=item)
    return response(200, {"success": True})

# ──────────────────────────────────────────────
# POST /appointments/book   (JSON body)
# ──────────────────────────────────────────────
def book_appointment(event):
    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError as e:
        return response(400, {"message": "Invalid JSON", "error": str(e)})

    shop_id    = body.get("shop_id")
    barber_id  = body.get("barber_id")
    date       = body.get("date")
    start_time = body.get("start_time")
    duration   = int(body.get("duration", 40))
    client     = body.get("client_name", "Cliente")

    if not all([shop_id, barber_id, date, start_time]):
        return response(400, {"message": "Required: shop_id, barber_id, date, start_time"})

    # ── business-hour / Sunday checks ─────────────────────────────
    try:
        requested_start = datetime.strptime(f"{date} {start_time}", "%Y-%m-%d %H:%M")
    except ValueError as e:
        return response(400, {"message": "Data/hora inválida", "error": str(e)})

    if requested_start.weekday() == 6:      # domingo
        return response(400, {"message": "Não agendamos aos domingos."})

    if requested_start.time() < datetime.strptime("07:00", "%H:%M").time():
        return response(400, {"message": "Antes das 07:00."})

    if (requested_start + timedelta(minutes=duration)).time() > datetime.strptime("19:00", "%H:%M").time():
        return response(400, {"message": "Após as 19:00."})

    # ── write item with conditional-put to prevent double-book ─
    sort_key = build_sort_key(date, start_time, barber_id)
    item = {
        SHOP_KEY:   shop_id,
        SORT_KEY:   sort_key,
        "date":       date,
        "start_time": start_time,
        "barber_id":  barber_id,
        "duration":   duration,
        "client_name": client,
        "status":     "booked"
    }

    try:
        appointments_table.put_item(
            Item=item,
            ConditionExpression=f"attribute_not_exists({SORT_KEY})"
        )
        return response(200, {"success": True, "appointment": item})
    except appointments_table.meta.client.exceptions.ConditionalCheckFailedException:
        return response(409, {"message": "Horário já reservado"})
    except Exception as e:
        print("PutItem error:", e)
        return response(500, {"message": "Erro ao agendar", "error": str(e)})
