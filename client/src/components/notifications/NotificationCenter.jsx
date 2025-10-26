import React, { useEffect, useState } from 'react';
import { connectSse } from '../../utils/sse';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    // initial fetch
    fetch('/api/notifications').then(r => r.json()).then(j => {
      if (j.ok && Array.isArray(j.notifications)) {
        setNotifications(j.notifications);
        setUnread(j.notifications.filter(n => !n.read).length);
      }
    }).catch(() => {});

    const sse = connectSse('/api/events', (type, data) => {
      if (type === 'notification') {
        setNotifications(prev => [data, ...prev].slice(0, 50));
        setUnread(prev => prev + 1);
      }
    });
    return () => sse.close();
  }, []);

  return (
    <div className="notification-center">
      <button aria-label={`Notifications (${unread})`} className="notification-bell">
        🔔 {unread > 0 ? <span className="badge">{unread}</span> : null}
      </button>
      <div className="notification-list">
        {notifications.length === 0 ? <div className="empty">No notifications</div> : (
          <ul>
            {notifications.map(n => (
              <li key={n.id} className={`note ${n.read ? 'read' : 'unread'}`}>
                <strong>{n.title}</strong>
                <div className="msg">{n.message}</div>
                <small className="t">{new Date(n.createdAt).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
