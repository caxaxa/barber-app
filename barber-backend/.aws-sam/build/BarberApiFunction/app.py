import json
import os
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal
from urllib.parse import parse_qs
from datetime import datetime, timedelta

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            else:
                return float(obj)
        return super(DecimalEncoder, self).default(obj)

APPOINTMENTS_TABLE = os.environ.get('APPOINTMENTS_TABLE', 'Appointments')
BARBERS_TABLE = os.environ.get('BARBERS_TABLE', 'barbers')

dynamodb = boto3.resource('dynamodb')
appointments_table = dynamodb.Table(APPOINTMENTS_TABLE)
barbers_table = dynamodb.Table(BARBERS_TABLE)

def lambda_handler(event, context):
    path = event.get("rawPath") or event.get("path", "")
    http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "")

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
    try:
        result = barbers_table.scan()
        items = result.get('Items', [])
        return response(200, {"barbers": items})
    except Exception as e:
        print("Error scanning barbers table:", e)
        return response(500, {"message": "Error scanning barbers table", "error": str(e)})

def get_appointments(event):
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
    Expected JSON: { "barber_id": <int>, "date": "YYYY-MM-DD", "start_time": "HH:MM", ... }
    Enforces:
      - Horário de funcionamento: 07:00 às 19:00.
      - Não agendar aos domingos.
      - Não agendar dentro de 40 minutos antes ou depois de um horário já reservado para o mesmo barbeiro.
    """
    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError as e:
        return response(400, {"message": "Invalid JSON body", "error": str(e)})

    barber_id = body.get("barber_id")
    date = body.get("date")
    start_time = body.get("start_time")
    duration = int(body.get("duration", 40))

    if not (barber_id and date and start_time):
        return response(400, {"message": "Missing required fields: barber_id, date, start_time"})

    try:
        requested_start = datetime.strptime(f"{date} {start_time}", "%Y-%m-%d %H:%M")
    except ValueError as e:
        return response(400, {"message": "Formato de data/hora inválido", "error": str(e)})

    # Check for Sunday (weekday() returns 6 for Sunday)
    if requested_start.weekday() == 6:
        return response(400, {"message": "Não é possível agendar aos domingos."})

    BUSINESS_START = datetime.strptime("07:00", "%H:%M").time()
    BUSINESS_END = datetime.strptime("19:00", "%H:%M").time()

    if requested_start.time() < BUSINESS_START:
        return response(400, {"message": "Horário fora do expediente (antes das 07:00)."})
    
    requested_end = requested_start + timedelta(minutes=duration)
    if requested_end.time() > BUSINESS_END:
        return response(400, {"message": "Horário fora do expediente (após as 19:00)."})
    
    try:
        result = appointments_table.query(
            KeyConditionExpression=Key('date').eq(date)
        )
        items = result.get('Items', [])
        for appt in items:
            # Only consider appointments for the same barber
            if int(appt.get("barber_id")) != int(barber_id):
                continue
            existing_start = datetime.strptime(f"{appt['date']} {appt['start_time']}", "%Y-%m-%d %H:%M")
            # Check if the new appointment is within 40 minutes before or after an existing appointment
            if abs((requested_start - existing_start).total_seconds()) < 40 * 60:
                conflict_time = existing_start.strftime('%H:%M')
                return response(409, {"message": f"Horário indisponível: conflito com horário marcado às {conflict_time}."})
    except Exception as e:
        print("Error checking existing appointments:", e)
        return response(500, {"message": "Erro ao verificar horários existentes", "error": str(e)})

    try:
        appointment = {
            'date': date,
            'start_time': start_time,
            'barber_id': barber_id,
            'duration': duration,
            'client_name': body.get("client_name", "Cliente Exemplo"),
            'status': body.get("status", "booked")
        }
        appointments_table.put_item(Item=appointment)
        return response(200, {"success": True, "appointment": appointment})
    except Exception as e:
        print("Error booking appointment:", e)
        return response(500, {"message": "Erro ao marcar horário", "error": str(e)})

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body, cls=DecimalEncoder)
    }
