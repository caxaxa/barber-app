import json
from urllib.parse import parse_qs
from typing import Any, Dict, List

# In-memory data for demonstration purposes.
barbers: List[Dict[str, Any]] = [
    {"barber_id": 1, "name": "Eduardo", "color_tag": "#FF5733"},
    {"barber_id": 2, "name": "João", "color_tag": "#33C4FF"}
]

appointments: List[Dict[str, Any]] = [
    {
        "barber_id": 1,
        "date": "2022-10-15",
        "start_time": "10:00",
        "duration": 40,
        "client_name": "Test Client"
    }
]

# Helper function to format responses with CORS headers.
def response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        "body": json.dumps(body)
    }

def lambda_handler(event, context):
    http_method = event.get("requestContext", {}).get("http", {}).get("method", "")
    path = event.get("rawPath", "")

    # Handle preflight OPTIONS request for CORS
    if http_method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": json.dumps({})
        }

    if path == "/barbers" and http_method == "GET":
        return get_barbers()
    elif path == "/appointments" and http_method == "GET":
        return get_appointments(event)
    elif path == "/appointments/book" and http_method == "POST":
        return book_appointment(event)
    else:
        return response(404, {"message": "Not Found"})

def get_barbers():
    return response(200, {"barbers": barbers})

def get_appointments(event):
    query = event.get("rawQueryString", "")
    params = parse_qs(query)
    date = params.get("date", [None])[0]

    if not date:
        return response(400, {"message": "Missing 'date' query parameter"})

    filtered = [appt for appt in appointments if appt["date"] == date]
    return response(200, {"appointments": filtered, "barbers": barbers})

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

    conflict = next(
        (appt for appt in appointments if appt["barber_id"] == barber_id and appt["date"] == date and appt["start_time"] == start_time),
        None
    )
    if conflict:
        return response(409, {"message": "Horário já reservado."})

    new_appointment = {
        "barber_id": barber_id,
        "date": date,
        "start_time": start_time,
        "duration": 40,
        "client_name": "Cliente Exemplo"
    }
    appointments.append(new_appointment)
    return response(200, {"success": True, "appointment": new_appointment})
