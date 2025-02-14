import json
from urllib.parse import parse_qs

barbers = [
    {"barber_id": 1, "name": "Eduardo", "color_tag": "#FF5733"},
    {"barber_id": 2, "name": "João", "color_tag": "#33C4FF"}
]

appointments = [
    {
        "barber_id": 1,
        "date": "2024-12-19",
        "start_time": "11:00",
        "duration": 40,
        "client_name": "Test Client"
    }
]

def lambda_handler(event, context):
    http_method = event.get("requestContext", {}).get("http", {}).get("method", "")
    path = event.get("rawPath", "")

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

    filtered = [a for a in appointments if a["date"] == date]
    return response(200, {"appointments": filtered, "barbers": barbers})

def book_appointment(event):
    body = json.loads(event.get("body", "{}"))
    barber_id = body.get("barber_id")
    date = body.get("date")
    start_time = body.get("start_time")

    if not (barber_id and date and start_time):
        return response(400, {"message": "Missing required fields: barber_id, date, start_time"})

    conflict = next((a for a in appointments if a["barber_id"] == barber_id and a["date"] == date and a["start_time"] == start_time), None)
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

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body)
    }
