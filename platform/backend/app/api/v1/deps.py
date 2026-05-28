from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.session import get_db


def db_session() -> Session:
    return Depends(get_db)
