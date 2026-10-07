from fastapi import APIRouter, Response

from app.api.deps import DB, CurrentUser
from app.schemas.car import CarListItem
from app.services import favorite_service

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=list[CarListItem])
def list_favorites(user: CurrentUser, db: DB):
    return favorite_service.list_favorite_cars(db, user)


@router.get("/ids", response_model=list[int])
def favorite_ids(user: CurrentUser, db: DB):
    return favorite_service.favorite_ids(db, user)


@router.post("/{car_id}", status_code=204)
def add(car_id: int, user: CurrentUser, db: DB):
    favorite_service.add_favorite(db, user, car_id)
    return Response(status_code=204)


@router.delete("/{car_id}", status_code=204)
def remove(car_id: int, user: CurrentUser, db: DB):
    favorite_service.remove_favorite(db, user, car_id)
    return Response(status_code=204)
