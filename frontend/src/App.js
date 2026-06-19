import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { BrowserRouter as Router } from 'react-router-dom';
import JobList from './components/JobList';
import JobForm from './components/JobForm';
import FilterBar from './components/FilterBar';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const JOBS_PER_PAGE = 40;

function App() {
  const [theme, setTheme] = useState('light');
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({ job_type: '', location: '', tag: [], keyword: '', sort: '' });
  const [suggestions, setSuggestions] = useState({ job_type: [], location: [], tag: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingJob, setEditingJob] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

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
      .get(`${API_URL}/api/jobs?${params}`)
      .then((res) => {
        if (res.data.length === 0) {
          setError("No jobs found matching the criteria."); // Handle empty response
        } else {
          setError(""); // Clear error if jobs are found
        }
        setJobs(res.data); // Update state with fetched jobs
        setCurrentPage(1); // Reset to page 1 whenever the filtered set changes
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
    axios.get(`${API_URL}/api/jobs`)
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
      axios.delete(`${API_URL}/api/jobs/${jobId}`)
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

  // ---- Pagination derived state ----
  const totalPages = Math.max(1, Math.ceil(jobs.length / JOBS_PER_PAGE));

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * JOBS_PER_PAGE;
    return jobs.slice(start, start + JOBS_PER_PAGE);
  }, [jobs, currentPage]);

  const goToPage = (page) => {
    const clamped = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(clamped);
    const listSection = document.getElementById('job-list-section');
    if (listSection) {
      listSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Builds a compact page-number list with ellipses, e.g. 1 ... 4 5 6 ... 12
  const getPageNumbers = () => {
    const pages = [];
    const windowSize = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - windowSize && i <= currentPage + windowSize)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <Router>
      <div data-theme={theme}>
        {/* Nav bar */}
        <header className="navbar">
          <div className="navbar-inner">
            <div className="navbar-logo">
              <span className="navbar-logo-mark">JB</span>
              Job Board
            </div>
            <div className="navbar-actions">
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button
                className="btn-post-job"
                onClick={() => document.querySelector('.hero-section').scrollIntoView({ behavior: 'smooth' })}
              >
                Post a Job
              </button>
            </div>
          </div>
        </header>

        {/* Hero / Add-Edit form */}
        <div className="hero-section">
          <h1>Find your next role</h1>
          <p className="hero-subtitle">Browse open positions or post a new opportunity below.</p>
          <div className="job-form-card card">
            <JobForm
              suggestions={suggestions}
              onJobAdded={handleJobAdded}
              editingJob={editingJob}
              onJobUpdated={handleJobUpdated}
              onCancelEdit={() => setEditingJob(null)}
            />
          </div>
        </div>

        {/* Filters + sort */}
        <section className="container">
          <div className="filter-bar-wrap">
            <FilterBar
              filters={filters}
              suggestions={suggestions}
              onFilterChange={handleFilterChange}
            />
            <div className="sort-row">
              <label htmlFor="sort-select">Sort by</label>
              <select
                id="sort-select"
                className="sort-select"
                value={filters.sort}
                onChange={handleSortChange}
              >
                <option value="">Default</option>
                <option value="posting_date_desc">Date Posted: Newest First</option>
                <option value="posting_date_asc">Date Posted: Oldest First</option>
              </select>
              <button className="btn-reset" onClick={handleResetFilters}>
                Reset Filters
              </button>
            </div>
          </div>
        </section>

        {/* Job List */}
        <section className="container" id="job-list-section">
          {!loading && !error && jobs.length > 0 && (
            <div className="results-meta">
              <span>{jobs.length} job{jobs.length !== 1 ? 's' : ''} found</span>
              <span>Page {currentPage} of {totalPages}</span>
            </div>
          )}

          {loading ? (
            <div className="job-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="skeleton-card" key={i}>
                  <div className="skeleton-line" style={{ width: '60%' }} />
                  <div className="skeleton-line" style={{ width: '40%' }} />
                  <div className="skeleton-line" style={{ width: '80%' }} />
                  <div className="skeleton-line" style={{ width: '50%' }} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="state-wrap">
              <div className="state-icon">🔍</div>
              <h3>No jobs found</h3>
              <p>{error}</p>
            </div>
          ) : (
            <>
              <JobList jobs={paginatedJobs} onEdit={handleEdit} onDelete={handleDelete} />

              {totalPages > 1 && (
                <nav className="pagination-wrap" aria-label="Job list pagination">
                  <button
                    className="page-btn"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ‹
                  </button>
                  {getPageNumbers().map((p, idx) =>
                    p === '...' ? (
                      <span className="page-ellipsis" key={`ellipsis-${idx}`}>…</span>
                    ) : (
                      <button
                        key={p}
                        className={`page-btn ${p === currentPage ? 'active' : ''}`}
                        onClick={() => goToPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    className="page-btn"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    ›
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </Router>
  );
}

export default App;