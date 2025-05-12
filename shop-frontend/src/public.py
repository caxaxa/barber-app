# public.py
import os, json, boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal
from datetime import datetime, timedelta

from app import (
    json_safe, response, build_sort_key, SHOP_KEY, SORT_KEY,
    configs_table, workers_table, appointments_table
)

#  ───────────────────────────────────────────
# Public (no Cognito) – shop_id comes from query‑string
#  ───────────────────────────────────────────

def handler(event, _):
    route  = event["rawPath"]
    method = event["requestContext"]["http"]["method"]

    if route == "/public/config" and method == "GET":
        return get_config(event)
    if route == "/public/workers" and method == "GET":
        return get_workers(event)
    if route == "/public/appointments/book" and method == "POST":
        return book_appointment(event)

    return response(404, {"msg":"not found"})

# ── GET /public/config?shop_id=foo ─────────────────

def get_config(event):
    shop = (event.get("queryStringParameters") or {}).get("shop_id")
    if not shop:
        return response(400, {"message":"shop_id required"})
    item = configs_table.get_item(Key={"shop_id":shop}).get("Item", {})
    return response(200, item)

# ── GET /public/workers?shop_id=foo ───────────────

def get_workers(event):
    shop = (event.get("queryStringParameters") or {}).get("shop_id")
    if not shop:
        return response(400, {"message":"shop_id required"})
    res = workers_table.query(KeyConditionExpression=Key("shop_id").eq(shop))
    return response(200, {"workers":[json_safe(i) for i in res.get("Items",[])]})

# ── POST /public/appointments/book ────────────────

def book_appointment(event):
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return response(400, {"message":"invalid json"})

    required = ["worker_id","date","start_time","client_name","shop_id"]
    if not all(k in body for k in required):
        return response(400,{"message":f"required: {', '.join(required)}"})

    shop_id   = body["shop_id"]
    worker_id = body["worker_id"]
    date      = body["date"]
    start     = body["start_time"]
    duration  = int(body.get("duration",40))

    sort_key = build_sort_key(date,start,worker_id)
    item = {
        SHOP_KEY: shop_id,
        SORT_KEY: sort_key,
        "date":date,
        "start_time":start,
        "worker_id":worker_id,
        "duration":duration,
        "client_name":body["client_name"],
        "status":"booked"
    }
    try:
        appointments_table.put_item(Item=item,
            ConditionExpression=f"attribute_not_exists({SORT_KEY})")
        return response(200,{"success":True})
    except appointments_table.meta.client.exceptions.ConditionalCheckFailedException:
        return response(409,{"message":"slot taken"})