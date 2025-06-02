from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import psycopg2
from datetime import datetime, timedelta
import time
import re
from bs4 import BeautifulSoup

# Database configuration for PostgreSQL connection
DB_CONFIG = {
    "dbname": "jobboard",
    "user": "postgres",
    "password": "70126633",
    "host": "localhost",
    "port": "5432"
}

def get_db_connection():
    # Establish connection to the database
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("Successfully connected to PostgreSQL database.")
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to PostgreSQL database: {e}")
        return None

def parse_posting_date(date_str_raw):
    # Parse various posting date formats into a date object
    date_str = date_str_raw.lower().replace('posted', '').strip()
    now = datetime.now()

    if not date_str:
        print(f"Warning: Empty posting date string received ('{date_str_raw}'). Returning None.")
        return None

    # Handle relative date formats like "today", "yesterday", "xh ago", etc.
    if "today" in date_str or "0 days ago" in date_str:
        return now.date()
    elif "yesterday" in date_str or "1 day ago" in date_str:
        return (now - timedelta(days=1)).date()

    hours_ago_match = re.match(r'(\d+)\s*h(ours?)?\s*ago', date_str)
    if hours_ago_match:
        hours = int(hours_ago_match.group(1))
        return (now - timedelta(hours=hours)).date()

    days_ago_match = re.match(r'(\d+)\s*d(ays?)?\s*ago', date_str)
    if days_ago_match:
        days = int(days_ago_match.group(1))
        return (now - timedelta(days=days)).date()

    months_ago_match = re.match(r'(\d+)\s*mo(nths?)?\s*ago', date_str)
    if months_ago_match:
        months = int(months_ago_match.group(1))
        return (now - timedelta(days=months * 30)).date()

    # Handle "on Month Day" format
    on_date_match = re.match(r'on\s+([a-z]{3,})\s+(\d+)(?:st|nd|rd|th)?', date_str)
    if on_date_match:
        month_name_str = on_date_match.group(1)
        day = int(on_date_match.group(2))
        try:
            month_format = "%b" if len(month_name_str) == 3 else "%B"
            month = datetime.strptime(month_name_str, month_format).month
            parsed_date = datetime(now.year, month, day).date()
            if parsed_date > now.date():
                parsed_date = datetime(now.year - 1, month, day).date()
            return parsed_date
        except ValueError as e:
            print(f"Warning: Could not parse 'on Month Day' format: '{date_str_raw}' due to {e}. Returning None.")
            return None

    # Fallback for direct date formats
    try:
        return datetime.strptime(date_str_raw, "%b %d, %Y").date()
    except ValueError:
        pass

    print(f"Warning: Could not parse posting date string: '{date_str_raw}'. Returning None.")
    return None

def infer_job_type(tags_list, title):
    # Infer job type based on tags or title
    tags_lower = [tag.lower() for tag in tags_list]
    title_lower = title.lower()

    if "intern" in tags_lower or "internship" in tags_lower or \
       "intern" in title_lower or "internship" in title_lower:
        return "Internship"
    if "contract" in tags_lower or "contractor" in tags_lower:
        return "Contract"
    if "part-time" in tags_lower or "part time" in tags_lower:
        return "Part-Time"
    if "permanent" in tags_lower:
        return "Full-Time"
    return "Full-Time"

def check_if_job_exists(cursor, title, company, posting_date_obj):
    # Check if a job with the same title, company, and posting date already exists
    query = """
    SELECT id FROM public.jobs
    WHERE title = %s AND company = %s AND posting_date = %s;
    """
    try:
        cursor.execute(query, (title, company, posting_date_obj))
        return cursor.fetchone() is not None
    except psycopg2.Error as e:
        print(f"Error checking if job exists: {e}")
        return False

