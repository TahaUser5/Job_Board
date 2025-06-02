from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from models import db
from routes import jobs_bp
from dotenv import load_dotenv
from sqlalchemy.sql import text
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL", "postgresql://postgres:70126633@localhost/job_board")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

app.register_blueprint(jobs_bp, url_prefix="/api/jobs")

@app.route("/health", methods=["GET"])
def health_check():
    try:
        with app.app_context():
            db.session.execute(text("SELECT 1"))
        return jsonify({"status": "App is running and database is connected!"}), 200
    except Exception as e:
        return jsonify({"status": "Error", "message": str(e)}), 500

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Welcome to the job board backend!"})

if __name__ == "__main__":
    app.run(debug=True)
