# Warelyn Database Design

Source of truth: `docs/WARELYN_REAL_WORLD_V2_PRD.md` plus current Alembic migrations.

## Current Phase

Phase 1B tenant-scoped catalog and warehouse foundation is complete.

Related commits:

- Implementation: `dbd9752 implement Warelyn auth and tenant foundation`
- Planning alignment: `0137f69 update backlog with auth and tenant foundation phase`

Inventory quantities, stock ledger, purchase, sales, and returns workflow tables are not implemented yet.

Current implemented models:

- `Tenant`
- `User`
- `RefreshToken`
- `Category`
- `Brand`
- `Vendor`
- `Customer`
- `Product`
- `Warehouse`
- `WarehouseLocation`

Next recommended phase: `Phase 2 - Inventory Engine and stock ledger`. Product, warehouse, and location master data do not hold stock balances or mutate stock.

## Tables

### `tenants`

Tenant workspace record.

Columns:

- `id` primary key
- `company_name` required
- `contact_email` required, indexed
- `phone` nullable
- `address` nullable
- `gst_number` nullable
- `business_type` nullable
- `status`: `ACTIVE`, `DISABLED`, `PENDING`, indexed
- `created_at`
- `updated_at`

### `users`

User identity record. Tenant users belong to one tenant. `SUPER_ADMIN` users have `tenant_id = null`.

Columns:

- `id` primary key
- `tenant_id` nullable foreign key to `tenants.id`, indexed
- `name` required
- `email` required, unique, indexed
- `phone` nullable
- `password_hash` required
- `role`: `SUPER_ADMIN`, `TENANT_ADMIN`, `INVENTORY_MANAGER`, `SALES_STAFF`, `PURCHASE_STAFF`, `VIEWER`, indexed
- `status`: `ACTIVE`, `DISABLED`, `INVITED`, indexed
- `email_verified_at` nullable
- `phone_verified_at` nullable
- `last_login_at` nullable
- `created_at`
- `updated_at`

### `refresh_tokens`

Stored refresh token records. Raw refresh tokens are never persisted; only SHA-256 token hashes are stored.

Columns:

- `id` primary key
- `user_id` required foreign key to `users.id`, indexed
- `token_hash` required, unique, indexed
- `expires_at` required, indexed
- `revoked_at` nullable
- `created_at`

### Catalog And Warehouse Master Data

Tenant-scoped master data tables added by `20260521_0002_catalog_warehouse_foundation.py`:

- `categories`: tenant, name, description, status, timestamps; unique `(tenant_id, name)`.
- `brands`: tenant, name, description, status, timestamps; unique `(tenant_id, name)`.
- `vendors`: tenant, name, email, phone, address, GST number, status, timestamps; unique `(tenant_id, name)`.
- `customers`: tenant, name, email, phone, address, GST number, status, timestamps; unique `(tenant_id, email)`.
- `products`: tenant, optional category/brand, name, SKU, barcode, description, unit, prices, reorder level, tracking flags, status, timestamps; unique `(tenant_id, sku)` and `(tenant_id, barcode)`.
- `warehouses`: tenant, name, code, address, status, timestamps; unique `(tenant_id, code)`.
- `warehouse_locations`: tenant, warehouse, optional parent location, code, name, barcode, location type, sort order, status, timestamps; unique `(tenant_id, warehouse_id, code)` and `(tenant_id, warehouse_id, barcode)`.

## Enums

### `UserRole`

- `SUPER_ADMIN`
- `TENANT_ADMIN`
- `INVENTORY_MANAGER`
- `SALES_STAFF`
- `PURCHASE_STAFF`
- `VIEWER`

### `TenantStatus`

- `ACTIVE`
- `DISABLED`
- `PENDING`

### `UserStatus`

- `ACTIVE`
- `DISABLED`
- `INVITED`

### `RecordStatus`

- `ACTIVE`
- `INACTIVE`
- `ARCHIVED`

### `LocationType`

- `STORAGE`
- `PICKING`
- `RECEIVING`
- `PACKING`
- `SHIPPING`
- `RETURN`
- `DAMAGED`
- `EXPIRED`
- `QUARANTINE`
- `QC`
- `SCRAP`
- `VIRTUAL`

## Migration

Current migration:

- `backend/alembic/versions/20260521_0001_auth_tenant_foundation.py`
- `backend/alembic/versions/20260521_0002_catalog_warehouse_foundation.py`

Apply migrations:

```bash
cd backend
.venv/bin/alembic upgrade head
```

Seed a platform super admin from environment variables:

```bash
cd backend
.venv/bin/python -m app.utils.seed_super_admin
```

For local validation without MySQL, tests create an isolated in-memory SQLite database from SQLAlchemy metadata.

## Tenant Isolation Foundation

- Tenant-owned business tables added in later phases must include `tenant_id` unless explicitly documented as platform-global.
- Normal tenant APIs must resolve `tenant_id` from authenticated user context.
- Future tenant-owned modules must derive `tenant_id` from authenticated user context.
- `users.email` is globally unique in this foundation to simplify login and avoid cross-tenant ambiguity.
- Repository methods for future business tables should require tenant context by default.
- Catalog and warehouse master data use tenant-scoped repository helpers and tenant-scoped unique constraints.
