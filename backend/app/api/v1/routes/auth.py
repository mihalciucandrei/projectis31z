from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import DB, CurrentUser
from app.core.security import create_access_token
from app.schemas.user import TokenResponse, UserRead, UserRegister, UserUpdate
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _token(user) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(user.id, user.role.value), user=UserRead.model_validate(user))


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: UserRegister, db: DB):
    return _token(auth_service.register_user(db, data))


@router.post("/login", response_model=TokenResponse)
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DB):
    """OAuth2 password flow: в поле `username` передаётся email."""
    return _token(auth_service.authenticate(db, form.username, form.password))


@router.get("/me", response_model=UserRead)
def me(user: CurrentUser):
    return user


@router.put("/me", response_model=UserRead)
def update_me(data: UserUpdate, user: CurrentUser, db: DB):
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    db.commit()
    return user
