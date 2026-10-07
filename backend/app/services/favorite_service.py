from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.db.models import Car, Favorite, User


def list_favorite_cars(db: Session, user: User) -> list[Car]:
    stmt = (
        select(Car)
        .join(Favorite, Favorite.car_id == Car.id)
        .where(Favorite.user_id == user.id)
        .options(selectinload(Car.photos))
        .order_by(Favorite.created_at.desc())
    )
    return list(db.scalars(stmt).unique().all())


def favorite_ids(db: Session, user: User) -> list[int]:
    return list(db.scalars(select(Favorite.car_id).where(Favorite.user_id == user.id)).all())


def add_favorite(db: Session, user: User, car_id: int) -> None:
    if db.get(Car, car_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Объявление не найдено")
    exists = db.scalar(select(Favorite.id).where(Favorite.user_id == user.id, Favorite.car_id == car_id))
    if not exists:
        db.add(Favorite(user_id=user.id, car_id=car_id))
        db.commit()


def remove_favorite(db: Session, user: User, car_id: int) -> None:
    db.execute(delete(Favorite).where(Favorite.user_id == user.id, Favorite.car_id == car_id))
    db.commit()
