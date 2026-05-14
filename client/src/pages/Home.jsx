import { usePageTitle } from '../hooks/usePageTitle';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../hooks/useAuth';
import Footer from '../components/common/Footer';
import api from '../api/axios';
import { useCategories } from '../hooks/useCategories';

export default function Home() {
  usePageTitle('Connect Businesses with Professionals');
  const { isAuthenticated, user } = useAuth();
  const { categories: CATEGORIES } = useCategories();
  const dashboardPath =
    (user?.role === 'admin'  || user?.role === 'manager')    ? '/dashboard/admin'
    : (user?.role === 'business' || user?.role === 'individual') ? '/dashboard/business'
    : '/dashboard/professional';

  const { data: statsData } = useQuery(
    'platformStats',
    () => api.get('/stats').then(r => r.data.stats),
    { staleTime: 1000 * 60 * 10 } // cache for 10 min
  );

  const fmt = n => {
    if (!n && n !== 0) return '—';
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k+`;
    return `${n}+`;
  };

  const stats = [
    [fmt(statsData?.completedTasks), 'Tasks Completed'],
    [fmt(statsData?.professionals),  'Verified Professionals'],
    [fmt(statsData?.clients),        'Happy Clients'],
    [statsData?.rating ?? '—',       'Average Rating'],
  ];

  return (
    <div>
      {/* Hero */}
      <section style={s.hero}>
        <div style={{ maxWidth: 740, margin: '0 auto', textAlign: 'center' }}>
          <div style={s.heroPill}>🚀 The smarter way to get things done</div>
          <h1 style={s.heroTitle}>
            Find the right professional for <span style={s.heroHighlight}>any task</span>
          </h1>
          <p style={s.heroSub}>
            Whether you're a business scaling fast, a startup finding its feet, or an individual
            with something that needs doing — Fugigeek connects you with experienced professionals
            ready to help right now.
          </p>
          <div style={s.heroBtns}>
            {isAuthenticated ? (
              <>
                <Link to="/tasks/new"    style={s.heroBtn}>Post a Task</Link>
                <Link to={dashboardPath} style={s.heroBtnOut}>Go to Dashboard</Link>
              </>
            ) : (
              <>
                <Link to="/register" style={s.heroBtn}>Get Started Free</Link>
                <Link to="/listings" style={s.heroBtnOut}>Browse Open Tasks</Link>
              </>
            )}
          </div>
          <p style={s.heroNote}>No subscription. Pay only when you hire.</p>
        </div>
      </section>

      {/* Who it's for */}
      <section style={s.forSection}>
        <div style={s.forGrid}>
          <div style={s.forCard}>
            <span style={s.forIcon}>🏢</span>
            <h3 style={s.forTitle}>Businesses</h3>
            <p style={s.forDesc}>Scale your team on demand. Post tasks, hire vetted professionals, and deliver projects faster without the overhead of full-time hiring.</p>
            <Link to="/register" style={s.forLink}>Start hiring →</Link>
          </div>
          <div style={s.forCard}>
            <span style={s.forIcon}>👤</span>
            <h3 style={s.forTitle}>Individuals</h3>
            <p style={s.forDesc}>Got something that needs doing? From fixing your website to managing your finances — find a trusted professional and get it done.</p>
            <Link to="/register" style={s.forLink}>Post your task →</Link>
          </div>
          <div style={s.forCard}>
            <span style={s.forIcon}>💼</span>
            <h3 style={s.forTitle}>Professionals</h3>
            <p style={s.forDesc}>Turn your skills into income. Browse tasks that match your expertise, submit proposals, and build a reputation that brings clients to you.</p>
            <Link to="/listings" style={s.forLink}>Browse tasks →</Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={s.stats}>
        {stats.map(([n, l]) => (
          <div key={l} style={s.stat}>
            <div style={s.statNum}>{n}</div>
            <div style={s.statLabel}>{l}</div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section style={s.section}>
        <div className="container">
          <h2 style={s.sectionTitle}>Browse by category</h2>
          <p style={s.sectionSub}>From tech to creative, legal to finance — whatever you need, we have the professional for it.</p>
          <div style={s.catGrid}>
            {CATEGORIES.map(c => (
              <Link key={c.name} to={`/listings?category=${encodeURIComponent(c.name)}`} style={s.catCard}>
                <span style={{ fontSize: 32 }}>{c.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ ...s.section, background: '#f9fafb' }}>
        <div className="container">
          <h2 style={s.sectionTitle}>How Fugigeek works</h2>
          <p style={s.sectionSub}>Simple, transparent, and built around getting things done.</p>
          <div style={s.steps}>
            {[
              { n: '1', t: 'Post your task',    d: "Describe what you need, set your budget, and publish your task in minutes. It's free to post." },
              { n: '2', t: 'Receive proposals',  d: 'Professionals review your task and send tailored proposals. Compare bids, profiles, and reviews.' },
              { n: '3', t: 'Hire & collaborate', d: 'Choose the best fit, communicate directly, and work together with full visibility.' },
              { n: '4', t: 'Approve & pay',      d: "Release payment only when you're satisfied. Leave a review to help the community." },
            ].map(step => (
              <div key={step.n} style={s.step}>
                <div style={s.stepNum}>{step.n}</div>
                <h3 style={s.stepTitle}>{step.t}</h3>
                <p style={s.stepDesc}>{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={s.cta}>
        <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>Ready to get something done?</h2>
        <p style={{ color: '#bfdbfe', marginBottom: 28, fontSize: 16 }}>
          Join thousands of people and businesses already using Fugigeek to get work done smarter.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register"            style={s.ctaBtn}>Post a Task</Link>
          <Link to="/users/professionals" style={{ ...s.ctaBtn, background: 'transparent', border: '2px solid #fff', color: '#fff' }}>
            Find Professionals
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

const s = {
  hero:         { padding: '88px 24px 72px', textAlign: 'center', background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)' },
  heroPill:     { display: 'inline-block', background: '#dbeafe', color: '#1d4ed8', fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 20, marginBottom: 20 },
  heroTitle:    { fontSize: 48, fontWeight: 800, lineHeight: 1.15, marginBottom: 20, color: '#111827' },
  heroHighlight:{ color: '#2563eb' },
  heroSub:      { fontSize: 18, color: '#4b5563', lineHeight: 1.7, maxWidth: 620, margin: '0 auto 32px' },
  heroBtns:     { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 },
  heroBtn:      { background: '#2563eb', color: '#fff', padding: '14px 28px', borderRadius: 10, fontSize: 16, fontWeight: 600, textDecoration: 'none' },
  heroBtnOut:   { background: '#fff', color: '#2563eb', padding: '14px 28px', borderRadius: 10, fontSize: 16, fontWeight: 600, border: '2px solid #2563eb', textDecoration: 'none' },
  heroNote:     { fontSize: 13, color: '#9ca3af', marginTop: 8 },
  forSection:   { background: '#fff', padding: '56px 24px', borderBottom: '1px solid #e5e7eb' },
  forGrid:      { maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 },
  forCard:      { padding: 28, borderRadius: 14, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 10 },
  forIcon:      { fontSize: 36 },
  forTitle:     { fontSize: 18, fontWeight: 700, color: '#111827' },
  forDesc:      { fontSize: 14, color: '#6b7280', lineHeight: 1.7, flex: 1 },
  forLink:      { fontSize: 14, fontWeight: 600, color: '#2563eb', textDecoration: 'none' },
  stats:        { display: 'flex', justifyContent: 'center', gap: 56, padding: '40px 24px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' },
  stat:         { textAlign: 'center' },
  statNum:      { fontSize: 30, fontWeight: 800, color: '#2563eb' },
  statLabel:    { fontSize: 14, color: '#6b7280', marginTop: 4 },
  section:      { padding: '64px 24px' },
  sectionTitle: { fontSize: 30, fontWeight: 700, textAlign: 'center', marginBottom: 12 },
  sectionSub:   { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 40 },
  catGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, maxWidth: 1100, margin: '0 auto' },
  catCard:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 16px', border: '1px solid #e5e7eb', borderRadius: 12, textAlign: 'center', background: '#fff', color: '#111827', textDecoration: 'none' },
  steps:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, maxWidth: 1100, margin: '0 auto' },
  step:         { background: '#fff', padding: 28, borderRadius: 12, border: '1px solid #e5e7eb' },
  stepNum:      { width: 36, height: 36, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginBottom: 14, fontSize: 15 },
  stepTitle:    { fontSize: 17, fontWeight: 600, marginBottom: 8 },
  stepDesc:     { fontSize: 14, color: '#6b7280', lineHeight: 1.7 },
  cta:          { background: '#1d4ed8', color: '#fff', padding: '72px 24px', textAlign: 'center' },
  ctaBtn:       { background: '#fff', color: '#1d4ed8', padding: '14px 28px', borderRadius: 10, fontSize: 15, fontWeight: 700, display: 'inline-block', textDecoration: 'none' },
};
