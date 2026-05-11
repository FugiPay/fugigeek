import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import usersAPI from '../api/users';

const SKILLS = [
  'Web Development','Mobile Development','Design & Creative','Digital Marketing',
  'Content Writing','Data Analysis','Financial Consulting','Legal Advisory',
  'HR & Recruitment','Sales Strategy','Project Management',
];

export default function Professionals() {
  const [search,       setSearch]       = useState('');
  const [skills,       setSkills]       = useState([]);
  const [availability, setAvailability] = useState('');
  const [page,         setPage]         = useState(1);

  const toggleSkill = sk => setSkills(p => p.includes(sk) ? p.filter(s => s !== sk) : [...p, sk]);

  const { data, isLoading } = useQuery(
    ['professionals', { search, skills, availability, page }],
    () => usersAPI.getProfessionals({ search, skills: skills.join(',') || undefined, availability: availability || undefined, page, limit: 12 }).then(r => r.data),
    { keepPreviousData: true }
  );

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.navInner}>
          <Link to="/" style={s.logo}>Fugigeek</Link>
          <Link to="/listings" style={{ fontSize: 14, color: '#374151' }}>Browse tasks</Link>
        </div>
      </nav>

      <div style={s.layout}>
        {/* Sidebar */}
        <aside style={s.sidebar}>
          <div style={s.filterGroup}>
            <div style={s.filterLabel}>Search</div>
            <input style={s.filterInput} placeholder="Name, skill…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>

          <div style={s.filterGroup}>
            <div style={s.filterLabel}>Availability</div>
            {[['', 'Any'], ['full-time', 'Full-time'], ['part-time', 'Part-time'], ['contract', 'Contract'], ['weekends', 'Weekends']].map(([v, l]) => (
              <label key={v} style={s.radioRow}>
                <input type="radio" name="avail" checked={availability === v} onChange={() => { setAvailability(v); setPage(1); }} />
                {l}
              </label>
            ))}
          </div>

          <div style={s.filterGroup}>
            <div style={s.filterLabel}>Skills</div>
            {SKILLS.map(sk => (
              <label key={sk} style={s.checkRow}>
                <input type="checkbox" checked={skills.includes(sk)} onChange={() => { toggleSkill(sk); setPage(1); }} />
                {sk}
              </label>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main style={s.main}>
          <div style={s.resultsBar}>
            <h1 style={s.pageTitle}>Find professionals</h1>
            <span style={{ fontSize: 14, color: '#6b7280' }}>
              {isLoading ? 'Loading…' : `${data?.total || 0} professionals`}
            </span>
          </div>

          {isLoading && <div style={s.loading}>Loading professionals…</div>}

          <div style={s.grid}>
            {data?.professionals?.map(pro => (
              <Link key={pro._id} to={`/users/${pro._id}`} style={s.card}>
                <div style={s.cardTop}>
                  <div style={s.avatar}>{pro.name[0]}</div>
                  <div style={s.identity}>
                    <div style={s.name}>{pro.name}</div>
                    <div style={s.headline}>{pro.professionalProfile?.headline || 'Professional'}</div>
                    {pro.professionalProfile?.location && (
                      <div style={s.location}>📍 {pro.professionalProfile.location}</div>
                    )}
                  </div>
                </div>

                {pro.stats?.rating > 0 && (
                  <div style={s.rating}>
                    ⭐ {pro.stats.rating} <span style={{ color: '#9ca3af' }}>({pro.stats.reviewCount} reviews)</span>
                    &nbsp;·&nbsp; {pro.stats.completedTasks} tasks
                  </div>
                )}

                {pro.professionalProfile?.skills?.length > 0 && (
                  <div style={s.skills}>
                    {pro.professionalProfile.skills.slice(0, 4).map(sk => (
                      <span key={sk} style={s.skillTag}>{sk}</span>
                    ))}
                    {pro.professionalProfile.skills.length > 4 && (
                      <span style={s.moreTag}>+{pro.professionalProfile.skills.length - 4}</span>
                    )}
                  </div>
                )}

                <div style={s.footer}>
                  {pro.professionalProfile?.hourlyRate && (
                    <span style={s.rate}>${pro.professionalProfile.hourlyRate}/hr</span>
                  )}
                  {pro.professionalProfile?.availability && (
                    <span style={s.avail}>{pro.professionalProfile.availability}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>

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
  page:         { minHeight: '100vh', background: '#f9fafb' },
  nav:          { background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px' },
  navInner:     { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 },
  logo:         { fontSize: 20, fontWeight: 700, color: '#2563eb' },
  layout:       { maxWidth: 1200, margin: '0 auto', padding: 24, display: 'flex', gap: 24, alignItems: 'flex-start' },
  sidebar:      { width: 220, flexShrink: 0, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 16 },
  filterGroup:  { marginBottom: 20 },
  filterLabel:  { fontSize: 12, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 },
  filterInput:  { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' },
  radioRow:     { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', marginBottom: 6, cursor: 'pointer' },
  checkRow:     { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', marginBottom: 5, cursor: 'pointer' },
  main:         { flex: 1 },
  resultsBar:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pageTitle:    { fontSize: 22, fontWeight: 700 },
  loading:      { textAlign: 'center', padding: 40, color: '#6b7280' },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card:         { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, color: '#111827', textDecoration: 'none' },
  cardTop:      { display: 'flex', gap: 12, alignItems: 'flex-start' },
  avatar:       { width: 48, height: 48, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 },
  identity:     { flex: 1, minWidth: 0 },
  name:         { fontWeight: 600, fontSize: 15 },
  headline:     { fontSize: 13, color: '#6b7280', marginTop: 2 },
  location:     { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  rating:       { fontSize: 13, color: '#374151' },
  skills:       { display: 'flex', flexWrap: 'wrap', gap: 6 },
  skillTag:     { padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, fontSize: 12 },
  moreTag:      { padding: '4px 10px', background: '#f3f4f6', color: '#6b7280', borderRadius: 20, fontSize: 12 },
  footer:       { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: 10 },
  rate:         { fontWeight: 600, fontSize: 14, color: '#16a34a' },
  avail:        { fontSize: 12, background: '#f0fdf4', color: '#15803d', padding: '3px 8px', borderRadius: 12 },
  pages:        { display: 'flex', gap: 8, marginTop: 32, justifyContent: 'center' },
  pageBtn:      { width: 36, height: 36, border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', background: '#fff', fontSize: 14 },
  pageBtnActive:{ background: '#2563eb', color: '#fff', borderColor: '#2563eb' },
};
