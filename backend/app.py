import os
from dotenv import load_dotenv

load_dotenv()

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_migrate import Migrate

from config import Config
from models import db

mail = Mail()
jwt = JWTManager()
migrate = Migrate()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    mail.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    CORS(app, resources={r"/api/*": {"origins": app.config["CLIENT_URL"]}})

    from routes.auth_routes import auth_bp
    from routes.food_routes import food_bp
    from routes.goal_routes import goal_bp
    from routes.payment_routes import payment_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(food_bp, url_prefix="/api/food")
    app.register_blueprint(goal_bp, url_prefix="/api/goals")
    app.register_blueprint(payment_bp, url_prefix="/api/payments")

    @app.route("/api/health")
    def health():
        return {"status": "ok"}, 200

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_ENV") == "development", port=5000)
