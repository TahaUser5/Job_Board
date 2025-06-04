import React from 'react';

// Add props for CRUD actions
function JobList({ jobs, onEdit, onDelete }) {
  return (
    <div className="row">
      {jobs.length > 0 ? (
        jobs.map((job) => (
          <div key={job.id} className="col-md-4 mb-4">
            <div className="card shadow-sm" style={{ boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", padding: "20px", minHeight: "250px", marginBottom:"20px" }}>
              <div className="card-body">
                <h5 className="card-title">{job.title}</h5>
                <p className="card-text"><strong>Company:</strong> {job.company}</p>
                <p className="card-text"><strong>Location:</strong> {job.location}</p>
                <p className="card-text"><strong>Job Type:</strong> {job.job_type}</p>
                <p className="card-text"><strong>Posting Date:</strong> {job.posting_date}</p>
                <p className="card-text"><strong>Tags:</strong> {Array.isArray(job.tags) ? job.tags.join(", ") : job.tags}</p>
                {/* CRUD Buttons */}
                <div className="mt-3 d-flex justify-content-between">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onEdit && onEdit(job)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => onDelete && onDelete(job.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center">No jobs available</p>
      )}
    </div>
  );
}

export default JobList;
