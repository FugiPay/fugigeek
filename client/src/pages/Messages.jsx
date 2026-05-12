import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import messagesAPI from '../api/messages';
import { useAuth } from '../hooks/useAuth';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Messages() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeConvId, setActiveConvId] = useState(searchParams.get('conv') || null);
  const [draft, setDraft]   = useState('');
  const bottomRef           = useRef(null);
  const socketRef           = useRef(null);

  // ── Socket.io real-time ───────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('tb_token');
    socketRef.current = io(API_URL, { auth: { token } });

    if (user?._id) socketRef.current.emit('join_room', user._id);

    socketRef.current.on('new_message', ({ conversationId, message }) => {
      // Refresh conversations list and active messages
      qc.invalidateQueries('conversations');
      if (conversationId === activeConvId) {
        qc.invalidateQueries(['messages', conversationId]);
      }
    });

    return () => socketRef.current?.disconnect();
  }, [user?._id, activeConvId]);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data: convsData } = useQuery('conversations',
    () => messagesAPI.getConversations().then(r => r.data),
    { refetchInterval: 15000 } // poll every 15s as fallback
  );

  const { data: msgsData } = useQuery(
    ['messages', activeConvId],
    () => messagesAPI.getMessages(activeConvId).then(r => r.data),
    { enabled: !!activeConvId, refetchOnWindowFocus: false }
  );

  // Scroll to bottom when messages load or new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgsData?.messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMutation = useMutation(
    content => messagesAPI.sendMessage(activeConvId, content),
    {
      onSuccess: () => {
        setDraft('');
        qc.invalidateQueries(['messages', activeConvId]);
        qc.invalidateQueries('conversations');
      },
    }
  );

  const handleSend = e => {
    e.preventDefault();
    if (!draft.trim() || sendMutation.isLoading) return;
    sendMutation.mutate(draft.trim());
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
  };

  const conversations = convsData?.conversations || [];
  const messages      = msgsData?.messages       || [];
  const activeConv    = conversations.find(c => c._id === activeConvId);

  // Get the other participant in a conversation
  const otherParticipant = conv =>
    conv?.participants?.find(p => p._id !== user?._id);

  const displayName = p => {
    if (!p) return '';
    if (p.role === 'business') return p.businessProfile?.companyName || p.name;
    return p.name;
  };

  const selectConv = conv => {
    setActiveConvId(conv._id);
    setSearchParams({ conv: conv._id });
    qc.invalidateQueries('conversations');
  };

  return (
    <div style={s.page}>
      {/* Top nav */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <Link to="/" style={s.logo}>Fugigeek</Link>
          <span style={s.navTitle}>Messages</span>
          <Link to={user?.role === 'business' ? '/dashboard/business' : '/dashboard/professional'}
            style={{ fontSize: 14, color: '#374151' }}>← Dashboard</Link>
        </div>
      </nav>

      <div style={s.layout}>
        {/* Conversation list */}
        <aside style={s.convList}>
          <div style={s.convListHeader}>
            <h2 style={s.convListTitle}>Conversations</h2>
          </div>

          {conversations.length === 0 ? (
            <div style={s.empty}>
              <p>No conversations yet.</p>
              <p style={{ fontSize: 12, marginTop: 6 }}>
                {user?.role === 'business'
                  ? 'Browse professionals and start a conversation.'
                  : 'Apply to tasks to start conversations with businesses.'}
              </p>
            </div>
          ) : (
            conversations.map(conv => {
              const other   = otherParticipant(conv);
              const unread  = conv.unreadCount?.[user?._id] || 0;
              const isActive = conv._id === activeConvId;
              return (
                <div key={conv._id} style={{ ...s.convItem, ...(isActive ? s.convItemActive : {}) }}
                  onClick={() => selectConv(conv)}>
                  <div style={s.convAvatar}>{other?.name?.[0] || '?'}</div>
                  <div style={s.convInfo}>
                    <div style={s.convName}>
                      {displayName(other)}
                      {unread > 0 && <span style={s.unreadBadge}>{unread}</span>}
                    </div>
                    {conv.task && <div style={s.convTask}>📋 {conv.task.title}</div>}
                    <div style={s.convLast}>{conv.lastMessage || 'No messages yet'}</div>
                  </div>
                  <div style={s.convTime}>
                    {new Date(conv.lastMessageAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })
          )}
        </aside>

        {/* Chat window */}
        <main style={s.chatWindow}>
          {!activeConvId ? (
            <div style={s.chatEmpty}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
              <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Select a conversation</h3>
              <p style={{ color: '#6b7280', fontSize: 14 }}>Choose a conversation from the left to start messaging</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={s.chatHeader}>
                <div style={s.chatAvatar}>
                  {otherParticipant(activeConv)?.name?.[0] || '?'}
                </div>
                <div>
                  <div style={s.chatName}>{displayName(otherParticipant(activeConv))}</div>
                  {activeConv?.task && (
                    <div style={s.chatTask}>
                      Re: <Link to={`/listings/${activeConv.task._id}`} style={{ color: '#2563eb' }}>
                        {activeConv.task.title}
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div style={s.messages}>
                {messages.map(msg => {
                  const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                  return (
                    <div key={msg._id} style={{ ...s.msgRow, ...(isMe ? s.msgRowMe : {}) }}>
                      {!isMe && (
                        <div style={s.msgAvatar}>{msg.sender?.name?.[0]}</div>
                      )}
                      <div style={{ maxWidth: '70%' }}>
                        <div style={{ ...s.bubble, ...(isMe ? s.bubbleMe : s.bubbleThem) }}>
                          {msg.content}
                        </div>
                        <div style={{ ...s.msgTime, ...(isMe ? { textAlign: 'right' } : {}) }}>
                          {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} style={s.inputRow}>
                <textarea
                  style={s.input}
                  placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  maxLength={2000}
                />
                <button style={s.sendBtn} type="submit" disabled={!draft.trim() || sendMutation.isLoading}>
                  {sendMutation.isLoading ? '…' : '➤'}
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const s = {
  page:           { display: 'flex', flexDirection: 'column', height: '100vh', background: '#f9fafb' },
  nav:            { background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', flexShrink: 0 },
  navInner:       { maxWidth: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 },
  logo:           { fontSize: 20, fontWeight: 700, color: '#2563eb' },
  navTitle:       { fontSize: 16, fontWeight: 600 },
  layout:         { display: 'flex', flex: 1, overflow: 'hidden' },
  // Conversation list
  convList:       { width: 300, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  convListHeader: { padding: '16px 20px', borderBottom: '1px solid #f3f4f6' },
  convListTitle:  { fontSize: 15, fontWeight: 600 },
  empty:          { padding: '32px 20px', color: '#6b7280', fontSize: 14 },
  convItem:       { display: 'flex', gap: 10, padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #f9fafb', alignItems: 'flex-start' },
  convItemActive: { background: '#eff6ff' },
  convAvatar:     { width: 40, height: 40, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 },
  convInfo:       { flex: 1, minWidth: 0 },
  convName:       { fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  convTask:       { fontSize: 11, color: '#6b7280', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  convLast:       { fontSize: 12, color: '#9ca3af', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  convTime:       { fontSize: 11, color: '#9ca3af', flexShrink: 0 },
  unreadBadge:    { background: '#2563eb', color: '#fff', fontSize: 10, borderRadius: 10, padding: '1px 6px', fontWeight: 600 },
  // Chat
  chatWindow:     { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  chatEmpty:      { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#374151' },
  chatHeader:     { padding: '14px 20px', background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  chatAvatar:     { width: 40, height: 40, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 },
  chatName:       { fontWeight: 600, fontSize: 15 },
  chatTask:       { fontSize: 12, color: '#6b7280', marginTop: 2 },
  messages:       { flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 },
  msgRow:         { display: 'flex', alignItems: 'flex-end', gap: 8 },
  msgRowMe:       { flexDirection: 'row-reverse' },
  msgAvatar:      { width: 28, height: 28, borderRadius: '50%', background: '#6b7280', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 },
  bubble:         { padding: '10px 14px', borderRadius: 16, fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' },
  bubbleThem:     { background: '#fff', border: '1px solid #e5e7eb', color: '#111827', borderBottomLeftRadius: 4 },
  bubbleMe:       { background: '#2563eb', color: '#fff', borderBottomRightRadius: 4 },
  msgTime:        { fontSize: 11, color: '#9ca3af', marginTop: 4, paddingLeft: 4, paddingRight: 4 },
  inputRow:       { display: 'flex', gap: 10, padding: '14px 20px', background: '#fff', borderTop: '1px solid #e5e7eb', flexShrink: 0, alignItems: 'flex-end' },
  input:          { flex: 1, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 12, fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 },
  sendBtn:        { width: 44, height: 44, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 12, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
};
