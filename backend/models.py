from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone_number = db.Column(db.String(20), unique=True, nullable=True)
    password_hash = db.Column(db.String(256), nullable=True)
    name = db.Column(db.String(120), nullable=True)
    avatar_url = db.Column(db.String(500), nullable=True)

    otp = db.Column(db.String(6), nullable=True)
    otp_expiry = db.Column(db.Float, nullable=True)

    stripe_customer_id = db.Column(db.String(255), nullable=True)
    subscription_status = db.Column(db.String(20), default="free")
    subscription_plan = db.Column(db.String(20), nullable=True)
    subscription_expires_at = db.Column(db.DateTime, nullable=True)

    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    food_records = db.relationship("FoodRecord", backref="user", lazy=True, cascade="all, delete-orphan")
    macro_goals = db.relationship("DailyMacroGoal", backref="user", lazy=True, cascade="all, delete-orphan")
    water_logs = db.relationship("WaterLog", backref="user", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "phone_number": self.phone_number,
            "avatar_url": self.avatar_url,
            "subscription_status": self.subscription_status,
            "subscription_plan": self.subscription_plan,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    @property
    def is_premium(self):
        if self.subscription_status != "active":
            return False
        if self.subscription_expires_at and self.subscription_expires_at < datetime.utcnow():
            return False
        return True


class FoodRecord(db.Model):
    __tablename__ = "food_records"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    date = db.Column(db.Date, default=date.today, nullable=False)
    meal_type = db.Column(db.String(20), default="snack")
    food_name = db.Column(db.String(200), nullable=False)
    calories = db.Column(db.Float, default=0)
    protein = db.Column(db.Float, default=0)
    carbs = db.Column(db.Float, default=0)
    fats = db.Column(db.Float, default=0)
    fiber = db.Column(db.Float, default=0)
    serving_size = db.Column(db.String(50), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    source = db.Column(db.String(20), default="manual")
    ai_confidence = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat(),
            "meal_type": self.meal_type,
            "food_name": self.food_name,
            "calories": self.calories,
            "protein": self.protein,
            "carbs": self.carbs,
            "fats": self.fats,
            "fiber": self.fiber,
            "serving_size": self.serving_size,
            "image_url": self.image_url,
            "source": self.source,
            "ai_confidence": self.ai_confidence,
            "created_at": self.created_at.isoformat(),
        }


class DailyMacroGoal(db.Model):
    __tablename__ = "daily_macro_goals"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    calories = db.Column(db.Float, default=2000)
    protein = db.Column(db.Float, default=150)
    carbs = db.Column(db.Float, default=250)
    fats = db.Column(db.Float, default=65)
    fiber = db.Column(db.Float, default=25)
    water_ml = db.Column(db.Float, default=2000)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "calories": self.calories,
            "protein": self.protein,
            "carbs": self.carbs,
            "fats": self.fats,
            "fiber": self.fiber,
            "water_ml": self.water_ml,
        }


class WaterLog(db.Model):
    __tablename__ = "water_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    date = db.Column(db.Date, default=date.today, nullable=False)
    amount_ml = db.Column(db.Float, nullable=False)
    logged_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat(),
            "amount_ml": self.amount_ml,
            "logged_at": self.logged_at.isoformat(),
        }
