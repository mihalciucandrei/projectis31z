from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.db.models import ReservationStatus
from app.schemas.car import CarListItem
from app.schemas.user import UserPublic


class MessageCreate(BaseModel):
    car_id: int
    message_text: str = Field(min_length=1, max_length=3000)
    receiver_id: Optional[int] = None  # обязателен, только если пишет продавец


class MessageRead(BaseModel):
    id: int
    car_id: int
    car_title: str
    sender_id: int
    sender_name: str
    receiver_id: int
    receiver_name: str
    message_text: str
    is_read: bool
    created_at: datetime


class ReservationCreate(BaseModel):
    car_id: int


class BuyerContact(UserPublic):
    email: str


class ReservationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    car: CarListItem
    buyer: BuyerContact
    status: ReservationStatus
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
