# Warelyn V2 Implementation Backlog

Source of truth: `docs/WARELYN_REAL_WORLD_V2_PRD.md`.

Priority values:

- `P0` = foundation/security/data correctness
- `P1` = core workflow
- `P2` = production UX/reporting
- `P3` = polish/future

This backlog is for progressive implementation. Do not implement backend code, frontend code, migrations, or product features until the relevant phase is explicitly approved.

Completed:

- Phase 0 foundation: root docs/config, FastAPI shell, React/Vite/Tailwind shell, Docker Compose.
- Phase 1A auth and tenant foundation: tenant/user/refresh token models, JWT auth APIs, protected frontend auth shell.
- Phase 1B tenant-scoped catalog and warehouse foundation: tenant-scoped repository helpers, catalog and warehouse master data APIs, frontend module shells.
- Phase 2 InventoryEngine and stock ledger foundation: centralized stock mutation, warehouse stock projection, ledger entries, reservations, idempotency, reconciliation dry-run.
- Phase 3 product import and barcode-ready catalog: CSV product import jobs, validation, preview, commit, cancel, product search by name/SKU/barcode, scanner-friendly barcode input.
- Phase 4 purchase receiving workflow: purchase orders, purchase receipts, partial receiving, warehouse/location receiving, receipt commit through `InventoryEngine.stock_in()`, and purchase ledger references.
- Phase 5 batch, expiry, and serial tracking foundation: traceability tables, tracked receiving validation, ledger batch/serial references, read-only batch/serial APIs, and receiving UI fields.
- Phase 6 sales reservation and fulfillment foundation: sales orders, explicit location allocation, reservation/release/deduction through `InventoryEngine`, sales fulfillment drafts/commit, frontend sales screens, and sales workflow tests.
- Phase 1A implementation commit: `dbd9752 implement Warelyn auth and tenant foundation`.
- Phase 1A planning alignment commit: `0137f69 update backlog with auth and tenant foundation phase`.

Current implemented auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Current implemented auth models:

- `Tenant`
- `User`
- `RefreshToken`

Next recommended phase: `Phase 7 - Picking, Packing, and Serial Allocation Foundation` or `Phase 7 - Returns QC Foundation`.

## Required Phase Order

`Phase 1A - Auth and Tenant Foundation` must happen after project foundation and before tenant-owned business workflows.

This phase establishes the authenticated tenant context that later modules must trust. Product CRUD, warehouse CRUD, inventory engine, stock ledger, purchase workflow, sales workflow, returns workflow, and reports all depend on backend-derived `tenant_id`, role checks, active tenant status, active user status, and protected route dependencies.

Do not start product, warehouse, inventory, purchase, sales, returns, or reporting implementation until Phase 1A is complete enough to provide:

- Tenant model and tenant status.
- User model, user roles, and user status.
- Password hashing and verification.
- JWT access token and JWT refresh token handling.
- Tenant admin registration.
- Login, refresh, logout, and `auth/me`.
- Backend dependencies: `get_current_user`, `get_current_user_context`, `require_roles()`, `require_tenant_user()`, and `require_super_admin()`.
- Frontend auth shell, protected routes, and role-aware navigation foundation.

Phase 1A is now completed. Future tenant-owned modules must derive `tenant_id` from authenticated user context instead of accepting arbitrary tenant IDs from normal tenant user requests.

`Phase 1B - Tenant-scoped catalog and warehouse foundation` is completed and includes:

- Base tenant-scoped repository pattern.
- Base CRUD conventions.
- Category model.
- Brand model.
- Vendor model.
- Customer model.
- Product model without stock mutation.
- Warehouse model.
- Warehouse location/bin model foundation.
- Tenant isolation tests.
- Frontend module shells for catalog and warehouses.

Phase 1B does not implement stock mutation. Product CRUD does not change stock. Warehouse CRUD does not change stock. `InventoryEngine`, stock ledger, and actual stock quantities wait for Phase 2.

`Phase 2 - Inventory Engine and stock ledger` is completed and includes:

