import { Bell, CheckCheck, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../hooks/useToast.jsx';
import * as notificationService from '../services/notificationService.js';
import { formatDate } from '../utils/formatters.js';

export function NotificationBell() {
  const { accessToken } = useAuth();
  const toast = useToast();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [list, unread] = await Promise.all([
        notificationService.listNotifications(accessToken),
        notificationService.getUnreadCount(accessToken),
      ]);
      setNotifications(list);
      setUnreadCount(unread.count);
    } catch {
      // silently fail
    }
  }, [accessToken]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  async function handleMarkRead(id) {
    try {
      await notificationService.markNotificationRead(accessToken, id);
      fetchData();
    } catch {
      toast.error('Failed to mark as read.');
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationService.markAllNotificationsRead(accessToken);
      fetchData();
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to mark all as read.');
    }
  }

  return (
    <div className="topbar-popover-anchor" ref={ref}>
      <button className="topbar-icon-btn topbar-icon-btn-quiet relative" onClick={() => setOpen((v) => !v)} title="Notifications" type="button">
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className="topbar-popover topbar-popover-right" style={{ width: '360px' }}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-warelyn-text">Notifications</h3>
            {unreadCount > 0 ? (
              <button className="flex items-center gap-1 text-xs font-medium text-warelyn-primary hover:underline" onClick={handleMarkAllRead} type="button">
                <CheckCheck size={14} /> Mark all read
              </button>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <p className="py-6 text-center text-sm text-warelyn-muted">No notifications yet.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <div className={`flex items-start gap-3 rounded-xl px-3 py-3 transition ${n.is_read ? '' : 'bg-blue-50/50'}`} key={n.id}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warelyn-text">{n.title}</p>
                    {n.message ? <p className="mt-0.5 text-xs text-warelyn-muted line-clamp-2">{n.message}</p> : null}
                    <p className="mt-1 text-[10px] text-warelyn-muted">{formatDate(n.created_at)}</p>
                  </div>
                  {!n.is_read ? (
                    <button className="shrink-0 rounded-lg p-1 text-warelyn-muted hover:bg-white hover:text-warelyn-text" onClick={() => handleMarkRead(n.id)} title="Mark as read" type="button">
                      <CheckCheck size={14} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
