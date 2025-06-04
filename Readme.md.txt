# Job_Board

## Overview
Job_Board is a project designed to scrape job postings, process them on the backend, and provide a frontend interface for users to view and interact with the data.

---

## Setup and Run Instructions

### Backend
1. **Navigate to the backend directory**:
   cd backend
   ```

2. **Install dependencies**:
   npm install
   ```

3. **Set up environment variables**:
   - Create a `.env` file in the `backend` directory.
   - Add the required variables (e.g., database connection strings, API keys).

4. **Run the backend server**:
   npm start
   ```
   The backend will be available at `http://localhost:5000` 
   ---

### Scraper
1. **Navigate to the scraper directory**:
   cd scraper
   ```

2. **Install dependencies**:
   pip install -r requirements.txt
   ```

3. **Run the scraper**:
   python scraper.py
   ```
   The scraper will fetch job postings and store them in the backend's database.

---

### Frontend
Since the frontend is not fully added to GitHub (only the `src` folder is available), follow these steps:

1. **Create a new React project**:
   npx create-react-app frontend
   ```

2. **Replace the `src` folder**:
   - Delete the `src` folder in the newly created `frontend` directory.
   - Copy the provided `src` folder into the `frontend` directory.

3. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

4. **Run the frontend**:
   ```bash
   npm start
   ```

   The frontend will be available at `http://localhost:3000`.

---

## Assumptions and Shortcuts
- The backend and scraper are assumed to use Node.js and Python, respectively.
- The database connection and API keys are configured via environment variables.
- The frontend `src` folder contains all necessary components and logic to run the application.

---

## Project Structure
```
Job_Board/
├── backend/       # Backend server code
├── scraper/       # Scraper scripts
├── src/           # Frontend source code (to be integrated into a React project)
└── README.md      # Documentation
```

---

## Technology Decisions
- **Backend**: Node.js with Express for scalability and ease of development.
- **Scraper**: Python for its rich ecosystem of libraries like `BeautifulSoup` and `requests`.
- **Frontend**: React for its component-based architecture and ease of integration with APIs.
- **Database**: Assumed to be a relational database (e.g., PostgreSQL) for structured job data storage.


## video link of the explaination
https://vimeo.com/1090204274/2197e99a32?share=copy
