import csv
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation
from io import StringIO
from typing import Any

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.imports import ImportJob, ImportJobRow, ImportJobStatus, ImportRowStatus, ProductImportMode
from app.models.master_data import RecordStatus
from app.repositories.imports import ImportRepository

REQUIRED_FIELDS = {"name", "sku", "unit"}
OPTIONAL_FIELDS = {
    "barcode",
    "description",
    "category_name",
    "brand_name",
    "vendor_name",
    "cost_price",
    "selling_price",
    "reorder_level",
    "track_batch",
    "track_expiry",
    "track_serial",
    "status",
}
BOOLEAN_VALUES = {"true": True, "yes": True, "1": True, "false": False, "no": False, "0": False, "": False}


class ProductImportService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = ImportRepository(db)

    def upload(self, tenant_id: int, actor_id: int, filename: str, content: bytes, mode: ProductImportMode, create_missing_references: bool) -> ImportJob:
        rows = self._parse_csv(content)
        job = self.repository.create_job(
            {
                "tenant_id": tenant_id,
                "created_by": actor_id,
                "import_type": "products",
                "filename": filename,
                "mode": mode,
                "status": ImportJobStatus.UPLOADED,
                "total_rows": len(rows),
                "valid_rows": 0,
                "error_rows": 0,
                "warning_rows": 0,
                "created_count": 0,
                "updated_count": 0,
                "skipped_count": 0,
            }
        )
        self.repository.create_rows(
            [
                ImportJobRow(
                    tenant_id=tenant_id,
                    job_id=job.id,
                    row_number=index + 2,
                    raw_data={**row, "_create_missing_references": str(create_missing_references).lower()},
                    normalized_data=None,
                    status=ImportRowStatus.PENDING,
                    errors=[],
                    warnings=[],
                )
                for index, row in enumerate(rows)
            ]
        )
        self.db.commit()
        self.db.refresh(job)
        return job

    def get_job(self, tenant_id: int, job_id: int) -> ImportJob:
        job = self.repository.get_job(tenant_id, job_id)
        if job is None:
            raise AppError("IMPORT_JOB_NOT_FOUND", "Import job was not found for this tenant.", 404)
        return job

    def list_rows(self, tenant_id: int, job_id: int) -> list[ImportJobRow]:
        self.get_job(tenant_id, job_id)
        return self.repository.list_rows(tenant_id, job_id)

    def validate(self, tenant_id: int, job_id: int) -> tuple[ImportJob, list[ImportJobRow]]:
        job = self.get_job(tenant_id, job_id)
        if job.status in (ImportJobStatus.COMMITTED, ImportJobStatus.CANCELLED):
            raise AppError("INVALID_IMPORT_STATE", "Committed or cancelled jobs cannot be validated.", 409)
        job.status = ImportJobStatus.VALIDATING
        rows = self.repository.list_rows(tenant_id, job_id)
        seen_skus: dict[str, int] = {}
        seen_barcodes: dict[str, int] = {}
        create_missing = self._row_create_missing(rows)
        counts = {"valid": 0, "error": 0, "warning": 0}
        for row in rows:
            normalized, errors, warnings, existing_product_id = self._validate_row(tenant_id, row, job.mode, create_missing, seen_skus, seen_barcodes)
            row.normalized_data = normalized
            row.errors = errors
            row.warnings = warnings
            row.existing_product_id = existing_product_id
            if errors:
                row.status = ImportRowStatus.ERROR
                counts["error"] += 1
            elif warnings:
                row.status = ImportRowStatus.WARNING
                counts["warning"] += 1
                counts["valid"] += 1
            else:
                row.status = ImportRowStatus.VALID
                counts["valid"] += 1
        job.valid_rows = counts["valid"]
        job.error_rows = counts["error"]
        job.warning_rows = counts["warning"]
        job.status = ImportJobStatus.HAS_ERRORS if counts["error"] else ImportJobStatus.VALIDATED
        job.validated_at = datetime.now(UTC)
        self.db.commit()
        return job, rows

    def commit(self, tenant_id: int, job_id: int) -> tuple[ImportJob, list[ImportJobRow]]:
        job = self.get_job(tenant_id, job_id)
        if job.status == ImportJobStatus.UPLOADED:
            job, _ = self.validate(tenant_id, job_id)
        if job.status not in (ImportJobStatus.VALIDATED, ImportJobStatus.HAS_ERRORS):
            raise AppError("INVALID_IMPORT_STATE", "Only validated import jobs can be committed.", 409)
        created = updated = skipped = 0
        create_missing = self._row_create_missing(self.repository.list_rows(tenant_id, job_id))
        for row in self.repository.list_rows(tenant_id, job_id):
            if row.status == ImportRowStatus.ERROR or not row.normalized_data:
                row.status = ImportRowStatus.SKIPPED
                skipped += 1
                continue
            product = self.repository.get_product_by_sku(tenant_id, row.normalized_data["sku"])
            product_values = self._product_values(tenant_id, row.normalized_data, create_missing, row.warnings)
            if product:
                for key, value in product_values.items():
                    if key != "tenant_id":
                        setattr(product, key, value)
                row.status = ImportRowStatus.UPDATED
                row.existing_product_id = product.id
                updated += 1
            else:
                product = self.repository.create_product(product_values)
                row.status = ImportRowStatus.CREATED
                row.created_product_id = product.id
                created += 1
        job.created_count = created
        job.updated_count = updated
        job.skipped_count = skipped
        job.status = ImportJobStatus.COMMITTED
        job.committed_at = datetime.now(UTC)
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise AppError("IMPORT_COMMIT_FAILED", "Import commit failed because of duplicate catalog data.", 409) from exc
        return job, self.repository.list_rows(tenant_id, job_id)

    def cancel(self, tenant_id: int, job_id: int) -> ImportJob:
        job = self.get_job(tenant_id, job_id)
        if job.status == ImportJobStatus.COMMITTED:
            raise AppError("INVALID_IMPORT_STATE", "Committed import jobs cannot be cancelled.", 409)
        job.status = ImportJobStatus.CANCELLED
        job.cancelled_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(job)
        return job

    def _parse_csv(self, content: bytes) -> list[dict[str, str]]:
        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise AppError("INVALID_IMPORT_FILE", "CSV file must be UTF-8 encoded.", 400) from exc
        reader = csv.DictReader(StringIO(text))
        if not reader.fieldnames:
            raise AppError("INVALID_IMPORT_FILE", "CSV file must include a header row.", 400)
        normalized_headers = [field.strip().lower() for field in reader.fieldnames]
        missing = REQUIRED_FIELDS - set(normalized_headers)
        if missing:
            raise AppError("INVALID_IMPORT_COLUMNS", f"Missing required columns: {', '.join(sorted(missing))}.", 400)
        rows = []
        for row in reader:
            rows.append({(key or "").strip().lower(): (value or "").strip() for key, value in row.items()})
        return rows

    def _validate_row(self, tenant_id: int, row: ImportJobRow, mode: ProductImportMode, create_missing: bool, seen_skus: dict[str, int], seen_barcodes: dict[str, int]) -> tuple[dict[str, Any], list[str], list[str], int | None]:
        raw = row.raw_data
        errors: list[str] = []
        warnings: list[str] = []
        normalized: dict[str, Any] = {}
        for field in REQUIRED_FIELDS:
            value = raw.get(field, "").strip()
            if not value:
                errors.append(f"{field} is required")
            normalized[field] = value
        normalized["barcode"] = raw.get("barcode") or None
        normalized["description"] = raw.get("description") or None
        normalized["category_name"] = raw.get("category_name") or None
        normalized["brand_name"] = raw.get("brand_name") or None
        normalized["vendor_name"] = raw.get("vendor_name") or None
        normalized["status"] = raw.get("status") or RecordStatus.ACTIVE.value
        if normalized["status"] not in {item.value for item in RecordStatus}:
            errors.append("status must be ACTIVE, INACTIVE, or ARCHIVED")
        for price_field in ["cost_price", "selling_price"]:
            parsed = self._decimal(raw.get(price_field), price_field, errors)
            normalized[price_field] = str(parsed) if parsed is not None else None
        normalized["reorder_level"] = self._non_negative_int(raw.get("reorder_level"), "reorder_level", errors)
        for flag in ["track_batch", "track_expiry", "track_serial"]:
            normalized[flag] = self._bool(raw.get(flag, "false"), flag, errors)
        sku = normalized.get("sku")
        barcode = normalized.get("barcode")
        if sku:
            if sku in seen_skus:
                errors.append(f"duplicate SKU in file; first seen on row {seen_skus[sku]}")
            else:
                seen_skus[sku] = row.row_number
        if barcode:
            if barcode in seen_barcodes:
                errors.append(f"duplicate barcode in file; first seen on row {seen_barcodes[barcode]}")
            else:
                seen_barcodes[barcode] = row.row_number
        existing = self.repository.get_product_by_sku(tenant_id, sku) if sku else None
        if mode == ProductImportMode.create_only and existing:
            errors.append("SKU already exists for this tenant")
        if mode == ProductImportMode.update_existing and not existing:
            errors.append("SKU does not exist for update_existing mode")
        if barcode:
            barcode_product = self.repository.get_product_by_barcode(tenant_id, barcode)
            if barcode_product and (not existing or barcode_product.id != existing.id):
                errors.append("barcode already exists for this tenant")
        for ref_field in ["category_name", "brand_name", "vendor_name"]:
            name = normalized.get(ref_field)
            if name and not create_missing:
                warnings.append(f"{ref_field} will only be linked if it already exists")
        if normalized.get("vendor_name"):
            warnings.append("Vendor exists/created but product-vendor linking is not supported in this phase")
        return normalized, errors, warnings, existing.id if existing else None

    def _product_values(self, tenant_id: int, data: dict[str, Any], create_missing: bool, warnings: list[str]) -> dict[str, Any]:
        values = {
            "tenant_id": tenant_id,
            "name": data["name"],
            "sku": data["sku"],
            "barcode": data.get("barcode"),
            "description": data.get("description"),
            "unit": data["unit"],
            "cost_price": Decimal(str(data["cost_price"])) if data.get("cost_price") is not None else None,
            "selling_price": Decimal(str(data["selling_price"])) if data.get("selling_price") is not None else None,
            "reorder_level": data.get("reorder_level"),
            "track_batch": data.get("track_batch", False),
            "track_expiry": data.get("track_expiry", False),
            "track_serial": data.get("track_serial", False),
            "status": RecordStatus(data.get("status", RecordStatus.ACTIVE.value)),
        }
        if data.get("category_name"):
            category = self.repository.get_category_by_name(tenant_id, data["category_name"])
            if category is None and create_missing:
                category = self.repository.create_category(tenant_id, data["category_name"])
            values["category_id"] = category.id if category else None
        if data.get("brand_name"):
            brand = self.repository.get_brand_by_name(tenant_id, data["brand_name"])
            if brand is None and create_missing:
                brand = self.repository.create_brand(tenant_id, data["brand_name"])
            values["brand_id"] = brand.id if brand else None
        if data.get("vendor_name") and create_missing and self.repository.get_vendor_by_name(tenant_id, data["vendor_name"]) is None:
            self.repository.create_vendor(tenant_id, data["vendor_name"])
        return values

    def _row_create_missing(self, rows: list[ImportJobRow]) -> bool:
        return any(row.raw_data.get("_create_missing_references") == "true" for row in rows)

    def _decimal(self, value: str | None, field: str, errors: list[str]) -> Decimal | None:
        if not value:
            return None
        try:
            parsed = Decimal(str(value))
        except (InvalidOperation, ValueError):
            errors.append(f"{field} must be numeric")
            return None
        if parsed < 0:
            errors.append(f"{field} cannot be negative")
        return parsed

    def _non_negative_int(self, value: str | None, field: str, errors: list[str]) -> int | None:
        if not value:
            return None
        try:
            parsed = int(value)
        except ValueError:
            errors.append(f"{field} must be an integer")
            return None
        if parsed < 0:
            errors.append(f"{field} cannot be negative")
        return parsed

    def _bool(self, value: str | None, field: str, errors: list[str]) -> bool:
        key = (value or "").strip().lower()
        if key not in BOOLEAN_VALUES:
            errors.append(f"{field} must be boolean-compatible")
            return False
        return BOOLEAN_VALUES[key]
