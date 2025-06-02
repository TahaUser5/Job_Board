from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from models import db
from routes import jobs_bp
from dotenv import load_dotenv
from sqlalchemy.sql import text  
import os

# Load environment variables from .env file
load_dotenv()  

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for frontend-backend communication

# Configure the database connection using environment variables
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")  
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy with the Flask app
db.init_app(app)

# Register the jobs blueprint for job-related routes
app.register_blueprint(jobs_bp, url_prefix="/api/jobs")

@app.route("/health", methods=["GET"])
def health_check():
    """
    Health check endpoint to verify the app and database connection.
    Executes a simple SQL query to ensure the database is reachable.
    """
    try:
        with app.app_context():
            db.session.execute(text("SELECT 1"))  # Execute raw SQL wrapped in text()
        return jsonify({"status": "App is running and database is connected!"}), 200
    except Exception as e:
        return jsonify({"status": "Error", "message": str(e)}), 500

@app.route("/", methods=["GET"])
def home():
    """
    Home endpoint to provide a welcome message.
    """
    return jsonify({"message": "Welcome to the job board backend!"})

if __name__ == "__main__":
    app.run(debug=True)  # Run the app in debug mode for development
