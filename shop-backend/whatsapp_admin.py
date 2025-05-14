import json, os, boto3, requests
ddb  = boto3.resource('dynamodb').Table(os.environ['CONFIGS_TABLE'])

def connect_handler(event, _ctx):
    # ↓ for now just prove it runs
    return {'statusCode': 200, 'body': json.dumps({'ok': True})}

def lists_handler(event, _ctx):
    return {'statusCode': 204}

