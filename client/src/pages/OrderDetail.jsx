import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import ordersAPI   from '../api/orders';
import paymentsAPI from '../api/payments';
import { useAuth } from '../hooks/useAuth';

export default function OrderDetail() {
  const { id } = useParams();
  const { user, isProfessional } = useAuth();
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');
  const [msg,   setMsg]   = useState({ type: '', text: '' });

  const { data, isLoading } = useQuery(['order', id], () => ordersAPI.getOne(id).then(r => r.data));
  const order = data?.order;

  const payMutation = useMutation(
    () => paymentsAPI.create(id),
    {
      onSuccess: ({ data }) => {
        window.location.href = data.paymentUrl;
      },
      onError: err => setMsg({ type: 'warn', text: err.response?.data?.message || 'Payment initiation failed.' }),
    }
  );

  const submitMutation = useMutation(
    () => ordersAPI.submit(id, { professionalNotes: notes }),
    { onSuccess: () => {
      qc.invalidateQueries(['order', id]);
      setMsg({ type: 'success', text: 'Work submitted! Awaiting client verification.' });
    }}
  );

  const verifyMutation = useMutation(
    () => ordersAPI.verify(id, { verificationNotes: notes }),
    { onSuccess: () => {
      qc.invalidateQueries(['order', id]);
      setMsg({ type: 'success', text: '✅ Work verified and order marked complete!' });
    }}
  );

  const disputeMutation = useMutation(
    () => ordersAPI.dispute(id, { reason: notes }),
    { onSuccess: () => {
      qc.invalidateQueries(['order', id]);
      setMsg({ type: 'warn', text: 'Dispute raised. Our team will be in touch shortly.' });
    }}
  );

  const withdrawMutation = useMutation(
    () => ordersAPI.withdraw(id),
    { onSuccess: () => {
      qc.invalidateQueries(['order', id]);
      setMsg({ type: 'warn', text: 'Proposal withdrawn. The task is now open again.' });
    }}
  );

  if (isLoading) return <div style={s.center}>Loading order…</div>;
  if (!order)    return <div style={s.center}>Order not found.</div>;

  const isClient = user?._id === order.client?._id?.toString() ||
                   user?._id === order.client?._id;

  const statusColors = {
    pending_payment: { bg: '#fef3c7', fg: '#b45309' },
    active:          { bg: '#dbeafe', fg: '#1d4ed8' },
    submitted:       { bg: '#ede9fe', fg: '#6d28d9' },
    verified:        { bg: '#dcfce7', fg: '#15803d' },
    disputed:        { bg: '#fee2e2', fg: '#b91c1c' },
    withdrawn:       { bg: '#f3f4f6', fg: '#4b5563' },
    cancelled:       { bg: '#fee2e2', fg: '#b91c1c' },
  };
  const sc = statusColors[order.status] || { bg: '#f3f4f6', fg: '#6b7280' };

  const dashPath = isProfessional ? '/dashboard/professional' : '/dashboard/business';

  return (
    <div style={s.page}>
      <div style={s.breadcrumb}>
        <Link to={dashPath} style={s.breadLink}>← Dashboard</Link>
        <span style={s.sep}>·</span>
        <span style={{ fontSize: 14, color: '#6b7280' }}>Order details</span>
      </div>

      <div style={s.layout}>
        <div style={s.main}>
          {/* Header */}
          <div style={s.header}>
            <div>
              <h1 style={s.title}>{order.task?.title}</h1>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <span style={{ ...s.badge, background: sc.bg, color: sc.fg }}>
                  {order.status}
                </span>
                <span style={s.badgeGray}>{order.task?.category}</span>
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {msg.text && (
            <div style={{
              background: msg.type === 'success' ? '#f0fdf4' : '#fffbeb',
              color:      msg.type === 'success' ? '#15803d' : '#b45309',
              border:     `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fde68a'}`,
              borderRadius: 8, padding: '12px 16px', fontSize: 14,
            }}>{msg.text}</div>
          )}

          {/* Parties */}
          <div style={s.partiesRow}>
            <div style={s.partyCard}>
              <div style={s.partyLabel}>Client</div>
              <div style={s.partyName}>
                {order.client?.businessProfile?.companyName ||
                 order.client?.individualProfile?.occupation ||
                 order.client?.name}
              </div>
              {order.client?.phone && (
                <a href={`tel:${order.client.phone}`} style={s.phoneLink}>
                  📞 {order.client.phone}
                </a>
              )}
            </div>
            <div style={s.arrow}>→</div>
            <div style={s.partyCard}>
              <div style={s.partyLabel}>Professional</div>
              <div style={s.partyName}>{order.professional?.name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {order.professional?.professionalProfile?.headline}
              </div>
              {order.professional?.phone && (
                <a href={`tel:${order.professional.phone}`} style={s.phoneLink}>
                  📞 {order.professional.phone}
                </a>
              )}
            </div>
          </div>

          {/* Deliverables */}
          {order.deliverables?.length > 0 && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Submitted deliverables</h2>
              {order.deliverables.map((d, i) => (
                <div key={i} style={s.deliverableItem}>
                  <a href={d.url} target="_blank" rel="noreferrer" style={s.attachLink}>
                    📎 {d.originalName || `Deliverable ${i + 1}`}
                  </a>
                  {d.description && <p style={s.delDesc}>{d.description}</p>}
                </div>
              ))}
              {order.professionalNotes && (
                <div style={s.noteBox}>
                  <strong>Professional notes:</strong> {order.professionalNotes}
                </div>
              )}
            </div>
          )}

          {/* Verification notes */}
          {order.status === 'verified' && order.verificationNotes && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Verification notes</h2>
              <p style={{ fontSize: 14, color: '#374151' }}>{order.verificationNotes}</p>
            </div>
          )}

          {/* Client: pay to activate order */}
          {isClient && order.status === 'pending_payment' && (
            <div style={{ ...s.card, borderColor: '#bfdbfe', background: '#eff6ff' }}>
              <h2 style={{ ...s.cardTitle, color: '#1d4ed8' }}>Payment required</h2>
              <p style={{ fontSize: 14, color: '#1d4ed8', marginBottom: 16 }}>
                Complete your payment of <strong>K{order.amount}</strong> to activate this order and
                notify the professional to begin work.
              </p>
              <button style={{ ...s.btn, background: '#2563eb' }}
                onClick={() => payMutation.mutate()} disabled={payMutation.isLoading}>
                {payMutation.isLoading ? 'Redirecting to payment…' : `💳 Pay K${order.amount}`}
              </button>
            </div>
          )}

          {/* Professional: submit work */}
          {isProfessional && order.status === 'active' && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Submit your work</h2>
              <p style={s.cardSub}>Describe what you've completed. The client will review and verify.</p>
              <label style={s.label}>Notes to client</label>
              <textarea style={s.textarea} rows={4}
                placeholder="Summarise what you've done, any notes or instructions for the client…"
                value={notes} onChange={e => setNotes(e.target.value)} />
              <button style={s.btn} onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isLoading}>
                {submitMutation.isLoading ? 'Submitting…' : 'Submit work for review'}
              </button>
            </div>
          )}

          {/* Client: verify or dispute */}
          {isClient && order.status === 'submitted' && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Review submitted work</h2>
              <p style={s.cardSub}>
                The professional has submitted their work. Review the deliverables above, then
                verify completion or raise a dispute if something is wrong.
              </p>
              <label style={s.label}>Notes (optional)</label>
              <textarea style={s.textarea} rows={3}
                placeholder="Any notes about the completed work…"
                value={notes} onChange={e => setNotes(e.target.value)} />
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button style={{ ...s.btn, background: '#16a34a' }}
                  onClick={() => verifyMutation.mutate()} disabled={verifyMutation.isLoading}>
                  ✅ Verify & mark complete
                </button>
                <button style={{ ...s.btn, background: '#dc2626' }}
                  onClick={() => disputeMutation.mutate()} disabled={disputeMutation.isLoading}>
                  ⚠️ Raise dispute
                </button>
              </div>
            </div>
          )}

          {/* Client: withdraw active order */}
          {isClient && order.status === 'active' && (
            <div style={{ ...s.card, borderColor: '#fde68a', background: '#fffbeb' }}>
              <h2 style={{ ...s.cardTitle, color: '#92400e' }}>Withdraw proposal</h2>
              <p style={{ fontSize: 14, color: '#92400e', marginBottom: 12 }}>
                If you no longer need this work done, you can withdraw. The task will be reopened.
              </p>
              <button style={{ ...s.btn, background: '#d97706' }}
                onClick={() => withdrawMutation.mutate()} disabled={withdrawMutation.isLoading}>
                Withdraw proposal
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside style={s.sidebar}>
          <div style={s.sideCard}>
            <h3 style={s.sideTitle}>Order summary</h3>
            <div style={s.row}><span>Agreed amount</span><strong>K{order.amount || '—'}</strong></div>
            <div style={s.row}><span>Currency</span><strong>ZMW</strong></div>
            {order.deadline && (
              <div style={s.row}><span>Deadline</span><strong>{new Date(order.deadline).toLocaleDateString()}</strong></div>
            )}
            <p style={s.payNote}>
              💡 Payment is handled directly between the client and professional.
            </p>
          </div>

          <div style={s.sideCard}>
            <h3 style={s.sideTitle}>Timeline</h3>
            <div style={s.timelineItem}>📋 Order created<br /><span style={{ color: '#9ca3af', fontSize: 12 }}>{new Date(order.createdAt).toLocaleDateString()}</span></div>
            {order.submittedAt && <div style={s.timelineItem}>📬 Work submitted<br /><span style={{ color: '#9ca3af', fontSize: 12 }}>{new Date(order.submittedAt).toLocaleDateString()}</span></div>}
            {order.verifiedAt  && <div style={s.timelineItem}>✅ Verified<br /><span style={{ color: '#9ca3af', fontSize: 12 }}>{new Date(order.verifiedAt).toLocaleDateString()}</span></div>}
          </div>

          <div style={s.sideCard}>
            <h3 style={s.sideTitle}>Communication</h3>
            <Link to="/messages" style={s.msgBtn}>💬 Open Messages</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

const s = {
  page:         { minHeight: '100vh', background: '#f9fafb' },
  center:       { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#6b7280' },
  breadcrumb:   { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb' },
  breadLink:    { fontSize: 14, color: '#374151', textDecoration: 'none' },
  sep:          { color: '#d1d5db' },
  layout:       { maxWidth: 1100, margin: '0 auto', padding: 24, display: 'flex', gap: 24, alignItems: 'flex-start' },
  main:         { flex: 1, display: 'flex', flexDirection: 'column', gap: 16 },
  sidebar:      { width: 260, flexShrink: 0 },
  header:       { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 },
  title:        { fontSize: 22, fontWeight: 700 },
  badge:        { fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 500 },
  badgeGray:    { fontSize: 12, padding: '4px 10px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280' },
  partiesRow:   { display: 'flex', alignItems: 'center', gap: 16, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 },
  partyCard:    { flex: 1 },
  partyLabel:   { fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 },
  partyName:    { fontSize: 15, fontWeight: 600, marginBottom: 4 },
  phoneLink:    { fontSize: 13, color: '#16a34a', textDecoration: 'none', display: 'block' },
  arrow:        { fontSize: 20, color: '#9ca3af' },
  card:         { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 },
  cardTitle:    { fontSize: 16, fontWeight: 600, marginBottom: 6 },
  cardSub:      { fontSize: 14, color: '#6b7280', marginBottom: 14 },
  deliverableItem: { padding: '8px 0', borderBottom: '1px solid #f3f4f6' },
  attachLink:   { color: '#2563eb', fontSize: 14, textDecoration: 'none' },
  delDesc:      { fontSize: 13, color: '#6b7280', marginTop: 4 },
  noteBox:      { background: '#f9fafb', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#374151', marginTop: 12 },
  label:        { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6, marginTop: 12 },
  textarea:     { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
  btn:          { padding: '11px 22px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 12 },
  sideCard:     { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16 },
  sideTitle:    { fontSize: 14, fontWeight: 600, marginBottom: 12 },
  row:          { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid #f9fafb' },
  payNote:      { fontSize: 12, color: '#6b7280', marginTop: 12, lineHeight: 1.6 },
  timelineItem: { fontSize: 13, color: '#374151', marginBottom: 10, lineHeight: 1.6 },
  msgBtn:       { display: 'block', background: '#eff6ff', color: '#2563eb', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500, textAlign: 'center', textDecoration: 'none' },
};
