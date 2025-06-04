import React, { useState, useEffect } from 'react';

function FilterBar({ filters = { job_type: '', location: '', tag: '' }, suggestions = { job_type: [], location: [], tag: [] }, onFilterChange }) {
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

  return (
    <div className="mb-4">
      <h2>Filters</h2>
      <div className="form-row">
        <div className="form-group col-md-4">
          <input
            type="text"
            name="job_type"
            className="form-control"
            placeholder="Job Type"
            value={localFilters.job_type || ""}
            onChange={handleChange}
            list="job-type-suggestions"
          />
          <datalist id="job-type-suggestions">
            {(suggestions.job_type || []).map((type, index) => (
              <option key={index} value={type} />
            ))}
          </datalist>
        </div>
        <div className="form-group col-md-4">
          <input
            type="text"
            name="location"
            className="form-control"
            placeholder="Location"
            value={localFilters.location || ""}
            onChange={handleChange}
            list="location-suggestions"
          />
          <datalist id="location-suggestions">
            {(suggestions.location || []).map((loc, index) => (
              <option key={index} value={loc} />
            ))}
          </datalist>
        </div>
        <div className="form-group col-md-4">
          <input
            type="text"
            name="tag"
            className="form-control"
            placeholder="Tag"
            value={localFilters.tag || ""}
            onChange={handleChange}
            list="tag-suggestions"
          />
          <datalist id="tag-suggestions">
            {(suggestions.tag || []).map((tag, index) => (
              <option key={index} value={tag} />
            ))}
          </datalist>
        </div>
      </div>
      <button className="btn btn-success" onClick={handleApplyFilters}>
        Apply Filters
      </button>
    </div>
  );
}

export default FilterBar;
