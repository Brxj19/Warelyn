# Warelyn API Contract

Source of truth: `docs/WARELYN_REAL_WORLD_V2_PRD.md` plus implemented backend routes.

## Response Shape

Successful responses return endpoint-specific JSON.

Errors use a consistent envelope:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password.",
    "request_id": "..."
  }
}
```

Validation errors include `details`.

## Health

### `GET /api/health`

Returns service status.

```json
{
  "status": "ok",
  "service": "Warelyn Inventory API"
}
```

## Auth And Tenant Foundation

Status: completed in implementation commit `dbd9752 implement Warelyn auth and tenant foundation` and documented in planning alignment commit `0137f69 update backlog with auth and tenant foundation phase`.

Current implemented auth endpoints are:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### `POST /api/auth/register`

Creates a tenant and its first `TENANT_ADMIN` user. Does not return tokens.

Request:

```json
{
  "company_name": "Acme Warehousing",
  "name": "Acme Admin",
  "email": "admin@example.com",
  "phone": "+15550100",
  "password": "StrongPass123!"
}
```

Response `201`:

```json
{
  "tenant": {
    "id": 1,
    "company_name": "Acme Warehousing",
    "contact_email": "admin@example.com",
    "phone": "+15550100",
    "address": null,
    "gst_number": null,
    "business_type": null,
    "status": "ACTIVE",
    "created_at": "...",
    "updated_at": "..."
  },
  "user": {
    "id": 1,
    "tenant_id": 1,
    "name": "Acme Admin",
    "email": "admin@example.com",
    "phone": "+15550100",
    "role": "TENANT_ADMIN",
    "status": "ACTIVE",
    "email_verified_at": null,
    "phone_verified_at": null,
    "last_login_at": null,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

Duplicate email returns `409 DUPLICATE_EMAIL`.

### `POST /api/auth/login`

Authenticates active users and active tenants.

Request:

```json
{
  "email": "admin@example.com",
  "password": "StrongPass123!"
}
```

Response:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer",
  "user": { "id": 1, "tenant_id": 1, "role": "TENANT_ADMIN" },
  "tenant": { "id": 1, "company_name": "Acme Warehousing" }
}
```

Failure codes:

- `INVALID_CREDENTIALS`
- `DISABLED_USER`
- `DISABLED_TENANT`

### `POST /api/auth/refresh`

Validates a stored refresh token and issues a new access token.

Request:

```json
{
  "refresh_token": "..."
}
```

Response:

```json
{
  "access_token": "...",
  "token_type": "bearer"
}
```

Failure codes:

- `INVALID_TOKEN`
- `EXPIRED_TOKEN`
- `DISABLED_USER`
- `DISABLED_TENANT`

### `GET /api/auth/me`

Protected route. Requires `Authorization: Bearer <access_token>`.

Response:

```json
{
  "user": { "id": 1, "tenant_id": 1, "role": "TENANT_ADMIN" },
  "tenant": { "id": 1, "company_name": "Acme Warehousing" },
  "role": "TENANT_ADMIN"
}
```

Missing token returns `401 MISSING_TOKEN`.

### `POST /api/auth/logout`

Revokes a refresh token if supplied. Local frontend logout should still clear local auth state if the server token is already invalid.

Request:

```json
{
  "refresh_token": "..."
}
```

Response:

```json
{
  "success": true
}
```

## Tenant Isolation Contract

- Tenant users do not pass arbitrary `tenant_id` for normal business APIs.
- Backend dependencies resolve tenant context from the authenticated access token and current user row.
- Future tenant-owned modules must derive `tenant_id` from authenticated user context.
- `SUPER_ADMIN` users are platform users and have `tenant_id = null`.
- Role checks are enforced by backend dependencies, not frontend navigation alone.

## Catalog Foundation

All catalog routes require a bearer token and derive `tenant_id` from authenticated user context. Product CRUD does not mutate stock.

Writer roles: `TENANT_ADMIN`, `INVENTORY_MANAGER`.

Reader rules:

- Categories and brands: any tenant user.
- Products: `TENANT_ADMIN`, `INVENTORY_MANAGER`, `VIEWER`, `SALES_STAFF`, `PURCHASE_STAFF`.
- Vendors: `TENANT_ADMIN`, `INVENTORY_MANAGER`, `VIEWER`, `PURCHASE_STAFF`.
- Customers: `TENANT_ADMIN`, `INVENTORY_MANAGER`, `VIEWER`, `SALES_STAFF`.

Implemented endpoints:

- `GET /api/catalog/categories`
- `POST /api/catalog/categories`
- `PATCH /api/catalog/categories/{category_id}`
- `GET /api/catalog/brands`
- `POST /api/catalog/brands`
- `PATCH /api/catalog/brands/{brand_id}`
- `GET /api/catalog/vendors`
- `POST /api/catalog/vendors`
- `PATCH /api/catalog/vendors/{vendor_id}`
- `GET /api/catalog/customers`
- `POST /api/catalog/customers`
- `PATCH /api/catalog/customers/{customer_id}`
- `GET /api/catalog/products`
- `POST /api/catalog/products`
- `PATCH /api/catalog/products/{product_id}`

`GET /api/catalog/products` accepts optional `search` and matches tenant-scoped product `name`, `sku`, or `barcode`.

Duplicate tenant-scoped unique values return `409 DUPLICATE_RECORD`.

## Product Import

All product import routes require a bearer token and derive `tenant_id` from authenticated user context. Product import creates or updates product master data only; it does not mutate stock, create `warehouse_stock`, create `stock_ledger_entries`, create `stock_reservations`, or call `InventoryEngine`.

Writer roles: `TENANT_ADMIN`, `INVENTORY_MANAGER`.

Implemented endpoints:

- `POST /api/imports/products/upload`
- `GET /api/imports/products/{job_id}`
- `GET /api/imports/products/{job_id}/rows`
- `POST /api/imports/products/{job_id}/validate`
- `POST /api/imports/products/{job_id}/commit`
- `POST /api/imports/products/{job_id}/cancel`

Upload request is `multipart/form-data`:

- `file`: CSV file.
- `mode`: `create_only`, `update_existing`, or `upsert`.
- `create_missing_references`: `true` or `false`.

Required CSV columns:

- `name`
- `sku`
- `unit`

Optional CSV columns:

- `barcode`
- `description`
- `category_name`
- `brand_name`
- `vendor_name`
- `cost_price`
- `selling_price`
- `reorder_level`
- `track_batch`
- `track_expiry`
- `track_serial`
- `status`

Import modes:

- `create_only`: rows with existing tenant SKUs are errors.
- `update_existing`: rows without existing tenant SKUs are errors.
- `upsert`: existing tenant SKUs are updated and missing tenant SKUs are created.

Validation catches required fields, invalid numeric/boolean/status values, duplicate SKUs or barcodes in the file, existing SKU conflicts, and tenant barcode collisions. Commit skips invalid rows. Vendor names can be validated or created as vendor master data, but products are not linked to vendors in this phase because product-vendor linking is not implemented yet.

Response shape for upload, validate, commit, and cancel:

```json
{
  "job": {
    "id": 1,
    "status": "VALIDATED",
    "mode": "create_only",
    "total_rows": 1,
    "valid_rows": 1,
    "error_rows": 0,
    "warning_rows": 0,
    "created_count": 0,
    "updated_count": 0,
    "skipped_count": 0
  },
  "rows": []
}
```

## Warehouse Foundation

All warehouse routes require a bearer token and derive `tenant_id` from authenticated user context. Warehouse and location CRUD does not mutate stock.

Reader roles: `TENANT_ADMIN`, `INVENTORY_MANAGER`, `VIEWER`, `PURCHASE_STAFF`.

Writer roles: `TENANT_ADMIN`, `INVENTORY_MANAGER`.

Implemented endpoints:

- `GET /api/warehouses`
- `POST /api/warehouses`
- `PATCH /api/warehouses/{warehouse_id}`
- `GET /api/warehouses/{warehouse_id}/locations`
- `POST /api/warehouses/{warehouse_id}/locations`
- `PATCH /api/warehouses/{warehouse_id}/locations/{location_id}`

## InventoryEngine And Stock Ledger Foundation

All inventory routes require a bearer token and derive `tenant_id` from authenticated user context. Normal tenant APIs never accept `tenant_id`.

Read roles: `TENANT_ADMIN`, `INVENTORY_MANAGER`, `VIEWER`, `SALES_STAFF`, `PURCHASE_STAFF`.

Stock mutation roles for stock in/out/adjust/transfer/reconciliation: `TENANT_ADMIN`, `INVENTORY_MANAGER`.

Reservation roles for reserve/release/deduct: `TENANT_ADMIN`, `INVENTORY_MANAGER`, `SALES_STAFF`.

Implemented endpoints:

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

Mutation requests require `idempotency_key`. Reusing the same tenant, operation, and idempotency key with the same request returns the stored response. Reusing the same key with a different request returns `409 IDEMPOTENCY_CONFLICT`.

Stock operations require `product_id`, `warehouse_id`, and `location_id`; `location_id` is required to avoid ambiguous stock dimensions.

`POST /api/inventory/stock-in` accepts optional Phase 5 tracking fields:

- `batch_number`
- `supplier_batch_number`
- `manufacture_date`
- `expiry_date`
- `warranty_until`
- `serial_numbers`

Tracking rules:

- Untracked products reject tracking fields.
- Batch-tracked or expiry-tracked products require `batch_number`.
- Expiry-tracked products require `expiry_date`.
- Serial-tracked products require `serial_numbers`, and the serial count must equal `quantity`.
- For serial-tracked receiving, the engine creates one `STOCK_IN` ledger entry per serial with `serial_id`.
- For batch/expiry non-serial receiving, the engine creates one `STOCK_IN` ledger entry with `batch_id`.

Phase 5 limitations: `warehouse_stock` remains location-level only; batch/serial details are traceability records and ledger references. FEFO allocation, expiry jobs, blocked stock transitions, sales fulfillment serial capture, returns QC, and advanced reporting are not implemented.

## Purchase Receiving Workflow

All purchase routes require a bearer token and derive `tenant_id` from authenticated user context. Purchase order status alone does not mutate stock. Stock increases only when a purchase receipt is committed, and commit calls `InventoryEngine.stock_in()` for each receipt item. Purchase receiving must not directly update `warehouse_stock` or directly insert `stock_ledger_entries`.

Read roles: `TENANT_ADMIN`, `INVENTORY_MANAGER`, `PURCHASE_STAFF`, `VIEWER`.

Write roles: `TENANT_ADMIN`, `INVENTORY_MANAGER`, `PURCHASE_STAFF`.

`VIEWER` is read-only. `SALES_STAFF` cannot manage purchase orders. `SUPER_ADMIN` does not use normal tenant purchase APIs.

Implemented endpoints:

- `GET /api/purchase-orders`
- `POST /api/purchase-orders`
- `GET /api/purchase-orders/{po_id}`
- `PATCH /api/purchase-orders/{po_id}`
- `POST /api/purchase-orders/{po_id}/submit`
- `POST /api/purchase-orders/{po_id}/cancel`
- `POST /api/purchase-orders/{po_id}/close`
- `POST /api/purchase-orders/{po_id}/receipts`
- `GET /api/purchase-orders/{po_id}/receipts`
- `GET /api/purchase-receipts/{receipt_id}`
- `PATCH /api/purchase-receipts/{receipt_id}`
- `POST /api/purchase-receipts/{receipt_id}/commit`
- `POST /api/purchase-receipts/{receipt_id}/cancel`

Purchase order statuses:

- `DRAFT`
- `SUBMITTED`
- `PARTIALLY_RECEIVED`
- `RECEIVED`
- `CANCELLED`
- `CLOSED`

Purchase receipt statuses:

- `DRAFT`
- `COMMITTED`
- `CANCELLED`

Rules:

- Purchase orders must reference a tenant-owned vendor and tenant-owned products.
- Purchase order updates are allowed only while `DRAFT`.
- Submit requires at least one item.
- Receiving is allowed only for `SUBMITTED` or `PARTIALLY_RECEIVED` purchase orders.
- Cancelled, closed, and fully received purchase orders cannot be received.
- Receipt items must reference tenant-owned products, warehouses, and locations; location must belong to the selected warehouse.
- Received quantity must be positive and cannot exceed the remaining ordered quantity. Phase 4 blocks over-receiving.
- Receipt items may include `batch_number`, `supplier_batch_number`, `manufacture_date`, `expiry_date`, `warranty_until`, and `serial_numbers`; commit forwards these fields to `InventoryEngine.stock_in()`.
- Draft receipts can be edited or cancelled.
- Committed receipts cannot be edited.
- Cancelled receipts do not mutate stock.
- Receipt commit uses `reference_type=PURCHASE_RECEIPT` and `reference_id=receipt_number` on stock ledger entries.

Phase 5 limitations: no vendor bills, supplier payments, invoice accounting, purchase PDFs, sales workflow, returns QC, FEFO auto-allocation, expiry background jobs, mobile scanner workflow, or advanced reports.

## Sales Reservation And Fulfillment Foundation

All sales routes require a bearer token and derive `tenant_id` from authenticated user context. Sales confirmation reserves stock only through `InventoryEngine.reserve_stock()`. Sales cancellation/close releases active reservations only through `InventoryEngine.release_reservation()`. Fulfillment commit deducts reserved stock only through `InventoryEngine.deduct_reserved_stock()`.

Read roles: `TENANT_ADMIN`, `INVENTORY_MANAGER`, `SALES_STAFF`, `VIEWER`.

Write roles: `TENANT_ADMIN`, `INVENTORY_MANAGER`, `SALES_STAFF`.

`VIEWER` is read-only. `PURCHASE_STAFF` cannot manage sales orders. `SUPER_ADMIN` does not use normal tenant sales APIs.

Implemented endpoints:

- `GET /api/sales-orders`
- `POST /api/sales-orders`
- `GET /api/sales-orders/{order_id}`
- `PATCH /api/sales-orders/{order_id}`
- `POST /api/sales-orders/{order_id}/confirm`
- `POST /api/sales-orders/{order_id}/cancel`
- `POST /api/sales-orders/{order_id}/close`
- `POST /api/sales-orders/{order_id}/fulfillments`
- `GET /api/sales-orders/{order_id}/fulfillments`
- `GET /api/sales-fulfillments/{fulfillment_id}`
- `PATCH /api/sales-fulfillments/{fulfillment_id}`
- `POST /api/sales-fulfillments/{fulfillment_id}/commit`
- `POST /api/sales-fulfillments/{fulfillment_id}/cancel`

Sales order statuses:

- `DRAFT`
- `CONFIRMED`
- `PARTIALLY_FULFILLED`
- `FULFILLED`
- `CANCELLED`
- `CLOSED`

Sales fulfillment statuses:

- `DRAFT`
- `COMMITTED`
- `CANCELLED`

Rules:

- Sales orders must reference a tenant-owned customer and tenant-owned products.
- Sales order updates are allowed only while `DRAFT`.
- Confirmation requires explicit allocation lines with `sales_order_item_id`, `warehouse_id`, `location_id`, and `quantity`.
- Allocated quantity must equal ordered quantity for each order item.
- Warehouse and location must belong to the tenant; location must belong to the selected warehouse.
- Serial-tracked products can be confirmed only with one-unit reservation lines; explicit `serial_id` selection happens during picking.
- Fulfillment requires active reservations for the same sales order.
- Serial-tracked fulfillment requires a picked serial allocation for the reservation.
- Fulfillment commit creates `SALES_DEDUCT` ledger entries and updates order fulfillment status.
- Cancelled fulfillments do not mutate stock.

## Picking, Packing, And Serial Allocation Foundation

All picking and packing routes require a bearer token and derive `tenant_id` from authenticated user context. Picking and packing are operational allocation workflows only: they do not mutate `warehouse_stock`, do not release reservations, and do not create `stock_ledger_entries`. Final deduction remains `InventoryEngine.deduct_reserved_stock()` during sales fulfillment commit. Package data is optional in Phase 7.

Read roles: `TENANT_ADMIN`, `INVENTORY_MANAGER`, `SALES_STAFF`, `VIEWER`.

Write roles: `TENANT_ADMIN`, `INVENTORY_MANAGER`, `SALES_STAFF`.

`VIEWER` is read-only. `PURCHASE_STAFF` cannot manage picking or packing. `SUPER_ADMIN` does not use normal tenant picking and packing APIs.

Implemented endpoints:

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

Pick task statuses:

- `PENDING`
- `IN_PROGRESS`
- `PICKED`
- `CANCELLED`

Pick task item statuses:

- `PENDING`
- `PICKED`
- `CANCELLED`

Package statuses:

- `DRAFT`
- `PACKED`
- `CANCELLED`

Picking rules:

- Pick tasks can be generated only for `CONFIRMED` or `PARTIALLY_FULFILLED` sales orders.
- Pick tasks are generated from active `StockReservation` rows.
- Duplicate active pick tasks for the same reservation are blocked.
- Picked quantity cannot exceed required quantity or active reservation quantity.
- Serial-tracked products require explicit `serial_id` during picking.
- Selected serial must belong to the same tenant, product, warehouse, and location, and must be `IN_STOCK`.
- Duplicate serial allocation is blocked within a pick request and across non-cancelled pick tasks.
- Batch allocation is explicit/manual only; selected batch must match tenant, product, warehouse, and location.

Packing rules:

- Packages can be created only from picked task items.
- Package creation and pack action do not deduct stock.
- Cancelled packages do not mutate stock.
- Packages remain optional before fulfillment commit in Phase 7.

Phase 7 limitations: no carrier shipment integration, invoice accounting, payment collection, returns QC, FEFO auto-allocation, delivery tracking with external carriers, full mobile scanner workflow, advanced reports, or mandatory package-before-fulfillment enforcement.
