import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function JobForm({ suggestions, onJobAdded, editingJob, onJobUpdated, onCancelEdit }) {
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    job_type: '',
    tags: '',
    posting_date: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Prefill form when editing
  useEffect(() => {
    if (editingJob) {
      setForm({
        title: editingJob.title || '',
        company: editingJob.company || '',
        location: editingJob.location || '',
        job_type: editingJob.job_type || '',
        // Normalise to comma-string for the text input
        tags: Array.isArray(editingJob.tags)
          ? editingJob.tags.join(', ')
          : (editingJob.tags || ''),
        posting_date: editingJob.posting_date || '',
      });
    } else {
      setForm({ title: '', company: '', location: '', job_type: '', tags: '', posting_date: '' });
    }
  }, [editingJob]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Validation
    if (!form.title || !form.company || !form.location || !form.job_type || !form.posting_date) {
      setError('All fields are required.');
      setSubmitting(false);
      return;
    }

    // Tags are stored as a comma-string in the input; send as plain string to backend
    const payload = { ...form };

    console.log('Payload:', payload); // Log the payload for debugging

    const request = editingJob
      ? axios.put(`${API_URL}/api/jobs/${editingJob.id}/`, payload)
      : axios.post(`${API_URL}/api/jobs/`, payload);

    request
      .then((res) => {
        console.log(editingJob ? 'Job updated:' : 'Job created:', res.data);
        setSubmitting(false);
        setForm({
          title: '',
          company: '',
          location: '',
          job_type: '',
          tags: '',
          posting_date: '',
        });
        if (editingJob) {
          onJobUpdated && onJobUpdated(res.data);
        } else {
          onJobAdded && onJobAdded();
        }
      })
      .catch((err) => {
        console.error('Error saving job:', err);
        setError(editingJob ? 'Error updating job' : 'Error adding job');
        setSubmitting(false);
      });
  };

  return (
    <>
      <h4>{editingJob ? 'Edit Job' : 'Post a Job'}</h4>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <input
              type="text"
              name="title"
              className="form-control"
              placeholder="Job title"
              value={form.title}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              name="company"
              className="form-control"
              placeholder="Company"
              value={form.company}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <input
              type="text"
              name="location"
              className="form-control"
              placeholder="Location"
              value={form.location}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              name="job_type"
              className="form-control"
              placeholder="Job type (e.g. Full-time)"
              value={form.job_type || ""}
              onChange={handleChange}
              list="job-type-suggestions"
              disabled={submitting}
            />
            <datalist id="job-type-suggestions">
              {(suggestions.job_type || []).map((type, idx) => (
                <option key={idx} value={type} />
              ))}
            </datalist>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <input
              type="text"
              name="tags"
              className="form-control"
              placeholder="Tags (comma-separated)"
              value={form.tags || ""}
              onChange={handleChange}
              list="tag-suggestions"
              disabled={submitting}
            />
            <datalist id="tag-suggestions">
              {(suggestions.tag || []).map((tag, idx) => (
                <option key={idx} value={tag} />
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <input
              type="date"
              name="posting_date"
              className="form-control"
              value={form.posting_date}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>
        </div>
        {error && <div className="alert-danger">{error}</div>}
        <button className="btn-success" type="submit" disabled={submitting}>
          {editingJob ? 'Update Job' : 'Add Job'}
        </button>
        {editingJob && (
          <button className="btn-secondary" type="button" onClick={onCancelEdit} disabled={submitting}>
            Cancel
          </button>
        )}
      </form>
    </>
  );
}

export default JobForm;