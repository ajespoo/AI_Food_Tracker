import random
import string
import time

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)
from werkzeug.security import generate_password_hash, check_password_hash

from models import db, User

auth_bp = Blueprint("auth", __name__)


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def _send_otp(user: User, otp: str):
    try:
        from services.notifications import send_otp_email
        send_otp_email(user.email, otp, user.name or "")
    except Exception as e:
        current_app.logger.error(f"Email OTP failed: {e}")

    if user.phone_number:
        try:
            from services.notifications import send_sms_otp
            send_sms_otp(user.phone_number, otp)
        except Exception as e:
            current_app.logger.error(f"SMS OTP failed: {e}")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")
    name = data.get("name", "")
    phone = data.get("phone_number", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        name=name,
        phone_number=phone or None,
    )
    otp = _generate_otp()
    user.otp = otp
    user.otp_expiry = time.time() + 600
    db.session.add(user)
    db.session.commit()

    _send_otp(user, otp)
    return jsonify({"message": "Registration successful. Check your email for OTP.", "user_id": user.id}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash or "", password):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/send-otp", methods=["POST"])
def send_otp():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    otp = _generate_otp()
    user.otp = otp
    user.otp_expiry = time.time() + 600
    db.session.commit()
    _send_otp(user, otp)
    return jsonify({"message": "OTP sent"}), 200


@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    otp = data.get("otp", "")

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    if user.otp != otp:
        return jsonify({"error": "Invalid OTP"}), 400
    if not user.otp_expiry or time.time() > user.otp_expiry:
        return jsonify({"error": "OTP expired"}), 400

    user.otp = None
    user.otp_expiry = None
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return jsonify({"access_token": access_token}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/profile", methods=["PATCH"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}

    if "name" in data:
        user.name = data["name"]
    if "phone_number" in data:
        user.phone_number = data["phone_number"]
    if "avatar_url" in data:
        user.avatar_url = data["avatar_url"]

    db.session.commit()
    return jsonify({"user": user.to_dict()}), 200
