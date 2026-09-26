import logging
import sys
from app.config import settings


def setup_logging() -> None:
    """Initialize structured, production-grade console logging."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True
    )


def get_logger(name: str) -> logging.Logger:
    """Return a scoped logger under the ecopulse namespace."""
    return logging.getLogger(f"ecopulse.{name}")
