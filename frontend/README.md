# Job Board

A full-stack job board application designed to help job seekers find opportunities and employers post openings. Features a dynamic React frontend and a robust Python/Flask backend backed by PostgreSQL.

## Features

- **Dynamic UI/UX**: Clean, modern interface with Light/Dark mode.
- **Job Listings**: View open positions with company, location, and tags.
- **Search & Filter**: Find jobs by keyword, location, type, and tags.
- **Pagination**: Browse results easily with server/client pagination.
- **Auto-Scraping**: Silently scrapes actuarylist.com in the background when specific filters are applied to stay up-to-date.
- **Post Jobs**: Integrated form to securely post new jobs to the database.

## Tech Stack

- **Frontend**: React.js, CSS variables (Custom Themes), Axios
- **Backend**: Python, Flask, SQLAlchemy, Psycopg2, Selenium (for scraping)
- **Database**: PostgreSQL 17

## Getting Started

### Prerequisites
- Node.js (v16+)
- Python (3.10+)
- PostgreSQL (running on port 5432)

### Backend Setup
1. Open terminal in the `backend/` directory.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/Scripts/activate # Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and fill in your database credentials.
5. Run the server:
   ```bash
   python app.py
   ```

### Frontend Setup
1. Open a new terminal in the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.
