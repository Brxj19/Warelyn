from typing import Any

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.domain.inventory.engine import InventoryEngine
from app.models.inventory import InventoryBatch, InventorySerial, StockLedgerEntry, WarehouseStock
from app.repositories.inventory import InventoryRepository


class InventoryService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = InventoryRepository(db)
        self.engine = InventoryEngine(db)

    def list_stock(self, tenant_id: int) -> list[WarehouseStock]:
        return self.repository.list_stock(tenant_id)

    def list_ledger(self, tenant_id: int) -> list[StockLedgerEntry]:
        return self.repository.list_ledger(tenant_id)

    def list_batches(self, tenant_id: int) -> list[InventoryBatch]:
        return self.repository.list_batches(tenant_id)

    def get_batch(self, tenant_id: int, batch_id: int) -> InventoryBatch:
        batch = self.repository.get_batch(tenant_id, batch_id)
        if batch is None:
            raise AppError("BATCH_NOT_FOUND", "Inventory batch was not found for this tenant.", 404)
        return batch

    def list_serials(self, tenant_id: int) -> list[InventorySerial]:
        return self.repository.list_serials(tenant_id)

    def get_serial(self, tenant_id: int, serial_id: int) -> InventorySerial:
        serial = self.repository.get_serial(tenant_id, serial_id)
        if serial is None:
            raise AppError("SERIAL_NOT_FOUND", "Inventory serial was not found for this tenant.", 404)
        return serial

    def stock_in(self, tenant_id: int, actor_id: int, values: dict[str, Any], auto_commit: bool = True) -> dict:
        return self.engine.stock_in(tenant_id, actor_id, values, auto_commit=auto_commit)

    def stock_out(self, tenant_id: int, actor_id: int, values: dict[str, Any]) -> dict:
        return self.engine.stock_out(tenant_id, actor_id, values)

    def adjust_stock(self, tenant_id: int, actor_id: int, values: dict[str, Any]) -> dict:
        return self.engine.adjust_stock(tenant_id, actor_id, values)

    def reserve_stock(self, tenant_id: int, actor_id: int, values: dict[str, Any], auto_commit: bool = True) -> dict:
        return self.engine.reserve_stock(tenant_id, actor_id, values, auto_commit=auto_commit)

    def release_reservation(self, tenant_id: int, actor_id: int, reservation_id: int, values: dict[str, Any], auto_commit: bool = True) -> dict:
        return self.engine.release_reservation(tenant_id, actor_id, reservation_id, values, auto_commit=auto_commit)

    def deduct_reserved_stock(self, tenant_id: int, actor_id: int, reservation_id: int, values: dict[str, Any], auto_commit: bool = True) -> dict:
        return self.engine.deduct_reserved_stock(tenant_id, actor_id, reservation_id, values, auto_commit=auto_commit)

    def transfer_stock(self, tenant_id: int, actor_id: int, values: dict[str, Any]) -> dict:
        return self.engine.transfer_stock(tenant_id, actor_id, values)

    def reconcile_stock_dry_run(self, tenant_id: int) -> dict:
        return self.engine.reconcile_stock_dry_run(tenant_id)
