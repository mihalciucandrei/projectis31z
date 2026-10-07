"""Демо-данные: запускаются один раз, если таблица users пуста."""
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.models import (
    Car, CarPhoto, Favorite, ListingStatus, Message, Reservation, ReservationStatus, User, UserRole, utcnow,
)

USERS = [
    ("Администратор", "admin@automarket.md", "admin123", UserRole.admin, "+373 22 000 000", "Chișinău"),
    ("Андрей Попеску", "seller@automarket.md", "seller123", UserRole.seller, "+373 69 111 222", "Chișinău"),
    ("AutoCentru Bălți", "dealer@automarket.md", "seller123", UserRole.seller, "+373 68 333 444", "Bălți"),
    ("Мария Чебан", "buyer@automarket.md", "buyer123", UserRole.buyer, "+373 79 555 666", "Chișinău"),
]

# brand, model, year, price, mileage, fuel, transmission, body, city, seller_idx, days_ago, status, description
CARS = [
    ("Volkswagen", "Golf 7", 2016, 11200, 142000, "diesel", "manual", "hatchback", "Chișinău", 1, 5, "active", "Один владелец, полное обслуживание у дилера, зимняя резина в комплекте."),
    ("Volkswagen", "Passat B8", 2018, 17900, 128000, "diesel", "automatic", "wagon", "Bălți", 2, 12, "active", "Универсал для семьи: DSG, адаптивный круиз, навигация."),
    ("Volkswagen", "Tiguan", 2019, 23500, 87000, "petrol", "automatic", "suv", "Chișinău", 1, 20, "active", "4Motion, панорамная крыша, камера заднего вида."),
    ("BMW", "320d", 2017, 19800, 156000, "diesel", "automatic", "sedan", "Chișinău", 1, 33, "active", "M-пакет, кожаный салон, обслуживание по книжке."),
    ("BMW", "X5", 2015, 24900, 189000, "diesel", "automatic", "suv", "Cahul", 2, 41, "active", "xDrive30d, пневмоподвеска, не крашена."),
    ("BMW", "i3", 2019, 15400, 62000, "electric", "automatic", "hatchback", "Chișinău", 1, 8, "active", "Электромобиль, запас хода около 260 км, зарядный кабель в комплекте."),
    ("Mercedes-Benz", "C 220 d", 2018, 22700, 118000, "diesel", "automatic", "sedan", "Chișinău", 1, 15, "active", "AMG Line, LED-фары, подогрев сидений."),
    ("Mercedes-Benz", "E 250", 2014, 14600, 201000, "diesel", "automatic", "sedan", "Bălți", 2, 55, "active", "Комфортный бизнес-седан, всё работает, торг уместен."),
    ("Mercedes-Benz", "Vito Tourer", 2017, 21500, 175000, "diesel", "manual", "minivan", "Orhei", 2, 27, "active", "9 мест, кондиционер, идеально для семьи или такси."),
    ("Audi", "A4 Avant", 2016, 16900, 164000, "diesel", "automatic", "wagon", "Chișinău", 1, 18, "active", "Quattro, S-line, комплект летней резины."),
    ("Audi", "Q5", 2017, 25800, 133000, "diesel", "automatic", "suv", "Bălți", 2, 3, "active", "Quattro, виртуальная панель, пакет Technology."),
    ("Toyota", "Corolla", 2020, 18300, 54000, "hybrid", "automatic", "sedan", "Chișinău", 1, 2, "active", "Гибрид, расход около 4.5 л/100 км, гарантия до 2027."),
    ("Toyota", "RAV4", 2018, 24300, 96000, "hybrid", "automatic", "suv", "Ungheni", 2, 36, "active", "Гибрид AWD, камера 360°, один хозяин."),
    ("Toyota", "Yaris", 2015, 8900, 110000, "petrol", "manual", "hatchback", "Bălți", 2, 70, "active", "Экономичный городской вариант, без вложений."),
    ("Toyota", "Hilux", 2016, 26500, 174000, "diesel", "manual", "pickup", "Soroca", 2, 45, "active", "Рабочая лошадка, фаркоп, защита днища."),
    ("Skoda", "Octavia", 2019, 15700, 121000, "petrol", "manual", "sedan", "Chișinău", 1, 9, "active", "Style, 1.5 TSI, парктроники, климат-контроль."),
    ("Skoda", "Superb", 2017, 17400, 149000, "diesel", "automatic", "wagon", "Cahul", 2, 60, "active", "Огромный салон, DSG, Columbus навигация."),
    ("Dacia", "Duster", 2020, 13900, 68000, "gas", "manual", "suv", "Chișinău", 1, 6, "active", "Заводское ГБО, 4x4, хорошее состояние."),
    ("Dacia", "Logan", 2018, 6900, 99000, "gas", "manual", "sedan", "Orhei", 2, 80, "active", "Самый практичный вариант для города и поездок."),
    ("Renault", "Megane", 2017, 9800, 138000, "diesel", "manual", "hatchback", "Bălți", 2, 95, "active", "Экономичный дизель, свежее ТО."),
    ("Ford", "Focus", 2016, 8700, 152000, "petrol", "manual", "wagon", "Chișinău", 1, 110, "active", "Универсал 1.0 EcoBoost, надёжный и недорогой."),
    ("Ford", "Mustang", 2015, 29900, 84000, "petrol", "automatic", "coupe", "Chișinău", 1, 22, "active", "5.0 V8 GT, спорт-выхлоп, состояние отличное."),
    ("Honda", "CR-V", 2017, 19600, 122000, "petrol", "automatic", "suv", "Ungheni", 2, 30, "active", "1.5 turbo, кожаный салон, обслуживание у дилера."),
    ("Tesla", "Model 3", 2020, 27800, 72000, "electric", "automatic", "sedan", "Chișinău", 1, 4, "active", "Long Range, автопилот, свежая батарея 91%."),
    ("Hyundai", "Tucson", 2019, 18900, 91000, "diesel", "automatic", "suv", "Chișinău", 1, 14, "reserved", "Полный привод, обогрев руля, камера."),
    ("Opel", "Astra", 2014, 6200, 175000, "diesel", "manual", "hatchback", "Bălți", 2, 130, "sold", "Продан — остаётся в архиве статистики."),
]

