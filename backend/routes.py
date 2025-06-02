from flask import Blueprint, request, jsonify
from models import db, Job
from datetime import datetime
from scrape import scrape_actuary_list_to_db

jobs_bp = Blueprint("jobs", __name__)

@jobs_bp.route("/health", methods=["GET"])
def health_check():
    """
    Health check route to verify if the backend is running.
    """
    return jsonify({"status": "Backend is running!"}), 200

@jobs_bp.route("/", methods=["GET"])
def get_jobs():
    """
    Fetches all jobs or filters jobs based on query parameters.
    Supports filtering by job_type, location, and tags.
    """
    job_type = request.args.get("job_type")
    location = request.args.get("location")
    tag = request.args.get("tag")
    sort = request.args.get("sort")

    query = Job.query

    if job_type:
        query = query.filter(Job.job_type.ilike(f"%{job_type}%")) 
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
    if tag:
        query = query.filter(Job.tags.ilike(f"%{tag}%"))
    if sort == "posting_date_desc":
        query = query.order_by(Job.posting_date.desc())
    elif sort == "posting_date_asc":
        query = query.order_by(Job.posting_date.asc())

    jobs = query.all()
    return jsonify([job.to_dict() for job in jobs])

@jobs_bp.route("/", methods=["POST"])
def add_job():
    """
    Creates a new job entry in the database.
    Validates required fields before insertion.
    """
    data = request.get_json()
    required_fields = ["title", "company", "location", "posting_date", "job_type"]

    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    try:
        job = Job(
            title=data["title"],
            company=data["company"],
            location=data["location"],
            posting_date=datetime.strptime(data["posting_date"], "%Y-%m-%d"),
            job_type=data["job_type"],
            tags=",".join(data.get("tags", []))  
        )
        db.session.add(job)
        db.session.commit()
        return jsonify(job.to_dict()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jobs_bp.route("/<int:job_id>", methods=["PUT", "PATCH"])
def update_job(job_id):
    """
    Updates an existing job entry in the database.
    Validates the job ID and updates fields dynamically.
    """
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    data = request.get_json()
    for field in ["title", "company", "location", "posting_date", "job_type", "tags"]:
        if field in data:
            if field == "tags":
                setattr(job, field, ",".join(data[field]))
            elif field == "posting_date":
                setattr(job, field, datetime.strptime(data[field], "%Y-%m-%d"))
            else:
                setattr(job, field, data[field])

    db.session.commit()  # Ensure changes are committed
    return jsonify(job.to_dict())

@jobs_bp.route("/<int:job_id>", methods=["DELETE"])
def delete_job(job_id):
    """
    Deletes a job entry from the database.
    Validates the job ID before deletion.
    """
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    db.session.delete(job)
    db.session.commit()
    return jsonify({"message": "Job deleted successfully"}), 204
