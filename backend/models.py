from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Job(db.Model):
    """
    Represents a job listing in the database.
    """
    __tablename__ = 'jobs'
    id = db.Column(db.Integer, primary_key=True)  # Unique identifier for each job
    title = db.Column(db.String(255), nullable=False)  # Job title
    company = db.Column(db.String(255), nullable=False)  # Company name
    location = db.Column(db.String(255), nullable=False)  # Job location
    posting_date = db.Column(db.Date, nullable=False)  # Date the job was posted
    job_type = db.Column(db.String(50), nullable=False)  # Type of job (e.g., Full-Time, Part-Time)
    tags = db.Column(db.Text, nullable=True)  # Comma-separated tags or keywords

    def to_dict(self):
        """
        Converts the Job object into a dictionary for JSON serialization.
        """
        return {
            "id": self.id,
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "posting_date": self.posting_date.isoformat(),
            "job_type": self.job_type,
            "tags": self.tags,
        }
