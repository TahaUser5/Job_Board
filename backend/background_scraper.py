"""
background_scraper.py
---------------------
Silently scrapes actuarylist.com in a background daemon thread whenever the
user applies a filter.  Results are saved directly to the DB using psycopg2
(same deduplication logic as scrape.py), so no new jobs are ever duplicated.

The caller (routes.py) never waits for this — the Flask response is returned
immediately and this runs alongside it.
"""

import threading
import time
import os
import re
import hashlib
from datetime import datetime, timedelta
from urllib.parse import urlparse

# ── Cooldown registry ─────────────────────────────────────────────────────────
# Maps filter-hash → last_scraped UTC epoch.  Stored in memory; resets on
# server restart (that's fine — a fresh scrape on restart is harmless).
_cooldown: dict[str, float] = {}
_cooldown_lock = threading.Lock()
COOLDOWN_SECONDS = 300  # 5 minutes per unique filter combo

# ── How many pages to silently scrape ─────────────────────────────────────────
BACKGROUND_PAGES = 3


def _filter_hash(keyword: str, company: str, job_type: str, location: str) -> str:
    """Stable hash of the active filters so we can throttle per combination."""
    raw = f"{keyword}|{company}|{job_type}|{location}".lower().strip()
    return hashlib.md5(raw.encode()).hexdigest()


def _is_on_cooldown(fhash: str) -> bool:
    with _cooldown_lock:
        last = _cooldown.get(fhash, 0)
        return (time.time() - last) < COOLDOWN_SECONDS


def _mark_scraped(fhash: str) -> None:
    with _cooldown_lock:
        _cooldown[fhash] = time.time()


# ── DB helpers (mirror of scrape.py so we stay independent) ──────────────────

def _get_db_config() -> dict:
    from dotenv import load_dotenv
    load_dotenv(override=True)
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        raise RuntimeError("DATABASE_URL not set")
    p = urlparse(url)
    return {
        "dbname": p.path.lstrip("/"),
        "user": p.username,
        "password": p.password,
        "host": p.hostname,
        "port": str(p.port or 5432),
    }


def _job_exists(cursor, title: str, company: str, posting_date) -> bool:
    cursor.execute(
        "SELECT id FROM public.jobs WHERE title=%s AND company=%s AND posting_date=%s",
        (title, company, posting_date),
    )
    return cursor.fetchone() is not None


