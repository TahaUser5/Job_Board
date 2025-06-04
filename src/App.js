import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router } from 'react-router-dom';
import JobList from './components/JobList';
import JobForm from './components/JobForm';
import FilterBar from './components/FilterBar';
import './App.css';

function App() {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({ job_type: '', location: '', tag: [], keyword: '', sort: '' });
  const [suggestions, setSuggestions] = useState({ job_type: [], location: [], tag: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingJob, setEditingJob] = useState(null);

  // Fetch jobs from backend
  const fetchJobs = () => {
    setLoading(true);
    setError("");
    const paramsObj = {
      ...filters,
      tag: Array.isArray(filters.tag) ? filters.tag.join(",") : filters.tag,
    };
    const cleanedParams = Object.fromEntries(
      Object.entries(paramsObj).filter(
        ([_, v]) =>
          v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
      )
    );
    const params = new URLSearchParams(cleanedParams).toString();

    axios
      .get(`http://localhost:5000/api/jobs?${params}`)
      .then((res) => {
        if (res.data.length === 0) {
          setError("No jobs found matching the criteria."); // Handle empty response
        } else {
          setError(""); // Clear error if jobs are found
        }
        setJobs(res.data); // Update state with fetched jobs
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching jobs:", err); // Log error for debugging
        setError("Error fetching jobs. Please check the backend server.");
        setLoading(false);
      });
  };

  // Fetch suggestions for filters
  const fetchSuggestions = () => {
    axios.get(`http://localhost:5000/api/jobs`)
      .then((res) => {
        const allJobs = res.data;
        const jobTypes = [...new Set(allJobs.map(job => job.job_type))];
        const locations = [...new Set(allJobs.map(job => job.location))];
        const tags = [
          ...new Set(
            allJobs.flatMap(job =>
              typeof job.tags === "string"
                ? job.tags.split(",").map(t => t.trim())
                : Array.isArray(job.tags)
                ? job.tags
                : []
            )
          ),
        ];
        setSuggestions({ job_type: jobTypes, location: locations, tag: tags });
      })
      .catch((err) => {
        console.error("Error fetching suggestions:", err); // Log error for debugging
      });
  };

  useEffect(() => {
    fetchJobs();
    fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // CRUD: Add Job
  const handleJobAdded = () => {
    fetchJobs(); // Refetch jobs after adding a new job
    fetchSuggestions(); // Refetch suggestions for filters
  };

  // CRUD: Edit Job
  const handleEdit = (job) => {
    setEditingJob({
      ...job,
      tags: typeof job.tags === "string"
        ? job.tags.split(",").map(t => t.trim()).filter(Boolean)
        : Array.isArray(job.tags)
        ? job.tags
        : [],
    });

    // Scroll to the "Add Job" section
    document.querySelector('.hero-section').scrollIntoView({ behavior: 'smooth' });
  };

  // CRUD: Update Job (called after successful edit)
  const handleJobUpdated = (updatedJob) => {
    setEditingJob(null);
    fetchJobs(); // Refetch jobs after updating a job
    fetchSuggestions(); // Refetch suggestions for filters
  };

  // CRUD: Delete Job
  const handleDelete = (jobId) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      axios.delete(`http://localhost:5000/api/jobs/${jobId}`)
        .then(() => {
          fetchJobs();
          fetchSuggestions();
        })
        .catch((err) => {
          console.error("Error deleting job:", err); // Log error for debugging
          alert("Error deleting job. Please try again later.");
        });
    }
  };

  // Filtering and Sorting handlers
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters })); // Update filters dynamically
  };

  // Sort handler
  const handleSortChange = (e) => {
    setFilters(prev => ({ ...prev, sort: e.target.value }));
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({ job_type: '', location: '', tag: [], keyword: '', sort: '' });
  };

  return (
    <Router>
      <div>
        <div className='hero-section'>
          <div style={{ position: "absolute", top: "20px", left: "20px", fontSize: "1.5rem", fontWeight: "bold" }}>
            Job Board
          </div>
          {/* Add/Edit Job Form */}
          <section className="container" style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <JobForm
              suggestions={suggestions}
              onJobAdded={handleJobAdded}
              editingJob={editingJob}
              onJobUpdated={handleJobUpdated}
              onCancelEdit={() => setEditingJob(null)}
            />
          </section>
        </div>
        {/* FilterBar with dropdowns and multi-select for tags */}
        <section className="container">
          <FilterBar
            filters={filters}
            suggestions={suggestions}
            onFilterChange={handleFilterChange}
          />
          {/* Sorting */}
          <div className="mb-3" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px" }}>
            <label htmlFor="sort-select" style={{ fontWeight: "bold", fontSize: "1rem", color: "#333" }}>Sort By:</label>
            <select
              id="sort-select"
              className="form-select"
              style={{ width: "200px", borderRadius: "30px", padding: "10px", border: "1px solid #ddd" }}
              value={filters.sort}
              onChange={handleSortChange}
            >
              <option value="">Select</option>
              <option value="posting_date_desc">Date Posted: Newest First</option>
              <option value="posting_date_asc">Date Posted: Oldest First</option>
            </select>
            <button
              className="btn btn-secondary"
              style={{ borderRadius: "30px", padding: "10px 20px" }}
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>
        </section>
        {/* Job List */}
        <section className="container" >
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <JobList jobs={jobs} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </section>
      </div>
    </Router>
  );
}

export default App;
