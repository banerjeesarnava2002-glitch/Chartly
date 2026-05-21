import os
import logging

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

SQLITE_FALLBACK_URL = "sqlite:///./playground.db"

# Normalize the configured DATABASE_URL
_db_url = os.getenv("DATABASE_URL", "")
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql://", 1)

def _is_placeholder(url: str) -> bool:
    return (
        not url
        or url.startswith("postgresql://user:password@ep-your-endpoint")
        or url == "sqlite:///./playground.db"
    )

def _probe_postgres(url: str) -> bool:
    """Try a quick connection to verify the PostgreSQL host is reachable."""
    try:
        probe_engine = create_engine(url, connect_args={"connect_timeout": 5}, pool_pre_ping=True)
        with probe_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        probe_engine.dispose()
        return True
    except Exception as exc:
        logger.warning(
            "PostgreSQL connection probe failed (%s). Falling back to SQLite.", exc
        )
        return False

# Decide which database to use
if _is_placeholder(_db_url):
    SQLALCHEMY_DATABASE_URL = SQLITE_FALLBACK_URL
    logger.info("No remote DATABASE_URL configured — using local SQLite: %s", SQLITE_FALLBACK_URL)
elif _db_url.startswith("sqlite"):
    SQLALCHEMY_DATABASE_URL = _db_url
else:
    # A real PostgreSQL URL was provided — probe it
    if _probe_postgres(_db_url):
        SQLALCHEMY_DATABASE_URL = _db_url
        logger.info("Connected to PostgreSQL database.")
    else:
        SQLALCHEMY_DATABASE_URL = SQLITE_FALLBACK_URL
        logger.info("Falling back to local SQLite: %s", SQLITE_FALLBACK_URL)

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

