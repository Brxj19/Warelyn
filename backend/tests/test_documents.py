from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.documents import Bill, DocumentTemplate, Invoice, NumberSequence
from test_purchasing import auth_headers as purchase_headers
from test_purchasing import create_po, create_receipt, register_and_login as purchase_login, setup_purchase_dimension, submit_po
from test_sales import auth_headers as sales_headers
from test_sales import confirm_sales_order, create_fulfillment, create_sales_order, register_and_login as sales_login, setup_sales_dimension, stock_in


def test_create_invoice_from_sales_order_and_download_pdf(client: TestClient, db_session: Session) -> None:
    login = sales_login(client)
    token = login["access_token"]
    dimension = setup_sales_dimension(client, token, "INV")
    order = create_sales_order(client, token, dimension, "3", "SO-INV")

    created = client.post("/api/invoices", json={"sales_order_id": order["id"]}, headers=sales_headers(token))
    pdf = client.get(f"/api/invoices/{created.json()['id']}/pdf", headers=sales_headers(token))

    assert created.status_code == 201
    assert created.json()["invoice_number"].startswith("INV-")
    assert created.json()["total_amount"] == "29.97"
    assert pdf.status_code == 200
    assert pdf.headers["content-type"] == "application/pdf"
    assert db_session.query(Invoice).count() == 1
    assert db_session.query(NumberSequence).count() >= 1


def test_create_invoice_from_fulfillment_and_send_paid_void(client: TestClient, db_session: Session, monkeypatch) -> None:
    monkeypatch.setattr("app.services.documents.send_email", lambda *args, **kwargs: None)
    login = sales_login(client, "invoice-fulfill@example.com")
    token = login["access_token"]
    dimension = setup_sales_dimension(client, token, "INVFUL")
    stock_in(client, token, dimension, "4", "invful-stock")
    order = create_sales_order(client, token, dimension, "4", "SO-INVFUL")
    confirmed = confirm_sales_order(client, token, order, dimension, "4", "invful-confirm")
    fulfillment = create_fulfillment(client, token, order, dimension, confirmed["stock_results"][0]["reservation"]["id"], "4", "FUL-INV")

    created = client.post("/api/invoices", json={"fulfillment_id": fulfillment["id"]}, headers=sales_headers(token))
    sent = client.post(f"/api/invoices/{created.json()['id']}/send", json={}, headers=sales_headers(token))
    paid = client.post(f"/api/invoices/{created.json()['id']}/mark-paid", json={}, headers=sales_headers(token))
    void = client.post(f"/api/invoices/{created.json()['id']}/void", json={}, headers=sales_headers(token))

    assert created.status_code == 201
    assert sent.status_code == 200
    assert sent.json()["status"] == "SENT"
    assert paid.status_code == 200
    assert paid.json()["status"] == "PAID"
    assert void.status_code == 409
    assert db_session.query(Invoice).one().status.value == "PAID"


def test_create_bill_from_receipt_send_pdf_and_paid(client: TestClient, db_session: Session, monkeypatch) -> None:
    monkeypatch.setattr("app.services.documents.send_email", lambda *args, **kwargs: None)
    login = purchase_login(client, "bill@example.com")
    token = login["access_token"]
    dimension = setup_purchase_dimension(client, token, "BILL")
    po = submit_po(client, token, create_po(client, token, dimension, "5", "PO-BILL")["id"])
    receipt = create_receipt(client, token, po, dimension, "5", "GRN-BILL")

    created = client.post("/api/bills", json={"receipt_id": receipt["id"]}, headers=purchase_headers(token))
    sent = client.post(f"/api/bills/{created.json()['id']}/send", json={"email": "vendor@example.com"}, headers=purchase_headers(token))
    pdf = client.get(f"/api/bills/{created.json()['id']}/pdf", headers=purchase_headers(token))
    paid = client.post(f"/api/bills/{created.json()['id']}/mark-paid", json={}, headers=purchase_headers(token))

    assert created.status_code == 201
    assert created.json()["bill_number"].startswith("BILL-")
    assert sent.status_code == 200
    assert pdf.status_code == 200
    assert pdf.headers["content-type"] == "application/pdf"
    assert paid.status_code == 200
    assert db_session.query(Bill).count() == 1


def test_document_templates_list_update_and_preview(client: TestClient, db_session: Session) -> None:
    login = sales_login(client, "templates@example.com")
    token = login["access_token"]

    listed = client.get("/api/document-templates?channel=EMAIL", headers=sales_headers(token))
    assert listed.status_code == 200
    template = listed.json()[0]
    updated = client.patch(
        f"/api/document-templates/{template['id']}",
        json={"subject_template": "Hello {company_name}", "body_template": "Invoice {invoice_number}"},
        headers=sales_headers(token),
    )
    preview = client.post(
        f"/api/document-templates/{template['id']}/preview",
        json={"variables": {"invoice_number": "INV-00999"}},
        headers=sales_headers(token),
    )

    assert updated.status_code == 200
    assert preview.status_code == 200
    assert "INV-00999" in preview.json()["body"]
    assert db_session.query(DocumentTemplate).count() >= 1
