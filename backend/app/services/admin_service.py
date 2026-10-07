from fastapi import HTTPException, status
from sqlalchemy import case, extract, func, select
from sqlalchemy.orm import Session

from app.db.models import Car, ListingStatus, Message, Reservation, ReservationStatus, User


def _stats_cols():
    return (
        func.count(Car.id),
        func.sum(case((Car.status == ListingStatus.active, 1), else_=0)),
        func.sum(case((Car.status == ListingStatus.sold, 1), else_=0)),
        func.avg(Car.price),
    )


def _row(key, total, active, sold, avg):
    return {"key": str(key), "total": int(total or 0), "active": int(active or 0),
            "sold": int(sold or 0), "avg_price": round(float(avg), 2) if avg is not None else None}


def stats_by_column(db: Session, column) -> list[dict]:
    rows = db.execute(select(column, *_stats_cols()).group_by(column).order_by(func.count(Car.id).desc(), column)).all()
    return [_row(*r) for r in rows]


def stats_by_month(db: Session) -> list[dict]:
    y, m = extract("year", Car.created_at), extract("month", Car.created_at)
    rows = db.execute(select(y, m, *_stats_cols()).group_by(y, m).order_by(y, m)).all()
    return [_row(f"{int(yy):04d}-{int(mm):02d}", *rest) for yy, mm, *rest in rows]


def summary(db: Session) -> dict:
    def cnt(model, *conds):
        return db.scalar(select(func.count()).select_from(model).where(*conds)) or 0

    return {
        "users": cnt(User),
        "cars_total": cnt(Car),
        "cars_active": cnt(Car, Car.status == ListingStatus.active),
        "cars_reserved": cnt(Car, Car.status == ListingStatus.reserved),
        "cars_sold": cnt(Car, Car.status == ListingStatus.sold),
        "reservations_pending": cnt(Reservation, Reservation.status == ReservationStatus.pending),
        "reservations_confirmed": cnt(Reservation, Reservation.status == ReservationStatus.confirmed),
        "messages": cnt(Message),
    }


def change_role(db: Session, admin: User, user_id: int, role) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")
    if user.id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Нельзя менять собственную роль")
    user.role = role
    db.commit()
    return user


def delete_user(db: Session, admin: User, user_id: int) -> None:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")
    if user.id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Нельзя удалить самого себя")
    db.delete(user)  # связанные записи удаляются каскадом на уровне БД
    db.commit()
