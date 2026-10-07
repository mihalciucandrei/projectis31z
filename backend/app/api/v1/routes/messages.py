from fastapi import APIRouter, Response

from app.api.deps import DB, CurrentUser
from app.schemas.interaction import MessageCreate, MessageRead
from app.services import message_service as svc

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("", response_model=MessageRead, status_code=201)
def send(data: MessageCreate, user: CurrentUser, db: DB):
    return svc.to_read(svc.send_message(db, user, data))


@router.get("", response_model=list[MessageRead])
def my_messages(user: CurrentUser, db: DB):
    """Все сообщения пользователя (входящие и исходящие), по возрастанию времени."""
    return [svc.to_read(m) for m in svc.my_messages(db, user)]


@router.get("/unread-count")
def unread_count(user: CurrentUser, db: DB) -> dict:
    return {"count": svc.unread_count(db, user)}


@router.post("/read", status_code=204)
def mark_read(car_id: int, with_user_id: int, user: CurrentUser, db: DB):
    svc.mark_thread_read(db, user, car_id, with_user_id)
    return Response(status_code=204)
