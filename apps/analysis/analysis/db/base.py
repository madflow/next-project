from sqlalchemy.orm import DeclarativeBase

from analysis.db.meta import meta


class Base(DeclarativeBase):
    """Base for all models."""

    metadata = meta
