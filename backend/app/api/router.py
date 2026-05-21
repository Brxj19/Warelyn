from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.catalog import router as catalog_router
from app.api.health import router as health_router
from app.api.imports import router as imports_router
from app.api.inventory import router as inventory_router
from app.api.purchasing import router as purchasing_router
from app.api.sales import router as sales_router
from app.api.warehouses import router as warehouses_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(catalog_router)
api_router.include_router(health_router)
api_router.include_router(imports_router)
api_router.include_router(inventory_router)
api_router.include_router(purchasing_router)
api_router.include_router(sales_router)
api_router.include_router(warehouses_router)
