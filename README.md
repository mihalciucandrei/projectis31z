# AutoMarket

Веб-платформа продажи автомобилей по ТЗ «AutoMarket — Phase 1».
Один репозиторий: **backend** (Python, FastAPI) + **frontend** (Next.js, JavaScript) + PostgreSQL.

```
automarket/
├── backend/    FastAPI · SQLAlchemy · Pydantic · JWT · bcrypt
├── frontend/   Next.js 14 (App Router, JS) · Tailwind · Axios
└── docker-compose.yml   db + backend + frontend одной командой
```

## Запуск одной командой

```bash
docker compose up --build
```

| Что | Адрес |
|---|---|
| Сайт | http://localhost:3000 |
| Swagger (OpenAPI) | http://localhost:8000/docs |

При первом старте backend создаёт таблицы и заполняет демо-данные (25 авто, 4 пользователя).

| Роль | Email | Пароль |
|---|---|---|
| Администратор | admin@automarket.md | admin123 |
| Продавец | seller@automarket.md | seller123 |
| Покупатель | buyer@automarket.md | buyer123 |

## Запуск без Docker (разработка)

```bash
# 1. БД
docker compose up -d db

# 2. backend
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload                          # http://localhost:8000

# 3. frontend (в другом терминале)
cd frontend
npm install
npm run dev                                            # http://localhost:3000
```

Браузер обращается только к Next.js: запросы `/api/*` и `/uploads/*` проксируются в backend
(`next.config.js`, переменная `BACKEND_URL`, по умолчанию `http://localhost:8000`), поэтому CORS не мешает.

Тесты backend (SQLite во временной папке, PostgreSQL не нужен): `cd backend && pytest`.

## Соответствие ТЗ

**Схема БД** (`backend/app/db/models.py`) — по DBML из ТЗ: `users`, `cars`, `car_photos`,
`favorites` (unique user+car), `messages`, `reservations` + enum-типы и индексы (brand, city, price, status, (brand, city)).

**Роли**: гость / покупатель / продавец / администратор; JWT (stateless), пароли — bcrypt.

| Возможность | Эндпоинты |
|---|---|
| Регистрация, вход, профиль | `POST /auth/register`, `POST /auth/login`, `GET/PUT /auth/me` |
| Каталог: фильтры, сортировка, пагинация | `GET /cars?brand=&city=&price_min=&price_max=&year_min=&year_max=&mileage_max=&fuel_type=&transmission=&body_type=&q=&sort=&page=&page_size=` |
| Справочники фильтров | `GET /cars/meta` |
| CRUD объявлений продавца | `GET /cars/mine`, `POST /cars`, `PUT/DELETE /cars/{id}` |
| Фото | `POST /cars/{id}/photos`, `PATCH .../photos/{pid}/main`, `DELETE .../photos/{pid}` |
| Избранное | `GET /favorites`, `POST/DELETE /favorites/{car_id}` |
| Обращения к продавцу | `POST /messages`, `GET /messages`, `POST /messages/read` |
| Бронирование | `POST /reservations`, `POST /reservations/{id}/confirm`, `.../cancel`, `GET /reservations/mine`, `/incoming` |
| Аналитика (admin) | `GET /admin/analytics/by-brand`, `/by-city`, `/by-month`, `/admin/summary` |
| Пользователи (admin) | `GET /admin/users`, `PATCH /admin/users/{id}/role`, `DELETE /admin/users/{id}` |

**Бронирование** (`services/reservation_service.py`) выполняется в одной транзакции с
`SELECT ... FOR UPDATE` по строке авто: два покупателя не смогут занять один автомобиль.
Статусы авто: `active → reserved → sold`. Подтверждает продавец, отменяет продавец или покупатель
(авто возвращается в `active`). Неподтверждённая бронь истекает через 48 часов (`RESERVATION_TTL_HOURS`).

## Структура backend

```
app/
  core/        config (pydantic-settings), security (JWT, bcrypt)
  db/          models, session, seed
  schemas/     Pydantic-схемы запросов/ответов
  services/    бизнес-логика и работа с БД
  api/         deps (авторизация, роли) и v1/routes (роутеры)
  tests/       pytest: auth, каталог, избранное, сообщения, бронирование, аналитика
```

## Что изменено относительно присланного проекта

- Старый `autosalon-backend` (MySQL; `car_brands`, `orders`, `order_cars`) не соответствует ТЗ и схеме БД,
  поэтому модель данных заменена на схему AutoMarket, СУБД — PostgreSQL. Слоистая идея
  (routes → services → db) сохранена; controllers/repositories/dto объединены в `services` для компактности.
- Alembic не используется: таблицы создаются при старте (`create_all`). Для продакшена стоит добавить миграции.
- Frontend сделан на **Next.js (JS)**, а не React+Vite, как в ТЗ — по вашему указанию.
- Валюта в интерфейсе — евро; интерфейс на русском (i18n по ТЗ не входит).
