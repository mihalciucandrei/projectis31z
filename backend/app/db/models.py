"""ORM-модели — соответствуют схеме AutoMarket (DBML) из ТЗ."""
import enum
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class UserRole(str, enum.Enum):
    buyer = "buyer"
    seller = "seller"
    admin = "admin"


class FuelType(str, enum.Enum):
    petrol = "petrol"
    diesel = "diesel"
    hybrid = "hybrid"
    electric = "electric"
    gas = "gas"


class TransmissionType(str, enum.Enum):
    manual = "manual"
    automatic = "automatic"


class BodyType(str, enum.Enum):
    sedan = "sedan"
    hatchback = "hatchback"
    suv = "suv"
    coupe = "coupe"
    wagon = "wagon"
    minivan = "minivan"
    pickup = "pickup"


class ListingStatus(str, enum.Enum):
    active = "active"
    reserved = "reserved"
    sold = "sold"
    archived = "archived"


class ReservationStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    expired = "expired"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), nullable=False, default=UserRole.buyer)
    phone: Mapped[Optional[str]] = mapped_column(String(40))
    city: Mapped[Optional[str]] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, server_default=func.now())


class CarPhoto(Base):
    __tablename__ = "car_photos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    car_id: Mapped[int] = mapped_column(ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_main: Mapped[bool] = mapped_column(Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, default=0)


class Car(Base):
    __tablename__ = "cars"
    __table_args__ = (Index("ix_cars_brand_city", "brand", "city"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    seller_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    brand: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    model: Mapped[str] = mapped_column(String(80), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, index=True)
    mileage: Mapped[int] = mapped_column(Integer, nullable=False)  # km
    fuel_type: Mapped[FuelType] = mapped_column(Enum(FuelType, name="fuel_type"), nullable=False)
    transmission: Mapped[TransmissionType] = mapped_column(Enum(TransmissionType, name="transmission_type"), nullable=False)
    body_type: Mapped[BodyType] = mapped_column(Enum(BodyType, name="body_type"), nullable=False)
    city: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[ListingStatus] = mapped_column(
        Enum(ListingStatus, name="listing_status"), nullable=False, default=ListingStatus.active, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow, server_default=func.now())

    seller: Mapped[User] = relationship(lazy="joined", innerjoin=True)
    photos: Mapped[list[CarPhoto]] = relationship(
        order_by="CarPhoto.order", cascade="all, delete-orphan", passive_deletes=True
    )

    @property
    def main_photo(self) -> Optional[str]:
        if not self.photos:
            return None
        return next((p.url for p in self.photos if p.is_main), self.photos[0].url)


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("user_id", "car_id", name="uq_favorite_user_car"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    car_id: Mapped[int] = mapped_column(ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, server_default=func.now())


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    car_id: Mapped[int] = mapped_column(ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, server_default=func.now())

    car: Mapped[Car] = relationship(lazy="joined", innerjoin=True)
    sender: Mapped[User] = relationship(foreign_keys=[sender_id], lazy="joined", innerjoin=True)
    receiver: Mapped[User] = relationship(foreign_keys=[receiver_id], lazy="joined", innerjoin=True)


class Reservation(Base):
    """Бизнес-правило: у авто может быть только одна активная бронь (pending/confirmed).
    Обеспечивается в сервисе через SELECT ... FOR UPDATE в одной транзакции."""

    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    car_id: Mapped[int] = mapped_column(ForeignKey("cars.id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[ReservationStatus] = mapped_column(
        Enum(ReservationStatus, name="reservation_status"), nullable=False, default=ReservationStatus.pending, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, server_default=func.now())
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    car: Mapped[Car] = relationship(lazy="joined", innerjoin=True)
    buyer: Mapped[User] = relationship(lazy="joined", innerjoin=True)
