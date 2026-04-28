import os
from datetime import datetime, timedelta

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/fitness.activity.read",
          "https://www.googleapis.com/auth/fitness.nutrition.read"]


def get_credentials(token_data: dict) -> Credentials:
    return Credentials(
        token=token_data.get("access_token"),
        refresh_token=token_data.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ.get("GOOGLE_CLIENT_ID"),
        client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
        scopes=SCOPES,
    )


def get_steps_today(token_data: dict) -> int:
    try:
        creds = get_credentials(token_data)
        service = build("fitness", "v1", credentials=creds)
        now = datetime.utcnow()
        start = datetime(now.year, now.month, now.day)
        start_ms = int(start.timestamp() * 1000)
        end_ms = int(now.timestamp() * 1000)
        body = {
            "aggregateBy": [{"dataTypeName": "com.google.step_count.delta"}],
            "bucketByTime": {"durationMillis": 86400000},
            "startTimeMillis": start_ms,
            "endTimeMillis": end_ms,
        }
        result = service.users().dataset().aggregate(userId="me", body=body).execute()
        steps = 0
        for bucket in result.get("bucket", []):
            for dataset in bucket.get("dataset", []):
                for point in dataset.get("point", []):
                    for val in point.get("value", []):
                        steps += val.get("intVal", 0)
        return steps
    except Exception:
        return 0


def get_calories_burned_today(token_data: dict) -> float:
    try:
        creds = get_credentials(token_data)
        service = build("fitness", "v1", credentials=creds)
        now = datetime.utcnow()
        start = datetime(now.year, now.month, now.day)
        start_ms = int(start.timestamp() * 1000)
        end_ms = int(now.timestamp() * 1000)
        body = {
            "aggregateBy": [{"dataTypeName": "com.google.calories.expended"}],
            "bucketByTime": {"durationMillis": 86400000},
            "startTimeMillis": start_ms,
            "endTimeMillis": end_ms,
        }
        result = service.users().dataset().aggregate(userId="me", body=body).execute()
        total = 0.0
        for bucket in result.get("bucket", []):
            for dataset in bucket.get("dataset", []):
                for point in dataset.get("point", []):
                    for val in point.get("value", []):
                        total += val.get("fpVal", 0)
        return round(total, 1)
    except Exception:
        return 0.0
