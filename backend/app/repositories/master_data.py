from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.master_data import Brand, Category, Customer, Product, Vendor, Warehouse, WarehouseLocation
from app.repositories.base import TenantScopedRepository


class CategoryRepository(TenantScopedRepository[Category]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Category)


class BrandRepository(TenantScopedRepository[Brand]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Brand)


class VendorRepository(TenantScopedRepository[Vendor]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Vendor)


class CustomerRepository(TenantScopedRepository[Customer]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Customer)


class ProductRepository(TenantScopedRepository[Product]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Product)


class WarehouseRepository(TenantScopedRepository[Warehouse]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Warehouse)


class WarehouseLocationRepository(TenantScopedRepository[WarehouseLocation]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, WarehouseLocation)

    def list_for_warehouse(self, tenant_id: int, warehouse_id: int) -> list[WarehouseLocation]:
        return list(self.db.scalars(select(WarehouseLocation).where(WarehouseLocation.tenant_id == tenant_id, WarehouseLocation.warehouse_id == warehouse_id)))

    def get_for_warehouse(self, tenant_id: int, warehouse_id: int, location_id: int) -> WarehouseLocation | None:
        return self.db.scalar(
            select(WarehouseLocation).where(
                WarehouseLocation.id == location_id,
                WarehouseLocation.tenant_id == tenant_id,
                WarehouseLocation.warehouse_id == warehouse_id,
            )
        )
