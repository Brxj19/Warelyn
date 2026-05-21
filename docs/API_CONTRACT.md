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

Phase 1B will add tenant-scoped catalog and warehouse foundation. Product CRUD and warehouse CRUD must not mutate stock. `InventoryEngine`, stock ledger, and actual stock quantities are not implemented yet and must wait for Phase 2.
