from app import app
from models import db

# Initialize the database schema
with app.app_context():
    print("Creating database tables...")
    db.create_all()  # Create all tables defined in models.py
    print("Database tables created successfully.")
