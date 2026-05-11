import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import listingsAPI from '../api/listings';

const CATEGORIES = [
  'All','Web Development','Mobile Development','Design & Creative','Digital Marketing',
  'Content & Writing','Data & Analytics','Finance & Accounting','Legal & Compliance',
  'HR & Recruitment','Sales & Business Dev','Project Management','Engineering','Operations','Other',
];

const statusBadge = s => ({
  open:        { background: '#dcfce7', color: '#15803d' },
  'in-progress': { background: '#dbeafe', color: '#1d4ed8' },
  completed:   { background: '#f3f4f6', color: '#4b5563' },
}[s] || {});

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [budgetType, setBudgetType] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery(
    ['listings', { search, category, budgetType, page }],
    () => listingsAPI.getAll({ search, category: category || undefined, budgetType: budgetType || undefined, page, limit: 12 }).then(r => r.data),
    { keepPreviousData: true }
  );

  const applyCategory = c => { setCategory(c === 'All' ? '' : c); setPage(1); };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <Link to="/" style={s.logo}>Fugigeek</Link>
          <Link to="/register" style={s.postBtn}>+ Post a Task</Link>
        </div>
      </div>

      <div style={s.layout}>
        {/* Sidebar filters */}
        <aside style={s.sidebar}>
          <div style={s.filterGroup}>
            <div style={s.filterLabel}>Search</div>
            <input style={s.filterInput} placeholder="Keywords…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>

          <div style={s.filterGroup}>
            <div style={s.filterLabel}>Budget type</div>
            {['', 'fixed', 'hourly'].map(t => (
              <label key={t} style={s.radioRow}>
                <input type="radio" name="budgetType" checked={budgetType === t}
                  onChange={() => { setBudgetType(t); setPage(1); }} />
                <span>{t === '' ? 'Any' : t.charAt(0).toUpperCase() + t.slice(1)}</span>
              </label>
            ))}
          </div>

          <div style={s.filterGroup}>
            <div style={s.filterLabel}>Category</div>
            {CATEGORIES.map(c => (
              <div key={c}
                style={{ ...s.catItem, ...(category === (c === 'All' ? '' : c) ? s.catActive : {}) }}
                onClick={() => applyCategory(c)}>{c}</div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main style={s.main}>
          <div style={s.resultsBar}>
            <span style={{ color: '#6b7280', fontSize: 14 }}>
              {isLoading ? 'Loading…' : `${data?.total || 0} tasks found`}
            </span>
          </div>

          {isLoading && <div style={s.loading}>Loading tasks…</div>}

          <div style={s.grid}>
            {data?.tasks?.map(task => (
              <Link key={task._id} to={`/listings/${task._id}`} style={s.card}>
                <div style={s.cardTop}>
                  <span style={{ ...s.badge, ...statusBadge(task.status) }}>{task.status}</span>
                  <span style={s.badgeGray}>{task.budgetType}</span>
                </div>
                <h3 style={s.cardTitle}>{task.title}</h3>
                <p style={s.cardDesc}>{task.description.slice(0, 120)}…</p>
                <div style={s.cardMeta}>
                  <span style={s.metaItem}>📁 {task.category}</span>
                  {task.budgetMax && <span style={s.metaItem}>💰 Up to ${task.budgetMax}</span>}
                  {task.deadline  && <span style={s.metaItem}>📅 {new Date(task.deadline).toLocaleDateString()}</span>}
                </div>
                <div style={s.cardFooter}>
                  <div style={s.bizInfo}>
                    <div style={s.bizAvatar}>{task.business?.name?.[0]}</div>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{task.business?.businessProfile?.companyName || task.business?.name}</span>
                  </div>
                  <span style={s.proposals}>{task.proposalCount} proposals</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data?.pages > 1 && (
            <div style={s.pages}>
              {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
                <button key={p} style={{ ...s.pageBtn, ...(page === p ? s.pageBtnActive : {}) }}
                  onClick={() => setPage(p)}>{p}</button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const s = {
  page:       { minHeight: '100vh', background: '#f9fafb' },
  header:     { background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 },
  headerInner:{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 },
  logo:       { fontSize: 20, fontWeight: 700, color: '#2563eb' },
  postBtn:    { background: '#2563eb', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500 },
  layout:     { maxWidth: 1200, margin: '0 auto', padding: 24, display: 'flex', gap: 24, alignItems: 'flex-start' },
  sidebar:    { width: 220, flexShrink: 0, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 16 },
  filterGroup:{ marginBottom: 20 },
  filterLabel:{ fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 },
  filterInput:{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' },
  radioRow:   { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', marginBottom: 6, cursor: 'pointer' },
  catItem:    { fontSize: 13, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', color: '#374151', marginBottom: 2 },
  catActive:  { background: '#eff6ff', color: '#2563eb', fontWeight: 500 },
  main:       { flex: 1 },
  resultsBar: { marginBottom: 16 },
  loading:    { textAlign: 'center', padding: 40, color: '#6b7280' },
  grid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  card:       { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, display: 'flex', flexDirection: 'column', gap: 10, color: '#111827', textDecoration: 'none' },
  cardTop:    { display: 'flex', gap: 8 },
  badge:      { fontSize: 11, padding: '3px 8px', borderRadius: 12, fontWeight: 500 },
  badgeGray:  { fontSize: 11, padding: '3px 8px', borderRadius: 12, background: '#f3f4f6', color: '#6b7280' },
  cardTitle:  { fontSize: 15, fontWeight: 600, lineHeight: 1.3 },
  cardDesc:   { fontSize: 13, color: '#6b7280', lineHeight: 1.5 },
  cardMeta:   { display: 'flex', flexWrap: 'wrap', gap: 10 },
  metaItem:   { fontSize: 12, color: '#6b7280' },
  cardFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: 10, marginTop: 4 },
  bizInfo:    { display: 'flex', alignItems: 'center', gap: 6 },
  bizAvatar:  { width: 24, height: 24, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 },
  proposals:  { fontSize: 12, color: '#6b7280' },
  pages:      { display: 'flex', gap: 8, marginTop: 32, justifyContent: 'center' },
  pageBtn:    { width: 36, height: 36, border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', background: '#fff', fontSize: 14 },
  pageBtnActive: { background: '#2563eb', color: '#fff', borderColor: '#2563eb' },
};
