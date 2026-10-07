from typing import Annotated

from fastapi import APIRouter, File, Query, Response, UploadFile

from app.api.deps import DB, CurrentUser, OptionalUser, SellerUser
from app.schemas.car import (
    CarCreate, CarDetail, CarFilters, CarListItem, CarMeta, CarPage, CarUpdate,
)
from app.services import car_service, favorite_service

router = APIRouter(prefix="/cars", tags=["cars"])


def _page(db, filters: CarFilters, seller_id=None) -> CarPage:
    cars, total = car_service.search_cars(db, filters, seller_id)
    return CarPage(
        items=[CarListItem.model_validate(c) for c in cars],
        total=total, page=filters.page, page_size=filters.page_size,
        pages=car_service.page_count(total, filters.page_size),
    )


@router.get("", response_model=CarPage)
def list_cars(filters: Annotated[CarFilters, Query()], db: DB):
    """Каталог: поиск, многопараметрическая фильтрация, сортировка, пагинация."""
    return _page(db, filters)


@router.get("/meta", response_model=CarMeta)
def meta(db: DB):
    """Справочники для фильтров: марки и города (с количеством), enum-значения."""
    return car_service.car_meta(db)


@router.get("/mine", response_model=CarPage)
def my_cars(filters: Annotated[CarFilters, Query()], user: SellerUser, db: DB):
    return _page(db, filters, seller_id=user.id)


@router.get("/{car_id}", response_model=CarDetail)
def get_car(car_id: int, db: DB, user: OptionalUser):
    car = car_service.get_car_or_404(db, car_id)
    detail = CarDetail.model_validate(car)
    if user:
        detail.is_favorite = car_id in favorite_service.favorite_ids(db, user)
    return detail


@router.post("", response_model=CarDetail, status_code=201)
def create_car(data: CarCreate, user: SellerUser, db: DB):
    return car_service.create_car(db, user, data)


@router.put("/{car_id}", response_model=CarDetail)
def update_car(car_id: int, data: CarUpdate, user: SellerUser, db: DB):
    car = car_service.get_car_or_404(db, car_id)
    car_service.ensure_can_modify(car, user)
    return car_service.update_car(db, car, user, data)


@router.delete("/{car_id}", status_code=204)
def delete_car(car_id: int, user: SellerUser, db: DB):
    car = car_service.get_car_or_404(db, car_id)
    car_service.ensure_can_modify(car, user)
    car_service.delete_car(db, car)
    return Response(status_code=204)


@router.post("/{car_id}/photos", response_model=CarDetail, status_code=201)
async def upload_photos(car_id: int, user: SellerUser, db: DB, files: list[UploadFile] = File(...)):
    car = car_service.get_car_or_404(db, car_id)
    car_service.ensure_can_modify(car, user)
    return await car_service.add_photos(db, car, files)


@router.patch("/{car_id}/photos/{photo_id}/main", response_model=CarDetail)
def make_main(car_id: int, photo_id: int, user: SellerUser, db: DB):
    car = car_service.get_car_or_404(db, car_id)
    car_service.ensure_can_modify(car, user)
    return car_service.set_main_photo(db, car, photo_id)


@router.delete("/{car_id}/photos/{photo_id}", response_model=CarDetail)
def remove_photo(car_id: int, photo_id: int, user: SellerUser, db: DB):
    car = car_service.get_car_or_404(db, car_id)
    car_service.ensure_can_modify(car, user)
    return car_service.delete_photo(db, car, photo_id)
