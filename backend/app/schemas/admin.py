from typing import Optional

from pydantic import BaseModel

from app.db.models import UserRole


class RoleUpdate(BaseModel):
    role: UserRole


class GroupStat(BaseModel):
    key: str
    total: int
    active: int
    sold: int
    avg_price: Optional[float] = None


class PlatformSummary(BaseModel):
    users: int
    cars_total: int
    cars_active: int
    cars_reserved: int
    cars_sold: int
    reservations_pending: int
    reservations_confirmed: int
    messages: int
