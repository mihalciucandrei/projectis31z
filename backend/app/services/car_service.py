import math
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.db.models import (
    BodyType, Car, CarPhoto, FuelType, ListingStatus, TransmissionType, User, UserRole,
)
from app.schemas.car import CarCreate, CarFilters, CarUpdate

SORTS = {
    "newest": (Car.created_at.desc(),),
    "price_asc": (Car.price.asc(),),
    "price_desc": (Car.price.desc(),),
    "year_desc": (Car.year.desc(),),
    "mileage_asc": (Car.mileage.asc(),),
}
ALLOWED_IMAGES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def get_car_or_404(db: Session, car_id: int) -> Car:
    car = db.scalar(select(Car).where(Car.id == car_id).options(selectinload(Car.photos)))
    if car is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Объявление не найдено")
    return car


def ensure_can_modify(car: Car, user: User) -> None:
    if user.role != UserRole.admin and car.seller_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Это не ваше объявление")


def search_cars(db: Session, f: CarFilters, seller_id: int | None = None) -> tuple[list[Car], int]:
    conds = []
    if seller_id is not None:
        conds.append(Car.seller_id == seller_id)
        if f.status:
            conds.append(Car.status == f.status)
    elif f.status:
        conds.append(Car.status == f.status)
    else:  # публичный каталог: активные и забронированные
        conds.append(Car.status.in_([ListingStatus.active, ListingStatus.reserved]))

    if f.q:
        like = f"%{f.q.strip().lower()}%"
        conds.append(or_(func.lower(Car.brand).like(like), func.lower(Car.model).like(like),
                         func.lower(func.coalesce(Car.description, "")).like(like)))
    if f.brand:
        conds.append(func.lower(Car.brand) == f.brand.strip().lower())
    if f.model:
        conds.append(func.lower(Car.model).like(f"%{f.model.strip().lower()}%"))
    if f.city:
        conds.append(func.lower(Car.city) == f.city.strip().lower())
    if f.price_min is not None:
        conds.append(Car.price >= f.price_min)
    if f.price_max is not None:
        conds.append(Car.price <= f.price_max)
    if f.year_min is not None:
        conds.append(Car.year >= f.year_min)
    if f.year_max is not None:
        conds.append(Car.year <= f.year_max)
    if f.mileage_max is not None:
        conds.append(Car.mileage <= f.mileage_max)
    if f.fuel_type:
        conds.append(Car.fuel_type == f.fuel_type)
    if f.transmission:
        conds.append(Car.transmission == f.transmission)
    if f.body_type:
        conds.append(Car.body_type == f.body_type)

    total = db.scalar(select(func.count()).select_from(Car).where(*conds)) or 0
    stmt = (
        select(Car)
        .where(*conds)
        .options(selectinload(Car.photos))
        .order_by(*SORTS[f.sort], Car.id.desc())
        .offset((f.page - 1) * f.page_size)
        .limit(f.page_size)
    )
    return list(db.scalars(stmt).unique().all()), total


def page_count(total: int, page_size: int) -> int:
    return max(1, math.ceil(total / page_size))


def car_meta(db: Session) -> dict:
    visible = Car.status.in_([ListingStatus.active, ListingStatus.reserved])

    def counts(col):
        rows = db.execute(select(col, func.count()).where(visible).group_by(col).order_by(col)).all()
        return [{"name": name, "count": cnt} for name, cnt in rows]

    return {
        "brands": counts(Car.brand),
        "cities": counts(Car.city),
        "fuel_types": [e.value for e in FuelType],
        "transmissions": [e.value for e in TransmissionType],
        "body_types": [e.value for e in BodyType],
    }


def create_car(db: Session, seller: User, data: CarCreate) -> Car:
    car = Car(seller_id=seller.id, **data.model_dump())
    db.add(car)
    db.commit()
    return get_car_or_404(db, car.id)


def update_car(db: Session, car: Car, user: User, data: CarUpdate) -> Car:
    changes = data.model_dump(exclude_unset=True)
    new_status = changes.get("status")
    if new_status is not None and user.role != UserRole.admin:
        # продавец управляет только активностью; reserved/sold меняются через бронирование
        if car.status in (ListingStatus.reserved, ListingStatus.sold):
            raise HTTPException(status.HTTP_409_CONFLICT, "Статус нельзя менять, пока авто забронировано или продано")
        if new_status not in (ListingStatus.active, ListingStatus.archived):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Допустимые статусы: active, archived")
    for key, value in changes.items():
        if value is None and key != "description":
            continue
        setattr(car, key, value)
    db.commit()
    return get_car_or_404(db, car.id)


def delete_car(db: Session, car: Car) -> None:
    for photo in car.photos:
        _remove_file(photo.url)
    db.delete(car)
    db.commit()


# ---------------------------------------------------------------- photos
def _upload_path() -> Path:
    path = Path(settings.upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _remove_file(url: str) -> None:
    if url.startswith("/uploads/"):
        (_upload_path() / url.removeprefix("/uploads/")).unlink(missing_ok=True)


async def add_photos(db: Session, car: Car, files: list[UploadFile]) -> Car:
    limit = settings.max_upload_mb * 1024 * 1024
    next_order = max((p.order for p in car.photos), default=-1) + 1
    for file in files:
        ext = ALLOWED_IMAGES.get(file.content_type or "")
        if ext is None:
            raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Допустимы только JPEG, PNG и WEBP")
        content = await file.read()
        if len(content) > limit:
            raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"Файл больше {settings.max_upload_mb} МБ")
        name = f"{uuid.uuid4().hex}{ext}"
        (_upload_path() / name).write_bytes(content)
        db.add(CarPhoto(car_id=car.id, url=f"/uploads/{name}", is_main=not car.photos and next_order == 0, order=next_order))
        next_order += 1
        db.flush()
        db.refresh(car)
    db.commit()
    return get_car_or_404(db, car.id)


def delete_photo(db: Session, car: Car, photo_id: int) -> Car:
    photo = next((p for p in car.photos if p.id == photo_id), None)
    if photo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Фото не найдено")
    was_main = photo.is_main
    _remove_file(photo.url)
    car.photos.remove(photo)
    db.flush()
    if was_main and car.photos:
        car.photos[0].is_main = True
    db.commit()
    return get_car_or_404(db, car.id)


def set_main_photo(db: Session, car: Car, photo_id: int) -> Car:
    if not any(p.id == photo_id for p in car.photos):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Фото не найдено")
    for p in car.photos:
        p.is_main = p.id == photo_id
    db.commit()
    return get_car_or_404(db, car.id)
