import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../../hooks/useAuth';
import messagesAPI from '../../api/messages';
import Avatar from './Avatar';

export default function MessagesDropdown({ unread }) {
  const { user, token } = useAuth();
  const navigate        = useNavigate();
  const [open, setOpen] = useState(false);
  const ref             = useRef(null);

  const { data, refetch } = useQuery(
    'navConversations',
    () => messagesAPI.getConversations().then(r => r.data),
    { enabled: !!token && open, staleTime: 30000 }
  );

  // Refetch when dropdown opens
  useEffect(() => { if (open) refetch(); }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const conversations = data?.conversations?.slice(0, 5) || [];

  // Get the other participant
  const other = conv => conv?.participants?.find(p => p._id !== user?._id);

  const displayName = p => {
    if (!p) return '';
    return p.role === 'business'
      ? p.businessProfile?.companyName || p.name
      : p.name;
  };

  const timeAgo = date => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div ref={ref} style={s.wrap}>
      {/* Icon button */}
      <button style={s.iconBtn} onClick={() => setOpen(p => !p)}>
        <span style={{ fontSize: 18 }}>💬</span>
        {unread > 0 && (
          <span style={s.badge}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={s.dropdown}>
          {/* Header */}
          <div style={s.header}>
            <span style={s.headerTitle}>Messages</span>
            {unread > 0 && (
              <span style={s.unreadPill}>{unread} unread</span>
            )}
          </div>

          {/* Conversation list */}
          <div style={s.list}>
            {conversations.length === 0 ? (
              <div style={s.empty}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map(conv => {
                const participant = other(conv);
                const convUnread  = conv.unreadCount?.[user?._id] || 0;
                return (
                  <div
                    key={conv._id}
                    style={{ ...s.item, ...(convUnread > 0 ? s.itemUnread : {}) }}
                    onClick={() => {
                      setOpen(false);
                      navigate(`/messages?conv=${conv._id}`);
                    }}
                  >
                    <Avatar
                      src={participant?.avatar}
                      name={displayName(participant)}
                      size={38}
                    />
                    <div style={s.itemBody}>
                      <div style={s.itemHeader}>
                        <span style={s.itemName}>{displayName(participant)}</span>
                        <span style={s.itemTime}>{timeAgo(conv.lastMessageAt)}</span>
                      </div>
                      {conv.task && (
                        <div style={s.itemTask}>📋 {conv.task.title}</div>
                      )}
                      <div style={{ ...s.itemLast, fontWeight: convUnread > 0 ? 600 : 400 }}>
                        {conv.lastMessage || 'No messages yet'}
                      </div>
                    </div>
                    {convUnread > 0 && <span style={s.convBadge}>{convUnread}</span>}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <Link
            to="/messages"
            style={s.footer}
            onClick={() => setOpen(false)}
          >
            View all messages →
          </Link>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap:        { position: 'relative' },
  iconBtn:     { position: 'relative', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#374151' },
  badge:       { position: 'absolute', top: 2, right: 2, background: '#dc2626', color: '#fff', fontSize: 9, borderRadius: 10, padding: '1px 4px', fontWeight: 700, lineHeight: 1.4 },
  dropdown:    { position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.1)', width: 320, zIndex: 400, overflow: 'hidden' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f3f4f6' },
  headerTitle: { fontSize: 14, fontWeight: 600 },
  unreadPill:  { background: '#dbeafe', color: '#1d4ed8', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 },
  list:        { maxHeight: 340, overflowY: 'auto' },
  empty:       { padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 14 },
  item:        { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f9fafb', background: '#fff', transition: 'background .1s' },
  itemUnread:  { background: '#f8faff' },
  itemBody:    { flex: 1, minWidth: 0 },
  itemHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  itemName:    { fontSize: 13, fontWeight: 600, color: '#111827' },
  itemTime:    { fontSize: 11, color: '#9ca3af', flexShrink: 0, marginLeft: 8 },
  itemTask:    { fontSize: 11, color: '#6b7280', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  itemLast:    { fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  convBadge:   { background: '#2563eb', color: '#fff', fontSize: 10, borderRadius: 10, padding: '1px 6px', fontWeight: 700, flexShrink: 0, alignSelf: 'center' },
  footer:      { display: 'block', padding: '12px 16px', textAlign: 'center', fontSize: 13, color: '#2563eb', fontWeight: 600, borderTop: '1px solid #f3f4f6', textDecoration: 'none', background: '#fafafa' },
};
