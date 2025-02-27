import json
import os
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal
from urllib.parse import parse_qs  # for parsing query strings

class DecimalEncoder(json.JSONEncoder):
    """
    Ensures Decimal types from DynamoDB are converted to int or float in JSON.
    """
    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            else:
                return float(obj)
        return super(DecimalEncoder, self).default(obj)

# Read environment variables set in template.yaml or similar
APPOINTMENTS_TABLE = os.environ.get('APPOINTMENTS_TABLE', 'Appointments')
BARBERS_TABLE = os.environ.get('BARBERS_TABLE', 'barbers')

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb')

# Table objects
appointments_table = dynamodb.Table(APPOINTMENTS_TABLE)
barbers_table = dynamodb.Table(BARBERS_TABLE)

def lambda_handler(event, context):
    """
    Main Lambda entry point. Routes requests based on path + method.
    """
    path = event.get("rawPath") or event.get("path", "")
    http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "")

    # Handle CORS preflight
    if http_method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": ""
        }

    # Route definitions
    if path == "/barbers" and http_method == "GET":
        return get_barbers_from_db()

    elif path == "/appointments" and http_method == "GET":
        return get_appointments(event)

    elif path == "/appointments/all" and http_method == "GET":
        return get_all_appointments()

    elif path == "/appointments/book" and http_method == "POST":
        return book_appointment(event)

    else:
        return response(404, {"message": "Not Found"})


def get_barbers_from_db():
    """
    GET /barbers
    Scans the "Barbers" table and returns all items.
    """
    try:
        result = barbers_table.scan()
        items = result.get('Items', [])
        return response(200, {"barbers": items})
    except Exception as e:
        print("Error scanning barbers table:", e)
        return response(500, {"message": "Error scanning barbers table", "error": str(e)})


def get_appointments(event):
    """
    GET /appointments?date=YYYY-MM-DD
    Returns appointments for a specific date from the "Appointments" table.
    """
    query = event.get("rawQueryString", "")
    params = parse_qs(query)
    date = params.get("date", [None])[0]
    if not date:
        return response(400, {"message": "Missing 'date' query parameter"})

    try:
        result = appointments_table.query(
            KeyConditionExpression=Key('date').eq(date)
        )
        items = result.get('Items', [])
        return response(200, {"appointments": items})
    except Exception as e:
        print("Error querying appointments:", e)
        return response(500, {"message": "Error querying appointments", "error": str(e)})


def get_all_appointments():
    """
    GET /appointments/all
    Returns all appointments from the "Appointments" table.
    """
    try:
        result = appointments_table.scan()
        items = result.get('Items', [])
        return response(200, {"appointments": items})
    except Exception as e:
        print("Error scanning appointments:", e)
        return response(500, {"message": "Error scanning appointments", "error": str(e)})


def book_appointment(event):
    """
    POST /appointments/book
    Body JSON must include: { "barber_id": <int>, "date": "YYYY-MM-DD", "start_time": "HH:MM" }
    Optionally: "duration", "client_name", "status"
    """
    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError as e:
        return response(400, {"message": "Invalid JSON body", "error": str(e)})

    barber_id = body.get("barber_id")
    date = body.get("date")
    start_time = body.get("start_time")

    # Validate required fields
    if not (barber_id and date and start_time):
        return response(400, {"message": "Missing required fields: barber_id, date, start_time"})

    try:
        # Check if slot already booked
        existing = appointments_table.get_item(Key={'date': date, 'start_time': start_time})
        if 'Item' in existing:
            return response(409, {"message": "Time slot already booked."})

        # Construct new appointment item
        appointment = {
            'date': date,
            'start_time': start_time,
            'barber_id': barber_id,
            'duration': body.get("duration", 40),
            'client_name': body.get("client_name", "Cliente Exemplo"),
            'status': body.get("status", "booked")
        }
        appointments_table.put_item(Item=appointment)
        return response(200, {"success": True, "appointment": appointment})
    except Exception as e:
        print("Error booking appointment:", e)
        return response(500, {"message": "Error booking appointment", "error": str(e)})


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body, cls=DecimalEncoder)
    }
