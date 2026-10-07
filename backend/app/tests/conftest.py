import os
import tempfile

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["UPLOAD_DIR"] = f"{_tmp}/uploads"
os.environ["SEED_DEMO_DATA"] = "false"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    with TestClient(app) as c:
        yield c


def register(client, email, role="buyer", name="Test User"):
    r = client.post("/api/v1/auth/register", json={"name": name, "email": email, "password": "secret123", "role": role})
    assert r.status_code == 201, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


CAR = {"brand": "Toyota", "model": "Corolla", "year": 2020, "price": 15000, "mileage": 50000,
       "fuel_type": "hybrid", "transmission": "automatic", "body_type": "sedan", "city": "Chișinău"}
