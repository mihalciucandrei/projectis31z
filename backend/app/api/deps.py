from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.models import User, UserRole
from app.db.session import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login", auto_error=False)

DB = Annotated[Session, Depends(get_db)]


def get_optional_user(db: DB, token: Annotated[Optional[str], Depends(oauth2_scheme)]) -> Optional[User]:
    if not token:
        return None
    user_id = decode_access_token(token)
    return db.get(User, user_id) if user_id else None


def get_current_user(user: Annotated[Optional[User], Depends(get_optional_user)]) -> User:
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Требуется авторизация", headers={"WWW-Authenticate": "Bearer"})
    return user


def require_roles(*roles: UserRole):
    def checker(user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")
        return user

    return checker


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[Optional[User], Depends(get_optional_user)]
SellerUser = Annotated[User, Depends(require_roles(UserRole.seller, UserRole.admin))]
AdminUser = Annotated[User, Depends(require_roles(UserRole.admin))]
