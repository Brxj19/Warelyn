import hashlib
import json
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.domain.inventory.reconciliation import InventoryReconciliation
from app.models.inventory import MovementType, ReferenceType, ReservationStatus, StockLedgerEntry, StockReservation, WarehouseStock
from app.repositories.inventory import InventoryRepository

ZERO = Decimal("0")


class InventoryEngine:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = InventoryRepository(db)

    def stock_in(self, tenant_id: int, actor_id: int, payload: dict[str, Any], auto_commit: bool = True) -> dict:
        return self._run_idempotent("stock_in", tenant_id, actor_id, payload, lambda: self._stock_in(tenant_id, actor_id, payload), auto_commit=auto_commit)

    def stock_out(self, tenant_id: int, actor_id: int, payload: dict[str, Any]) -> dict:
        return self._run_idempotent("stock_out", tenant_id, actor_id, payload, lambda: self._stock_out(tenant_id, actor_id, payload))

    def adjust_stock(self, tenant_id: int, actor_id: int, payload: dict[str, Any]) -> dict:
        return self._run_idempotent("adjust_stock", tenant_id, actor_id, payload, lambda: self._adjust_stock(tenant_id, actor_id, payload))

    def reserve_stock(self, tenant_id: int, actor_id: int, payload: dict[str, Any]) -> dict:
        return self._run_idempotent("reserve_stock", tenant_id, actor_id, payload, lambda: self._reserve_stock(tenant_id, actor_id, payload))

    def release_reservation(self, tenant_id: int, actor_id: int, reservation_id: int, payload: dict[str, Any]) -> dict:
        body = {**payload, "reservation_id": reservation_id}
        return self._run_idempotent("release_reservation", tenant_id, actor_id, body, lambda: self._release_reservation(tenant_id, actor_id, reservation_id, payload))

    def deduct_reserved_stock(self, tenant_id: int, actor_id: int, reservation_id: int, payload: dict[str, Any]) -> dict:
        body = {**payload, "reservation_id": reservation_id}
        return self._run_idempotent("deduct_reserved_stock", tenant_id, actor_id, body, lambda: self._deduct_reserved_stock(tenant_id, actor_id, reservation_id, payload))

    def transfer_stock(self, tenant_id: int, actor_id: int, payload: dict[str, Any]) -> dict:
        return self._run_idempotent("transfer_stock", tenant_id, actor_id, payload, lambda: self._transfer_stock(tenant_id, actor_id, payload))

    def reconcile_stock_dry_run(self, tenant_id: int) -> dict:
        return InventoryReconciliation(self.repository).dry_run(tenant_id)

    def _stock_in(self, tenant_id: int, actor_id: int, payload: dict[str, Any]) -> dict:
        quantity = self._positive_quantity(payload["quantity"])
        self._validate_dimension(tenant_id, payload["product_id"], payload["warehouse_id"], payload["location_id"])
        stock = self.repository.get_or_create_stock(tenant_id, payload["product_id"], payload["warehouse_id"], payload["location_id"])
        stock.quantity_on_hand += quantity
        stock.quantity_available += quantity
        self._assert_invariants(stock)
        entry = self._ledger(stock, MovementType.STOCK_IN, quantity, ZERO, quantity, actor_id, payload)
        return self._response(stock, [entry], None, payload["idempotency_key"])

    def _stock_out(self, tenant_id: int, actor_id: int, payload: dict[str, Any]) -> dict:
        quantity = self._positive_quantity(payload["quantity"])
        self._validate_dimension(tenant_id, payload["product_id"], payload["warehouse_id"], payload["location_id"])
        stock = self.repository.lock_stock(tenant_id, payload["product_id"], payload["warehouse_id"], payload["location_id"])
        if stock is None:
            raise AppError("STOCK_NOT_FOUND", "Stock was not found for this tenant.", 404)
        self._require_available(stock, quantity)
        stock.quantity_on_hand -= quantity
        stock.quantity_available -= quantity
        self._assert_invariants(stock)
        entry = self._ledger(stock, MovementType.STOCK_OUT, -quantity, ZERO, -quantity, actor_id, payload)
        return self._response(stock, [entry], None, payload["idempotency_key"])

    def _adjust_stock(self, tenant_id: int, actor_id: int, payload: dict[str, Any]) -> dict:
        delta = Decimal(str(payload["delta"]))
        if delta == ZERO:
            raise AppError("INVALID_STOCK_QUANTITY", "Adjustment delta cannot be zero.", 400)
        self._validate_dimension(tenant_id, payload["product_id"], payload["warehouse_id"], payload["location_id"])
        stock = self.repository.get_or_create_stock(tenant_id, payload["product_id"], payload["warehouse_id"], payload["location_id"])
        if delta < ZERO:
            self._require_available(stock, abs(delta))
            movement = MovementType.ADJUSTMENT_OUT
        else:
            movement = MovementType.ADJUSTMENT_IN
        stock.quantity_on_hand += delta
        stock.quantity_available += delta
        self._assert_invariants(stock)
        entry = self._ledger(stock, movement, delta, ZERO, delta, actor_id, payload)
        return self._response(stock, [entry], None, payload["idempotency_key"])

    def _reserve_stock(self, tenant_id: int, actor_id: int, payload: dict[str, Any]) -> dict:
        quantity = self._positive_quantity(payload["quantity"])
        self._validate_dimension(tenant_id, payload["product_id"], payload["warehouse_id"], payload["location_id"])
        stock = self.repository.lock_stock(tenant_id, payload["product_id"], payload["warehouse_id"], payload["location_id"])
        if stock is None:
            raise AppError("STOCK_NOT_FOUND", "Stock was not found for this tenant.", 404)
        self._require_available(stock, quantity)
        reservation = self.repository.create_reservation(
            {
                "tenant_id": tenant_id,
                "product_id": payload["product_id"],
                "warehouse_id": payload["warehouse_id"],
                "location_id": payload["location_id"],
                "quantity": quantity,
                "status": ReservationStatus.ACTIVE,
                "reference_type": payload.get("reference_type", ReferenceType.SALES_ORDER),
                "reference_id": payload.get("reference_id"),
                "created_by": actor_id,
            }
        )
        stock.quantity_reserved += quantity
        stock.quantity_available -= quantity
        self._assert_invariants(stock)
        entry = self._ledger(stock, MovementType.SALES_RESERVE, ZERO, quantity, -quantity, actor_id, payload)
        return self._response(stock, [entry], reservation, payload["idempotency_key"])

    def _release_reservation(self, tenant_id: int, actor_id: int, reservation_id: int, payload: dict[str, Any]) -> dict:
        reservation = self.repository.lock_reservation(tenant_id, reservation_id)
        if reservation is None:
            raise AppError("RESERVATION_NOT_FOUND", "Reservation was not found for this tenant.", 404)
        if reservation.status != ReservationStatus.ACTIVE:
            raise AppError("INVALID_RESERVATION_STATE", "Only active reservations can be released.", 409)
        stock = self.repository.lock_stock(tenant_id, reservation.product_id, reservation.warehouse_id, reservation.location_id)
        if stock is None:
            raise AppError("STOCK_NOT_FOUND", "Stock was not found for this tenant.", 404)
        reservation.status = ReservationStatus.RELEASED
        reservation.released_at = datetime.now(UTC)
        stock.quantity_reserved -= reservation.quantity
        stock.quantity_available += reservation.quantity
        self._assert_invariants(stock)
        ledger_payload = {**payload, "reference_type": reservation.reference_type, "reference_id": reservation.reference_id, "idempotency_key": payload["idempotency_key"]}
        entry = self._ledger(stock, MovementType.SALES_RELEASE, ZERO, -reservation.quantity, reservation.quantity, actor_id, ledger_payload)
        return self._response(stock, [entry], reservation, payload["idempotency_key"])

    def _deduct_reserved_stock(self, tenant_id: int, actor_id: int, reservation_id: int, payload: dict[str, Any]) -> dict:
        reservation = self.repository.lock_reservation(tenant_id, reservation_id)
        if reservation is None:
            raise AppError("RESERVATION_NOT_FOUND", "Reservation was not found for this tenant.", 404)
        if reservation.status != ReservationStatus.ACTIVE:
            raise AppError("INVALID_RESERVATION_STATE", "Only active reservations can be deducted.", 409)
        stock = self.repository.lock_stock(tenant_id, reservation.product_id, reservation.warehouse_id, reservation.location_id)
        if stock is None:
            raise AppError("STOCK_NOT_FOUND", "Stock was not found for this tenant.", 404)
        reservation.status = ReservationStatus.DEDUCTED
        reservation.deducted_at = datetime.now(UTC)
        stock.quantity_on_hand -= reservation.quantity
        stock.quantity_reserved -= reservation.quantity
        self._assert_invariants(stock)
        ledger_payload = {**payload, "reference_type": reservation.reference_type, "reference_id": reservation.reference_id, "idempotency_key": payload["idempotency_key"]}
        entry = self._ledger(stock, MovementType.SALES_DEDUCT, -reservation.quantity, -reservation.quantity, ZERO, actor_id, ledger_payload)
        return self._response(stock, [entry], reservation, payload["idempotency_key"])

    def _transfer_stock(self, tenant_id: int, actor_id: int, payload: dict[str, Any]) -> dict:
        quantity = self._positive_quantity(payload["quantity"])
        source = (payload["product_id"], payload["source_warehouse_id"], payload["source_location_id"])
        destination = (payload["product_id"], payload["destination_warehouse_id"], payload["destination_location_id"])
        if source == destination:
            raise AppError("INVALID_STOCK_STATE", "Source and destination stock dimensions must differ.", 400)
        self._validate_dimension(tenant_id, *source)
        self._validate_dimension(tenant_id, *destination)
        locked = {}
        for dimension in sorted([source, destination]):
            locked[dimension] = self.repository.get_or_create_stock(tenant_id, *dimension)
        source_stock = locked[source]
        destination_stock = locked[destination]
        self._require_available(source_stock, quantity)
        source_stock.quantity_on_hand -= quantity
        source_stock.quantity_available -= quantity
        destination_stock.quantity_on_hand += quantity
        destination_stock.quantity_available += quantity
        self._assert_invariants(source_stock)
        self._assert_invariants(destination_stock)
        source_payload = {**payload, "warehouse_id": source_stock.warehouse_id, "location_id": source_stock.location_id}
        dest_payload = {**payload, "warehouse_id": destination_stock.warehouse_id, "location_id": destination_stock.location_id}
        out_entry = self._ledger(source_stock, MovementType.TRANSFER_OUT, -quantity, ZERO, -quantity, actor_id, source_payload)
        in_entry = self._ledger(destination_stock, MovementType.TRANSFER_IN, quantity, ZERO, quantity, actor_id, dest_payload)
        return self._response([source_stock, destination_stock], [out_entry, in_entry], None, payload["idempotency_key"])

    def _validate_dimension(self, tenant_id: int, product_id: int, warehouse_id: int, location_id: int) -> None:
        if self.repository.get_product(tenant_id, product_id) is None:
            raise AppError("PRODUCT_NOT_FOUND", "Product was not found for this tenant.", 404)
        if self.repository.get_warehouse(tenant_id, warehouse_id) is None:
            raise AppError("WAREHOUSE_NOT_FOUND", "Warehouse was not found for this tenant.", 404)
        if self.repository.get_location(tenant_id, warehouse_id, location_id) is None:
            raise AppError("LOCATION_NOT_FOUND", "Location was not found for this tenant warehouse.", 404)

    def _run_idempotent(self, operation: str, tenant_id: int, actor_id: int, payload: dict[str, Any], handler: Any, auto_commit: bool = True) -> dict:
        key = payload.get("idempotency_key")
        if not key:
            raise AppError("IDEMPOTENCY_KEY_REQUIRED", "Idempotency key is required.", 400)
        request_hash = self._request_hash(payload)
        existing = self.repository.get_idempotency(tenant_id, key, operation)
        if existing:
            if existing.request_hash != request_hash:
                raise AppError("IDEMPOTENCY_CONFLICT", "Idempotency key was already used with a different request.", 409)
            return existing.response_json
        try:
            response = handler()
            self.repository.store_idempotency(tenant_id, key, operation, request_hash, response, actor_id)
            if auto_commit:
                self.db.commit()
            return response
        except AppError:
            if auto_commit:
                self.db.rollback()
            raise
        except IntegrityError as exc:
            if auto_commit:
                self.db.rollback()
            raise AppError("IDEMPOTENCY_CONFLICT", "Idempotency key was already used.", 409) from exc

    def _ledger(self, stock: WarehouseStock, movement_type: MovementType, quantity_delta: Decimal, reserved_delta: Decimal, available_delta: Decimal, actor_id: int, payload: dict[str, Any]) -> StockLedgerEntry:
        return self.repository.add_ledger_entry(
            {
                "tenant_id": stock.tenant_id,
                "product_id": stock.product_id,
                "warehouse_id": stock.warehouse_id,
                "location_id": stock.location_id,
                "movement_type": movement_type,
                "quantity_delta": quantity_delta,
                "reserved_delta": reserved_delta,
                "available_delta": available_delta,
                "reference_type": payload.get("reference_type", ReferenceType.MANUAL),
                "reference_id": payload.get("reference_id"),
                "idempotency_key": payload["idempotency_key"],
                "note": payload.get("note"),
                "created_by": actor_id,
            }
        )

    def _response(self, stock: WarehouseStock | list[WarehouseStock], entries: list[StockLedgerEntry], reservation: StockReservation | None, idempotency_key: str) -> dict:
        self.db.flush()
        return {
            "stock": [self._stock_json(item) for item in stock] if isinstance(stock, list) else self._stock_json(stock),
            "ledger_entries": [self._ledger_json(entry) for entry in entries],
            "reservation": self._reservation_json(reservation) if reservation else None,
            "idempotency_key": idempotency_key,
        }

    def _stock_json(self, stock: WarehouseStock) -> dict:
        return {
            "id": stock.id,
            "tenant_id": stock.tenant_id,
            "product_id": stock.product_id,
            "warehouse_id": stock.warehouse_id,
            "location_id": stock.location_id,
            "quantity_on_hand": str(stock.quantity_on_hand),
            "quantity_reserved": str(stock.quantity_reserved),
            "quantity_available": str(stock.quantity_available),
            "updated_at": datetime.now(UTC).isoformat(),
        }

    def _ledger_json(self, entry: StockLedgerEntry) -> dict:
        return {
            "id": entry.id,
            "tenant_id": entry.tenant_id,
            "product_id": entry.product_id,
            "warehouse_id": entry.warehouse_id,
            "location_id": entry.location_id,
            "movement_type": entry.movement_type.value,
            "quantity_delta": str(entry.quantity_delta),
            "reserved_delta": str(entry.reserved_delta),
            "available_delta": str(entry.available_delta),
            "reference_type": entry.reference_type.value,
            "reference_id": entry.reference_id,
            "idempotency_key": entry.idempotency_key,
            "note": entry.note,
            "created_by": entry.created_by,
            "created_at": datetime.now(UTC).isoformat(),
        }

    def _reservation_json(self, reservation: StockReservation) -> dict:
        return {
            "id": reservation.id,
            "tenant_id": reservation.tenant_id,
            "product_id": reservation.product_id,
            "warehouse_id": reservation.warehouse_id,
            "location_id": reservation.location_id,
            "quantity": str(reservation.quantity),
            "status": reservation.status.value,
            "reference_type": reservation.reference_type.value,
            "reference_id": reservation.reference_id,
            "created_by": reservation.created_by,
            "released_at": reservation.released_at.isoformat() if reservation.released_at else None,
            "deducted_at": reservation.deducted_at.isoformat() if reservation.deducted_at else None,
            "created_at": datetime.now(UTC).isoformat(),
            "updated_at": datetime.now(UTC).isoformat(),
        }

    def _request_hash(self, payload: dict[str, Any]) -> str:
        encoded = json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()

    def _positive_quantity(self, value: Any) -> Decimal:
        quantity = Decimal(str(value))
        if quantity <= ZERO:
            raise AppError("INVALID_STOCK_QUANTITY", "Quantity must be greater than zero.", 400)
        return quantity

    def _require_available(self, stock: WarehouseStock, quantity: Decimal) -> None:
        if stock.quantity_available < quantity:
            raise AppError("INSUFFICIENT_STOCK", "Available stock is insufficient for this operation.", 409)

    def _assert_invariants(self, stock: WarehouseStock) -> None:
        if stock.quantity_on_hand < ZERO or stock.quantity_reserved < ZERO or stock.quantity_available < ZERO:
            raise AppError("INVALID_STOCK_STATE", "Stock quantities cannot be negative.", 409)
        if stock.quantity_reserved > stock.quantity_on_hand:
            raise AppError("INVALID_STOCK_STATE", "Reserved quantity cannot exceed on-hand quantity.", 409)
        if stock.quantity_available != stock.quantity_on_hand - stock.quantity_reserved:
            raise AppError("INVALID_STOCK_STATE", "Available quantity must equal on-hand minus reserved quantity.", 409)
