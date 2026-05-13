import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ICONS = {
  new_proposal:      '📬',
  proposal_accepted: '🎉',
  order_submitted:   '📋',
  order_verified:    '✅',
  new_message:       '💬',
  payment_confirmed: '💳',
  dispute_raised:    '⚠️',
  order_cancelled:   '❌',
};

export default function NotificationBell() {
  const { user, token } = useAuth();
  const qc              = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);

  // Fetch notifications
  const { data } = useQuery(
    'notifications',
    () => api.get('/notifications').then(r => r.data),
    { enabled: !!token, refetchInterval: 30000 }
  );

  const notifications = data?.notifications || [];
  const unread        = data?.unread || 0;

  // Real-time socket
  useEffect(() => {
    if (!token || !user?._id) return;
    const socket = io(API_URL, { auth: { token } });
    socket.emit('join_room', user._id);
    socket.on('notification', () => qc.invalidateQueries('notifications'));
    return () => socket.disconnect();
  }, [token, user?._id]);

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const readAllMutation = useMutation(
    () => api.put('/notifications/read-all'),
    { onSuccess: () => qc.invalidateQueries('notifications') }
  );

  const readOneMutation = useMutation(
    id => api.put(`/notifications/${id}/read`),
    { onSuccess: () => qc.invalidateQueries('notifications') }
  );

  if (!token) return null;

  return (
    <div ref={ref} style={s.wrap}>
      <button style={s.bell} onClick={() => setOpen(p => !p)}>
        🔔
        {unread > 0 && (
          <span style={s.badge}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div style={s.dropdown}>
          <div style={s.header}>
            <span style={s.headerTitle}>Notifications</span>
            {unread > 0 && (
              <button style={s.readAll} onClick={() => readAllMutation.mutate()}>
                Mark all read
              </button>
            )}
          </div>

          <div style={s.list}>
            {notifications.length === 0 && (
              <div style={s.empty}>No notifications yet</div>
            )}
            {notifications.map(n => (
              <Link
                key={n._id}
                to={n.link || '/'}
                style={{ ...s.item, ...(n.read ? s.itemRead : s.itemUnread) }}
                onClick={() => { if (!n.read) readOneMutation.mutate(n._id); setOpen(false); }}
              >
                <span style={s.icon}>{ICONS[n.type] || '🔔'}</span>
                <div style={s.content}>
                  <div style={s.title}>{n.title}</div>
                  <div style={s.body}>{n.body}</div>
                  <div style={s.time}>
                    {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {!n.read && <span style={s.dot} />}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap:        { position: 'relative' },
  bell:        { position: 'relative', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, borderRadius: 8 },
  badge:       { position: 'absolute', top: 2, right: 2, background: '#dc2626', color: '#fff', fontSize: 9, borderRadius: 10, padding: '1px 4px', fontWeight: 700, lineHeight: 1.4 },
  dropdown:    { position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.1)', width: 340, zIndex: 400, overflow: 'hidden' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f3f4f6' },
  headerTitle: { fontSize: 14, fontWeight: 600 },
  readAll:     { fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' },
  list:        { maxHeight: 380, overflowY: 'auto' },
  empty:       { padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 14 },
  item:        { display: 'flex', gap: 10, padding: '12px 16px', borderBottom: '1px solid #f9fafb', textDecoration: 'none', color: '#111827', alignItems: 'flex-start' },
  itemUnread:  { background: '#f8faff' },
  itemRead:    { background: '#fff' },
  icon:        { fontSize: 18, flexShrink: 0, marginTop: 2 },
  content:     { flex: 1, minWidth: 0 },
  title:       { fontSize: 13, fontWeight: 600, marginBottom: 2 },
  body:        { fontSize: 12, color: '#6b7280', lineHeight: 1.5 },
  time:        { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  dot:         { width: 8, height: 8, borderRadius: '50%', background: '#2563eb', flexShrink: 0, marginTop: 4 },
};
