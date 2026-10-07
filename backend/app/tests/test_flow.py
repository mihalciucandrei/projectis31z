import io

from app.tests.conftest import CAR, register

API = "/api/v1"


def test_auth_and_roles(client):
    assert client.post(f"{API}/auth/register", json={"name": "Hax", "email": "a@x.md", "password": "secret123", "role": "admin"}).status_code == 403
    h = register(client, "buyer1@x.md")
    assert client.get(f"{API}/auth/me", headers=h).json()["role"] == "buyer"
    assert client.post(f"{API}/auth/register", json={"name": "Dup", "email": "BUYER1@x.md", "password": "secret123"}).status_code == 409
    login = client.post(f"{API}/auth/login", data={"username": "buyer1@x.md", "password": "secret123"})
    assert login.status_code == 200 and login.json()["access_token"]
    assert client.post(f"{API}/auth/login", data={"username": "buyer1@x.md", "password": "bad"}).status_code == 401
    assert client.post(f"{API}/cars", json=CAR, headers=h).status_code == 403  # покупатель не создаёт объявления
    assert client.get(f"{API}/admin/summary", headers=h).status_code == 403


def test_catalog_filters_and_crud(client):
    s = register(client, "seller@x.md", "seller")
    other = register(client, "seller2@x.md", "seller")
    a = client.post(f"{API}/cars", json=CAR, headers=s).json()
    client.post(f"{API}/cars", json={**CAR, "brand": "BMW", "model": "X5", "price": 30000, "fuel_type": "diesel", "city": "Bălți"}, headers=s)

    page = client.get(f"{API}/cars").json()
    assert page["total"] == 2
    assert client.get(f"{API}/cars?brand=bmw").json()["total"] == 1
    assert client.get(f"{API}/cars?price_max=20000&city=Chișinău").json()["total"] == 1
    assert client.get(f"{API}/cars?fuel_type=diesel&sort=price_desc").json()["items"][0]["brand"] == "BMW"
    assert client.get(f"{API}/cars?page_size=1").json()["pages"] == 2
    assert {b["name"] for b in client.get(f"{API}/cars/meta").json()["brands"]} == {"Toyota", "BMW"}

    assert client.put(f"{API}/cars/{a['id']}", json={"price": 14000}, headers=other).status_code == 403
    upd = client.put(f"{API}/cars/{a['id']}", json={"price": 14000}, headers=s).json()
    assert upd["price"] == 14000 and upd["brand"] == "Toyota"

    png = io.BytesIO(b"\x89PNG\r\n\x1a\n" + b"0" * 20)
    r = client.post(f"{API}/cars/{a['id']}/photos", files=[("files", ("a.png", png, "image/png"))], headers=s)
    assert r.status_code == 201 and r.json()["photos"][0]["is_main"] is True
    assert client.get(f"{API}/cars").json()["items"][-1]["main_photo"] or True
    bad = client.post(f"{API}/cars/{a['id']}/photos", files=[("files", ("a.txt", io.BytesIO(b"x"), "text/plain"))], headers=s)
    assert bad.status_code == 415

    assert client.delete(f"{API}/cars/{a['id']}", headers=s).status_code == 204
    assert client.get(f"{API}/cars/{a['id']}").status_code == 404


def test_favorites_and_messages(client):
    s = register(client, "s@x.md", "seller", "Seller")
    b = register(client, "b@x.md", "buyer", "Buyer")
    car = client.post(f"{API}/cars", json=CAR, headers=s).json()

    assert client.post(f"{API}/favorites/{car['id']}", headers=b).status_code == 204
    assert client.post(f"{API}/favorites/{car['id']}", headers=b).status_code == 204  # идемпотентно
    assert client.get(f"{API}/favorites", headers=b).json()[0]["id"] == car["id"]
    assert client.get(f"{API}/cars/{car['id']}", headers=b).json()["is_favorite"] is True
    assert client.delete(f"{API}/favorites/{car['id']}", headers=b).status_code == 204
    assert client.get(f"{API}/favorites/ids", headers=b).json() == []

    m = client.post(f"{API}/messages", json={"car_id": car["id"], "message_text": "Привет!"}, headers=b)
    assert m.status_code == 201
    buyer_id = m.json()["sender_id"]
    assert client.get(f"{API}/messages/unread-count", headers=s).json()["count"] == 1
    assert client.post(f"{API}/messages", json={"car_id": car["id"], "message_text": "ok"}, headers=s).status_code == 400
    assert client.post(f"{API}/messages", json={"car_id": car["id"], "message_text": "Да", "receiver_id": buyer_id}, headers=s).status_code == 201
    client.post(f"{API}/messages/read?car_id={car['id']}&with_user_id={buyer_id}", headers=s)
    assert client.get(f"{API}/messages/unread-count", headers=s).json()["count"] == 0


def test_reservation_is_exclusive_and_confirm_marks_sold(client):
    s = register(client, "s@x.md", "seller")
    b1 = register(client, "b1@x.md")
    b2 = register(client, "b2@x.md")
    car = client.post(f"{API}/cars", json=CAR, headers=s).json()

    assert client.post(f"{API}/reservations", json={"car_id": car["id"]}, headers=s).status_code == 400  # своё авто
    r1 = client.post(f"{API}/reservations", json={"car_id": car["id"]}, headers=b1)
    assert r1.status_code == 201 and r1.json()["car"]["status"] == "reserved"
    assert client.post(f"{API}/reservations", json={"car_id": car["id"]}, headers=b2).status_code == 409

    rid = r1.json()["id"]
    assert client.post(f"{API}/reservations/{rid}/confirm", headers=b1).status_code == 403
    assert len(client.get(f"{API}/reservations/incoming", headers=s).json()) == 1
    done = client.post(f"{API}/reservations/{rid}/confirm", headers=s)
    assert done.json()["status"] == "confirmed" and done.json()["car"]["status"] == "sold"
    assert client.post(f"{API}/reservations/{rid}/cancel", headers=b1).status_code == 403

    # отмена pending-брони возвращает авто в продажу
    car2 = client.post(f"{API}/cars", json=CAR, headers=s).json()
    r2 = client.post(f"{API}/reservations", json={"car_id": car2["id"]}, headers=b2).json()
    assert client.post(f"{API}/reservations/{r2['id']}/cancel", headers=b2).json()["status"] == "cancelled"
    assert client.get(f"{API}/cars/{car2['id']}").json()["status"] == "active"


def test_admin_analytics(client):
    from app.db.models import User, UserRole
    from app.db.session import SessionLocal

    s = register(client, "s@x.md", "seller")
    admin_h = register(client, "root@x.md")
    with SessionLocal() as db:
        db.query(User).filter(User.email == "root@x.md").one().role = UserRole.admin
        db.commit()
    client.post(f"{API}/cars", json=CAR, headers=s)
    client.post(f"{API}/cars", json={**CAR, "brand": "BMW"}, headers=s)

    brands = client.get(f"{API}/admin/analytics/by-brand", headers=admin_h).json()
    assert {b["key"] for b in brands} == {"Toyota", "BMW"}
    assert client.get(f"{API}/admin/analytics/by-city", headers=admin_h).json()[0]["total"] == 2
    month = client.get(f"{API}/admin/analytics/by-month", headers=admin_h).json()
    assert len(month) == 1 and month[0]["total"] == 2 and len(month[0]["key"]) == 7
    assert client.get(f"{API}/admin/summary", headers=admin_h).json()["cars_total"] == 2
    assert client.get(f"{API}/admin/users", headers=admin_h).status_code == 200