BRAND_PHOTO_URLS = {
    "Volkswagen": "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80",
    "BMW": "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    "Mercedes-Benz": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
    "Audi": "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80",
    "Toyota": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    "Skoda": "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=80",
    "Dacia": "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80",
    "Renault": "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1200&q=80",
    "Ford": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
    "Honda": "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1200&q=80",
    "Tesla": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
    "Hyundai": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    "Opel": "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80",
}


def seed_demo_data(db: Session) -> None:
    if db.scalar(select(User.id).limit(1)):
        return

    users = []
    for name, email, pwd, role, phone, city in USERS:
        u = User(name=name, email=email, password_hash=hash_password(pwd), role=role, phone=phone, city=city)
        db.add(u)
        users.append(u)
    db.flush()
    sellers = [users[1], users[2]]
    now = utcnow()

    cars = []
    for brand, model, year, price, km, fuel, trans, body, city, s_idx, days, status, desc in CARS:
        created = now - timedelta(days=days)
        c = Car(
            seller_id=sellers[s_idx - 1].id, brand=brand, model=model, year=year, price=price, mileage=km,
            fuel_type=fuel, transmission=trans, body_type=body, city=city, description=desc,
            status=ListingStatus(status), created_at=created, updated_at=created,
        )
        db.add(c)
        cars.append(c)
    db.flush()

    for car in cars:
        db.add(CarPhoto(car_id=car.id, url=BRAND_PHOTO_URLS.get(car.brand, BRAND_PHOTO_URLS["Volkswagen"]), is_main=True))

    buyer = users[3]
    for car in (cars[0], cars[5], cars[22]):
        db.add(Favorite(user_id=buyer.id, car_id=car.id))
    db.add(Message(car_id=cars[0].id, sender_id=buyer.id, receiver_id=cars[0].seller_id,
                   message_text="Здравствуйте! Автомобиль ещё в продаже? Можно посмотреть в выходные?"))
    db.add(Message(car_id=cars[0].id, sender_id=cars[0].seller_id, receiver_id=buyer.id,
                   message_text="Добрый день! Да, в продаже. Приезжайте в субботу после 11:00.", is_read=True))
    reserved = next(c for c in cars if c.status == ListingStatus.reserved)
    db.add(Reservation(car_id=reserved.id, buyer_id=buyer.id, status=ReservationStatus.pending))
    sold = next(c for c in cars if c.status == ListingStatus.sold)
    db.add(Reservation(car_id=sold.id, buyer_id=buyer.id, status=ReservationStatus.confirmed,
                       created_at=sold.created_at + timedelta(days=3), confirmed_at=sold.created_at + timedelta(days=4)))
    db.commit()
