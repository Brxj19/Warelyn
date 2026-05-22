from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.auth import Tenant, User, UserRole, UserStatus
from app.models.communication import Notification


def create_users(db_session, client):
    tenant = Tenant(company_name="NotifCo", contact_email="n@x.com")
    db_session.add(tenant)
    db_session.flush()
    user_a = User(
        tenant_id=tenant.id, name="UserA", email="a@x.com",
        password_hash=get_password_hash("StrongPass123!"),
        role=UserRole.TENANT_ADMIN, status=UserStatus.ACTIVE,
    )
    user_b = User(
        tenant_id=tenant.id, name="UserB", email="b@x.com",
        password_hash=get_password_hash("StrongPass123!"),
        role=UserRole.VIEWER, status=UserStatus.ACTIVE,
    )
    db_session.add(user_a)
    db_session.add(user_b)
    db_session.flush()
    notif1 = Notification(user_id=user_a.id, tenant_id=tenant.id, title="Test 1", type="INFO", category="SYSTEM")
    notif2 = Notification(user_id=user_a.id, tenant_id=tenant.id, title="Test 2", type="WARNING", category="AUTH")
    notif3 = Notification(user_id=user_b.id, tenant_id=tenant.id, title="B Notif", type="INFO", category="SYSTEM")
    db_session.add(notif1)
    db_session.add(notif2)
    db_session.add(notif3)
    db_session.commit()
    login_a = client.post("/api/auth/login", json={"email": "a@x.com", "password": "StrongPass123!"})
    login_b = client.post("/api/auth/login", json={"email": "b@x.com", "password": "StrongPass123!"})
    return login_a.json()["access_token"], login_b.json()["access_token"], user_a.id, user_b.id, notif1.id, notif2.id, notif3.id


def test_user_sees_own_notifications(db_session, client):
    token_a, token_b, uid_a, uid_b, n1, n2, n3 = create_users(db_session, client)
    resp = client.get("/api/notifications", headers={"Authorization": f"Bearer {token_a}"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    titles = [n["title"] for n in data]
    assert "Test 1" in titles
    assert "Test 2" in titles
    assert "B Notif" not in titles


def test_user_cannot_read_another_user_notification(db_session, client):
    token_a, token_b, uid_a, uid_b, n1, n2, n3 = create_users(db_session, client)
    resp = client.post(f"/api/notifications/{n1}/read", headers={"Authorization": f"Bearer {token_b}"})
    assert resp.status_code == 404


def test_mark_one_read(db_session, client):
    token_a, token_b, uid_a, uid_b, n1, n2, n3 = create_users(db_session, client)
    resp = client.post(f"/api/notifications/{n1}/read", headers={"Authorization": f"Bearer {token_a}"})
    assert resp.status_code == 200
    assert resp.json()["is_read"] is True
    notif = db_session.get(Notification, n1)
    assert notif.is_read is True


def test_mark_all_read(db_session, client):
    token_a, token_b, uid_a, uid_b, n1, n2, n3 = create_users(db_session, client)
    resp = client.post("/api/notifications/read-all", headers={"Authorization": f"Bearer {token_a}"})
    assert resp.status_code == 200
    unread = db_session.query(Notification).filter(Notification.user_id == uid_a, Notification.is_read == False).count()
    assert unread == 0


def test_unread_count_works(db_session, client):
    token_a, token_b, uid_a, uid_b, n1, n2, n3 = create_users(db_session, client)
    resp = client.get("/api/notifications/unread-count", headers={"Authorization": f"Bearer {token_a}"})
    assert resp.status_code == 200
    assert resp.json()["count"] == 2
    client.post(f"/api/notifications/{n1}/read", headers={"Authorization": f"Bearer {token_a}"})
    resp2 = client.get("/api/notifications/unread-count", headers={"Authorization": f"Bearer {token_a}"})
    assert resp2.json()["count"] == 1


def test_cross_tenant_notification_access_blocked(db_session, client):
    tenant_a = Tenant(company_name="TenA", contact_email="ta@x.com")
    tenant_b = Tenant(company_name="TenB", contact_email="tb@x.com")
    db_session.add(tenant_a)
    db_session.add(tenant_b)
    db_session.flush()
    user_a = User(tenant_id=tenant_a.id, name="A", email="aa@x.com", password_hash=get_password_hash("StrongPass123!"), role=UserRole.TENANT_ADMIN, status=UserStatus.ACTIVE)
    user_b = User(tenant_id=tenant_b.id, name="B", email="bb@x.com", password_hash=get_password_hash("StrongPass123!"), role=UserRole.TENANT_ADMIN, status=UserStatus.ACTIVE)
    db_session.add(user_a)
    db_session.add(user_b)
    db_session.flush()
    n = Notification(user_id=user_a.id, tenant_id=tenant_a.id, title="Secret", type="INFO", category="SYSTEM")
    db_session.add(n)
    db_session.commit()
    login_b = client.post("/api/auth/login", json={"email": "bb@x.com", "password": "StrongPass123!"})
    token_b = login_b.json()["access_token"]
    resp = client.get("/api/notifications", headers={"Authorization": f"Bearer {token_b}"})
    assert len(resp.json()) == 0
