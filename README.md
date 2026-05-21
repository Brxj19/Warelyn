# Warelyn Inventory

**Inventory that moves with your business.**

Warelyn Inventory is a production-style inventory and warehouse operations platform for growing businesses to manage products, warehouses, stock movements, purchases, sales, returns, reports, and team operations from one SaaS workspace.

## Current Status

This repository has completed **Phase 1A - Auth and Tenant Foundation**.

Related commits:

- Implementation: `dbd9752 implement Warelyn auth and tenant foundation`
- Planning alignment: `0137f69 update backlog with auth and tenant foundation phase`

The current implementation provides:

- FastAPI backend scaffold with health endpoint, settings, middleware, exception handling, database session setup, and Alembic foundation.
- `Tenant`, `User`, and `RefreshToken` models with roles, statuses, password hashing, JWT access tokens, JWT refresh tokens, login, registration, logout, refresh, and `auth/me` backend foundation.
- React + Vite + Tailwind frontend scaffold with layouts, placeholder pages, UI primitives, routing, and API client wrapper.
- Frontend auth shell with login, registration, protected routes, auth state, and authenticated dashboard placeholder.
- MySQL, backend, and frontend development services in Docker Compose.

Not implemented yet:

- Product CRUD.
- Warehouse workflows.
- Inventory workflows.
- Stock ledger and `InventoryEngine`.
- Purchase, sales, or returns flows.
- Advanced role/user management screens.

## Next Phase

Next recommended phase: **Phase 1B - Tenant-scoped catalog and warehouse foundation**.

Phase 1B should add the base tenant-scoped repository pattern, base CRUD conventions, category/brand/vendor/customer/product models without stock mutation, warehouse model, warehouse location/bin foundation, tenant isolation tests, and frontend module shells for catalog and warehouses.

Before adding inventory workflows, keep tenant context backend-derived from authenticated users and avoid passing arbitrary tenant IDs from normal tenant APIs. Product CRUD and warehouse CRUD must not mutate stock; actual stock quantities, `InventoryEngine`, and stock ledger wait for Phase 2.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS.
- Backend: Python, FastAPI, Pydantic Settings.
- Database: MySQL.
- ORM and migrations: SQLAlchemy, Alembic.
- Tests: Pytest.
- Local orchestration: Docker Compose.

## Folder Structure

```text
.
  docs/                         Planning and architecture docs
  logo/                         Brand assets
  backend/
    app/
      api/                      Root API router, health route, auth route
      core/                     Settings, middleware, exceptions, security helpers
      db/                       SQLAlchemy Base and session setup
      dependencies/             Current user, role, tenant dependencies
      models/                   Tenant, user, refresh token models
      repositories/             Auth and tenant DB access layer
      schemas/                  Auth request/response schemas
      services/                 Auth and tenant business services
      utils/                    Shared backend utilities
      main.py                   FastAPI app factory
    alembic/                    Migration environment, no business tables yet
    tests/                      Backend tests
  frontend/
    src/
      app/                      React entry and app shell
      components/ui/            Reusable UI primitives
      layouts/                  App and auth layouts
      pages/                    Placeholder pages
      routes/                   Route declarations
      services/                 Frontend API client wrapper
      styles/                   Tailwind and app styles
```

## Local Setup

Prerequisites:

- Python 3.11+
- Node.js 20+
- Docker and Docker Compose
- MySQL 8 if running without Docker

Backend setup:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Frontend setup:

```bash
cd frontend
npm install
cp .env.example .env
```

## Backend Commands

```bash
cd backend
.venv/bin/python -m compileall app
.venv/bin/python -m pytest
.venv/bin/alembic upgrade head
.venv/bin/python -m app.utils.seed_super_admin
.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "Warelyn Inventory API"
}
```

Auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Required backend environment variables are listed in `backend/.env.example`, including JWT settings and optional super admin seed settings.

## Frontend Commands

```bash
cd frontend
npm install
npm run dev
npm run build
```

## Docker Commands

```bash
docker compose config
docker compose up --build
docker compose down
```

Development URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- MySQL: `localhost:3306`

## Architecture Rules

- Routers stay thin and handle HTTP only.
- Services own business workflows.
- Repositories own database access.
- Backend enforces tenant isolation.
- Tenant ID for normal tenant business APIs must come from the authenticated user context, not arbitrary frontend input.
- `InventoryEngine` will be the only stock mutation path once inventory workflows begin.
- Frontend pages stay thin and call service/API wrappers.
- Frontend never calculates authoritative stock.
