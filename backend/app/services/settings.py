import json
from typing import Any

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.repositories.audit import AuditLogRepository
from app.repositories.settings import TenantSettingsRepository, UserPreferencesRepository


class TenantSettingsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = TenantSettingsRepository(db)
        self.audit_logs = AuditLogRepository(db)

    def get_settings(self, tenant_id: int) -> Any:
        return self.repository.get_or_create(tenant_id)

    def update_settings(self, tenant_id: int, values: dict[str, Any], actor_user_id: int | None = None, actor_role: str = "") -> Any:
        current = self.repository.get_or_create(tenant_id)
        result = self.repository.update(tenant_id, values)
        if result is None:
            raise AppError("SETTINGS_NOT_FOUND", "Tenant settings were not found.", 404)
        self.audit_logs.create(
            {
                "tenant_id": tenant_id,
                "actor_user_id": actor_user_id,
                "actor_role": actor_role,
                "action": "SETTINGS_UPDATE",
                "entity_type": "tenant_settings",
                "entity_id": str(tenant_id),
                "metadata_json": json.dumps({"updated_fields": list(values.keys())}, default=str),
            }
        )
        return result


class UserPreferencesService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = UserPreferencesRepository(db)
        self.audit_logs = AuditLogRepository(db)

    def get_preferences(self, user_id: int) -> Any:
        return self.repository.get_or_create(user_id)

    def update_preferences(self, user_id: int, values: dict[str, Any], actor_role: str = "") -> Any:
        current = self.repository.get_or_create(user_id)
        result = self.repository.update(user_id, values)
        if result is None:
            raise AppError("PREFERENCES_NOT_FOUND", "User preferences were not found.", 404)
        self.audit_logs.create(
            {
                "tenant_id": None,
                "actor_user_id": user_id,
                "actor_role": actor_role,
                "action": "PREFERENCES_UPDATE",
                "entity_type": "user_preferences",
                "entity_id": str(user_id),
                "metadata_json": json.dumps({"updated_fields": list(values.keys())}, default=str),
            }
        )
        return result
