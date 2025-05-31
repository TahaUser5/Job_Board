from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from app import app  # Import Flask app
from models import db, Job
from datetime import datetime
import time

def scrape_actuary_list():
    driver = webdriver.Chrome()
    driver.get("https://www.actuarylist.com/jobs")

    # Wait for the page to load
    time.sleep(5)

    jobs = []
    job_elements = driver.find_elements(By.CSS_SELECTOR, ".job-card")  # Update selector based on site structure

    for job_element in job_elements:
        try:
            title = job_element.find_element(By.CSS_SELECTOR, ".job-title").text
            company = job_element.find_element(By.CSS_SELECTOR, ".job-company").text
            location = job_element.find_element(By.CSS_SELECTOR, ".job-location").text
            posting_date = datetime.utcnow().date()  # Replace with actual scraping logic
            job_type = "Full-time"  # Default value; update based on site data
            tags = "Actuary, Finance"  # Replace with actual scraping logic

            job = Job(
                title=title,
                company=company,
                location=location,
                posting_date=posting_date,
                job_type=job_type,
                tags=tags
            )
            jobs.append(job)
        except Exception as e:
            print(f"Error scraping job: {e}")

    with app.app_context():  # Use Flask app context for database operations
        for job in jobs:
            existing_job = Job.query.filter_by(title=job.title, company=job.company).first()
            if not existing_job:
                db.session.add(job)
        db.session.commit()

    driver.quit()

if __name__ == "__main__":
    scrape_actuary_list()
