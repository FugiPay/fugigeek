import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import ordersAPI from '../api/orders';
import { useAuth } from '../hooks/useAuth';

export default function OrderDetail() {
  const { id } = useParams();
  const { user, isBusiness, isProfessional } = useAuth();
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');
  const [msg,   setMsg]   = useState({ type: '', text: '' });

  const { data, isLoading } = useQuery(['order', id], () => ordersAPI.getOne(id).then(r => r.data));
  const order = data?.order;

  const submitMutation = useMutation(
    () => ordersAPI.submit(id, { professionalNotes: notes }),
    { onSuccess: () => { qc.invalidateQueries(['order', id]); setMsg({ type: 'success', text: 'Work submitted! Awaiting business approval.' }); } }
  );
  const completeMutation = useMutation(
    () => ordersAPI.complete(id),
    { onSuccess: () => { qc.invalidateQueries(['order', id]); setMsg({ type: 'success', text: 'Order marked complete. Payment released.' }); } }
  );
  const disputeMutation = useMutation(
    () => ordersAPI.dispute(id, { reason: notes }),
    { onSuccess: () => { qc.invalidateQueries(['order', id]); setMsg({ type: 'warn', text: 'Dispute raised. Our team will be in touch.' }); } }
  );

  if (isLoading) return <div style={s.center}>Loading order…</div>;
  if (!order)    return <div style={s.center}>Order not found.</div>;

  const isMyOrder = user?._id === order.business?._id?.toString() ||
                    user?._id === order.professional?._id?.toString();

  const statusBg = { pending_payment:'#fef3c7', active:'#dbeafe', submitted:'#ede9fe', completed:'#dcfce7', disputed:'#fee2e2', refunded:'#f3f4f6' };
  const statusFg = { pending_payment:'#b45309', active:'#1d4ed8', submitted:'#6d28d9', completed:'#15803d', disputed:'#b91c1c', refunded:'#4b5563' };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.navInner}>
          <Link to="/" style={s.logo}>Fugigeek</Link>
          <Link to={isBusiness ? '/dashboard/business' : '/dashboard/professional'} style={{ fontSize: 14, color: '#374151' }}>
            ← Dashboard
          </Link>
        </div>
      </nav>

      <div style={s.layout}>
        <div style={s.main}>
          {/* Header */}
          <div style={s.header}>
            <div>
              <h1 style={s.title}>{order.task?.title}</h1>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <span style={{ ...s.badge, background: statusBg[order.status], color: statusFg[order.status] }}>
                  {order.status.replace(/_/g, ' ')}
                </span>
                <span style={s.badgeGray}>{order.task?.category}</span>
              </div>
            </div>
          </div>

          {msg.text && (
            <div style={{ background: msg.type === 'success' ? '#f0fdf4' : '#fffbeb', color: msg.type === 'success' ? '#15803d' : '#b45309', border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fde68a'}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 14 }}>
              {msg.text}
            </div>
          )}

          {/* Parties */}
          <div style={s.partiesRow}>
            <div style={s.partyCard}>
              <div style={s.partyLabel}>Business</div>
              <div style={s.partyName}>{order.business?.businessProfile?.companyName || order.business?.name}</div>
            </div>
            <div style={s.arrow}>→</div>
            <div style={s.partyCard}>
              <div style={s.partyLabel}>Professional</div>
              <div style={s.partyName}>{order.professional?.name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{order.professional?.professionalProfile?.headline}</div>
            </div>
          </div>

          {/* Deliverables */}
          {order.deliverables?.length > 0 && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Submitted deliverables</h2>
              {order.deliverables.map((d, i) => (
                <a key={i} href={d.url} target="_blank" rel="noreferrer" style={s.attachment}>
                  📎 {d.originalName || `Deliverable ${i + 1}`}
                </a>
              ))}
              {order.professionalNotes && (
                <div style={s.notes}><strong>Professional notes:</strong> {order.professionalNotes}</div>
              )}
            </div>
          )}

          {/* Milestones */}
          {order.milestones?.length > 0 && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Milestones</h2>
              {order.milestones.map((m, i) => (
                <div key={i} style={s.milestone}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: 14 }}>{m.title}</strong>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>${m.amount}</span>
                  </div>
                  {m.description && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{m.description}</p>}
                  <span style={{ fontSize: 12, color: m.status === 'approved' ? '#16a34a' : '#6b7280' }}>{m.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* Professional: submit work */}
          {isProfessional && order.status === 'active' && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Submit your work</h2>
              <label style={s.label}>Notes to the business (optional)</label>
              <textarea style={s.textarea} rows={4} placeholder="Describe what you've completed, any notes for the client…"
                value={notes} onChange={e => setNotes(e.target.value)} />
              <button style={s.btn} onClick={() => submitMutation.mutate()} disabled={submitMutation.isLoading}>
                {submitMutation.isLoading ? 'Submitting…' : 'Submit work for review'}
              </button>
            </div>
          )}

          {/* Business: approve or dispute */}
          {isBusiness && order.status === 'submitted' && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Review submitted work</h2>
              <p style={{ fontSize: 14, color: '#374151', marginBottom: 16 }}>
                The professional has submitted their work. Review the deliverables above and either approve to release payment, or raise a dispute.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button style={{ ...s.btn, background: '#16a34a' }} onClick={() => completeMutation.mutate()} disabled={completeMutation.isLoading}>
                  ✅ Approve & release payment
                </button>
                <button style={{ ...s.btn, background: '#dc2626' }} onClick={() => disputeMutation.mutate()} disabled={disputeMutation.isLoading}>
                  ⚠️ Raise a dispute
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside style={s.sidebar}>
          <div style={s.sideCard}>
            <h3 style={s.sideTitle}>Order summary</h3>
            <div style={s.row}><span>Amount</span><strong>${order.amount}</strong></div>
            <div style={s.row}><span>Platform fee</span><span style={{ color: '#6b7280' }}>${order.platformFee}</span></div>
            <div style={{ ...s.row, borderTop: '1px solid #f3f4f6', paddingTop: 8, marginTop: 4 }}>
              <span>Net payout</span><strong style={{ color: '#16a34a' }}>${order.netPayout}</strong>
            </div>
            {order.deadline && (
              <div style={{ ...s.row, marginTop: 8 }}><span>Deadline</span><span>{new Date(order.deadline).toLocaleDateString()}</span></div>
            )}
          </div>

          {order.submittedAt && (
            <div style={s.sideCard}>
              <h3 style={s.sideTitle}>Timeline</h3>
              <div style={s.timelineItem}>📋 Order created<br /><span>{new Date(order.createdAt).toLocaleDateString()}</span></div>
              {order.submittedAt && <div style={s.timelineItem}>📬 Work submitted<br /><span>{new Date(order.submittedAt).toLocaleDateString()}</span></div>}
              {order.completedAt && <div style={s.timelineItem}>✅ Completed<br /><span>{new Date(order.completedAt).toLocaleDateString()}</span></div>}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

const s = {
  page:        { minHeight: '100vh', background: '#f9fafb' },
  center:      { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#6b7280' },
  nav:         { background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px' },
  navInner:    { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 },
  logo:        { fontSize: 20, fontWeight: 700, color: '#2563eb' },
  layout:      { maxWidth: 1100, margin: '0 auto', padding: 24, display: 'flex', gap: 24, alignItems: 'flex-start' },
  main:        { flex: 1 },
  sidebar:     { width: 260, flexShrink: 0 },
  header:      { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 16 },
  title:       { fontSize: 22, fontWeight: 700 },
  badge:       { fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 500 },
  badgeGray:   { fontSize: 12, padding: '4px 10px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280' },
  partiesRow:  { display: 'flex', alignItems: 'center', gap: 16, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16 },
  partyCard:   { flex: 1 },
  partyLabel:  { fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 },
  partyName:   { fontSize: 15, fontWeight: 600 },
  arrow:       { fontSize: 20, color: '#9ca3af' },
  card:        { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 16 },
  cardTitle:   { fontSize: 16, fontWeight: 600, marginBottom: 14 },
  attachment:  { display: 'block', color: '#2563eb', fontSize: 14, marginBottom: 6 },
  notes:       { background: '#f9fafb', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#374151', marginTop: 12 },
  milestone:   { padding: '12px 0', borderBottom: '1px solid #f3f4f6' },
  label:       { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 },
  textarea:    { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: 12 },
  btn:         { padding: '11px 22px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  sideCard:    { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16 },
  sideTitle:   { fontSize: 14, fontWeight: 600, marginBottom: 12 },
  row:         { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0' },
  timelineItem:{ fontSize: 13, color: '#374151', marginBottom: 10, lineHeight: 1.6 },
};
