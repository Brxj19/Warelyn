# Warelyn Inventory

**Inventory that moves with your business.**

Warelyn Inventory is a production-style inventory and warehouse operations platform for growing businesses to manage products, warehouses, stock movements, purchases, sales, returns, reports, and team operations from one SaaS workspace.

## Current Status

This repository has completed **Phase 3 - Product import and barcode-ready catalog**.

Related commits:

- Implementation: `dbd9752 implement Warelyn auth and tenant foundation`
- Planning alignment: `0137f69 update backlog with auth and tenant foundation phase`

The current implementation provides:

- FastAPI backend scaffold with health endpoint, settings, middleware, exception handling, database session setup, and Alembic foundation.
- `Tenant`, `User`, and `RefreshToken` models with roles, statuses, password hashing, JWT access tokens, JWT refresh tokens, login, registration, logout, refresh, and `auth/me` backend foundation.
- Tenant-scoped category, brand, vendor, customer, product, warehouse, and warehouse location master data APIs.
- Tenant-scoped `InventoryEngine`, stock ledger, warehouse stock projection, stock reservation foundation, idempotency, and reconciliation dry-run APIs.
- CSV product import with upload, validation, preview, commit, cancel, duplicate checks, tenant isolation, and barcode-ready product search.
- React + Vite + Tailwind frontend scaffold with layouts, catalog and warehouse pages, UI primitives, routing, and API client wrapper.
- Frontend auth shell with login, registration, protected routes, auth state, and authenticated dashboard placeholder.
- Product import UI with CSV dropzone, preview table, import modes, and reusable scanner-friendly barcode input.
- MySQL, backend, and frontend development services in Docker Compose.

Not implemented yet:

- XLSX import and import column mapping UI.
- Purchase receiving workflow.
- Sales order, picking, packing, delivery, or returns QC workflows.
- Batch, expiry, and serial tracking.
- Advanced role/user management screens.

## Next Phase

Next recommended phase: **Phase 4 - Warehouse locations and bin tracking**.

Before adding later workflows, keep tenant context backend-derived from authenticated users and avoid passing arbitrary tenant IDs from normal tenant APIs. All stock mutation must continue through `InventoryEngine`; product import only creates or updates product master data and must not create stock records or ledger entries.

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
      api/                      Root API router, health, auth, catalog, warehouse, inventory, import routes
      core/                     Settings, middleware, exceptions, security helpers
      db/                       SQLAlchemy Base and session setup
      dependencies/             Current user, role, tenant dependencies
      domain/                   Inventory engine domain logic
      models/                   Auth, tenant, catalog, warehouse, inventory, import models
      repositories/             Auth, tenant, catalog, warehouse, inventory, import DB access layer
      schemas/                  Auth, catalog, warehouse, inventory, import request/response schemas
      services/                 Auth, catalog, warehouse, inventory, import business services
      utils/                    Shared backend utilities
      main.py                   FastAPI app factory
    alembic/                    Migration environment
    tests/                      Backend tests
  frontend/
    src/
      app/                      React entry and app shell
      components/ui/            Reusable UI primitives
      layouts/                  App and auth layouts
      pages/                    Dashboard, auth, catalog, and warehouse pages
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

Catalog endpoints:

- `GET|POST /api/catalog/categories`
- `PATCH /api/catalog/categories/{category_id}`
- `GET|POST /api/catalog/brands`
- `PATCH /api/catalog/brands/{brand_id}`
- `GET|POST /api/catalog/vendors`
- `PATCH /api/catalog/vendors/{vendor_id}`
- `GET|POST /api/catalog/customers`
- `PATCH /api/catalog/customers/{customer_id}`
- `GET|POST /api/catalog/products` with optional `?search=` by name, SKU, or barcode
- `PATCH /api/catalog/products/{product_id}`

Product import endpoints:

- `POST /api/imports/products/upload`
- `GET /api/imports/products/{job_id}`
- `GET /api/imports/products/{job_id}/rows`
- `POST /api/imports/products/{job_id}/validate`
- `POST /api/imports/products/{job_id}/commit`
- `POST /api/imports/products/{job_id}/cancel`

Warehouse endpoints:

- `GET|POST /api/warehouses`
- `PATCH /api/warehouses/{warehouse_id}`
- `GET|POST /api/warehouses/{warehouse_id}/locations`
- `PATCH /api/warehouses/{warehouse_id}/locations/{location_id}`

Inventory endpoints:

- `GET /api/inventory/stock`
- `GET /api/inventory/ledger`
- `GET /api/inventory/reconciliation/dry-run`
- `POST /api/inventory/stock-in`
- `POST /api/inventory/stock-out`
- `POST /api/inventory/adjust`
- `POST /api/inventory/reserve`
- `POST /api/inventory/reservations/{id}/release`
- `POST /api/inventory/reservations/{id}/deduct`
- `POST /api/inventory/transfer`

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
- Phase 2 inventory mutation endpoints require idempotency keys and location-level stock dimensions.
- Product import does not call `InventoryEngine` because it does not mutate stock.
- Frontend pages stay thin and call service/API wrappers.
- Frontend never calculates authoritative stock.
