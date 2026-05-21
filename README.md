# Warelyn Inventory

**Inventory that moves with your business.**

Warelyn Inventory is a production-style inventory and warehouse operations platform for growing businesses to manage products, warehouses, stock movements, purchases, sales, returns, reports, and team operations from one SaaS workspace.

## Current Status

This repository has completed **Phase 7 - Picking, Packing, and Serial Allocation Foundation**.

Related commits:

- Implementation: `dbd9752 implement Warelyn auth and tenant foundation`
- Planning alignment: `0137f69 update backlog with auth and tenant foundation phase`

The current implementation provides:

- FastAPI backend scaffold with health endpoint, settings, middleware, exception handling, database session setup, and Alembic foundation.
- `Tenant`, `User`, and `RefreshToken` models with roles, statuses, password hashing, JWT access tokens, JWT refresh tokens, login, registration, logout, refresh, and `auth/me` backend foundation.
- Tenant-scoped category, brand, vendor, customer, product, warehouse, and warehouse location master data APIs.
- Tenant-scoped `InventoryEngine`, stock ledger, warehouse stock projection, stock reservation foundation, idempotency, and reconciliation dry-run APIs.
- CSV product import with upload, validation, preview, commit, cancel, duplicate checks, tenant isolation, and barcode-ready product search.
- Tenant-scoped purchase orders, purchase order items, purchase receipts, partial receiving, and receipt commit through `InventoryEngine.stock_in()`.
- Batch, expiry, and serial traceability records for tracked products, with ledger references created by `InventoryEngine.stock_in()`.
- Tenant-scoped sales orders, explicit location-level sales reservation, reservation release, and fulfillment deduction through `InventoryEngine`.
- Tenant-scoped pick tasks, pick task items, explicit serial allocation during picking, optional batch allocation, packages, and package items.
- React + Vite + Tailwind frontend scaffold with layouts, catalog and warehouse pages, UI primitives, routing, and API client wrapper.
- Frontend auth shell with login, registration, protected routes, auth state, and authenticated dashboard placeholder.
- Product import UI with CSV dropzone, preview table, import modes, and reusable scanner-friendly barcode input.
- Purchase order, receiving, and receipt detail screens with warehouse/location receiving and committed stock impact.
- Purchase receiving fields for batch number, expiry, warranty, and serial capture on tracked products.
- Sales order, sales confirmation allocation, fulfillment draft, and fulfillment commit screens.
- Picking queue, pick task detail, sales pick, sales package, and package detail screens.
- MySQL, backend, and frontend development services in Docker Compose.

Not implemented yet:

- XLSX import and import column mapping UI.
- Vendor bills, supplier payments, invoice accounting, and purchase PDFs.
- Carrier shipment, invoice accounting, payment collection, or returns QC workflows.
- FEFO auto-allocation, expiry background jobs, package-mandatory fulfillment, and full mobile scanner workflow.
- Advanced role/user management screens.

## Next Phase

Next recommended phase: **Phase 8 - Returns QC Foundation** or **Phase 8 - Reports, Reorder Rules, and Operational Dashboards**.

Before adding later workflows, keep tenant context backend-derived from authenticated users and avoid passing arbitrary tenant IDs from normal tenant APIs. All stock mutation must continue through `InventoryEngine`; purchase receipt commit increases stock only through `InventoryEngine.stock_in()`, sales confirmation reserves through `InventoryEngine.reserve_stock()`, sales cancellation/close releases through `InventoryEngine.release_reservation()`, picking and packing do not mutate stock, and fulfillment commit deducts through `InventoryEngine.deduct_reserved_stock()`.

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
      api/                      Root API router, health, auth, catalog, warehouse, inventory, import, purchase routes
      core/                     Settings, middleware, exceptions, security helpers
      db/                       SQLAlchemy Base and session setup
      dependencies/             Current user, role, tenant dependencies
      domain/                   Inventory engine domain logic
      models/                   Auth, tenant, catalog, warehouse, inventory, import, purchase models
      repositories/             Auth, tenant, catalog, warehouse, inventory, import, purchase DB access layer
      schemas/                  Auth, catalog, warehouse, inventory, import, purchase request/response schemas
      services/                 Auth, catalog, warehouse, inventory, import, purchase business services
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

Purchase endpoints:

- `GET|POST /api/purchase-orders`
- `GET|PATCH /api/purchase-orders/{po_id}`
- `POST /api/purchase-orders/{po_id}/submit`
- `POST /api/purchase-orders/{po_id}/cancel`
- `POST /api/purchase-orders/{po_id}/close`
- `GET|POST /api/purchase-orders/{po_id}/receipts`
- `GET|PATCH /api/purchase-receipts/{receipt_id}`
- `POST /api/purchase-receipts/{receipt_id}/commit`
- `POST /api/purchase-receipts/{receipt_id}/cancel`

Sales endpoints:

- `GET|POST /api/sales-orders`
- `GET|PATCH /api/sales-orders/{order_id}`
- `POST /api/sales-orders/{order_id}/confirm`
- `POST /api/sales-orders/{order_id}/cancel`
- `POST /api/sales-orders/{order_id}/close`
- `GET|POST /api/sales-orders/{order_id}/fulfillments`
- `GET|PATCH /api/sales-fulfillments/{fulfillment_id}`
- `POST /api/sales-fulfillments/{fulfillment_id}/commit`
- `POST /api/sales-fulfillments/{fulfillment_id}/cancel`

Picking and packing endpoints:

- `GET /api/pick-tasks`
- `POST /api/sales-orders/{order_id}/pick-tasks`
- `GET /api/sales-orders/{order_id}/pick-tasks`
- `GET /api/pick-tasks/{pick_task_id}`
- `PATCH /api/pick-tasks/{pick_task_id}`
- `POST /api/pick-tasks/{pick_task_id}/start`
- `POST /api/pick-tasks/{pick_task_id}/pick`
- `POST /api/pick-tasks/{pick_task_id}/cancel`
- `POST /api/sales-orders/{order_id}/packages`
- `GET /api/sales-orders/{order_id}/packages`
- `GET /api/packages/{package_id}`
- `PATCH /api/packages/{package_id}`
- `POST /api/packages/{package_id}/pack`
- `POST /api/packages/{package_id}/cancel`

Warehouse endpoints:

- `GET|POST /api/warehouses`
- `PATCH /api/warehouses/{warehouse_id}`
- `GET|POST /api/warehouses/{warehouse_id}/locations`
- `PATCH /api/warehouses/{warehouse_id}/locations/{location_id}`

Inventory endpoints:

- `GET /api/inventory/stock`
- `GET /api/inventory/ledger`
- `GET /api/inventory/batches`
- `GET /api/inventory/batches/{batch_id}`
- `GET /api/inventory/serials`
- `GET /api/inventory/serials/{serial_id}`
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
- Purchase receipt commit calls `InventoryEngine.stock_in()` and does not directly update stock tables.
- Sales confirmation and fulfillment call reservation/deduction methods on `InventoryEngine` and do not directly update stock tables.
- Frontend pages stay thin and call service/API wrappers.
- Frontend never calculates authoritative stock.
