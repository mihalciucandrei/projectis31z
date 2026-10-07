"""Транзакционное бронирование: резервирование -> подтверждение / отмена.

Состояние авто и брони меняется атомарно в одной транзакции БД;
строка авто блокируется через SELECT ... FOR UPDATE, поэтому два покупателя
не смогут забронировать один и тот же автомобиль одновременно."""
from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Car, ListingStatus, Reservation, ReservationStatus, User, UserRole, utcnow

ACTIVE = (ReservationStatus.pending, ReservationStatus.confirmed)


def _lock_car(db: Session, car_id: int) -> Car:
    car = db.scalar(select(Car).where(Car.id == car_id).with_for_update(of=Car))
    if car is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Объявление не найдено")
    return car


def expire_stale(db: Session) -> None:
    """Просроченные pending-брони -> expired, авто снова доступно."""
    border = utcnow() - timedelta(hours=settings.reservation_ttl_hours)
    stale = db.scalars(
        select(Reservation).where(Reservation.status == ReservationStatus.pending, Reservation.created_at < border)
    ).all()
    for res in stale:
        res.status = ReservationStatus.expired
        car = db.get(Car, res.car_id)
        if car and car.status == ListingStatus.reserved:
            car.status = ListingStatus.active
    if stale:
        db.commit()


def create_reservation(db: Session, buyer: User, car_id: int) -> Reservation:
    expire_stale(db)
    car = _lock_car(db, car_id)  # <- блокировка строки до конца транзакции
    if car.seller_id == buyer.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Нельзя забронировать собственное объявление")
    if car.status != ListingStatus.active:
        raise HTTPException(status.HTTP_409_CONFLICT, "Автомобиль уже забронирован, продан или снят с продажи")
    busy = db.scalar(select(Reservation.id).where(Reservation.car_id == car.id, Reservation.status.in_(ACTIVE)).limit(1))
    if busy:
        raise HTTPException(status.HTTP_409_CONFLICT, "У автомобиля уже есть активная бронь")

    res = Reservation(car_id=car.id, buyer_id=buyer.id, status=ReservationStatus.pending)
    car.status = ListingStatus.reserved
    db.add(res)
    db.commit()
    return res


def _get_reservation_locked(db: Session, reservation_id: int) -> Reservation:
    res = db.scalar(select(Reservation).where(Reservation.id == reservation_id).with_for_update(of=Reservation))
    if res is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Бронь не найдена")
    return res


def confirm_reservation(db: Session, user: User, reservation_id: int) -> Reservation:
    res = _get_reservation_locked(db, reservation_id)
    car = _lock_car(db, res.car_id)
    if user.role != UserRole.admin and car.seller_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Подтвердить бронь может только продавец")
    if res.status != ReservationStatus.pending:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Бронь в статусе «{res.status.value}» нельзя подтвердить")
    res.status = ReservationStatus.confirmed
    res.confirmed_at = utcnow()
    car.status = ListingStatus.sold
    db.commit()
    return res


def cancel_reservation(db: Session, user: User, reservation_id: int) -> Reservation:
    res = _get_reservation_locked(db, reservation_id)
    car = _lock_car(db, res.car_id)
    is_seller = car.seller_id == user.id
    is_buyer = res.buyer_id == user.id
    if not (is_seller or is_buyer or user.role == UserRole.admin):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Нет доступа к этой брони")
    if res.status not in ACTIVE:
        raise HTTPException(status.HTTP_409_CONFLICT, "Эта бронь уже закрыта")
    if res.status == ReservationStatus.confirmed and is_buyer and not (is_seller or user.role == UserRole.admin):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Подтверждённую бронь может отменить только продавец")
    res.status = ReservationStatus.cancelled
    res.cancelled_at = utcnow()
    car.status = ListingStatus.active
    db.commit()
    return res


def buyer_reservations(db: Session, user: User) -> list[Reservation]:
    expire_stale(db)
    stmt = select(Reservation).where(Reservation.buyer_id == user.id).order_by(Reservation.created_at.desc())
    return list(db.scalars(stmt).unique().all())


def incoming_reservations(db: Session, user: User) -> list[Reservation]:
    expire_stale(db)
    stmt = select(Reservation).join(Car, Car.id == Reservation.car_id).order_by(Reservation.created_at.desc())
    if user.role != UserRole.admin:
        stmt = stmt.where(Car.seller_id == user.id)
    return list(db.scalars(stmt).unique().all())
