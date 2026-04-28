import os
from flask_mail import Message
from app import mail


def send_otp_email(email: str, otp: str, name: str = ""):
    subject = "Your AI Food Tracker verification code"
    body = f"""Hi {name or "there"},

Your one-time verification code is: {otp}

This code expires in 10 minutes. Do not share it with anyone.

— AI Food Tracker Team
"""
    msg = Message(subject=subject, recipients=[email], body=body)
    mail.send(msg)


def send_welcome_email(email: str, name: str = ""):
    subject = "Welcome to AI Food Tracker!"
    body = f"""Hi {name or "there"},

Welcome! Your account is all set. Start tracking your meals with AI-powered nutrition analysis.

— AI Food Tracker Team
"""
    msg = Message(subject=subject, recipients=[email], body=body)
    mail.send(msg)


def send_subscription_confirmation(email: str, plan: str, name: str = ""):
    subject = "Subscription confirmed — AI Food Tracker Premium"
    body = f"""Hi {name or "there"},

Your {plan} subscription is now active. Enjoy unlimited AI food scans, advanced analytics, and more.

— AI Food Tracker Team
"""
    msg = Message(subject=subject, recipients=[email], body=body)
    mail.send(msg)


def send_sms_otp(phone_number: str, otp: str):
    try:
        from twilio.rest import Client
        sid = os.environ.get("TWILIO_ACCOUNT_SID")
        token = os.environ.get("TWILIO_AUTH_TOKEN")
        from_number = os.environ.get("TWILIO_PHONE_NUMBER")
        if not all([sid, token, from_number]):
            return False
        client = Client(sid, token)
        client.messages.create(
            body=f"Your AI Food Tracker code: {otp}. Expires in 10 min.",
            from_=from_number,
            to=phone_number,
        )
        return True
    except Exception:
        return False
