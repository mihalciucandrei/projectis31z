from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.db.models import BodyType, FuelType, ListingStatus, TransmissionType
from app.schemas.user import UserPublic

SORT_OPTIONS = ("newest", "price_asc", "price_desc", "year_desc", "mileage_asc")


class CarBase(BaseModel):
    brand: str = Field(min_length=1, max_length=60)
    model: str = Field(min_length=1, max_length=80)
    year: int = Field(ge=1950, le=2100)
    price: float = Field(gt=0, lt=100_000_000)
    mileage: int = Field(ge=0, le=3_000_000)
    fuel_type: FuelType
    transmission: TransmissionType
    body_type: BodyType
    city: str = Field(min_length=1, max_length=80)
    description: Optional[str] = Field(default=None, max_length=5000)


class CarCreate(CarBase):
    pass


class CarUpdate(BaseModel):
    brand: Optional[str] = Field(default=None, min_length=1, max_length=60)
    model: Optional[str] = Field(default=None, min_length=1, max_length=80)
    year: Optional[int] = Field(default=None, ge=1950, le=2100)
    price: Optional[float] = Field(default=None, gt=0, lt=100_000_000)
    mileage: Optional[int] = Field(default=None, ge=0, le=3_000_000)
    fuel_type: Optional[FuelType] = None
    transmission: Optional[TransmissionType] = None
    body_type: Optional[BodyType] = None
    city: Optional[str] = Field(default=None, min_length=1, max_length=80)
    description: Optional[str] = Field(default=None, max_length=5000)
    status: Optional[ListingStatus] = None


class CarFilters(BaseModel):
    q: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    city: Optional[str] = None
    price_min: Optional[float] = Field(default=None, ge=0)
    price_max: Optional[float] = Field(default=None, ge=0)
    year_min: Optional[int] = None
    year_max: Optional[int] = None
    mileage_max: Optional[int] = Field(default=None, ge=0)
    fuel_type: Optional[FuelType] = None
    transmission: Optional[TransmissionType] = None
    body_type: Optional[BodyType] = None
    status: Optional[ListingStatus] = None
    sort: str = Field(default="newest", pattern="^(" + "|".join(SORT_OPTIONS) + ")$")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=12, ge=1, le=60)


class PhotoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    url: str
    is_main: bool
    order: int


class CarListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    seller_id: int
    brand: str
    model: str
    year: int
    price: float
    mileage: int
    fuel_type: FuelType
    transmission: TransmissionType
    body_type: BodyType
    city: str
    status: ListingStatus
    created_at: datetime
    main_photo: Optional[str] = None


class CarDetail(CarListItem):
    description: Optional[str] = None
    updated_at: datetime
    photos: list[PhotoRead] = []
    seller: UserPublic
    is_favorite: bool = False


class CarPage(BaseModel):
    items: list[CarListItem]
    total: int
    page: int
    page_size: int
    pages: int


class NameCount(BaseModel):
    name: str
    count: int


class CarMeta(BaseModel):
    brands: list[NameCount]
    cities: list[NameCount]
    fuel_types: list[str]
    transmissions: list[str]
    body_types: list[str]