def insert_job_data(conn, job_data):
    # Insert job data into the database
    if not all([job_data.get('title'), job_data.get('company'), job_data.get('location'), job_data.get('posting_date')]):
        print(f"Skipping job due to missing required fields (title, company, location, or posting_date): {job_data.get('title')}")
        return False

    insert_query = """
    INSERT INTO public.jobs (title, company, location, posting_date, job_type, tags)
    VALUES (%s, %s, %s, %s, %s, %s);
    """
    try:
        with conn.cursor() as cursor:
            if check_if_job_exists(cursor, job_data['title'], job_data['company'], job_data['posting_date']):
                print(f"Duplicate job found, skipping: {job_data['title']} at {job_data['company']}")
                return False

            cursor.execute(insert_query, (
                job_data['title'],
                job_data['company'],
                job_data['location'],
                job_data['posting_date'],
                job_data.get('job_type'),
                job_data.get('tags_str')
            ))
        conn.commit()
        print(f"Successfully inserted: {job_data['title']} at {job_data['company']}")
        return True
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error inserting job data for '{job_data.get('title')}': {e}")
        return False
    except Exception as e:
        conn.rollback()
        print(f"An unexpected error occurred during insertion for '{job_data.get('title')}': {e}")
        return False

def scrape_actuary_list_to_db():
    """
    Scrapes job listings from Actuary List and saves them to the database.
    """
    print("Starting Actuary List scraper for pages 1–6, then optional manual input.")

    db_conn = get_db_connection()
    if not db_conn:
        print("Halting scraper due to database connection failure.")
        return

    try:
        service = ChromeService(ChromeDriverManager().install())
        options = webdriver.ChromeOptions()
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1280,1024")
        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        driver = webdriver.Chrome(service=service, options=options)
        print("WebDriver initialized.")
    except Exception as e:
        print(f"Error initializing WebDriver: {e}")
        db_conn.close()
        return

    def scrape_page(page_number):
        # Scrape a single page of job listings
        page_url = f"https://www.actuarylist.com?page={page_number}"
        print(f"\nScraping Page {page_number}: {page_url}")
        try:
            driver.get(page_url)
            time.sleep(3)
            html_source = driver.page_source
            soup = BeautifulSoup(html_source, "html.parser")
            job_cards = soup.select("div.Job_job-card__YgDAV")
            print(f"Found {len(job_cards)} job cards on page {page_number}.")

            for card in job_cards:
                try:
                    title_tag = card.select_one("p.Job_job-card__position__ic1rc")
                    title = title_tag.get_text(strip=True) if title_tag else None

                    company_tag = card.select_one("p.Job_job-card__company__7T9qY")
                    company = company_tag.get_text(strip=True) if company_tag else None

                    location_tag = card.select_one("a.Job_job-card__location__bq7jX")
                    location = location_tag.get_text(strip=True) if location_tag else None

                    posting_date_tag = card.select_one("p.Job_job-card__posted-on__NCZaJ")
                    posting_date_raw = posting_date_tag.get_text(strip=True) if posting_date_tag else None
                    posting_date = parse_posting_date(posting_date_raw)

                    tag_links = card.select("div.Job_job-card__tags__zfriA a.Job_job-card__location__bq7jX")
                    tags_list = [a.get_text(strip=True) for a in tag_links if a.get_text(strip=True)]
                    tags_str = ", ".join(tags_list)

                    job_type = infer_job_type(tags_list, title)

                    job_data = {
                        "title": title,
                        "company": company,
                        "location": location,
                        "posting_date": posting_date,
                        "job_type": job_type,
                        "tags_str": tags_str
                    }

                    insert_job_data(db_conn, job_data)

                except Exception as e:
                    print(f"Error parsing job card: {e}")

        except Exception as e:
            print(f"Error scraping page {page_number}: {e}")

    for page in range(1, 6):
        scrape_page(page)

    while True:
        user_input = input("\nEnter a page number to scrape (or type 'exit' to quit): ").strip()
        if user_input.lower() == 'exit':
            break
        if user_input.isdigit():
            page_number = int(user_input)
            if page_number < 1:
                print("Please enter a valid page number (1 or higher).")
                continue
            scrape_page(page_number)
        else:
            print("Invalid input. Please enter a number or 'exit'.")

    driver.quit()
    db_conn.close()
    print("Scraping session complete.")

if __name__ == "__main__":
    print("--- Actuary List Selenium Scraper to PostgreSQL DB ---")
    scrape_actuary_list_to_db()
    print("--- Scraping process finished ---")

