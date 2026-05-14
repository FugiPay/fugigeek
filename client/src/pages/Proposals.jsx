import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import listingsAPI from '../api/listings';
import ordersAPI   from '../api/orders';
import messagesAPI from '../api/messages';
import { useAuth } from '../hooks/useAuth';

export default function Proposals() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const qc        = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [msg,      setMsg]      = useState('');

  const { data: taskData } = useQuery(['task', id],
    () => listingsAPI.getOne(id).then(r => r.data));

  const { data: propData, isLoading } = useQuery(['proposals', id],
    () => listingsAPI.getProposals(id).then(r => r.data));

  const task      = taskData?.task;
  const proposals = propData?.proposals || [];

  const acceptMutation = useMutation(
    proposalId => listingsAPI.acceptProposal(id, proposalId),
    {
      onSuccess: async ({ data }) => {
        // Create an order for the accepted proposal
        await ordersAPI.create({ taskId: id, proposalId: data.proposal._id });
        qc.invalidateQueries(['proposals', id]);
        qc.invalidateQueries(['task', id]);
        setMsg('Proposal accepted! An order has been created.');
      },
    }
  );

  const messageMutation = useMutation(
    recipientId => messagesAPI.startConversation(recipientId, id),
    { onSuccess: ({ data }) => navigate(`/messages?conv=${data.conversation._id}`) }
  );

  const activeProposal = proposals.find(p => p._id === selected) || proposals[0];

  if (isLoading) return <div style={s.center}>Loading proposals…</div>;

  return (
    <div style={s.page}>
      <div style={s.breadcrumb}>
        <Link to={
          (user?.role === 'admin' || user?.role === 'manager') ? '/dashboard/admin'
          : user?.role === 'professional' ? '/dashboard/professional'
          : '/dashboard/business'
        } style={s.breadLink}>← Dashboard</Link>
        <span style={s.sep}>·</span>
        <Link to={`/listings/${id}`}   style={s.breadLink}>{task?.title}</Link>
        <span style={s.sep}>·</span>
        <span style={{ fontSize: 14, color: '#6b7280' }}>Proposals ({proposals.length})</span>
      </div>

      {msg && <div style={s.successBanner}>{msg}</div>}

      {proposals.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>No proposals yet</h3>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Proposals will appear here once professionals apply to your task.</p>
          <Link to={`/listings/${id}`} style={s.emptyBtn}>View task →</Link>
        </div>
      ) : (
        <div style={s.layout}>
          {/* Proposal list */}
          <aside style={s.list}>
            <div style={s.listHeader}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{proposals.length} proposal{proposals.length !== 1 ? 's' : ''}</span>
            </div>
            {proposals.map(p => (
              <div key={p._id}
                style={{ ...s.listItem, ...(activeProposal?._id === p._id ? s.listItemActive : {}) }}
                onClick={() => setSelected(p._id)}>
                <div style={s.listAvatar}>{p.professional?.name?.[0]}</div>
                <div style={s.listInfo}>
                  <div style={s.listName}>{p.professional?.name}</div>
                  <div style={s.listHeadline}>{p.professional?.professionalProfile?.headline}</div>
                  <div style={s.listBid}>K{p.bidAmount} · {p.bidType}</div>
                </div>
                <span style={{ ...s.statusDot, background: p.status === 'accepted' ? '#16a34a' : p.status === 'rejected' ? '#dc2626' : '#d97706' }} />
              </div>
            ))}
          </aside>

          {/* Proposal detail */}
          {activeProposal && (
            <div style={s.detail}>
              {/* Professional header */}
              <div style={s.proHeader}>
                <div style={s.proAvatar}>{activeProposal.professional?.name?.[0]}</div>
                <div style={s.proInfo}>
                  <h2 style={s.proName}>{activeProposal.professional?.name}</h2>
                  <p style={s.proHeadline}>{activeProposal.professional?.professionalProfile?.headline}</p>
                  <div style={s.proMeta}>
                    {activeProposal.professional?.professionalProfile?.location && (
                      <span>📍 {activeProposal.professional.professionalProfile.location}</span>
                    )}
                    {activeProposal.professional?.stats?.rating > 0 && (
                      <span>⭐ {activeProposal.professional.stats.rating} ({activeProposal.professional.stats.reviewCount} reviews)</span>
                    )}
                    <span>✅ {activeProposal.professional?.stats?.completedTasks || 0} tasks completed</span>
                    {activeProposal.professional?.phone && (
                      <a href={`tel:${activeProposal.professional.phone}`} style={{ color: '#16a34a' }}>
                        📞 {activeProposal.professional.phone}
                      </a>
                    )}
                  </div>
                </div>
                <div style={s.bidBox}>
                  <div style={s.bidAmount}>K{activeProposal.bidAmount}</div>
                  <div style={s.bidType}>{activeProposal.bidType}</div>
                  {activeProposal.timeline && <div style={s.bidTimeline}>⏱ {activeProposal.timeline}</div>}
                </div>
              </div>

              {/* Cover letter */}
              <div style={s.section}>
                <h3 style={s.sectionTitle}>Cover letter</h3>
                <p style={s.coverLetter}>{activeProposal.coverLetter}</p>
              </div>

              {/* Professional skills */}
              {activeProposal.professional?.professionalProfile?.skills?.length > 0 && (
                <div style={s.section}>
                  <h3 style={s.sectionTitle}>Skills</h3>
                  <div style={s.skills}>
                    {activeProposal.professional.professionalProfile.skills.map(sk => (
                      <span key={sk} style={s.skill}>{sk}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {activeProposal.status === 'pending' && (
                <div style={s.actions}>
                  <button style={s.acceptBtn}
                    onClick={() => acceptMutation.mutate(activeProposal._id)}
                    disabled={acceptMutation.isLoading}>
                    {acceptMutation.isLoading ? 'Accepting…' : '✅ Accept proposal'}
                  </button>
                  <button style={s.messageBtn}
                    onClick={() => messageMutation.mutate(activeProposal.professional._id)}
                    disabled={messageMutation.isLoading}>
                    {messageMutation.isLoading ? 'Opening…' : '💬 Message professional'}
                  </button>
                  <Link to={`/users/${activeProposal.professional._id}`} style={s.profileBtn}>
                    👤 View full profile
                  </Link>
                </div>
              )}

              {activeProposal.status === 'accepted' && (
                <div style={s.acceptedBanner}>
                  ✅ This proposal was accepted. An order has been created.
                </div>
              )}

              {activeProposal.status === 'rejected' && (
                <div style={s.rejectedBanner}>
                  ❌ This proposal was not selected.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  page:           { minHeight: '100vh', background: '#f9fafb' },
  center:         { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#6b7280' },
  breadcrumb:     { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb' },
  breadLink:      { fontSize: 14, color: '#374151', textDecoration: 'none' },
  sep:            { color: '#d1d5db' },
  successBanner:  { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '12px 24px', fontSize: 14 },
  empty:          { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' },
  emptyBtn:       { marginTop: 16, background: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, textDecoration: 'none' },
  layout:         { display: 'flex', height: 'calc(100vh - 49px)', overflow: 'hidden' },
  // List sidebar
  list:           { width: 280, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', overflow: 'auto' },
  listHeader:     { padding: '14px 16px', borderBottom: '1px solid #f3f4f6' },
  listItem:       { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #f9fafb' },
  listItemActive: { background: '#eff6ff' },
  listAvatar:     { width: 38, height: 38, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 },
  listInfo:       { flex: 1, minWidth: 0 },
  listName:       { fontSize: 14, fontWeight: 600 },
  listHeadline:   { fontSize: 12, color: '#6b7280', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  listBid:        { fontSize: 13, color: '#16a34a', fontWeight: 600, marginTop: 4 },
  statusDot:      { width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 6 },
  // Detail panel
  detail:         { flex: 1, overflow: 'auto', padding: 28 },
  proHeader:      { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 },
  proAvatar:      { width: 60, height: 60, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 },
  proInfo:        { flex: 1 },
  proName:        { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  proHeadline:    { fontSize: 14, color: '#4b5563', marginBottom: 8 },
  proMeta:        { display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 13, color: '#6b7280' },
  bidBox:         { textAlign: 'right', flexShrink: 0 },
  bidAmount:      { fontSize: 24, fontWeight: 700, color: '#16a34a' },
  bidType:        { fontSize: 13, color: '#6b7280', marginTop: 2 },
  bidTimeline:    { fontSize: 13, color: '#6b7280', marginTop: 4 },
  section:        { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16 },
  sectionTitle:   { fontSize: 14, fontWeight: 600, marginBottom: 12 },
  coverLetter:    { fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' },
  skills:         { display: 'flex', flexWrap: 'wrap', gap: 8 },
  skill:          { padding: '5px 12px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, fontSize: 13 },
  actions:        { display: 'flex', gap: 12, flexWrap: 'wrap' },
  acceptBtn:      { padding: '12px 22px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  messageBtn:     { padding: '12px 22px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  profileBtn:     { padding: '12px 22px', background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, textDecoration: 'none' },
  acceptedBanner: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', fontSize: 14 },
  rejectedBanner: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', fontSize: 14 },
};
