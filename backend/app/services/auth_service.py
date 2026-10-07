from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.db.models import User, UserRole
from app.schemas.user import UserRegister


def register_user(db: Session, data: UserRegister) -> User:
    if data.role == UserRole.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Нельзя зарегистрироваться как администратор")
    email = data.email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Пользователь с таким email уже существует")
    user = User(
        name=data.name.strip(),
        email=email,
        password_hash=hash_password(data.password),
        role=data.role,
        phone=data.phone,
        city=data.city,
    )
    db.add(user)
    db.commit()
    return user


def authenticate(db: Session, email: str, password: str) -> User:
    user = db.scalar(select(User).where(User.email == email.lower()))
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Неверный email или пароль", headers={"WWW-Authenticate": "Bearer"}
        )
    return user
