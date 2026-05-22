from datetime import datetime

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.communication import Notification, NotificationCategory, NotificationType


class NotificationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, values: dict) -> Notification:
        notification = Notification(**values)
        self.db.add(notification)
        self.db.flush()
        return notification

    def list_for_user(self, user_id: int, tenant_id: int | None, limit: int = 50, offset: int = 0, unread_only: bool = False) -> list[Notification]:
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.is_read == False)
        query = query.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
        return list(self.db.scalars(query))

    def unread_count(self, user_id: int) -> int:
        return self.db.scalar(select(func.count(Notification.id)).where(Notification.user_id == user_id, Notification.is_read == False)) or 0

    def get_by_id(self, notification_id: int) -> Notification | None:
        return self.db.get(Notification, notification_id)

    def mark_read(self, notification_id: int) -> None:
        self.db.execute(
            update(Notification).where(Notification.id == notification_id).values(is_read=True, read_at=datetime.now())
        )
        self.db.flush()

    def mark_all_read(self, user_id: int) -> None:
        self.db.execute(
            update(Notification).where(Notification.user_id == user_id, Notification.is_read == False).values(is_read=True, read_at=datetime.now())
        )
        self.db.flush()


class NotificationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = NotificationRepository(db)

    def create_notification(self, user_id: int, title: str, message: str | None = None, type: str = "INFO", category: str = "SYSTEM", tenant_id: int | None = None, entity_type: str | None = None, entity_id: str | None = None) -> Notification:
        return self.repo.create(
            {
                "tenant_id": tenant_id,
                "user_id": user_id,
                "title": title,
                "message": message,
                "type": type,
                "category": category,
                "entity_type": entity_type,
                "entity_id": entity_id,
            }
        )

    def list_notifications(self, user_id: int, tenant_id: int | None, limit: int = 50, offset: int = 0, unread_only: bool = False) -> list[Notification]:
        return self.repo.list_for_user(user_id, tenant_id, limit, offset, unread_only)

    def unread_count(self, user_id: int) -> int:
        return self.repo.unread_count(user_id)

    def mark_read(self, user_id: int, notification_id: int) -> Notification | None:
        notification = self.repo.get_by_id(notification_id)
        if notification is None or notification.user_id != user_id:
            return None
        self.repo.mark_read(notification_id)
        notification.is_read = True
        return notification

    def mark_all_read(self, user_id: int) -> None:
        self.repo.mark_all_read(user_id)
