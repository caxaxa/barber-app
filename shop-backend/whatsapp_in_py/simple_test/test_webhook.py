import json

def lambda_handler(event, context):
    try:
        # Extract query parameters
        params = event.get("queryStringParameters", {})
        
        # Return diagnostic information
        return {
            "statusCode": 200,
            "body": json.dumps({
                "event": event,
                "message": "Webhook is working",
                "timestamp": str(__import__("datetime").datetime.now())
            })
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e)
            })
        }
