# Warelyn Deployment Readiness

Phase 11 focuses on regression testing, production hardening, and deployment safety. This document is a checklist for preparing Warelyn beyond local development.

## Scope

- Warelyn V2 is complete through Phase 10 UI polish.
- Phase 11 does not add new business workflows.
- Stock mutation must continue to go through `InventoryEngine` only.
- Frontend values must remain backend-driven for stock, reports, and workflow state.

## Required Environment

Backend production environment values must be explicitly provided:

- `WARELYN_ENVIRONMENT=production`
- `WARELYN_DEBUG=false`
- `WARELYN_DATABASE_URL` with production MySQL credentials.
- `WARELYN_CORS_ORIGINS` limited to trusted frontend origins.
- `WARELYN_JWT_SECRET_KEY` set to a long random secret; never use the example value.
- `WARELYN_ACCESS_TOKEN_EXPIRE_MINUTES` and `WARELYN_REFRESH_TOKEN_EXPIRE_DAYS` set for the deployment policy.
- `WARELYN_SEED_SUPER_ADMIN_ON_STARTUP=false` unless a controlled bootstrap procedure requires it.

Frontend production environment values:

- `VITE_API_BASE_URL` pointing to the deployed backend `/api` base URL.

## Docker Notes

`docker-compose.yml` is a development compose file. It intentionally uses bind mounts, local development credentials, and reload/dev servers.

Do not use it as-is for production. A production deployment should:

- Build immutable backend and frontend images.
- Run backend without `--reload`.
- Serve frontend static assets through a production web server or hosting platform.
- Use managed or hardened MySQL with backups.
- Keep secrets outside source control and outside committed compose files.
- Restrict published ports and network access.

## Database And Alembic

Before promoting a release:

1. Create or restore the target database.
2. Set `WARELYN_DATABASE_URL` for the target environment.
3. Run `cd backend && .venv/bin/alembic upgrade head`.
4. Confirm the app starts against the migrated database.
5. Keep migrations append-only after release; do not rewrite shipped migrations.

## Security Checklist

- JWT secret is strong and not the example value.
- CORS origins are explicit and minimal.
- Debug docs and OpenAPI are disabled in production unless intentionally exposed behind access controls.
- Super admin seed credentials are not default values.
- Upload/import endpoints reject malformed input with structured errors.
- Backend role checks enforce permissions; frontend visibility is not security.
- Tenant APIs derive tenant context from authenticated users, not request-supplied tenant IDs.

## Validation Checklist

Run before handoff or release:

```bash
cd backend && python3 -m compileall app
cd backend && .venv/bin/python -m pytest
cd backend && .venv/bin/alembic upgrade head
cd frontend && npm run build
docker compose config
git status --short
```

Or run the helper:

```bash
./scripts/validate.sh
```

## CI Readiness

The repository includes a minimal GitHub Actions workflow at `.github/workflows/ci.yml` for:

- backend compile
- backend pytest
- Alembic migration against MySQL service
- frontend build
- Docker Compose config validation

CI is not deployment automation. Deployment should be added only after target infrastructure is known.
