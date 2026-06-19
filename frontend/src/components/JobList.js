import React from 'react';

// Formats an ISO date (or whatever the backend sends) into a short readable string
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getTags(job) {
  if (Array.isArray(job.tags)) return job.tags.filter(Boolean);
  if (typeof job.tags === 'string') return job.tags.split(',').map(t => t.trim()).filter(Boolean);
  return [];
}

// Add props for CRUD actions
function JobList({ jobs, onEdit, onDelete }) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="state-wrap">
        <div className="state-icon">📭</div>
        <h3>No jobs available</h3>
        <p>Try adjusting your filters, or post the first job above.</p>
      </div>
    );
  }

  return (
    <div className="job-grid">
      {jobs.map((job) => {
        const tags = getTags(job);
        return (
          <div key={job.id} className="job-card">
            <div className="job-card-top">
              <div>
                <h5 className="job-card-title">{job.title}</h5>
                <p className="job-card-company">{job.company}</p>
              </div>
            </div>

            <div className="job-card-meta">
              <span className="job-card-meta-item">📍 {job.location}</span>
              <span className="job-card-meta-item">💼 {job.job_type}</span>
              <span className="job-card-meta-item">🗓 {formatDate(job.posting_date)}</span>
            </div>

            {tags.length > 0 && (
              <div className="job-card-tags">
                {tags.map((tag, idx) => (
                  <span className="tag-pill" key={idx}>
                    <span className="tag-pill-dot" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="job-card-footer">
              <div className="job-card-actions">
                <button className="btn-icon" onClick={() => onEdit && onEdit(job)}>
                  Edit
                </button>
                <button
                  className="btn-icon btn-icon-danger"
                  onClick={() => onDelete && onDelete(job.id)}
                >
                  Delete
                </button>
              </div>
              <button className="btn-apply-cta">View</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default JobList;