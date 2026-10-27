
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const statuses = [
  "Interested",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saved, setSaved] = useState(() =>
    readStorage("jobpilot-saved", [])
  );
  const [applications, setApplications] = useState(() =>
    readStorage("jobpilot-applications", {})
  );

  const [page, setPage] = useState("Dashboard");
  const [selectedJob, setSelectedJob] = useState(null);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All locations");
  const [source, setSource] = useState("All sources");
  const [statusFilter, setStatusFilter] = useState("All statuses");

  // Load live job listings from the Google Apps Script JSONP endpoint.
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_JOBS_API_URL;

    if (!apiUrl) {
      setLoadError("Google Sheets API URL is missing. Check .env.local.");
      setLoading(false);
      return undefined;
    }

    let active = true;
    let timeoutId;
    const callbackName = `jobPilotCallback_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    const script = document.createElement("script");

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      script.remove();
      try {
        delete window[callbackName];
      } catch {
        window[callbackName] = undefined;
      }
    };

    timeoutId = window.setTimeout(() => {
      if (active) {
        setLoadError("Loading timed out. Check the Google Sheets API connection.");
        setLoading(false);
      }
      cleanup();
    }, 15000);

    window[callbackName] = (data) => {
      if (!active) return;

      if (!Array.isArray(data)) {
        setLoadError(data?.error || "The API returned unexpected data.");
        setLoading(false);
        cleanup();
        return;
      }

      const mappedJobs = data
        .filter((row) => row.Role && row.Company)
        .map((row) => {
          const url = row.Job_URL || "";
          const match = url.match(/\/jobs\/view\/(\d+)/);

          return {
            id: match?.[1] || url || `${row.Role}-${row.Company}`,
            role: row.Role || "",
            company: row.Company || "",
            location: row.Location || "",
            pay: row.Pay || "",
            source: "LinkedIn",
            url,
          };
        });

      setJobs(mappedJobs);
      setLoadError("");
      setLoading(false);
      cleanup();
    };

    script.onerror = () => {
      if (active) {
        setLoadError("Could not connect to Google Sheets. Check the Apps Script URL and deployment.");
        setLoading(false);
      }
      cleanup();
    };

    script.src = `${apiUrl}${apiUrl.includes("?") ? "&" : "?"}callback=${callbackName}`;
    document.body.appendChild(script);

    return () => {
      active = false;
      cleanup();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("jobpilot-saved", JSON.stringify(saved));
  }, [saved]);

  useEffect(() => {
    localStorage.setItem(
      "jobpilot-applications",
      JSON.stringify(applications)
    );
  }, [applications]);

  const updateStatus = (jobId, status) => {
    setApplications((previous) => ({
      ...previous,
      [jobId]: {
        ...previous[jobId],
        status,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const updateNotes = (jobId, notes) => {
    setApplications((previous) => ({
      ...previous,
      [jobId]: {
        ...previous[jobId],
        notes,
      },
    }));
  };

  const toggleSaved = (jobId) => {
    setSaved((previous) =>
      previous.includes(jobId)
        ? previous.filter((id) => id !== jobId)
        : [...previous, jobId]
    );
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const term = search.trim().toLowerCase();
      const appStatus = applications[job.id]?.status || "Interested";

      const matchesSearch =
        job.role.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term);

      const matchesLocation =
        location === "All locations" ||
        job.location.toLowerCase().includes(location.toLowerCase());

      const matchesSource =
        source === "All sources" || job.source === source;

      const matchesStatus =
        statusFilter === "All statuses" ||
        appStatus === statusFilter;

      const matchesPage =
        page === "Saved Jobs"
          ? saved.includes(job.id)
          : page === "Applications"
            ? Boolean(applications[job.id]?.status)
            : true;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesSource &&
        matchesStatus &&
        matchesPage
      );
    });
  }, [
    jobs,
    search,
    location,
    source,
    statusFilter,
    page,
    saved,
    applications,
  ]);

  const appliedCount = jobs.filter(
    (job) => applications[job.id]?.status === "Applied"
  ).length;

  const interviewCount = jobs.filter(
    (job) => applications[job.id]?.status === "Interview"
  ).length;

  const offerCount = jobs.filter(
    (job) => applications[job.id]?.status === "Offer"
  ).length;

  const showPage = (nextPage) => {
    setPage(nextPage);
    setSearch("");
    setLocation("All locations");
    setSource("All sources");
    setStatusFilter("All statuses");
    setSelectedJob(null);
  };

  const openStatusList = (status) => {
    setPage("Applications");
    setStatusFilter(status);
    setSearch("");
    setLocation("All locations");
    setSource("All sources");
    setSelectedJob(null);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <button
          className="brand brand-button"
          onClick={() => showPage("Dashboard")}
        >
          <span className="brand-icon">J</span>
          <span>JobPilot</span>
        </button>

        <p className="menu-label">WORKSPACE</p>

        {[
          ["Dashboard", "▦"],
          ["Job Explorer", "⌕"],
          ["Saved Jobs", "♡"],
          ["Applications", "✓"],
        ].map(([name, icon]) => (
          <button
            key={name}
            className={`nav-item ${page === name ? "active" : ""}`}
            onClick={() => showPage(name)}
          >
            <span>{icon}</span> {name}
            {name === "Saved Jobs" && saved.length > 0 && (
              <span className="nav-count">{saved.length}</span>
            )}
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="avatar">J</div>
          <div>
            <strong>Job Seeker</strong>
            <p>Personal workspace</p>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <span>Workspace / {page}</span>
          <span className="live">
            <span /> Local dashboard
          </span>
        </header>

        <section className="welcome">
          <p className="eyebrow">YOUR CAREER, ORGANIZED</p>
          <h1>
            {page === "Dashboard"
              ? "Find your next opportunity."
              : page === "Job Explorer"
                ? "Explore opportunities."
                : page === "Saved Jobs"
                  ? "Your saved jobs."
                  : "Track your applications."}
          </h1>
          <p className="subtitle">
            Organize your job search and keep track of every opportunity.
          </p>
        </section>

        {page === "Dashboard" && (
          <section className="stats">
            {[
              ["Total jobs", jobs.length, "Job listings", () => showPage("Job Explorer")],
              ["Saved jobs", saved.length, "Your bookmarks", () => showPage("Saved Jobs")],
              ["Applied", appliedCount, "Applications submitted", () => openStatusList("Applied")],
              ["Interviews", interviewCount, "Interview-stage jobs", () => openStatusList("Interview")],
            ].map(([label, count, description, action]) => (
              <button
                className="stat-card stat-button"
                key={label}
                onClick={action}
              >
                <p>{label}</p>
                <h2>{count}</h2>
                <span>{description} ↗</span>
              </button>
            ))}
          </section>
        )}

        {page === "Dashboard" && (
          <section className="quick-actions">
            <div>
              <h2>Quick actions</h2>
              <p>Choose what you want to do next.</p>
            </div>
            <button className="primary-button" onClick={() => showPage("Job Explorer")}>
              Explore jobs
            </button>
            <button className="secondary-button" onClick={() => showPage("Applications")}>
              Update applications
            </button>
          </section>
        )}

        <section className="jobs-section">
          {loading && (
            <p className="loading-message">Loading jobs from Google Sheets...</p>
          )}

          {loadError && (
            <p className="error-message" role="alert">{loadError}</p>
          )}

          <div className="section-heading">
            <div>
              <h2>
                {page === "Dashboard"
                  ? "Latest job opportunities"
                  : page === "Job Explorer"
                    ? "All job opportunities"
                    : page}
              </h2>
              <p>
                {page === "Saved Jobs"
                  ? "Your bookmarked listings."
                  : page === "Applications"
                    ? "Update status and review your progress."
                    : "Search, filter, save, and explore job listings."}
              </p>
            </div>
            <span className="job-count">{filteredJobs.length} jobs</span>
          </div>

          <div className="filters">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search role, company, or location..."
              aria-label="Search jobs"
            />

            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              aria-label="Filter by location"
            >
              <option>All locations</option>
              {[...new Set(jobs.map((job) => job.location))].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <select
              value={source}
              onChange={(event) => setSource(event.target.value)}
              aria-label="Filter by source"
            >
              <option>All sources</option>
              {[...new Set(jobs.map((job) => job.source))].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            {page === "Applications" && (
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by application status"
              >
                <option>All statuses</option>
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            )}
          </div>

          <div className="job-list">
            {filteredJobs.map((job) => {
              const isSaved = saved.includes(job.id);
              const status = applications[job.id]?.status || "Interested";

              return (
                <article className="job-card" key={job.id}>
                  <button
                    className="company-logo logo-button"
                    onClick={() => setSelectedJob(job)}
                    aria-label={`View ${job.role} details`}
                  >
                    {job.company.charAt(0)}
                  </button>

                  <button
                    className="job-details job-title-button"
                    onClick={() => setSelectedJob(job)}
                  >
                    <h3>{job.role}</h3>
                    <p className="company">{job.company}</p>
                    <div className="job-meta">
                      <span>⌖ {job.location}</span>
                      <span>Pay: {job.pay || "Not specified"}</span>
                      <span>{job.source}</span>
                    </div>
                  </button>

                  <div className="job-actions">
                    <button
                      className={`save-button ${isSaved ? "saved" : ""}`}
                      onClick={() => toggleSaved(job.id)}
                      aria-label={isSaved ? "Remove saved job" : "Save job"}
                      title={isSaved ? "Remove bookmark" : "Save job"}
                    >
                      {isSaved ? "♥ Saved" : "♡ Save"}
                    </button>

                    <select
                      className="status-select"
                      value={status}
                      onChange={(event) => updateStatus(job.id, event.target.value)}
                      aria-label={`Status for ${job.role}`}
                    >
                      {statuses.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>

                    <a
                      className="apply-button"
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View job ↗
                    </a>
                  </div>
                </article>
              );
            })}

            {filteredJobs.length === 0 && (
              <div className="empty-state">
                <h3>No jobs found</h3>
                <p>Try changing your search or filters.</p>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setSearch("");
                    setLocation("All locations");
                    setSource("All sources");
                    setStatusFilter("All statuses");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>

        <footer>
          JobPilot · Smart Job Application Tracker
        </footer>
      </main>

      {selectedJob && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedJob(null)}
          role="presentation"
        >
          <section
            className="job-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedJob(null)}
              aria-label="Close job details"
            >
              ×
            </button>

            <p className="eyebrow">JOB DETAILS</p>
            <h2 id="job-modal-title">{selectedJob.role}</h2>
            <p className="company">{selectedJob.company}</p>

            <div className="detail-grid">
              <div>
                <span>Location</span>
                <strong>{selectedJob.location}</strong>
              </div>
              <div>
                <span>Pay</span>
                <strong>{selectedJob.pay || "Not specified"}</strong>
              </div>
              <div>
                <span>Source</span>
                <strong>{selectedJob.source}</strong>
              </div>
              <div>
                <span>Application status</span>
                <strong>{applications[selectedJob.id]?.status || "Interested"}</strong>
              </div>
            </div>

            <label className="notes-label" htmlFor="job-notes">
              Your notes
            </label>
            <textarea
              id="job-notes"
              rows={4}
              value={applications[selectedJob.id]?.notes || ""}
              onChange={(event) => updateNotes(selectedJob.id, event.target.value)}
              placeholder="Add interview dates, recruiter details, or reminders..."
            />

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => toggleSaved(selectedJob.id)}
              >
                {saved.includes(selectedJob.id) ? "♥ Saved" : "♡ Save job"}
              </button>
              <a
                className="apply-button"
                href={selectedJob.url}
                target="_blank"
                rel="noreferrer"
              >
                Open original listing ↗
              </a>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
