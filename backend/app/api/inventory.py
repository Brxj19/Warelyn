from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import require_roles
from app.models.auth import UserRole
from app.schemas.inventory import (
    DeductReservationRequest,
    InventoryMutationResponse,
    ReconciliationDryRunResponse,
    ReleaseReservationRequest,
    ReserveStockRequest,
    StockAdjustRequest,
    StockInRequest,
    StockLedgerEntryRead,
    StockOutRequest,
    TransferStockRequest,
    WarehouseStockRead,
)
from app.services.auth import UserContext
from app.services.inventory import InventoryService

router = APIRouter(prefix="/inventory", tags=["inventory"])
read_roles = (UserRole.TENANT_ADMIN, UserRole.INVENTORY_MANAGER, UserRole.VIEWER, UserRole.SALES_STAFF, UserRole.PURCHASE_STAFF)
stock_writer_roles = (UserRole.TENANT_ADMIN, UserRole.INVENTORY_MANAGER)
reservation_roles = (*stock_writer_roles, UserRole.SALES_STAFF)


@router.get("/stock", response_model=list[WarehouseStockRead])
def list_stock(context: UserContext = Depends(require_roles(*read_roles)), db: Session = Depends(get_db)) -> list[WarehouseStockRead]:
    return InventoryService(db).list_stock(context.tenant_id)


@router.get("/ledger", response_model=list[StockLedgerEntryRead])
def list_ledger(context: UserContext = Depends(require_roles(*read_roles)), db: Session = Depends(get_db)) -> list[StockLedgerEntryRead]:
    return InventoryService(db).list_ledger(context.tenant_id)


@router.get("/reconciliation/dry-run", response_model=ReconciliationDryRunResponse)
def reconciliation_dry_run(context: UserContext = Depends(require_roles(*stock_writer_roles)), db: Session = Depends(get_db)) -> ReconciliationDryRunResponse:
    return InventoryService(db).reconcile_stock_dry_run(context.tenant_id)


@router.post("/stock-in", response_model=InventoryMutationResponse)
def stock_in(request: StockInRequest, context: UserContext = Depends(require_roles(*stock_writer_roles)), db: Session = Depends(get_db)) -> InventoryMutationResponse:
    return InventoryService(db).stock_in(context.tenant_id, context.user.id, request.model_dump())


@router.post("/stock-out", response_model=InventoryMutationResponse)
def stock_out(request: StockOutRequest, context: UserContext = Depends(require_roles(*stock_writer_roles)), db: Session = Depends(get_db)) -> InventoryMutationResponse:
    return InventoryService(db).stock_out(context.tenant_id, context.user.id, request.model_dump())


@router.post("/adjust", response_model=InventoryMutationResponse)
def adjust_stock(request: StockAdjustRequest, context: UserContext = Depends(require_roles(*stock_writer_roles)), db: Session = Depends(get_db)) -> InventoryMutationResponse:
    return InventoryService(db).adjust_stock(context.tenant_id, context.user.id, request.model_dump())


@router.post("/reserve", response_model=InventoryMutationResponse)
def reserve_stock(request: ReserveStockRequest, context: UserContext = Depends(require_roles(*reservation_roles)), db: Session = Depends(get_db)) -> InventoryMutationResponse:
    return InventoryService(db).reserve_stock(context.tenant_id, context.user.id, request.model_dump())


@router.post("/reservations/{reservation_id}/release", response_model=InventoryMutationResponse)
def release_reservation(reservation_id: int, request: ReleaseReservationRequest, context: UserContext = Depends(require_roles(*reservation_roles)), db: Session = Depends(get_db)) -> InventoryMutationResponse:
    return InventoryService(db).release_reservation(context.tenant_id, context.user.id, reservation_id, request.model_dump())


@router.post("/reservations/{reservation_id}/deduct", response_model=InventoryMutationResponse)
def deduct_reserved_stock(reservation_id: int, request: DeductReservationRequest, context: UserContext = Depends(require_roles(*reservation_roles)), db: Session = Depends(get_db)) -> InventoryMutationResponse:
    return InventoryService(db).deduct_reserved_stock(context.tenant_id, context.user.id, reservation_id, request.model_dump())


@router.post("/transfer", response_model=InventoryMutationResponse)
def transfer_stock(request: TransferStockRequest, context: UserContext = Depends(require_roles(*stock_writer_roles)), db: Session = Depends(get_db)) -> InventoryMutationResponse:
    return InventoryService(db).transfer_stock(context.tenant_id, context.user.id, request.model_dump())
