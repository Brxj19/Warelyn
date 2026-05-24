from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.auth import Tenant
from app.models.documents import Bill, DocumentTemplate, DocumentTemplateChannel, DocumentTemplateKey, Invoice, NumberSequence, NumberSequenceKey
from app.models.master_data import Customer, Product, Vendor
from app.models.purchasing import PurchaseOrder, PurchaseReceipt
from app.models.sales import SalesFulfillment, SalesOrder
from app.models.settings import TenantSettings


class DocumentsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_invoice(self, tenant_id: int, invoice_id: int) -> Invoice | None:
        return self.db.scalar(
            select(Invoice)
            .options(selectinload(Invoice.items))
            .where(Invoice.tenant_id == tenant_id, Invoice.id == invoice_id)
        )

    def list_invoices(self, tenant_id: int) -> list[Invoice]:
        return list(
            self.db.scalars(
                select(Invoice)
                .options(selectinload(Invoice.items))
                .where(Invoice.tenant_id == tenant_id)
                .order_by(Invoice.created_at.desc(), Invoice.id.desc())
            )
        )

    def create_invoice(self, values: dict) -> Invoice:
        invoice = Invoice(**values)
        self.db.add(invoice)
        self.db.flush()
        return invoice

    def get_bill(self, tenant_id: int, bill_id: int) -> Bill | None:
        return self.db.scalar(
            select(Bill)
            .options(selectinload(Bill.items))
            .where(Bill.tenant_id == tenant_id, Bill.id == bill_id)
        )

    def list_bills(self, tenant_id: int) -> list[Bill]:
        return list(
            self.db.scalars(
                select(Bill)
                .options(selectinload(Bill.items))
                .where(Bill.tenant_id == tenant_id)
                .order_by(Bill.created_at.desc(), Bill.id.desc())
            )
        )

    def create_bill(self, values: dict) -> Bill:
        bill = Bill(**values)
        self.db.add(bill)
        self.db.flush()
        return bill

    def get_sales_order(self, tenant_id: int, order_id: int) -> SalesOrder | None:
        return self.db.scalar(
            select(SalesOrder)
            .options(selectinload(SalesOrder.items))
            .where(SalesOrder.tenant_id == tenant_id, SalesOrder.id == order_id)
        )

    def get_fulfillment(self, tenant_id: int, fulfillment_id: int) -> SalesFulfillment | None:
        return self.db.scalar(
            select(SalesFulfillment)
            .options(selectinload(SalesFulfillment.items))
            .where(SalesFulfillment.tenant_id == tenant_id, SalesFulfillment.id == fulfillment_id)
        )

    def get_purchase_order(self, tenant_id: int, po_id: int) -> PurchaseOrder | None:
        return self.db.scalar(
            select(PurchaseOrder)
            .options(selectinload(PurchaseOrder.items))
            .where(PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.id == po_id)
        )

    def get_purchase_receipt(self, tenant_id: int, receipt_id: int) -> PurchaseReceipt | None:
        return self.db.scalar(
            select(PurchaseReceipt)
            .options(selectinload(PurchaseReceipt.items))
            .where(PurchaseReceipt.tenant_id == tenant_id, PurchaseReceipt.id == receipt_id)
        )

    def get_customer(self, tenant_id: int, customer_id: int) -> Customer | None:
        return self.db.scalar(select(Customer).where(Customer.tenant_id == tenant_id, Customer.id == customer_id))

    def get_vendor(self, tenant_id: int, vendor_id: int) -> Vendor | None:
        return self.db.scalar(select(Vendor).where(Vendor.tenant_id == tenant_id, Vendor.id == vendor_id))

    def get_product(self, tenant_id: int, product_id: int) -> Product | None:
        return self.db.scalar(select(Product).where(Product.tenant_id == tenant_id, Product.id == product_id))

    def get_tenant(self, tenant_id: int) -> Tenant | None:
        return self.db.scalar(select(Tenant).where(Tenant.id == tenant_id))

    def get_tenant_settings(self, tenant_id: int) -> TenantSettings | None:
        return self.db.scalar(select(TenantSettings).where(TenantSettings.tenant_id == tenant_id))

    def get_sequence(self, tenant_id: int, sequence_key: NumberSequenceKey) -> NumberSequence | None:
        return self.db.scalar(
            select(NumberSequence).where(NumberSequence.tenant_id == tenant_id, NumberSequence.sequence_key == sequence_key)
        )

    def create_sequence(self, values: dict) -> NumberSequence:
        sequence = NumberSequence(**values)
        self.db.add(sequence)
        self.db.flush()
        return sequence

    def list_templates(self, tenant_id: int, channel: DocumentTemplateChannel | None = None) -> list[DocumentTemplate]:
        stmt = select(DocumentTemplate).where(DocumentTemplate.tenant_id == tenant_id)
        if channel is not None:
            stmt = stmt.where(DocumentTemplate.channel == channel)
        stmt = stmt.order_by(DocumentTemplate.channel.asc(), DocumentTemplate.template_key.asc())
        return list(self.db.scalars(stmt))

    def get_template(self, tenant_id: int, template_id: int) -> DocumentTemplate | None:
        return self.db.scalar(
            select(DocumentTemplate).where(DocumentTemplate.tenant_id == tenant_id, DocumentTemplate.id == template_id)
        )

    def get_template_by_key(
        self,
        tenant_id: int,
        channel: DocumentTemplateChannel,
        template_key: DocumentTemplateKey,
    ) -> DocumentTemplate | None:
        return self.db.scalar(
            select(DocumentTemplate).where(
                DocumentTemplate.tenant_id == tenant_id,
                DocumentTemplate.channel == channel,
                DocumentTemplate.template_key == template_key,
            )
        )

    def create_template(self, values: dict) -> DocumentTemplate:
        template = DocumentTemplate(**values)
        self.db.add(template)
        self.db.flush()
        return template
