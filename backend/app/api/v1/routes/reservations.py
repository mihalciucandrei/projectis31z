from fastapi import APIRouter

from app.api.deps import DB, CurrentUser, SellerUser
from app.schemas.interaction import ReservationCreate, ReservationRead
from app.services import reservation_service as svc

router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.post("", response_model=ReservationRead, status_code=201)
def reserve(data: ReservationCreate, user: CurrentUser, db: DB):
    """Забронировать авто (атомарно, с блокировкой строки)."""
    return svc.create_reservation(db, user, data.car_id)


@router.get("/mine", response_model=list[ReservationRead])
def my(user: CurrentUser, db: DB):
    return svc.buyer_reservations(db, user)


@router.get("/incoming", response_model=list[ReservationRead])
def incoming(user: SellerUser, db: DB):
    """Брони на объявления продавца."""
    return svc.incoming_reservations(db, user)


@router.post("/{reservation_id}/confirm", response_model=ReservationRead)
def confirm(reservation_id: int, user: SellerUser, db: DB):
    return svc.confirm_reservation(db, user, reservation_id)


@router.post("/{reservation_id}/cancel", response_model=ReservationRead)
def cancel(reservation_id: int, user: CurrentUser, db: DB):
    return svc.cancel_reservation(db, user, reservation_id)
