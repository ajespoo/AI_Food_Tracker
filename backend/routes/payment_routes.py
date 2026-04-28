import os
from datetime import datetime, timedelta

import stripe
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, User

payment_bp = Blueprint("payments", __name__)


def get_stripe():
    stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
    return stripe


@payment_bp.route("/checkout", methods=["POST"])
@jwt_required()
def create_checkout():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    plan = data.get("plan", "monthly")

    s = get_stripe()
    price_id = (
        os.environ.get("STRIPE_PRICE_YEARLY")
        if plan == "yearly"
        else os.environ.get("STRIPE_PRICE_MONTHLY")
    )
    if not price_id:
        return jsonify({"error": "Stripe price not configured"}), 500

    if not user.stripe_customer_id:
        customer = s.Customer.create(email=user.email, name=user.name or "")
        user.stripe_customer_id = customer.id
        db.session.commit()

    client_url = os.environ.get("CLIENT_URL", "http://localhost:5173")
    try:
        session = s.checkout.Session.create(
            customer=user.stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=f"{client_url}/dashboard?payment=success",
            cancel_url=f"{client_url}/subscription?payment=cancel",
        )
        return jsonify({"url": session.url, "session_id": session.id}), 200
    except Exception as e:
        current_app.logger.error(f"Stripe checkout error: {e}")
        return jsonify({"error": str(e)}), 400


@payment_bp.route("/portal", methods=["POST"])
@jwt_required()
def customer_portal():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    if not user.stripe_customer_id:
        return jsonify({"error": "No subscription found"}), 400

    s = get_stripe()
    client_url = os.environ.get("CLIENT_URL", "http://localhost:5173")
    try:
        session = s.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=f"{client_url}/profile",
        )
        return jsonify({"url": session.url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@payment_bp.route("/webhook", methods=["POST"])
def stripe_webhook():
    payload = request.get_data()
    sig = request.headers.get("Stripe-Signature", "")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

    s = get_stripe()
    try:
        event = s.Webhook.construct_event(payload, sig, webhook_secret)
    except Exception as e:
        current_app.logger.error(f"Webhook error: {e}")
        return jsonify({"error": "Invalid webhook"}), 400

    etype = event["type"]
    obj = event["data"]["object"]

    if etype == "customer.subscription.created" or etype == "customer.subscription.updated":
        customer_id = obj["customer"]
        status = obj["status"]
        plan = "yearly" if obj.get("items", {}).get("data", [{}])[0].get("price", {}).get("recurring", {}).get("interval") == "year" else "monthly"
        expires = datetime.fromtimestamp(obj["current_period_end"]) if obj.get("current_period_end") else None

        user = User.query.filter_by(stripe_customer_id=customer_id).first()
        if user:
            user.subscription_status = "active" if status == "active" else status
            user.subscription_plan = plan
            user.subscription_expires_at = expires
            db.session.commit()

            try:
                from services.notifications import send_subscription_confirmation
                send_subscription_confirmation(user.email, plan, user.name or "")
            except Exception:
                pass

    elif etype == "customer.subscription.deleted":
        customer_id = obj["customer"]
        user = User.query.filter_by(stripe_customer_id=customer_id).first()
        if user:
            user.subscription_status = "cancelled"
            user.subscription_plan = None
            db.session.commit()

    elif etype == "invoice.payment_failed":
        customer_id = obj["customer"]
        user = User.query.filter_by(stripe_customer_id=customer_id).first()
        if user:
            user.subscription_status = "past_due"
            db.session.commit()

    return jsonify({"received": True}), 200


@payment_bp.route("/status", methods=["GET"])
@jwt_required()
def subscription_status():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify({
        "subscription_status": user.subscription_status,
        "subscription_plan": user.subscription_plan,
        "subscription_expires_at": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
        "is_premium": user.is_premium,
    }), 200
