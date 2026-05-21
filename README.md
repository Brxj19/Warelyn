# Warelyn Inventory

**Inventory that moves with your business.**

Warelyn Inventory is a production-style inventory and warehouse operations platform for growing businesses to manage products, warehouses, stock movements, purchases, sales, returns, reports, and team operations from one SaaS workspace.

## Current Status

This repository is at **Phase 0: foundation only**.

The current implementation provides:

- FastAPI backend scaffold with health endpoint, settings, middleware, exception handling, database session setup, and Alembic foundation.
- React + Vite + Tailwind frontend scaffold with layouts, placeholder pages, UI primitives, routing, and API client wrapper.
- MySQL, backend, and frontend development services in Docker Compose.

Not implemented yet:

- Full authentication or JWT flows.
- Tenant onboarding and tenant authorization.
- Product CRUD.
- Inventory workflows.
- Purchase or sales flows.
- Database business tables or migrations.

## Next Phase

Next recommended phase: **auth and tenant foundation**.

Before adding business workflows, implement user identity, tenant context, permissions, and repository-level tenant isolation.

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
      api/                      Root API router and health route
      core/                     Settings, middleware, exceptions, security placeholders
      db/                       SQLAlchemy Base and session setup
      dependencies/             Future FastAPI dependencies
      models/                   Future SQLAlchemy models
      repositories/             Future DB access layer
      schemas/                  Future request/response schemas
      services/                 Future business services
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
- `InventoryEngine` will be the only stock mutation path once inventory workflows begin.
- Frontend pages stay thin and call service/API wrappers.
- Frontend never calculates authoritative stock.
