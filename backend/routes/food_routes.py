from datetime import date, datetime

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, FoodRecord, User
from services.ai_food_recognition import analyze_food_image, lookup_barcode, search_food_text

food_bp = Blueprint("food", __name__)


@food_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_food_image():
    user_id = int(get_jwt_identity())

    if "file" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    image_bytes = file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        return jsonify({"error": "Image too large (max 10MB)"}), 413

    try:
        nutrition = analyze_food_image(image_bytes)
    except Exception as e:
        current_app.logger.error(f"AI analysis failed: {e}")
        return jsonify({"error": "AI analysis failed. Please try again."}), 500

    meal_type = request.form.get("meal_type", "snack")
    today = date.today()

    record = FoodRecord(
        user_id=user_id,
        date=today,
        meal_type=meal_type,
        food_name=nutrition.get("food_name", "Unknown"),
        calories=float(nutrition.get("calories", 0)),
        protein=float(nutrition.get("protein", 0)),
        carbs=float(nutrition.get("carbs", 0)),
        fats=float(nutrition.get("fats", 0)),
        fiber=float(nutrition.get("fiber", 0)),
        serving_size=nutrition.get("serving_size"),
        source="ai_vision",
        ai_confidence=float(nutrition.get("confidence", 0)),
    )
    db.session.add(record)
    db.session.commit()

    return jsonify({"food": record.to_dict(), "nutrition": nutrition}), 201


@food_bp.route("/barcode/<barcode>", methods=["GET"])
@jwt_required()
def lookup_barcode_route(barcode):
    data = lookup_barcode(barcode)
    if not data:
        return jsonify({"error": "Product not found"}), 404
    return jsonify({"product": data}), 200


@food_bp.route("/search", methods=["GET"])
@jwt_required()
def search_food():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"error": "Query required"}), 400
    results = search_food_text(query)
    return jsonify({"results": results}), 200


@food_bp.route("/log", methods=["POST"])
@jwt_required()
def log_food():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    required = ["food_name", "calories"]
    if not all(k in data for k in required):
        return jsonify({"error": "food_name and calories are required"}), 400

    record = FoodRecord(
        user_id=user_id,
        date=date.fromisoformat(data.get("date", date.today().isoformat())),
        meal_type=data.get("meal_type", "snack"),
        food_name=data["food_name"],
        calories=float(data["calories"]),
        protein=float(data.get("protein", 0)),
        carbs=float(data.get("carbs", 0)),
        fats=float(data.get("fats", 0)),
        fiber=float(data.get("fiber", 0)),
        serving_size=data.get("serving_size"),
        source=data.get("source", "manual"),
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({"food": record.to_dict()}), 201


@food_bp.route("/records", methods=["GET"])
@jwt_required()
def get_records():
    user_id = int(get_jwt_identity())
    date_str = request.args.get("date", date.today().isoformat())
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    records = FoodRecord.query.filter_by(user_id=user_id, date=target_date).all()
    return jsonify({"records": [r.to_dict() for r in records]}), 200


@food_bp.route("/records/<int:record_id>", methods=["DELETE"])
@jwt_required()
def delete_record(record_id):
    user_id = int(get_jwt_identity())
    record = FoodRecord.query.filter_by(id=record_id, user_id=user_id).first_or_404()
    db.session.delete(record)
    db.session.commit()
    return jsonify({"message": "Record deleted"}), 200


@food_bp.route("/summary", methods=["GET"])
@jwt_required()
def daily_summary():
    user_id = int(get_jwt_identity())
    date_str = request.args.get("date", date.today().isoformat())
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    records = FoodRecord.query.filter_by(user_id=user_id, date=target_date).all()
    totals = {
        "calories": sum(r.calories for r in records),
        "protein": sum(r.protein for r in records),
        "carbs": sum(r.carbs for r in records),
        "fats": sum(r.fats for r in records),
        "fiber": sum(r.fiber for r in records),
    }
    by_meal = {}
    for r in records:
        by_meal.setdefault(r.meal_type, []).append(r.to_dict())

    return jsonify({"date": date_str, "totals": totals, "by_meal": by_meal, "count": len(records)}), 200


@food_bp.route("/history", methods=["GET"])
@jwt_required()
def food_history():
    user_id = int(get_jwt_identity())
    days = min(int(request.args.get("days", 7)), 30)

    from datetime import timedelta
    records = (
        FoodRecord.query
        .filter(FoodRecord.user_id == user_id, FoodRecord.date >= date.today() - timedelta(days=days))
        .order_by(FoodRecord.date.desc(), FoodRecord.created_at.desc())
        .all()
    )
    return jsonify({"records": [r.to_dict() for r in records]}), 200


@food_bp.route("/chat", methods=["POST"])
@jwt_required()
def nutrition_chat():
    from openai import OpenAI
    import os
    data = request.get_json() or {}
    messages = data.get("messages", [])
    if not messages:
        return jsonify({"error": "messages required"}), 400

    oc = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    try:
        resp = oc.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a friendly, expert nutrition coach. Give concise, actionable advice about food, macros, meal planning, and healthy eating. Keep replies under 150 words unless asked for a meal plan."},
                *[{"role": m["role"], "content": m["content"]} for m in messages[-10:]],
            ],
            max_tokens=300,
            temperature=0.7,
        )
        return jsonify({"reply": resp.choices[0].message.content}), 200
    except Exception as e:
        current_app.logger.error(f"Chat error: {e}")
        return jsonify({"error": "Chat unavailable"}), 500
