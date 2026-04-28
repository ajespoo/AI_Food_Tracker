from datetime import date

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, DailyMacroGoal, WaterLog, FoodRecord

goal_bp = Blueprint("goals", __name__)


@goal_bp.route("/macros", methods=["GET"])
@jwt_required()
def get_macro_goals():
    user_id = int(get_jwt_identity())
    goal = DailyMacroGoal.query.filter_by(user_id=user_id).first()
    if not goal:
        goal = DailyMacroGoal(user_id=user_id)
        db.session.add(goal)
        db.session.commit()
    return jsonify({"goals": goal.to_dict()}), 200


@goal_bp.route("/macros", methods=["PUT"])
@jwt_required()
def set_macro_goals():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    goal = DailyMacroGoal.query.filter_by(user_id=user_id).first()
    if not goal:
        goal = DailyMacroGoal(user_id=user_id)
        db.session.add(goal)

    for field in ["calories", "protein", "carbs", "fats", "fiber", "water_ml"]:
        if field in data:
            setattr(goal, field, float(data[field]))

    db.session.commit()
    return jsonify({"goals": goal.to_dict()}), 200


@goal_bp.route("/progress", methods=["GET"])
@jwt_required()
def daily_progress():
    user_id = int(get_jwt_identity())
    date_str = request.args.get("date", date.today().isoformat())
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        return jsonify({"error": "Invalid date"}), 400

    goal = DailyMacroGoal.query.filter_by(user_id=user_id).first()
    if not goal:
        goal = DailyMacroGoal(user_id=user_id)
        db.session.add(goal)
        db.session.commit()

    records = FoodRecord.query.filter_by(user_id=user_id, date=target_date).all()
    consumed = {
        "calories": sum(r.calories for r in records),
        "protein": sum(r.protein for r in records),
        "carbs": sum(r.carbs for r in records),
        "fats": sum(r.fats for r in records),
        "fiber": sum(r.fiber for r in records),
    }

    water_logs = WaterLog.query.filter_by(user_id=user_id, date=target_date).all()
    water_consumed = sum(w.amount_ml for w in water_logs)

    def pct(consumed, goal_val):
        return round(min(consumed / goal_val * 100, 100), 1) if goal_val > 0 else 0

    return jsonify({
        "date": date_str,
        "goals": goal.to_dict(),
        "consumed": consumed,
        "water_consumed_ml": water_consumed,
        "progress": {
            "calories": pct(consumed["calories"], goal.calories),
            "protein": pct(consumed["protein"], goal.protein),
            "carbs": pct(consumed["carbs"], goal.carbs),
            "fats": pct(consumed["fats"], goal.fats),
            "fiber": pct(consumed["fiber"], goal.fiber),
            "water": pct(water_consumed, goal.water_ml),
        },
    }), 200


@goal_bp.route("/water", methods=["POST"])
@jwt_required()
def log_water():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    amount_ml = data.get("amount_ml", 250)

    log = WaterLog(
        user_id=user_id,
        date=date.today(),
        amount_ml=float(amount_ml),
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({"log": log.to_dict()}), 201


@goal_bp.route("/water", methods=["GET"])
@jwt_required()
def get_water_logs():
    user_id = int(get_jwt_identity())
    date_str = request.args.get("date", date.today().isoformat())
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        return jsonify({"error": "Invalid date"}), 400

    logs = WaterLog.query.filter_by(user_id=user_id, date=target_date).all()
    total = sum(w.amount_ml for w in logs)
    return jsonify({"logs": [l.to_dict() for l in logs], "total_ml": total}), 200