- `InventoryEngine` as the only stock mutation path.
- `warehouse_stock` projection.
- Immutable `stock_ledger_entries`.
- `stock_reservations` foundation.
- Tenant-scoped `idempotency_keys`.
- Reconciliation dry-run comparing ledger totals to projection.
- Backend tests for stock invariants, role access, tenant isolation, idempotency, ledger behavior, and reconciliation.

Phase 2 does not implement product import, purchase receiving workflow, sales order workflow, picking/packing/delivery workflow, returns QC workflow, batch/expiry/serial tracking, advanced reports, AI assistant, or subscription expansion.

`Phase 3 - Product import and barcode-ready catalog` is completed and includes:

- Tenant-scoped `import_jobs` and `import_job_rows`.
- CSV product import upload, validation, preview, commit, cancel, and row listing APIs.
- Import modes: `create_only`, `update_existing`, and `upsert`.
- Duplicate SKU and barcode validation within the import file and tenant catalog.
- Optional creation of missing category, brand, and vendor master records.
- Product search by name, SKU, and barcode through `GET /api/catalog/products?search=`.
- Frontend product import page, CSV dropzone, preview table, and reusable barcode input.

Phase 3 does not implement XLSX import, column mapping UI, stock import, purchase receiving workflow, sales order workflow, picking/packing/delivery workflow, returns QC workflow, full batch/expiry/serial workflow, advanced reports, AI assistant, or subscription expansion. Product import does not call `InventoryEngine` and does not create `warehouse_stock`, `stock_ledger_entries`, or `stock_reservations`.

`Phase 4 - Purchase Receiving Workflow` is completed and includes:

- Tenant-scoped `purchase_orders`, `purchase_order_items`, `purchase_receipts`, and `purchase_receipt_items`.
- Purchase order create, submit, cancel, close, read, and draft update APIs.
- Purchase receipt create, update, cancel, commit, and read APIs.
- Partial receiving into tenant-owned warehouse/location dimensions.
- Over-receiving blocked by default.
- Receipt commit through `InventoryEngine.stock_in()` only.
- Stock ledger entries with `PURCHASE_RECEIPT` reference type.
- Backend tests for tenant isolation, roles, receipt commit, stock correctness, ledger references, and reconciliation.
- Frontend purchase order, receiving, and receipt screens.

Warehouse/location foundation already exists from Phase 1B and Phase 2 stock dimensions, so the approved implemented Phase 4 scope is purchase receiving. Phase 4 does not implement vendor bills, supplier payments, invoice accounting, purchase PDFs, sales workflow, picking/packing/delivery, returns QC, full batch/expiry/serial receiving workflow, advanced reports, AI assistant, or subscription expansion.

`Phase 5 - Batch, Expiry, and Serial Tracking Foundation` is completed and includes:

- Tenant-scoped `inventory_batches` and `inventory_serials` traceability tables.
- Nullable `batch_id` and `serial_id` on `stock_ledger_entries`.
- Receipt item fields for batch number, supplier batch, manufacture date, expiry date, warranty date, and serial numbers.
- `InventoryEngine.stock_in()` validation for product tracking flags and serial quantity matching.
- Batch quantity updates and serial creation only through `InventoryEngine.stock_in()`.
- Read-only batch and serial inventory APIs.
- Frontend purchase receiving capture and receipt detail display for tracking fields.

Phase 5 intentionally keeps `warehouse_stock` location-level only and does not add `batch_id` or `serial_id` to the projection uniqueness. Phase 5 does not implement sales allocation, FEFO auto-allocation, expiry jobs, blocked stock transitions, mobile scanning, returns QC, or serial capture during fulfillment.

`Phase 6 - Sales Reservation and Fulfillment Foundation` is completed and includes:

- Tenant-scoped `sales_orders`, `sales_order_items`, `sales_fulfillments`, and `sales_fulfillment_items`.
- Sales order create, confirm, cancel, close, read, and draft update APIs.
- Explicit location-level allocation lines on confirmation.
- Reservation through `InventoryEngine.reserve_stock()` only.
- Reservation release on cancellation/close through `InventoryEngine.release_reservation()` only.
- Fulfillment commit through `InventoryEngine.deduct_reserved_stock()` only.
- Sales ledger entries using `SALES_RESERVE`, `SALES_RELEASE`, and `SALES_DEDUCT`.
- Frontend sales order and fulfillment screens.

