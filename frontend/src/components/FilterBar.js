import React, { useState, useEffect } from 'react';

function FilterBar({ filters = { job_type: '', location: '', tag: '', keyword: '' }, suggestions = { job_type: [], location: [], tag: [] }, onFilterChange }) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters || {});
  }, [filters]);

  const handleChange = (e) => {
    setLocalFilters({ ...localFilters, [e.target.name]: e.target.value });
  };

  const handleApplyFilters = () => {
    // Only send non-empty filters to parent
    const safeFilters = typeof localFilters === 'object' && localFilters !== null ? localFilters : {};
    const filtered = Object.fromEntries(
      Object.entries(safeFilters).filter(([_, v]) => v !== undefined && v !== null && v !== "")
    );
    // Pass only the entered filters up to parent, which will fetch and display only matching jobs
    onFilterChange(filtered);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleApplyFilters();
    }
  };

  return (
    <>
      <h2>Filter jobs</h2>
      <div className="filter-row">
        <div className="filter-field">
          <input
            type="text"
            name="job_type"
            className="form-control"
            placeholder="Job type"
            value={localFilters.job_type || ""}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            list="filterbar-job-type-suggestions"
          />
          <datalist id="filterbar-job-type-suggestions">
            {(suggestions.job_type || []).map((type, index) => (
              <option key={index} value={type} />
            ))}
          </datalist>
        </div>
        <div className="filter-field">
          <input
            type="text"
            name="location"
            className="form-control"
            placeholder="Location"
            value={localFilters.location || ""}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            list="filterbar-location-suggestions"
          />
          <datalist id="filterbar-location-suggestions">
            {(suggestions.location || []).map((loc, index) => (
              <option key={index} value={loc} />
            ))}
          </datalist>
        </div>
        <div className="filter-field">
          <input
            type="text"
            name="tag"
            className="form-control"
            placeholder="Tag"
            value={localFilters.tag || ""}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            list="filterbar-tag-suggestions"
          />
          <datalist id="filterbar-tag-suggestions">
            {(suggestions.tag || []).map((tag, index) => (
              <option key={index} value={tag} />
            ))}
          </datalist>
        </div>
        <div className="filter-field">
          <input
            type="text"
            name="keyword"
            className="form-control"
            placeholder="Keyword (title, company…)"
            value={localFilters.keyword || ""}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="filter-actions">
          <button className="btn-apply" onClick={handleApplyFilters}>
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}

export default FilterBar;