from __future__ import annotations

from collections import defaultdict
from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.documents import (
    Bill,
    BillItem,
    BillStatus,
    DocumentTemplateChannel,
    DocumentTemplateKey,
    Invoice,
    InvoiceItem,
    InvoiceStatus,
    NumberSequenceKey,
)
from app.repositories.audit import AuditLogRepository
from app.repositories.documents import DocumentsRepository
from app.services.email_service import send_email
from app.services.pdf_service import build_simple_pdf

ZERO = Decimal("0.00")

DEFAULT_TEMPLATES: dict[tuple[DocumentTemplateChannel, DocumentTemplateKey], dict[str, str | bool | None]] = {
    (DocumentTemplateChannel.EMAIL, DocumentTemplateKey.EMAIL_VERIFICATION): {
        "name": "Email verification",
        "subject_template": "Verify your Warelyn email",
        "body_template": "Hello {user_name},\n\nYour Warelyn verification code is {code}.\nIt expires in {expiry_minutes} minutes.\n\nIf you did not request this, please ignore this email.",
        "is_active": True,
    },
    (DocumentTemplateChannel.EMAIL, DocumentTemplateKey.INVOICE_SEND): {
        "name": "Invoice email",
        "subject_template": "Invoice {invoice_number} from {company_name}",
        "body_template": "Hello,\n\nPlease find invoice {invoice_number} for {customer_name}.\nTotal: {currency} {total_amount}\nStatus: {status}\n\nRegards,\n{company_name}",
        "is_active": True,
    },
    (DocumentTemplateChannel.EMAIL, DocumentTemplateKey.BILL_SEND): {
        "name": "Bill email",
        "subject_template": "Bill {bill_number} from {company_name}",
        "body_template": "Hello,\n\nPlease find bill {bill_number} for {vendor_name}.\nTotal: {currency} {total_amount}\nStatus: {status}\n\nRegards,\n{company_name}",
        "is_active": True,
    },
    (DocumentTemplateChannel.PDF, DocumentTemplateKey.PDF_INVOICE): {
        "name": "Invoice PDF",
        "subject_template": None,
        "body_template": "{company_name}\nInvoice {invoice_number}\nCustomer: {customer_name}\nIssue date: {issue_date}\nDue date: {due_date}\nStatus: {status}\nSubtotal: {currency} {subtotal_amount}\nTax: {currency} {tax_amount}\nDiscount: {currency} {discount_amount}\nTotal: {currency} {total_amount}\n\n{line_items}\n\n{document_footer}",
        "is_active": True,
    },
    (DocumentTemplateChannel.PDF, DocumentTemplateKey.PDF_BILL): {
        "name": "Bill PDF",
        "subject_template": None,
        "body_template": "{company_name}\nBill {bill_number}\nVendor: {vendor_name}\nIssue date: {issue_date}\nDue date: {due_date}\nStatus: {status}\nSubtotal: {currency} {subtotal_amount}\nTax: {currency} {tax_amount}\nDiscount: {currency} {discount_amount}\nTotal: {currency} {total_amount}\n\n{line_items}\n\n{document_footer}",
        "is_active": True,
    },
}


class SafeDict(defaultdict):
    def __missing__(self, key: str) -> str:
        return ""


def _naive_utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _decimal(value: Any) -> Decimal:
    if value is None:
        return ZERO
    if isinstance(value, Decimal):
        return value.quantize(Decimal("0.01"))
    return Decimal(str(value)).quantize(Decimal("0.01"))


