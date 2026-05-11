import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES = [
  { icon: '💻', label: 'Web Development' },
  { icon: '📱', label: 'Mobile Development' },
  { icon: '🎨', label: 'Design & Creative' },
  { icon: '📣', label: 'Digital Marketing' },
  { icon: '✍️', label: 'Content & Writing' },
  { icon: '📊', label: 'Data & Analytics' },
  { icon: '💰', label: 'Finance & Accounting' },
  { icon: '⚖️', label: 'Legal & Compliance' },
];

export default function Home() {
  const { isAuthenticated, isBusiness, isProfessional } = useAuth();

  return (
    <div>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <span style={s.logo}>Fugigeek</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/listings" style={s.navLink}>Browse Tasks</Link>
            <Link to="/users/professionals" style={s.navLink}>Find Professionals</Link>
            {isAuthenticated ? (
              <Link to={isBusiness ? '/dashboard/business' : '/dashboard/professional'} style={s.navBtn}>Dashboard</Link>
            ) : (
              <>
                <Link to="/login"    style={s.navLink}>Sign in</Link>
                <Link to="/register" style={s.navBtn}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={s.hero}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={s.heroTitle}>Connect your business with the right professionals</h1>
          <p style={s.heroSub}>Post tasks, receive proposals from verified experts, and grow your business with confidence.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={s.heroBtn}>Post a Task</Link>
            <Link to="/listings" style={s.heroBtnOut}>Browse Open Tasks</Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={s.stats}>
        {[['10,000+', 'Tasks Completed'], ['5,000+', 'Verified Professionals'], ['2,000+', 'Businesses Served'], ['4.8/5', 'Average Rating']].map(([n, l]) => (
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
          <div style={s.catGrid}>
            {CATEGORIES.map(c => (
              <Link key={c.label} to={`/listings?category=${encodeURIComponent(c.label)}`} style={s.catCard}>
                <span style={{ fontSize: 32 }}>{c.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{c.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ ...s.section, background: '#f9fafb' }}>
        <div className="container">
          <h2 style={s.sectionTitle}>How Fugigeek works</h2>
          <div style={s.steps}>
            {[
              { n: '1', t: 'Post your task', d: 'Describe what you need, set your budget, and publish your task in minutes.' },
              { n: '2', t: 'Receive proposals', d: 'Verified professionals review your task and send tailored proposals with bids.' },
              { n: '3', t: 'Hire & collaborate', d: 'Choose the best fit, fund the project securely, and work directly with your professional.' },
              { n: '4', t: 'Release & review', d: "Approve the deliverables, release payment, and leave a review to build the community." },
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
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Ready to grow your business?</h2>
        <p style={{ color: '#bfdbfe', marginBottom: 24 }}>Join thousands of businesses already using Fugigeek</p>
        <Link to="/register" style={s.ctaBtn}>Get started for free</Link>
      </section>
    </div>
  );
}

const s = {
  nav:         { borderBottom: '1px solid #e5e7eb', padding: '0 24px', position: 'sticky', top: 0, background: '#fff', zIndex: 100 },
  navInner:    { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 },
  logo:        { fontSize: 20, fontWeight: 700, color: '#2563eb' },
  navLink:     { fontSize: 14, color: '#374151' },
  navBtn:      { fontSize: 14, background: '#2563eb', color: '#fff', padding: '8px 16px', borderRadius: 8 },
  hero:        { padding: '80px 24px', textAlign: 'center', background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)' },
  heroTitle:   { fontSize: 44, fontWeight: 800, lineHeight: 1.2, marginBottom: 20, color: '#111827' },
  heroSub:     { fontSize: 18, color: '#4b5563', marginBottom: 32, lineHeight: 1.6 },
  heroBtn:     { background: '#2563eb', color: '#fff', padding: '14px 28px', borderRadius: 10, fontSize: 16, fontWeight: 600 },
  heroBtnOut:  { background: '#fff', color: '#2563eb', padding: '14px 28px', borderRadius: 10, fontSize: 16, fontWeight: 600, border: '2px solid #2563eb' },
  stats:       { display: 'flex', justifyContent: 'center', gap: 48, padding: '40px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' },
  stat:        { textAlign: 'center' },
  statNum:     { fontSize: 28, fontWeight: 700, color: '#2563eb' },
  statLabel:   { fontSize: 14, color: '#6b7280', marginTop: 4 },
  section:     { padding: '64px 24px' },
  sectionTitle:{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 40 },
  catGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, maxWidth: 1200, margin: '0 auto' },
  catCard:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 16px', border: '1px solid #e5e7eb', borderRadius: 12, textAlign: 'center', background: '#fff', color: '#111827', transition: 'box-shadow .15s' },
  steps:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, maxWidth: 1100, margin: '0 auto' },
  step:        { background: '#fff', padding: 28, borderRadius: 12, border: '1px solid #e5e7eb' },
  stepNum:     { width: 36, height: 36, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginBottom: 14 },
  stepTitle:   { fontSize: 17, fontWeight: 600, marginBottom: 8 },
  stepDesc:    { fontSize: 14, color: '#6b7280', lineHeight: 1.6 },
  cta:         { background: '#2563eb', color: '#fff', padding: '64px 24px', textAlign: 'center' },
  ctaBtn:      { background: '#fff', color: '#2563eb', padding: '14px 32px', borderRadius: 10, fontSize: 16, fontWeight: 600, display: 'inline-block' },
};
