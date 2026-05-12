import { Link } from 'react-router-dom';

const LINKS = {
  Platform: [
    { label: 'Browse Tasks',       path: '/listings' },
    { label: 'Find Professionals', path: '/users/professionals' },
    { label: 'Post a Task',        path: '/tasks/new' },
  ],
  Company: [
    { label: 'About',      path: '/about' },
    { label: 'Contact',    path: '/contact' },
    { label: 'Blog',       path: '/blog' },
  ],
  Legal: [
    { label: 'Privacy Policy',  path: '/privacy' },
    { label: 'Terms of Service', path: '/terms' },
    { label: 'Cookie Policy',   path: '/cookies' },
  ],
};

export default function Footer() {
  return (
    <footer style={s.footer}>
      <div style={s.inner}>
        {/* Brand */}
        <div style={s.brand}>
          <Link to="/" style={s.logo}>Fugigeek</Link>
          <p style={s.tagline}>
            Connecting businesses with experienced professionals to get things done.
          </p>
          <div style={s.socials}>
            {['𝕏', 'in', 'f'].map(icon => (
              <span key={icon} style={s.socialIcon}>{icon}</span>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(LINKS).map(([group, links]) => (
          <div key={group} style={s.col}>
            <div style={s.colTitle}>{group}</div>
            {links.map(l => (
              <Link key={l.path} to={l.path} style={s.link}>{l.label}</Link>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={s.bottom}>
        <span>© {new Date().getFullYear()} Fugigeek. All rights reserved.</span>
        <span style={{ color: '#9ca3af' }}>Built for growth.</span>
      </div>
    </footer>
  );
}

const s = {
  footer:     { background: '#111827', color: '#d1d5db', padding: '56px 24px 0' },
  inner:      { maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 48, flexWrap: 'wrap', paddingBottom: 48, borderBottom: '1px solid #1f2937' },
  brand:      { flex: '0 0 260px' },
  logo:       { fontSize: 22, fontWeight: 700, color: '#fff', textDecoration: 'none', display: 'block', marginBottom: 12 },
  tagline:    { fontSize: 14, color: '#9ca3af', lineHeight: 1.7, marginBottom: 20 },
  socials:    { display: 'flex', gap: 10 },
  socialIcon: { width: 34, height: 34, background: '#1f2937', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer', color: '#d1d5db' },
  col:        { display: 'flex', flexDirection: 'column', gap: 10, minWidth: 140 },
  colTitle:   { fontSize: 13, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 },
  link:       { fontSize: 14, color: '#9ca3af', textDecoration: 'none' },
  bottom:     { maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', padding: '20px 0', fontSize: 13 },
};