class DocumentTemplateService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = DocumentsRepository(db)

    def list_templates(self, tenant_id: int, channel: str | None = None) -> list:
        self._ensure_defaults(tenant_id)
        resolved = DocumentTemplateChannel(channel) if channel else None
        return self.repository.list_templates(tenant_id, resolved)

    def update_template(self, tenant_id: int, template_id: int, values: dict[str, Any]):
        template = self.repository.get_template(tenant_id, template_id)
        if template is None:
            raise AppError("DOCUMENT_TEMPLATE_NOT_FOUND", "Document template was not found for this tenant.", 404)
        for key, value in values.items():
            setattr(template, key, value)
        self.db.commit()
        self.db.refresh(template)
        return template

    def preview_template(self, tenant_id: int, template_id: int, values: dict[str, Any]) -> dict[str, str | None]:
        template = self.repository.get_template(tenant_id, template_id)
        if template is None:
            raise AppError("DOCUMENT_TEMPLATE_NOT_FOUND", "Document template was not found for this tenant.", 404)
        context = self._preview_context(tenant_id, values)
        return {
            "subject": self._render(template.subject_template, context) if template.subject_template else None,
            "body": self._render(template.body_template, context),
        }

    def render_by_key(
        self,
        tenant_id: int,
        channel: DocumentTemplateChannel,
        template_key: DocumentTemplateKey,
        context: dict[str, Any],
    ) -> dict[str, str | None]:
        self._ensure_defaults(tenant_id)
        template = self.repository.get_template_by_key(tenant_id, channel, template_key)
        if template is None or not template.is_active:
            raise AppError("DOCUMENT_TEMPLATE_NOT_FOUND", "Active document template was not found for this tenant.", 404)
        return {
            "subject": self._render(template.subject_template, context) if template.subject_template else None,
            "body": self._render(template.body_template, context),
        }

    def _preview_context(self, tenant_id: int, values: dict[str, Any]) -> dict[str, Any]:
        base = DocumentsService(self.db)._base_template_context(tenant_id)
        if values.get("invoice_id"):
            invoice = DocumentsService(self.db).get_invoice(tenant_id, int(values["invoice_id"]))
            return {**base, **DocumentsService(self.db)._invoice_context(invoice)}
        if values.get("bill_id"):
            bill = DocumentsService(self.db).get_bill(tenant_id, int(values["bill_id"]))
            return {**base, **DocumentsService(self.db)._bill_context(bill)}
        return {**base, **values.get("variables", {})}

    def _ensure_defaults(self, tenant_id: int) -> None:
        created = False
        for (channel, template_key), payload in DEFAULT_TEMPLATES.items():
            if self.repository.get_template_by_key(tenant_id, channel, template_key) is None:
                self.repository.create_template(
                    {
                        "tenant_id": tenant_id,
                        "channel": channel,
                        "template_key": template_key,
                        "name": payload["name"],
                        "subject_template": payload["subject_template"],
                        "body_template": payload["body_template"],
                        "is_active": payload["is_active"],
                    }
                )
                created = True
        if created:
            self.db.commit()

    def _render(self, template: str | None, context: dict[str, Any]) -> str:
        if not template:
            return ""
        normalized = SafeDict(str)
        for key, value in context.items():
            normalized[key] = "" if value is None else str(value)
        return template.format_map(normalized)


class DocumentsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = DocumentsRepository(db)
        self.audit_logs = AuditLogRepository(db)
        self.templates = DocumentTemplateService(db)

    def list_invoices(self, tenant_id: int) -> list[Invoice]:
        return self.repository.list_invoices(tenant_id)

    def get_invoice(self, tenant_id: int, invoice_id: int) -> Invoice:
        invoice = self.repository.get_invoice(tenant_id, invoice_id)
        if invoice is None:
            raise AppError("INVOICE_NOT_FOUND", "Invoice was not found for this tenant.", 404)
        return invoice

    def create_invoice(self, tenant_id: int, actor_user_id: int, values: dict[str, Any]) -> Invoice:
        sales_order_id = values.get("sales_order_id")
        fulfillment_id = values.get("fulfillment_id")
        if not sales_order_id and not fulfillment_id:
            raise AppError("INVOICE_SOURCE_REQUIRED", "Invoice must reference a sales order or fulfillment.", 400)
        if sales_order_id:
            order = self.repository.get_sales_order(tenant_id, int(sales_order_id))
            if order is None:
                raise AppError("SALES_ORDER_NOT_FOUND", "Sales order was not found for this tenant.", 404)
        else:
            order = None
        fulfillment = self.repository.get_fulfillment(tenant_id, int(fulfillment_id)) if fulfillment_id else None
        if fulfillment_id and fulfillment is None:
            raise AppError("SALES_FULFILLMENT_NOT_FOUND", "Sales fulfillment was not found for this tenant.", 404)
        if fulfillment and order is None:
            order = self.repository.get_sales_order(tenant_id, fulfillment.sales_order_id)
        assert order is not None
        customer = self.repository.get_customer(tenant_id, order.customer_id)
        if customer is None:
            raise AppError("CUSTOMER_NOT_FOUND", "Customer was not found for this tenant.", 404)
        sequence = self._next_number(tenant_id, NumberSequenceKey.INVOICE, "INV")
        issue_date = values.get("issue_date") or date.today()
        tax_amount = _decimal(values.get("tax_amount"))
        discount_amount = _decimal(values.get("discount_amount"))
        line_items = []
        if fulfillment:
            order_items = {item.id: item for item in order.items}
            for row in fulfillment.items:
                order_item = order_items.get(row.sales_order_item_id)
                if order_item is None:
                    continue
                product = self.repository.get_product(tenant_id, row.product_id)
                description = product.name if product else f"Product #{row.product_id}"
                quantity = Decimal(str(row.fulfilled_quantity))
                unit_price = _decimal(order_item.unit_price)
                line_items.append(
                    {
                        "tenant_id": tenant_id,
                        "sales_order_item_id": order_item.id,
                        "product_id": row.product_id,
                        "description": description,
                        "quantity": quantity,
                        "unit_price": unit_price,
                        "line_total": _decimal(quantity * unit_price),
                    }
                )
        else:
            for order_item in order.items:
                product = self.repository.get_product(tenant_id, order_item.product_id)
                description = product.name if product else f"Product #{order_item.product_id}"
                quantity = Decimal(str(order_item.ordered_quantity))
                unit_price = _decimal(order_item.unit_price)
                line_items.append(
                    {
                        "tenant_id": tenant_id,
                        "sales_order_item_id": order_item.id,
                        "product_id": order_item.product_id,
                        "description": description,
                        "quantity": quantity,
                        "unit_price": unit_price,
                        "line_total": _decimal(quantity * unit_price),
                    }
                )
        subtotal = sum((item["line_total"] for item in line_items), ZERO)
        invoice = self.repository.create_invoice(
            {
                "tenant_id": tenant_id,
                "sales_order_id": order.id,
                "fulfillment_id": fulfillment.id if fulfillment else None,
                "customer_id": order.customer_id,
                "invoice_number": sequence,
                "status": InvoiceStatus.DRAFT,
                "issue_date": issue_date,
                "due_date": values.get("due_date"),
                "currency": values.get("currency") or self._base_template_context(tenant_id)["currency"] or "USD",
                "billing_address": self._address_for_party(customer),
                "subtotal_amount": subtotal,
                "tax_amount": tax_amount,
                "discount_amount": discount_amount,
                "total_amount": subtotal + tax_amount - discount_amount,
                "notes": values.get("notes"),
                "created_by": actor_user_id,
            }
        )
        for item in line_items:
            self.db.add(InvoiceItem(invoice_id=invoice.id, **item))
        return self._commit_and_refresh_invoice(tenant_id, invoice.id, "INVOICE_CREATED", actor_user_id)

    def list_bills(self, tenant_id: int) -> list[Bill]:
        return self.repository.list_bills(tenant_id)

    def get_bill(self, tenant_id: int, bill_id: int) -> Bill:
        bill = self.repository.get_bill(tenant_id, bill_id)
        if bill is None:
            raise AppError("BILL_NOT_FOUND", "Bill was not found for this tenant.", 404)
        return bill

    def create_bill(self, tenant_id: int, actor_user_id: int, values: dict[str, Any]) -> Bill:
        purchase_order_id = values.get("purchase_order_id")
        receipt_id = values.get("receipt_id")
        if not purchase_order_id and not receipt_id:
            raise AppError("BILL_SOURCE_REQUIRED", "Bill must reference a purchase order or purchase receipt.", 400)
        if purchase_order_id:
            po = self.repository.get_purchase_order(tenant_id, int(purchase_order_id))
            if po is None:
                raise AppError("PURCHASE_ORDER_NOT_FOUND", "Purchase order was not found for this tenant.", 404)
        else:
            po = None
        receipt = self.repository.get_purchase_receipt(tenant_id, int(receipt_id)) if receipt_id else None
        if receipt_id and receipt is None:
            raise AppError("PURCHASE_RECEIPT_NOT_FOUND", "Purchase receipt was not found for this tenant.", 404)
        if receipt and po is None:
            po = self.repository.get_purchase_order(tenant_id, receipt.purchase_order_id)
        assert po is not None
        vendor = self.repository.get_vendor(tenant_id, po.vendor_id)
        if vendor is None:
            raise AppError("VENDOR_NOT_FOUND", "Vendor was not found for this tenant.", 404)
        sequence = self._next_number(tenant_id, NumberSequenceKey.BILL, "BILL")
        issue_date = values.get("issue_date") or date.today()
        tax_amount = _decimal(values.get("tax_amount"))
        discount_amount = _decimal(values.get("discount_amount"))
        line_items = []
        if receipt:
            po_items = {item.id: item for item in po.items}
            for row in receipt.items:
                po_item = po_items.get(row.purchase_order_item_id)
                if po_item is None:
                    continue
                product = self.repository.get_product(tenant_id, row.product_id)
                description = product.name if product else f"Product #{row.product_id}"
                quantity = Decimal(str(row.received_quantity))
                unit_cost = _decimal(row.unit_cost or po_item.unit_cost)
                line_items.append(
                    {
                        "tenant_id": tenant_id,
                        "purchase_order_item_id": po_item.id,
                        "product_id": row.product_id,
                        "description": description,
                        "quantity": quantity,
                        "unit_cost": unit_cost,
                        "line_total": _decimal(quantity * unit_cost),
                    }
                )
        else:
            for po_item in po.items:
                product = self.repository.get_product(tenant_id, po_item.product_id)
                description = product.name if product else f"Product #{po_item.product_id}"
                quantity = Decimal(str(po_item.ordered_quantity))
                unit_cost = _decimal(po_item.unit_cost)
                line_items.append(
                    {
                        "tenant_id": tenant_id,
                        "purchase_order_item_id": po_item.id,
                        "product_id": po_item.product_id,
                        "description": description,
                        "quantity": quantity,
                        "unit_cost": unit_cost,
                        "line_total": _decimal(quantity * unit_cost),
                    }
                )
        subtotal = sum((item["line_total"] for item in line_items), ZERO)
        bill = self.repository.create_bill(
            {
                "tenant_id": tenant_id,
                "purchase_order_id": po.id,
                "receipt_id": receipt.id if receipt else None,
                "vendor_id": po.vendor_id,
                "bill_number": sequence,
                "status": BillStatus.DRAFT,
                "issue_date": issue_date,
                "due_date": values.get("due_date"),
                "currency": values.get("currency") or self._base_template_context(tenant_id)["currency"] or "USD",
                "billing_address": self._address_for_party(vendor),
                "subtotal_amount": subtotal,
                "tax_amount": tax_amount,
                "discount_amount": discount_amount,
                "total_amount": subtotal + tax_amount - discount_amount,
                "notes": values.get("notes"),
                "created_by": actor_user_id,
            }
        )
        for item in line_items:
            self.db.add(BillItem(bill_id=bill.id, **item))
        return self._commit_and_refresh_bill(tenant_id, bill.id, "BILL_CREATED", actor_user_id)

    def send_invoice(self, tenant_id: int, invoice_id: int, actor_user_id: int, email: str | None = None) -> Invoice:
        invoice = self.get_invoice(tenant_id, invoice_id)
        context = {**self._base_template_context(tenant_id), **self._invoice_context(invoice)}
        customer = self.repository.get_customer(tenant_id, invoice.customer_id)
        target_email = email or (customer.email if customer else None)
        if not target_email:
            raise AppError("INVOICE_EMAIL_REQUIRED", "Invoice email delivery requires a destination email address.", 400)
        rendered = self.templates.render_by_key(tenant_id, DocumentTemplateChannel.EMAIL, DocumentTemplateKey.INVOICE_SEND, context)
        send_email(target_email, rendered["subject"] or f"Invoice {invoice.invoice_number}", rendered["body"])
        invoice.status = InvoiceStatus.SENT
        invoice.sent_at = _naive_utcnow()
        return self._commit_and_refresh_invoice(tenant_id, invoice.id, "INVOICE_SENT", actor_user_id)

    def send_bill(self, tenant_id: int, bill_id: int, actor_user_id: int, email: str | None = None) -> Bill:
        bill = self.get_bill(tenant_id, bill_id)
        context = {**self._base_template_context(tenant_id), **self._bill_context(bill)}
        vendor = self.repository.get_vendor(tenant_id, bill.vendor_id)
        target_email = email or (vendor.email if vendor else None)
        if not target_email:
            raise AppError("BILL_EMAIL_REQUIRED", "Bill email delivery requires a destination email address.", 400)
        rendered = self.templates.render_by_key(tenant_id, DocumentTemplateChannel.EMAIL, DocumentTemplateKey.BILL_SEND, context)
        send_email(target_email, rendered["subject"] or f"Bill {bill.bill_number}", rendered["body"])
        bill.status = BillStatus.SENT
        bill.sent_at = _naive_utcnow()
        return self._commit_and_refresh_bill(tenant_id, bill.id, "BILL_SENT", actor_user_id)

    def mark_invoice_paid(self, tenant_id: int, invoice_id: int, actor_user_id: int) -> Invoice:
        invoice = self.get_invoice(tenant_id, invoice_id)
        if invoice.status == InvoiceStatus.VOID:
            raise AppError("INVALID_INVOICE_STATE", "Void invoices cannot be marked as paid.", 409)
        invoice.status = InvoiceStatus.PAID
        invoice.paid_at = _naive_utcnow()
        return self._commit_and_refresh_invoice(tenant_id, invoice.id, "INVOICE_PAID", actor_user_id)

    def void_invoice(self, tenant_id: int, invoice_id: int, actor_user_id: int) -> Invoice:
        invoice = self.get_invoice(tenant_id, invoice_id)
        if invoice.status == InvoiceStatus.PAID:
            raise AppError("INVALID_INVOICE_STATE", "Paid invoices cannot be voided.", 409)
        invoice.status = InvoiceStatus.VOID
        invoice.voided_at = _naive_utcnow()
        return self._commit_and_refresh_invoice(tenant_id, invoice.id, "INVOICE_VOIDED", actor_user_id)

    def mark_bill_paid(self, tenant_id: int, bill_id: int, actor_user_id: int) -> Bill:
        bill = self.get_bill(tenant_id, bill_id)
        if bill.status == BillStatus.VOID:
            raise AppError("INVALID_BILL_STATE", "Void bills cannot be marked as paid.", 409)
        bill.status = BillStatus.PAID
        bill.paid_at = _naive_utcnow()
        return self._commit_and_refresh_bill(tenant_id, bill.id, "BILL_PAID", actor_user_id)

    def void_bill(self, tenant_id: int, bill_id: int, actor_user_id: int) -> Bill:
        bill = self.get_bill(tenant_id, bill_id)
        if bill.status == BillStatus.PAID:
            raise AppError("INVALID_BILL_STATE", "Paid bills cannot be voided.", 409)
        bill.status = BillStatus.VOID
        bill.voided_at = _naive_utcnow()
        return self._commit_and_refresh_bill(tenant_id, bill.id, "BILL_VOIDED", actor_user_id)

    def render_invoice_pdf(self, tenant_id: int, invoice_id: int) -> bytes:
        invoice = self.get_invoice(tenant_id, invoice_id)
        context = {**self._base_template_context(tenant_id), **self._invoice_context(invoice)}
        rendered = self.templates.render_by_key(tenant_id, DocumentTemplateChannel.PDF, DocumentTemplateKey.PDF_INVOICE, context)
        invoice.pdf_generated_at = _naive_utcnow()
        self.db.commit()
        return build_simple_pdf(f"Invoice {invoice.invoice_number}", rendered["body"].splitlines())

    def render_bill_pdf(self, tenant_id: int, bill_id: int) -> bytes:
        bill = self.get_bill(tenant_id, bill_id)
        context = {**self._base_template_context(tenant_id), **self._bill_context(bill)}
        rendered = self.templates.render_by_key(tenant_id, DocumentTemplateChannel.PDF, DocumentTemplateKey.PDF_BILL, context)
        bill.pdf_generated_at = _naive_utcnow()
        self.db.commit()
        return build_simple_pdf(f"Bill {bill.bill_number}", rendered["body"].splitlines())

    def _next_number(self, tenant_id: int, sequence_key: NumberSequenceKey, default_prefix: str) -> str:
        sequence = self.repository.get_sequence(tenant_id, sequence_key)
        if sequence is None:
            sequence = self.repository.create_sequence(
                {
                    "tenant_id": tenant_id,
                    "sequence_key": sequence_key,
                    "prefix": default_prefix,
                    "next_number": 1,
                    "padding": 5,
                }
            )
            self.db.flush()
        current = sequence.next_number
        sequence.next_number += 1
        return f"{sequence.prefix}-{str(current).zfill(sequence.padding)}"

    def _base_template_context(self, tenant_id: int) -> dict[str, Any]:
        tenant = self.repository.get_tenant(tenant_id)
        settings = self.repository.get_tenant_settings(tenant_id)
        company_name = settings.company_display_name if settings and settings.company_display_name else tenant.company_name if tenant else "Warelyn"
        currency = settings.currency if settings and settings.currency else "USD"
        footer = settings.document_footer if settings and settings.document_footer else "Generated by Warelyn"
        return {
            "company_name": company_name,
            "currency": currency,
            "document_footer": footer,
            "tenant_phone": settings.phone if settings else None,
            "tenant_email": settings.contact_email if settings else None,
        }

    def _invoice_context(self, invoice: Invoice) -> dict[str, Any]:
        customer = self.repository.get_customer(invoice.tenant_id, invoice.customer_id)
        line_items = "\n".join(
            f"- {item.description}: {item.quantity} x {item.unit_price} = {item.line_total}" for item in invoice.items
        )
        return {
            "invoice_number": invoice.invoice_number,
            "customer_name": customer.name if customer else f"Customer #{invoice.customer_id}",
            "status": invoice.status.value if hasattr(invoice.status, "value") else str(invoice.status),
            "issue_date": invoice.issue_date,
            "due_date": invoice.due_date or "",
            "subtotal_amount": invoice.subtotal_amount,
            "tax_amount": invoice.tax_amount,
            "discount_amount": invoice.discount_amount,
            "total_amount": invoice.total_amount,
            "line_items": line_items,
        }

    def _bill_context(self, bill: Bill) -> dict[str, Any]:
        vendor = self.repository.get_vendor(bill.tenant_id, bill.vendor_id)
        line_items = "\n".join(
            f"- {item.description}: {item.quantity} x {item.unit_cost} = {item.line_total}" for item in bill.items
        )
        return {
            "bill_number": bill.bill_number,
            "vendor_name": vendor.name if vendor else f"Vendor #{bill.vendor_id}",
            "status": bill.status.value if hasattr(bill.status, "value") else str(bill.status),
            "issue_date": bill.issue_date,
            "due_date": bill.due_date or "",
            "subtotal_amount": bill.subtotal_amount,
            "tax_amount": bill.tax_amount,
            "discount_amount": bill.discount_amount,
            "total_amount": bill.total_amount,
            "line_items": line_items,
        }

    def _address_for_party(self, party: Any) -> str | None:
        parts = [getattr(party, field, None) for field in ["name", "email", "phone"]]
        values = [str(part).strip() for part in parts if part]
        return "\n".join(values) if values else None

    def _commit_and_refresh_invoice(self, tenant_id: int, invoice_id: int, action: str, actor_user_id: int) -> Invoice:
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise AppError("INVOICE_WRITE_FAILED", "Invoice change failed because of duplicate or invalid data.", 409) from exc
        invoice = self.get_invoice(tenant_id, invoice_id)
        self.audit_logs.create(
            {
                "tenant_id": tenant_id,
                "actor_user_id": actor_user_id,
                "actor_role": "",
                "action": action,
                "entity_type": "invoice",
                "entity_id": str(invoice.id),
            }
        )
        self.db.commit()
        return self.get_invoice(tenant_id, invoice_id)

    def _commit_and_refresh_bill(self, tenant_id: int, bill_id: int, action: str, actor_user_id: int) -> Bill:
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise AppError("BILL_WRITE_FAILED", "Bill change failed because of duplicate or invalid data.", 409) from exc
        bill = self.get_bill(tenant_id, bill_id)
        self.audit_logs.create(
            {
                "tenant_id": tenant_id,
                "actor_user_id": actor_user_id,
                "actor_role": "",
                "action": action,
                "entity_type": "bill",
                "entity_id": str(bill.id),
            }
        )
        self.db.commit()
        return self.get_bill(tenant_id, bill_id)
