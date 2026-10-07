from fastapi import HTTPException, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session

from app.db.models import Car, Message, User
from app.schemas.interaction import MessageCreate, MessageRead


def to_read(m: Message) -> MessageRead:
    return MessageRead(
        id=m.id, car_id=m.car_id, car_title=f"{m.car.brand} {m.car.model} {m.car.year}",
        sender_id=m.sender_id, sender_name=m.sender.name,
        receiver_id=m.receiver_id, receiver_name=m.receiver.name,
        message_text=m.message_text, is_read=m.is_read, created_at=m.created_at,
    )


def send_message(db: Session, sender: User, data: MessageCreate) -> Message:
    car = db.get(Car, data.car_id)
    if car is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Объявление не найдено")

    if sender.id == car.seller_id:  # продавец отвечает покупателю
        if data.receiver_id is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Укажите получателя (receiver_id)")
        had_dialog = db.scalar(
            select(Message.id).where(
                Message.car_id == car.id, Message.sender_id == data.receiver_id, Message.receiver_id == sender.id
            ).limit(1)
        )
        if not had_dialog:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Этот пользователь не писал вам по данному объявлению")
        receiver_id = data.receiver_id
    else:
        receiver_id = car.seller_id

    msg = Message(car_id=car.id, sender_id=sender.id, receiver_id=receiver_id, message_text=data.message_text.strip())
    db.add(msg)
    db.commit()
    return msg


def my_messages(db: Session, user: User) -> list[Message]:
    stmt = (
        select(Message)
        .where(or_(Message.sender_id == user.id, Message.receiver_id == user.id))
        .order_by(Message.created_at.asc(), Message.id.asc())
    )
    return list(db.scalars(stmt).unique().all())


def mark_thread_read(db: Session, user: User, car_id: int, with_user_id: int) -> None:
    db.execute(
        update(Message)
        .where(Message.receiver_id == user.id, Message.sender_id == with_user_id,
               Message.car_id == car_id, Message.is_read.is_(False))
        .values(is_read=True)
    )
    db.commit()


def unread_count(db: Session, user: User) -> int:
    return db.scalar(
        select(func.count()).select_from(Message).where(Message.receiver_id == user.id, Message.is_read.is_(False))
    ) or 0
