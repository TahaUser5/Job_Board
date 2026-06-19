from flask import Blueprint, request, jsonify
from models import db, Job
from datetime import datetime
from background_scraper import trigger_background_scrape

jobs_bp = Blueprint("jobs", __name__)

@jobs_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "Backend is running!"}), 200

@jobs_bp.route("/", methods=["GET"])
def get_jobs():
    job_type = request.args.get("job_type")
    location = request.args.get("location")
    tag = request.args.get("tag")
    sort = request.args.get("sort")
    keyword = request.args.get("keyword")  # search across title, company, location

    query = Job.query

    if job_type:
        query = query.filter(Job.job_type.ilike(f"%{job_type}%"))
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
    if tag:
        query = query.filter(Job.tags.ilike(f"%{tag}%"))
    if keyword:
        kw = f"%{keyword}%"
        query = query.filter(
            Job.title.ilike(kw) | Job.company.ilike(kw) | Job.location.ilike(kw)
        )
    if sort == "posting_date_desc":
        query = query.order_by(Job.posting_date.desc())
    elif sort == "posting_date_asc":
        query = query.order_by(Job.posting_date.asc())

    jobs = query.all()

    # If any filter is active, silently scrape for new matching jobs in background.
    # The response is returned immediately — the scrape runs alongside it.
    if any([keyword, job_type, location, tag]):
        trigger_background_scrape(
            keyword=keyword or "",
            company="",
            job_type=job_type or "",
            location=location or "",
        )

    return jsonify([job.to_dict() for job in jobs])

@jobs_bp.route("/", methods=["POST"])
def add_job():
    data = request.get_json()
    required_fields = ["title", "company", "location", "posting_date", "job_type"]

    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    try:
        # Normalise tags: accept either a list ["a","b"] or a comma string "a,b"
        raw_tags = data.get("tags", "")
        if isinstance(raw_tags, list):
            tags_str = ",".join(raw_tags)
        else:
            tags_str = raw_tags

        job = Job(
            title=data["title"],
            company=data["company"],
            location=data["location"],
            posting_date=datetime.strptime(data["posting_date"], "%Y-%m-%d"),
            job_type=data["job_type"],
            tags=tags_str,
        )
        db.session.add(job)
        db.session.commit()
        return jsonify(job.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@jobs_bp.route("/<int:job_id>", methods=["PUT", "PATCH"])
def update_job(job_id):
    job = db.session.get(Job, job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    data = request.get_json()
    for field in ["title", "company", "location", "posting_date", "job_type", "tags"]:
        if field in data:
            if field == "tags":
                # Normalise tags: accept either a list or a comma string
                raw = data[field]
                setattr(job, field, ",".join(raw) if isinstance(raw, list) else raw)
            elif field == "posting_date":
                setattr(job, field, datetime.strptime(data[field], "%Y-%m-%d"))
            else:
                setattr(job, field, data[field])

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

    # Fetch and return sorted jobs after updating
    sort = request.args.get("sort", "posting_date_desc")
    query = Job.query.order_by(Job.posting_date.desc() if sort == "posting_date_desc" else Job.posting_date.asc())
    jobs = query.all()
    return jsonify([job.to_dict() for job in jobs])

@jobs_bp.route("/<int:job_id>", methods=["DELETE"])
def delete_job(job_id):
    job = db.session.get(Job, job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    db.session.delete(job)
    db.session.commit()
    # 204 No Content must not include a response body
    return "", 204