def _insert_job(conn, job: dict) -> bool:
    if not all([job.get("title"), job.get("company"),
                job.get("location"), job.get("posting_date")]):
        return False
    try:
        with conn.cursor() as cur:
            if _job_exists(cur, job["title"], job["company"], job["posting_date"]):
                return False
            cur.execute(
                """INSERT INTO public.jobs
                   (title, company, location, posting_date, job_type, tags)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (job["title"], job["company"], job["location"],
                 job["posting_date"], job.get("job_type"), job.get("tags_str")),
            )
        conn.commit()
        return True
    except Exception:
        conn.rollback()
        return False


# ── Date parser (same logic as scrape.py) ────────────────────────────────────

def _parse_date(raw: str):
    s = raw.lower().replace("posted", "").strip()
    now = datetime.now()
    if not s:
        return None
    if "today" in s or "0 days ago" in s:
        return now.date()
    if "yesterday" in s or "1 day ago" in s:
        return (now - timedelta(days=1)).date()
    m = re.match(r"(\d+)\s*h(?:ours?)?\s*ago", s)
    if m:
        return (now - timedelta(hours=int(m.group(1)))).date()
    m = re.match(r"(\d+)\s*d(?:ays?)?\s*ago", s)
    if m:
        return (now - timedelta(days=int(m.group(1)))).date()
    m = re.match(r"(\d+)\s*mo(?:nths?)?\s*ago", s)
    if m:
        return (now - timedelta(days=int(m.group(1)) * 30)).date()
    m = re.match(r"on\s+([a-z]{3,})\s+(\d+)(?:st|nd|rd|th)?", s)
    if m:
        try:
            fmt = "%b" if len(m.group(1)) == 3 else "%B"
            month = datetime.strptime(m.group(1), fmt).month
            d = datetime(now.year, month, int(m.group(2))).date()
            return d if d <= now.date() else datetime(now.year - 1, month, int(m.group(2))).date()
        except ValueError:
            return None
    try:
        return datetime.strptime(raw, "%b %d, %Y").date()
    except ValueError:
        return None


def _infer_job_type(tags: list[str], title: str) -> str:
    tl = [t.lower() for t in tags]
    tt = title.lower()
    if "intern" in tl or "internship" in tl or "intern" in tt:
        return "Internship"
    if "contract" in tl or "contractor" in tl:
        return "Contract"
    if "part-time" in tl or "part time" in tl:
        return "Part-Time"
    return "Full-Time"


# ── Core background scrape logic ──────────────────────────────────────────────

def _do_scrape(pages: int, label: str) -> None:
    """
    Runs in a background thread.  Scrapes `pages` pages of actuarylist.com
    and silently inserts new jobs into the DB.
    """
    try:
        import psycopg2
        from selenium import webdriver
        from selenium.webdriver.chrome.service import Service as ChromeService
        from webdriver_manager.chrome import ChromeDriverManager
        from bs4 import BeautifulSoup

        conn = psycopg2.connect(**_get_db_config())

        options = webdriver.ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1280,1024")
        options.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        )
        service = ChromeService(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)

        new_count = 0
        for page in range(1, pages + 1):
            try:
                driver.get(f"https://www.actuarylist.com?page={page}")
                time.sleep(3)
                soup = BeautifulSoup(driver.page_source, "html.parser")
                cards = soup.select("div.Job_job-card__YgDAV")
                if not cards:
                    break  # no more pages

                for card in cards:
                    try:
                        title = (card.select_one("p.Job_job-card__position__ic1rc") or
                                 type("", (), {"get_text": lambda *a, **k: None})()).get_text(strip=True)
                        company = (card.select_one("p.Job_job-card__company__7T9qY") or
                                   type("", (), {"get_text": lambda *a, **k: None})()).get_text(strip=True)
                        location = (card.select_one("a.Job_job-card__location__bq7jX") or
                                    type("", (), {"get_text": lambda *a, **k: None})()).get_text(strip=True)
                        date_raw = (card.select_one("p.Job_job-card__posted-on__NCZaJ") or
                                    type("", (), {"get_text": lambda *a, **k: None})()).get_text(strip=True)
                        tags_els = card.select("div.Job_job-card__tags__zfriA a.Job_job-card__location__bq7jX")
                        tags = [a.get_text(strip=True) for a in tags_els if a.get_text(strip=True)]

                        if not title or not company:
                            continue

                        posting_date = _parse_date(date_raw or "")
                        if _insert_job(conn, {
                            "title": title,
                            "company": company,
                            "location": location,
                            "posting_date": posting_date,
                            "job_type": _infer_job_type(tags, title),
                            "tags_str": ", ".join(tags),
                        }):
                            new_count += 1
                    except Exception:
                        continue
            except Exception:
                break

        driver.quit()
        conn.close()
        print(f"[BG scrape | {label}] Done — {new_count} new job(s) added.")

    except Exception as e:
        print(f"[BG scrape | {label}] Error: {e}")


# ── Public API ────────────────────────────────────────────────────────────────

def trigger_background_scrape(
    keyword: str = "",
    company: str = "",
    job_type: str = "",
    location: str = "",
) -> None:
    """
    Called from routes.py.  Fires a daemon thread to scrape silently.
    Returns immediately — the Flask response is never delayed.
    Respects a per-filter cooldown to avoid hammering the site.
    """
    fhash = _filter_hash(keyword, company, job_type, location)
    if _is_on_cooldown(fhash):
        return  # already scraped this combo recently

    _mark_scraped(fhash)
    label = f"kw={keyword or '*'} co={company or '*'} type={job_type or '*'}"
    t = threading.Thread(target=_do_scrape, args=(BACKGROUND_PAGES, label), daemon=True)
    t.start()
    print(f"[BG scrape] Triggered for: {label}")
