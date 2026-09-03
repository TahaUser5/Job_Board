# Job Board

A full-stack job board that scrapes live listings, stores them in PostgreSQL, and serves them through a Flask API to a React frontend — with search, filtering, sorting, and full CRUD on job postings.

## Features

- 🔍 **Search & filter** jobs by keyword, job type, location, and tags
- ↕️ **Sort** by posting date (newest/oldest first)
- 📝 **Full CRUD** — post, edit, and delete job listings from the UI
- 🔄 **Live background scraping** — browsing with a filter applied silently triggers a fresh scrape of matching listings, so results stay current without blocking the page
- 📄 **Pagination** (40 jobs per page) and a light/dark theme toggle
- 🩺 **Health check endpoint** to verify the API and database connection

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19, React Router, Axios |
| Backend    | Flask, Flask-SQLAlchemy, Flask-CORS |
| Database   | PostgreSQL |
| Scraper    | Selenium, BeautifulSoup, webdriver-manager |

## Project Structure

```
Job_Board/
├── backend/
│   ├── app.py                  # Flask app entrypoint
│   ├── routes.py                # /api/jobs endpoints (blueprint)
│   ├── models.py                # SQLAlchemy Job model
│   ├── init_db.py               # Creates database tables
│   ├── scrape.py                # One-off scraper (run manually)
│   ├── background_scraper.py    # Triggered automatically on filtered searches
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   └── components/
│   │       ├── JobList.js
│   │       ├── JobForm.js
│   │       └── FilterBar.js
│   └── package.json
├── setup.sql                    # Initial PostgreSQL setup
└── README.md
```

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL 13+
- Google Chrome (the scraper drives headless Chrome via Selenium)

## Getting Started

### 1. Set up the database

```bash
psql -U postgres -f setup.sql
```

This creates the `jobboard` database. **Open `setup.sql` first and change the default password** before running it anywhere outside your own machine.

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
DATABASE_URL=postgresql://postgres:<your-password>@localhost:5432/jobboard
FLASK_DEBUG=true
```

Create the tables, then start the API:

```bash
python init_db.py
python app.py
```

The API runs at `http://localhost:5000`.

### 3. Frontend

The `frontend/` folder is a complete, ready-to-run React app — no scaffolding needed.

```bash
cd frontend
npm install
npm start
```

The app runs at `http://localhost:3000`. It talks to the API via `REACT_APP_API_URL` (defaults to `http://localhost:5000` if unset).

### 4. Load some jobs

The frontend triggers background scrapes automatically once you apply a filter, but to populate the database immediately, run the scraper directly:

```bash
cd backend
python scrape.py
```

This scrapes listings from [actuarylist.com](https://www.actuarylist.com) and inserts new (deduplicated) jobs into PostgreSQL.

## API Reference

All routes are prefixed with `/api/jobs`.

| Method | Route         | Description |
|--------|---------------|--------------|
| GET    | `/`           | List jobs. Supports `keyword`, `job_type`, `location`, `tag`, and `sort` (`posting_date_desc` / `posting_date_asc`) query params |
| POST   | `/`           | Create a job — requires `title`, `company`, `location`, `posting_date`, `job_type` |
| PUT/PATCH | `/<id>`    | Update a job |
| DELETE | `/<id>`       | Delete a job |
| GET    | `/health`     | Health check |

A top-level `/health` route also confirms the database connection is reachable.

## Environment Variables

| Variable | Used by | Description |
|----------|---------|--------------|
| `DATABASE_URL` | backend | PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/jobboard` |
| `FLASK_DEBUG` | backend | Set to `true` for Flask's debug mode (defaults to off) |
| `REACT_APP_API_URL` | frontend | Overrides the API base URL if the backend isn't on `localhost:5000` |

## Notes

- The scraper is currently scoped to a single source (actuarylist.com), so listings will lean toward actuarial/finance roles. Point `scrape.py` at a different site's selectors to broaden it.
- Background scrapes are throttled to once per unique filter combination every 5 minutes, so rapid re-filtering won't hammer the source site.
- `.env` files and `node_modules/` are already git-ignored — never commit real credentials.

## Demo

A walkthrough video is available here: [vimeo.com/1090204274](https://vimeo.com/1090204274/2197e99a32?share=copy)
