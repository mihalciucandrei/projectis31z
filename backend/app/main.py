from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.routes import admin, auth, cars, favorites, health, messages, reservations
from app.core.config import settings
from app.db import models  # noqa: F401  (регистрирует таблицы в metadata)
from app.db.base import Base
from app.db.seed import seed_demo_data
from app.db.session import SessionLocal, engine, wait_for_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    wait_for_db()
    Base.metadata.create_all(bind=engine)
    if settings.seed_demo_data:
        with SessionLocal() as db:
            seed_demo_data(db)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description="REST API платформы продажи автомобилей AutoMarket",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware, allow_origins=settings.cors_origin_list,
        allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
    )
    for module in (health, auth, cars, favorites, messages, reservations, admin):
        app.include_router(module.router, prefix=settings.api_v1_prefix)

    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
    return app


app = create_app()