Phase 6 does not implement picking, packing, carrier shipment, invoice accounting, payment collection, returns QC, FEFO auto-allocation, mobile scanner workflow, or serial-specific allocation/picking. Serial-tracked products are blocked from sales confirmation until explicit serial allocation is implemented.

| ID | Phase | Priority | Area | Problem | Proposed Implementation | Files Likely Involved | Acceptance Criteria | Test Required |
|---|---|---|---|---|---|---|---|---|
| V2-000 | Phase 0 - Foundation audit and cleanup | P0 | Repo baseline | Current checkout has planning docs but no backend/frontend source to verify. | Confirm source location, add missing root docs/config only when requested, document real commands once manifests exist, keep PRD path as `docs/WARELYN_REAL_WORLD_V2_PRD.md`. | `README.md`, `AGENTS.md`, `opencode.json`, `docs/*` | Future agents know what exists, what is target-only, and which commands are verified. | Documentation review; no app tests until app exists. |
| V2-001 | Phase 0 - Foundation audit and cleanup | P0 | Architecture source of truth | PRD describes V1/V2 architecture, but current repo does not contain app code. | Create architecture planning docs before coding; mark observed-vs-target facts clearly. | `docs/MODULE_BOUNDARIES.md`, `docs/INVENTORY_ENGINE_SPEC.md`, `docs/V2_IMPLEMENTATION_BACKLOG.md` | Planning docs distinguish absent current source from target V2 structure. | Review docs against PRD. |
| V2-010 | Phase 1 - Backend module boundaries | P0 | Backend structure | Without clear boundaries, business logic can leak into routers and stock updates can fragment. | Create FastAPI app structure with routers, core, domain, repositories, models, schemas, events, jobs, services, and CLI folders. | `backend/app/api/routers/*`, `backend/app/core/*`, `backend/app/domain/*`, `backend/app/repositories/*`, `backend/app/models/*`, `backend/app/schemas/*` | App boots with empty or migrated module structure; no stock mutation outside planned engine path. | Backend import/compile smoke test once backend exists. |
| V2-011 | Phase 1 - Backend module boundaries | P0 | Router/service/repository split | Routers can become business logic containers. | Implement thin routers that call use-case services; repositories own database queries; schemas own request/response contracts. | `backend/app/api/routers/*`, `backend/app/domain/*`, `backend/app/repositories/*`, `backend/app/schemas/*` | Routers contain HTTP concerns only and no direct stock mutation. | Router unit tests or route smoke tests; service tests for behavior. |
| V2-012 | Phase 1 - Backend module boundaries | P0 | Tenant isolation | Tenant-owned data can leak without repository-level filtering. | Establish tenant context dependency and repository base methods requiring tenant scope. | `backend/app/core/permissions.py`, `backend/app/repositories/base.py`, tenant-owned repositories | Tenant-owned reads/writes always require tenant context. | Cross-tenant denial tests for each tenant-owned module. |
| V2-013 | Phase 1A - Auth and Tenant Foundation | P0 | Tenant identity | Later business records need a trusted tenant owner before any tenant-owned CRUD exists. | Add `Tenant` model with company profile fields, status enum, timestamps, and tenant creation through registration. | `backend/app/models/*`, `backend/app/schemas/*`, `backend/app/repositories/*`, Alembic migration | Tenant records exist with `ACTIVE`, `DISABLED`, and `PENDING` statuses; registration creates an active tenant. | Migration test; tenant registration test. |
| V2-014 | Phase 1A - Auth and Tenant Foundation | P0 | User identity and roles | Business APIs cannot safely authorize actions without users, roles, and statuses. | Add `User` model with nullable `tenant_id` for `SUPER_ADMIN`, password hash, roles, statuses, verification timestamps, and last login timestamp. | `backend/app/models/*`, `backend/app/schemas/*`, auth repository/service, Alembic migration | Users have unique email, role, status, and tenant association rules; password hash is never returned. | User create tests; duplicate email test; schema leak test. |
| V2-015 | Phase 1A - Auth and Tenant Foundation | P0 | Token security | Protected APIs need standard authentication before tenant data exists. | Implement password hashing, JWT access tokens, JWT refresh tokens, refresh token hashing at rest, token decoding, configurable expiry, and clean auth errors. | `backend/app/core/security.py`, `backend/app/services/auth.py`, `backend/app/repositories/*`, `backend/.env.example` | Login returns access/refresh tokens; invalid, expired, revoked, or missing tokens fail cleanly. | Login, wrong password, refresh, logout/revoke, missing token tests. |
| V2-016 | Phase 1A - Auth and Tenant Foundation | P0 | Auth API | Frontend and future APIs need a minimal auth contract. | Add `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`, and `POST /api/auth/logout`. | `backend/app/api/auth.py`, auth schemas/service/repositories | Register creates tenant admin without returning tokens; login blocks disabled users/tenants; `auth/me` returns user, tenant, and role. | API integration tests for each endpoint. |
| V2-017 | Phase 1A - Auth and Tenant Foundation | P0 | Protected dependencies | Future business routers must not accept arbitrary tenant IDs from requests. | Add `get_current_user`, `get_current_user_context`, `require_roles()`, `require_tenant_user()`, and `require_super_admin()` dependencies. | `backend/app/dependencies/auth.py`, auth service | Tenant APIs can resolve tenant ID from authenticated user context; role checks block unauthorized users. | Dependency tests for role blocking and tenant context resolution. |
| V2-018 | Phase 1A - Auth and Tenant Foundation | P0 | Super admin seed | Platform administration needs a non-tenant user without demo business data. | Add env-driven super admin seed command or startup option using `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, and `SUPER_ADMIN_NAME`. | backend seed utility, config, `.env.example` | A `SUPER_ADMIN` can be created with `tenant_id = null`; no tenant demo data is created. | Seed command test or documented manual verification. |
| V2-019 | Phase 1A - Auth and Tenant Foundation | P1 | Frontend auth shell | Users need auth entrypoints and future pages need route protection. | Add frontend auth service methods, auth state/context, `/login`, `/register`, `/dashboard`, protected route wrapper, guest route behavior, `auth/me` load on startup, logout, and role-aware navigation foundation. | `frontend/src/services/*`, auth context/store, routes, login/register/dashboard pages, layouts | Unauthenticated users redirect to login; authenticated users reach dashboard and see user, tenant, and role. | Frontend build; manual auth flow check; later component tests. |
| V2-019A | Phase 1B - Tenant-scoped catalog and warehouse foundation | P0 | Tenant-scoped repository base | Future master data needs a consistent tenant isolation pattern before CRUD expands. | Add base repository conventions/helpers that require tenant context for tenant-owned tables and make cross-tenant access explicit. | `backend/app/repositories/base.py`, dependencies, tests | Tenant-owned repository methods require tenant context by default. | Tenant isolation repository tests. |
| V2-019B | Phase 1B - Tenant-scoped catalog and warehouse foundation | P1 | Catalog master data | Product setup needs supporting master data before inventory workflows. | Add category, brand, vendor, customer, and product models/schemas/repositories/services/routers using thin-router and tenant-scoped conventions. Product CRUD must not mutate stock. | catalog models/schemas/repositories/services/routers, Alembic migration | Tenant users can manage catalog master data scoped to their tenant; product has no stock mutation path. | CRUD and cross-tenant denial tests. |
| V2-019C | Phase 1B - Tenant-scoped catalog and warehouse foundation | P1 | Warehouse master data | Inventory workflows need warehouse and bin identity before stock exists. | Add warehouse model and warehouse location/bin model foundation. Warehouse CRUD and location CRUD must not mutate stock. | warehouse models/schemas/repositories/services/routers, Alembic migration | Tenant users can manage warehouses and location/bin records scoped to their tenant; no stock quantity fields are mutated. | CRUD and cross-tenant denial tests. |
| V2-019D | Phase 1B - Tenant-scoped catalog and warehouse foundation | P1 | Frontend module shells | Users need navigable shells for catalog and warehouses without operational workflows. | Add frontend module shells for catalog and warehouses using existing Warelyn visual style and API service files. | `frontend/src/modules/catalog/*`, `frontend/src/modules/warehouses/*`, frontend services/routes | Authenticated users can navigate to catalog and warehouse placeholders/basic CRUD shells; no stock UI is shown. | Frontend build; route smoke/manual checks. |
| V2-020 | Phase 2 - Inventory Engine and stock ledger | P0 | Stock correctness | Current PRD warns stock changes may be scattered across services. | Implement `InventoryEngine` as the only stock mutation path with transaction, lock, ledger, projection, audit, and idempotency responsibilities. | `backend/app/domain/inventory/engine.py`, `ledger.py`, `repositories/stock_repository.py`, `models/warehouse_stock.py`, `models/stock_ledger_entry.py` | Every stock mutation writes ledger and projection in one transaction. | Engine invariant tests; ledger write tests; idempotency tests. |
| V2-021 | Phase 2 - Inventory Engine and stock ledger | P0 | Idempotency | Repeated requests can duplicate stock movement. | Add idempotency key storage and service helper for critical operations. | `backend/app/core/idempotency.py`, `models/idempotency_key.py`, engine/service callers | Repeating same key returns prior result or safe conflict without duplicate ledger rows. | Idempotency unit/integration tests. |
| V2-022 | Phase 2 - Inventory Engine and stock ledger | P0 | Reconciliation | Projection can drift from ledger if no comparison exists. | Add reconciliation service/CLI with dry-run first, then controlled fix mode. | `backend/app/domain/inventory/reconciliation.py`, `backend/app/cli/reconcile_inventory.py`, report repository | Dry-run reports mismatches by tenant; fix mode creates correction entries. | Reconciliation mismatch/fix tests. |
| V2-030 | Phase 3 - Product import and barcode-ready catalog | P1 | Product onboarding | Real users need CSV/XLSX import, duplicate detection, and barcode capture. | Build import jobs with upload, column mapping, validation, preview, duplicate review, and commit. | `domain/catalog/import_service.py`, `models/import_job.py`, `models/import_job_row.py`, `api/routers/imports.py`, `frontend/src/modules/catalog/*` | Completed for CSV without mapping UI or XLSX. Users can validate before commit; invalid rows are skipped on commit; tenant duplicate checks are enforced. | Import validation tests and duplicate checks pass; UI flow build passes. |
| V2-031 | Phase 3 - Product import and barcode-ready catalog | P1 | Barcode readiness | Products, locations, batches, serials, packages, and shipments need barcode fields. | Add barcode fields/contracts to catalog and scanner-ready frontend input patterns. | product models/schemas, warehouse location models/schemas, `frontend/src/components/scanner/BarcodeInput.*` | Completed for product search and reusable product barcode input. Later workflow-specific scanning remains future work. | API tests for barcode uniqueness/search pass; frontend build passes. |
| V2-040 | Phase 4 - Purchase Receiving Workflow | P1 | Purchase receiving | Purchase order status alone must not increase stock; goods need a committed receiving workflow. | Add purchase orders, purchase receipts, partial receiving, warehouse/location receipt items, and receipt commit through `InventoryEngine.stock_in()`. | purchasing models/schemas/repositories/services/router, `domain/inventory/engine.py`, frontend purchasing pages | Completed for purchase order and receipt foundation. Receipt commit increases stock only through `InventoryEngine.stock_in()` and writes `PURCHASE_RECEIPT` ledger references. | Purchase receiving, tenant isolation, role, ledger, stock projection, and reconciliation tests pass. |
| V2-041 | Future - Putaway foundation | P1 | Putaway foundation | Receiving needs a path from receiving area to storage bins. | Add putaway task models/services after receiving foundation exists. | `models/putaway_task.py`, `domain/purchasing/receiving_service.py`, `domain/inventory/engine.py`, frontend receiving/warehouse modules | Received stock can be moved from receiving to storage with ledger entries. | Putaway service tests; stock movement tests. |
| V2-050 | Phase 5 - Batch, expiry, and serial tracking | P1 | Traceability | Batch/expiry/serial support must be first-class for regulated or warranty-heavy items. | Completed foundation with batch and serial models, validation rules, receiving forms, detail display, and read APIs. Status transitions beyond inbound creation remain future work. | inventory models/schemas/repositories, purchase receipt models/schemas, frontend purchase receiving/detail pages | Tracked products require batch/expiry/serial data before stock becomes available through receiving/stock-in. | Batch required; expiry required; serial uniqueness; serial quantity tests. |
| V2-051 | Phase 5 - Batch, expiry, and serial tracking | P1 | Expiry handling | Expired stock must not be sold and FEFO should guide allocation. | Add expiry alerts, FEFO allocation strategy, and expired stock state transitions. | `domain/inventory/allocation_service.py`, `picking_strategy.py`, `jobs/expire_batches.py`, reports | Expired batches are blocked; expiring-soon batches can be reported; FEFO allocation works. | FEFO allocation tests; expiry job tests. |
| V2-060 | Phase 6 - Purchase receiving workflow | P1 | Purchase receive realism | Receiving is more than changing PO status. | Implement partial receive, accepted/rejected/damaged quantities, receiving location, batch/expiry/serial capture, and putaway creation. | `domain/purchasing/receiving_service.py`, `domain/inventory/engine.py`, purchase receive models/schemas, frontend purchasing module | Posted receiving increases accepted stock; damaged/rejected quantities do not become sellable. | Purchase receive integration tests; damaged/rejected tests; idempotency tests. |
| V2-061 | Phase 6 - Purchase receiving workflow | P1 | Vendor bill/document link | Bills and PDFs should reflect received goods. | Link vendor bills to PO/receive/vendor/items and document generation. | bill models/services, document services, purchasing frontend module | Bills reference committed receiving data and can generate PDFs later. | Bill generation/API tests; document smoke tests. |
| V2-070 | Phase 6 - Sales reservation and fulfillment foundation | P1 | Sales stock flow | Sales should reserve on confirmation and deduct only on fulfillment commit. | Completed foundation with sales orders, explicit location allocation, reservation release, fulfillment commit, and frontend sales screens. Picking, packing, and serial allocation remain future work. | sales models/schemas/repositories/services/router, inventory engine transaction control, frontend sales pages | Confirm reserves; cancel/close releases active reservations; fulfillment commit deducts reserved stock. | Reservation, release, deduction, ledger, tenant isolation, role, and reconciliation tests pass. |
| V2-071 | Phase 7 - Sales reservation, picking, packing, and delivery | P1 | Scanner-friendly fulfillment | Pick/pack screens need bin/product confirmation and serial capture. | Add pick tasks, pick lines, package barcode, short pick reason, and scanner-focused UI. | pick/package models/schemas, fulfillment router/service, `frontend/src/modules/fulfillment/*`, scanner components | Pickers can scan bin/product and complete or short-pick tasks. | Fulfillment service tests; UI route/component tests later. |
| V2-080 | Phase 8 - Returns QC and damaged/expired/quarantine stock | P1 | Return correctness | Returned stock should not immediately become sellable. | Add return QC workflow with receive return, QC hold, QC result, restock/damaged/scrap/return-to-vendor decisions. | `domain/sales/return_service.py`, `domain/inventory/engine.py`, return QC models/schemas, frontend returns module | Returns enter QC and only approved restock returns to available stock. | Return QC tests; damaged/scrap tests; audit tests. |
| V2-081 | Phase 8 - Returns QC and damaged/expired/quarantine stock | P1 | Blocked stock states | Damaged, expired, quarantine, and QC stock can be accidentally counted as available. | Add blocked quantity projection fields and engine methods for damage, expiry, quarantine, and scrap. | stock models/repositories, engine, jobs, reports | Blocked stock is excluded from available and cannot be reserved. | Blocked-state invariant tests; reservation denial tests. |
| V2-090 | Phase 9 - Reports and reconciliation | P2 | Operational visibility | Reports must match real ledger/projection state. | Add inventory summary, warehouse stock, location stock, movement, low stock, valuation, batch expiry, serial, damaged, expired, QC hold, and reconciliation reports. | `domain/reports`, `repositories/report_repository.py`, report schemas/router, frontend reports module | Reports agree with warehouse stock and ledger data. | Report query tests; reconciliation report tests. |
| V2-091 | Phase 9 - Reports and reconciliation | P2 | Audit visibility | Operators need to see who changed what and why. | Add audit tabs and activity timelines for product, warehouse, order, receive, return, and stock movements. | audit models/services/router, frontend detail tabs | Critical workflows show actor, action, time, reference, and stock impact. | Audit API tests; frontend smoke tests later. |
| V2-100 | Phase 10 - Frontend workflow improvements | P2 | CRUD-like UI risk | Real operations need workflow-first screens, not isolated forms. | Build detail pages with tabs, stock impact previews, scanner-friendly inputs, loading/error/empty states, confirmations, and consistent tables/forms. | `frontend/src/modules/*`, `components/tables`, `components/forms`, `components/scanner`, `components/feedback` | Users can understand current state, next action, and stock impact before mutation. | Route smoke tests; component tests; manual QA checklist. |
| V2-101 | Phase 10 - Frontend workflow improvements | P2 | Brand consistency | UI should preserve Warelyn's operational SaaS direction. | Apply deep blue primary, emerald success, gray backgrounds, white cards, clear badges, and data-dense layouts. | frontend styles/theme/layout components | Screens use Warelyn branding and avoid Zoho branding/assets. | Visual review; accessibility checks later. |
| V2-110 | Phase 11 - Regression tests and production hardening | P0 | Regression risk | Inventory workflows can silently break without broad tests. | Add backend test suites for auth, tenant isolation, inventory engine, ledger, reservations, receiving, delivery, return QC, reconciliation, import, documents, email/SMS. | backend tests, fixtures, CI config | Core invariants and workflows are covered in automated tests. | Full backend test suite. |
| V2-111 | Phase 11 - Regression tests and production hardening | P2 | End-to-end confidence | Critical user journeys need browser-level coverage. | Add Playwright later for signup, login, warehouse, product, import stock, PO receive, sales reserve/deliver, invoice, return QC, reports, audit. | `frontend/e2e/*`, test config, CI config | Critical E2E flow passes against seeded environment. | Playwright E2E suite when frontend/backend exist. |
| V2-112 | Phase 11 - Regression tests and production hardening | P2 | Operational readiness | Background jobs, email, SMS outbox, PDFs, and reconciliation need safe production behavior. | Add job tests, outbox handling, failure retries, safe dev SMS/email behavior, and manual runbooks. | jobs, events/outbox, services/email_service.py, services/sms_service.py, docs/manual QA | Jobs are idempotent, observable, and safe to rerun. | Job tests; manual QA checklist. |

## Phase Guardrails

- Do not start backend implementation until Phase 0 planning is approved.
- Do not add tenant-owned business migrations until Phase 1A auth and tenant ownership rules are approved.
- Do not start product CRUD, warehouse CRUD, inventory engine, stock ledger, purchase workflow, sales workflow, returns workflow, or reports before Phase 1A is complete.
- Do not add frontend screens before API contracts and workflow ownership are clear.
- Do not work on AI assistant, subscription expansion, billing plans, payment features, marketplace integration, carrier integration, native mobile app, forecasting, full accounting, or ERP manufacturing during early V2 foundation work.
- Each implementation phase should end with relevant tests, updated docs when behavior changes, and a small commit.

## Suggested Commit Messages By Phase

| Phase | Commit Message |
|---|---|
| Phase 0 | `document Warelyn V2 foundation and project rules` |
| Phase 1 | `refactor backend module boundaries for v2 foundation` |
| Phase 1A | `implement Warelyn auth and tenant foundation` |
| Phase 1B | `add tenant scoped catalog and warehouse foundation` |
| Phase 2 | `centralize inventory mutations in inventory engine` |
| Phase 3 | `add product import and barcode ready catalog` |
| Phase 4 | `add purchase receiving workflow` |
| Phase 5 | `add batch expiry and serial tracking foundation` |
| Phase 6 | `add sales reservation and fulfillment foundation` |
| Phase 7 | `add picking packing and serial allocation foundation` |
| Phase 8 | `implement return qc and blocked stock workflows` |
| Phase 9 | `add inventory reports and reconciliation workflow` |
| Phase 10 | `improve frontend inventory workflow screens` |
| Phase 11 | `add regression tests for inventory workflows` |
