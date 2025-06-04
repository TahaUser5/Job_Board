import React, { useState, useEffect } from 'react';
import axios from 'axios';

function JobForm({ suggestions, onJobAdded, editingJob, onJobUpdated, onCancelEdit }) {
  const [form, setForm] = useState({
    title: '', // Add title back
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
        title: editingJob.title || '', // Add title back
        company: editingJob.company || '',
        location: editingJob.location || '',
        job_type: editingJob.job_type || '',
        tags: editingJob.tags || '',
        posting_date: editingJob.posting_date || '',
      });
    } else {
      setForm({
        title: '', // Add title back
        company: '',
        location: '',
        job_type: '',
        tags: '',
        posting_date: '',
      });
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

    const payload = {
      ...form,
      tags: Array.isArray(form.tags) ? form.tags.join(',') : form.tags,
    };

    console.log('Payload:', payload); // Log the payload for debugging

    axios
      .put(`http://localhost:5000/api/jobs/${editingJob.id}/`, payload) // <-- add trailing slash
      .then((res) => {
        console.log('Job created:', res.data); // Log the response for debugging
        setSubmitting(false);
        setForm({
          title: '', // Add title back
          company: '',
          location: '',
          job_type: '',
          tags: '',
          posting_date: '',
        });
        onJobAdded && onJobAdded();
      })
      .catch((err) => {
        console.error('Error adding job:', err); // Log the error for debugging
        setError('Error adding job');
        setSubmitting(false);
      });
  };

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h4>{editingJob ? 'Edit Job' : 'Add Job'}</h4>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group col-md-6">
              <input
                type="text"
                name="title"
                className="form-control"
                placeholder="Title"
                value={form.title}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
            <div className="form-group col-md-6">
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
            <div className="form-group col-md-6">
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
            <div className="form-group col-md-6">
              <input
                type="text"
                name="job_type"
                className="form-control"
                placeholder="Job Type"
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
            <div className="form-group col-md-6">
              <input
                type="text"
                name="tags"
                className="form-control"
                placeholder="Tag"
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
            <div className="form-group col-md-6">
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
          {error && <div className="alert alert-danger">{error}</div>}
          <button className="btn btn-success me-2" type="submit" disabled={submitting}>
            {editingJob ? 'Update Job' : 'Add Job'}
          </button>
          {editingJob && (
            <button className="btn btn-secondary" type="button" onClick={onCancelEdit} disabled={submitting}>
              Cancel
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default JobForm;
