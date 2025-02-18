import json
import os
from urllib.parse import parse_qs
import boto3
from boto3.dynamodb.conditions import Key

# Initialize DynamoDB resource and table from environment variable
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('APPOINTMENTS_TABLE', 'Appointments')
table = dynamodb.Table(table_name)

# Static list of barbers
barbers = [
    {"barber_id": 1, "name": "Eduardo", "color_tag": "#FF5733"},
    {"barber_id": 2, "name": "João", "color_tag": "#33C4FF"}
]

def lambda_handler(event, context):
    # Use "rawPath" if available, otherwise fallback to "path"
    path = event.get("rawPath") or event.get("path", "")
    # Use "httpMethod" directly, if available; otherwise try the nested location
    http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "")

    print("HTTP Method:", http_method)
    print("Path:", path)

    # Handle preflight CORS requests
    if http_method == "OPTIONS":
        return response(200, {})

    if path == "/barbers" and http_method == "GET":
        return get_barbers()
    elif path == "/appointments" and http_method == "GET":
        return get_appointments(event)
    elif path == "/appointments/all" and http_method == "GET":
        return get_all_appointments()
    elif path == "/appointments/book" and http_method == "POST":
        return book_appointment(event)
    else:
        return response(404, {"message": "Not Found"})



def get_barbers():
    return response(200, {"barbers": barbers})

def get_appointments(event):
    # Query appointments by a specific date passed as a query parameter
    query = event.get("rawQueryString", "")
    params = parse_qs(query)
    date = params.get("date", [None])[0]
    if not date:
        return response(400, {"message": "Missing 'date' query parameter"})

    try:
        result = table.query(
            KeyConditionExpression=Key('date').eq(date)
        )
        items = result.get('Items', [])
        return response(200, {"appointments": items, "barbers": barbers})
    except Exception as e:
        return response(500, {"message": "Error querying appointments", "error": str(e)})

def get_all_appointments():
    # Scan the entire table to retrieve all appointments
    try:
        result = table.scan()
        items = result.get('Items', [])
        return response(200, {"appointments": items, "barbers": barbers})
    except Exception as e:
        return response(500, {"message": "Error scanning appointments", "error": str(e)})

def book_appointment(event):
    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return response(400, {"message": "Invalid JSON body"})

    barber_id = body.get("barber_id")
    date = body.get("date")
    start_time = body.get("start_time")

    if not (barber_id and date and start_time):
        return response(400, {"message": "Missing required fields: barber_id, date, start_time"})

    try:
        # Check if an appointment already exists for the same date and start_time
        existing = table.get_item(Key={'date': date, 'start_time': start_time})
        if 'Item' in existing:
            return response(409, {"message": "Horário já reservado."})

        appointment = {
            'date': date,
            'start_time': start_time,
            'barber_id': barber_id,
            'duration': body.get("duration", 40),
            'client_name': body.get("client_name", "Cliente Exemplo"),
            'status': body.get("status", "booked")
        }
        table.put_item(Item=appointment)
        return response(200, {"success": True, "appointment": appointment})
    except Exception as e:
        return response(500, {"message": "Error booking appointment", "error": str(e)})

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body)
    }
