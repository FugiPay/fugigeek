import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import listingsAPI from '../api/listings';
import { useAuth } from '../hooks/useAuth';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isBusiness, isProfessional } = useAuth();
  const [proposal, setProposal] = useState({ bidAmount: '', bidType: 'fixed', coverLetter: '', timeline: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [propError,  setPropError]  = useState('');

  const { data, isLoading } = useQuery(['task', id], () => listingsAPI.getOne(id).then(r => r.data));
  const task = data?.task;

  const onProposalChange = e => setProposal(p => ({ ...p, [e.target.name]: e.target.value }));

  const submitProposal = async e => {
    e.preventDefault();
    if (!isAuthenticated) return navigate('/login');
    setPropError(''); setSubmitting(true);
    try {
      await listingsAPI.submitProposal(id, proposal);
      setSubmitted(true);
    } catch (err) {
      setPropError(err.response?.data?.message || 'Failed to submit proposal');
    } finally { setSubmitting(false); }
  };

  if (isLoading) return <div style={s.center}>Loading task…</div>;
  if (!task)     return <div style={s.center}>Task not found.</div>;

  const isOwner    = user?._id === task.business?._id;
  const canPropose = isProfessional && task.status === 'open' && !isOwner;

  return (
    <div style={s.page}>
      {/* Top nav */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <Link to="/" style={s.logo}>Fugigeek</Link>
          <Link to="/listings" style={{ fontSize: 14, color: '#374151' }}>← Browse Tasks</Link>
        </div>
      </nav>

      <div style={s.layout}>
        {/* Main column */}
        <div style={s.main}>
          {/* Status + category */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <span style={{ ...s.badge, ...statusColor(task.status) }}>{task.status}</span>
            <span style={s.badgeGray}>{task.category}</span>
            {task.locationType && <span style={s.badgeGray}>{task.locationType}</span>}
          </div>

          <h1 style={s.title}>{task.title}</h1>

          {/* Meta row */}
          <div style={s.meta}>
            {task.budgetMax  && <span>💰 Budget: up to ${task.budgetMax} ({task.budgetType})</span>}
            {task.deadline   && <span>📅 Deadline: {new Date(task.deadline).toLocaleDateString()}</span>}
            {task.duration   && <span>⏱ Duration: {task.duration}</span>}
            <span>👁 {task.views} views</span>
            <span>📬 {task.proposalCount} proposals</span>
          </div>

          {/* Description */}
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Task description</h2>
            <p style={s.body}>{task.description}</p>
          </section>

          {/* Skills required */}
          {task.skillsRequired?.length > 0 && (
            <section style={s.section}>
              <h2 style={s.sectionTitle}>Skills required</h2>
              <div style={s.skills}>
                {task.skillsRequired.map(sk => <span key={sk} style={s.skill}>{sk}</span>)}
              </div>
            </section>
          )}

          {/* Tags */}
          {task.tags?.length > 0 && (
            <section style={s.section}>
              <h2 style={s.sectionTitle}>Tags</h2>
              <div style={s.skills}>
                {task.tags.map(t => <span key={t} style={{ ...s.skill, background: '#f3f4f6', color: '#6b7280' }}>{t}</span>)}
              </div>
            </section>
          )}

          {/* Attachments */}
          {task.attachments?.length > 0 && (
            <section style={s.section}>
              <h2 style={s.sectionTitle}>Attachments</h2>
              {task.attachments.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noreferrer" style={s.attachment}>
                  📎 {a.originalName || `Attachment ${i + 1}`}
                </a>
              ))}
            </section>
          )}

          {/* Proposal form — professionals only */}
          {canPropose && (
            <section style={s.section}>
              <h2 style={s.sectionTitle}>Submit a proposal</h2>
              {submitted ? (
                <div style={s.success}>✅ Your proposal has been submitted! The business will review it shortly.</div>
              ) : (
                <form onSubmit={submitProposal} style={s.form}>
                  {propError && <div style={s.alert}>{propError}</div>}

                  <div style={s.formRow}>
                    <div style={{ flex: 1 }}>
                      <label style={s.label}>Your bid ({task.budgetType})</label>
                      <div style={s.inputPrefix}>
                        <span style={s.prefix}>$</span>
                        <input style={{ ...s.input, paddingLeft: 28 }} name="bidAmount" type="number" min="1"
                          placeholder="e.g. 500" value={proposal.bidAmount} onChange={onProposalChange} required />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={s.label}>Bid type</label>
                      <select style={s.input} name="bidType" value={proposal.bidType} onChange={onProposalChange}>
                        <option value="fixed">Fixed price</option>
                        <option value="hourly">Hourly rate</option>
                      </select>
                    </div>
                  </div>

                  <label style={s.label}>Estimated timeline</label>
                  <input style={s.input} name="timeline" placeholder="e.g. 2 weeks" value={proposal.timeline} onChange={onProposalChange} />

                  <label style={s.label}>Cover letter</label>
                  <textarea style={s.textarea} name="coverLetter" rows={6}
                    placeholder="Introduce yourself, explain your approach, and why you're the right fit for this task…"
                    value={proposal.coverLetter} onChange={onProposalChange} required />

                  <button style={s.btn} type="submit" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit proposal'}
                  </button>
                </form>
              )}
            </section>
          )}

          {!isAuthenticated && task.status === 'open' && (
            <div style={s.loginPrompt}>
              <p>Want to work on this task?</p>
              <Link to="/register" style={s.btn}>Create a professional account</Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside style={s.sidebar}>
          {/* Business card */}
          <div style={s.sideCard}>
            <h3 style={s.sideTitle}>Posted by</h3>
            <div style={s.bizRow}>
              <div style={s.bizAvatar}>{task.business?.name?.[0]}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{task.business?.businessProfile?.companyName || task.business?.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{task.business?.businessProfile?.industry}</div>
              </div>
            </div>
            {task.business?.stats?.rating > 0 && (
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
                ⭐ {task.business.stats.rating} · {task.business.stats.reviewCount} reviews
              </div>
            )}
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              ✅ {task.business?.stats?.completedTasks || 0} tasks completed
            </div>
          </div>

          {/* Task summary */}
          <div style={s.sideCard}>
            <h3 style={s.sideTitle}>Task summary</h3>
            <div style={s.summaryRow}><span>Budget</span><strong>Up to ${task.budgetMax || '—'}</strong></div>
            <div style={s.summaryRow}><span>Type</span><strong>{task.budgetType}</strong></div>
            <div style={s.summaryRow}><span>Duration</span><strong>{task.duration || '—'}</strong></div>
            <div style={s.summaryRow}><span>Location</span><strong>{task.locationType}</strong></div>
            <div style={s.summaryRow}><span>Proposals</span><strong>{task.proposalCount}</strong></div>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div style={s.sideCard}>
              <h3 style={s.sideTitle}>Manage task</h3>
              <Link to={`/listings/${task._id}/proposals`} style={s.mngBtn}>View proposals ({task.proposalCount})</Link>
              <Link to={`/listings/${task._id}/edit`}      style={{ ...s.mngBtn, background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', marginTop: 8 }}>Edit task</Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

const statusColor = s => ({
  open:          { background: '#dcfce7', color: '#15803d' },
  'in-progress': { background: '#dbeafe', color: '#1d4ed8' },
  completed:     { background: '#f3f4f6', color: '#4b5563' },
  cancelled:     { background: '#fee2e2', color: '#b91c1c' },
}[s] || {});

const s = {
  page:        { minHeight: '100vh', background: '#f9fafb' },
  center:      { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#6b7280' },
  nav:         { background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px' },
  navInner:    { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 },
  logo:        { fontSize: 20, fontWeight: 700, color: '#2563eb' },
  layout:      { maxWidth: 1200, margin: '0 auto', padding: 24, display: 'flex', gap: 24, alignItems: 'flex-start' },
  main:        { flex: 1, minWidth: 0 },
  sidebar:     { width: 280, flexShrink: 0 },
  title:       { fontSize: 26, fontWeight: 700, lineHeight: 1.3, marginBottom: 12 },
  meta:        { display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#6b7280', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #e5e7eb' },
  badge:       { fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 500 },
  badgeGray:   { fontSize: 12, padding: '4px 10px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280' },
  section:     { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 16 },
  sectionTitle:{ fontSize: 16, fontWeight: 600, marginBottom: 12 },
  body:        { fontSize: 15, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' },
  skills:      { display: 'flex', flexWrap: 'wrap', gap: 8 },
  skill:       { padding: '6px 12px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, fontSize: 13 },
  attachment:  { display: 'block', color: '#2563eb', fontSize: 14, marginBottom: 6 },
  form:        { display: 'flex', flexDirection: 'column', gap: 12 },
  formRow:     { display: 'flex', gap: 16 },
  alert:       { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 14 },
  success:     { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, padding: '14px 16px', fontSize: 14 },
  label:       { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 },
  input:       { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' },
  inputPrefix: { position: 'relative' },
  prefix:      { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: 14 },
  textarea:    { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
  btn:         { padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'pointer' },
  loginPrompt: { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, textAlign: 'center', marginTop: 16 },
  sideCard:    { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16 },
  sideTitle:   { fontSize: 14, fontWeight: 600, marginBottom: 14 },
  bizRow:      { display: 'flex', alignItems: 'center', gap: 10 },
  bizAvatar:   { width: 40, height: 40, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 },
  summaryRow:  { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid #f3f4f6' },
  mngBtn:      { display: 'block', background: '#2563eb', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, textAlign: 'center' },
};
