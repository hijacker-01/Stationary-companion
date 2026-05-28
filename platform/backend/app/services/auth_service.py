from sqlalchemy.orm import Session
from app.models.auth import User
from app.core.security import verify_password, create_access_token


def login(db: Session, email: str, password: str) -> str | None:
    user = db.query(User).filter(User.email == email, User.is_deleted.is_(False)).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return create_access_token(user.id)
