from fastapi import APIRouter, Response
from sqlalchemy import select

from app.api.deps import DB, AdminUser
from app.db.models import Car, User
from app.schemas.admin import GroupStat, PlatformSummary, RoleUpdate
from app.schemas.user import UserRead
from app.services import admin_service as svc

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/summary", response_model=PlatformSummary)
def summary(_: AdminUser, db: DB):
    return svc.summary(db)


@router.get("/analytics/by-brand", response_model=list[GroupStat])
def by_brand(_: AdminUser, db: DB):
    return svc.stats_by_column(db, Car.brand)


@router.get("/analytics/by-city", response_model=list[GroupStat])
def by_city(_: AdminUser, db: DB):
    return svc.stats_by_column(db, Car.city)


@router.get("/analytics/by-month", response_model=list[GroupStat])
def by_month(_: AdminUser, db: DB):
    return svc.stats_by_month(db)


@router.get("/users", response_model=list[UserRead])
def users(_: AdminUser, db: DB):
    return list(db.scalars(select(User).order_by(User.id)).all())


@router.patch("/users/{user_id}/role", response_model=UserRead)
def set_role(user_id: int, data: RoleUpdate, admin: AdminUser, db: DB):
    return svc.change_role(db, admin, user_id, data.role)


@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, admin: AdminUser, db: DB):
    svc.delete_user(db, admin, user_id)
    return Response(status_code=204)
