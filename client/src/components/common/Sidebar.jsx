import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = {
  business: [
    { icon: '📊', label: 'Overview',        path: '/dashboard/business' },
    { icon: '📋', label: 'My Tasks',        path: '/dashboard/business#tasks' },
    { icon: '📦', label: 'Orders',          path: '/dashboard/business#orders' },
    { icon: '➕', label: 'Post a Task',     path: '/tasks/new' },
    { icon: '🔍', label: 'Find Professionals', path: '/users/professionals' },
    { icon: '💬', label: 'Messages',        path: '/messages' },
    { icon: '👤', label: 'Edit Profile',    path: '/profile/edit' },
  ],
  professional: [
    { icon: '📊', label: 'Overview',        path: '/dashboard/professional' },
    { icon: '📦', label: 'My Orders',       path: '/dashboard/professional#orders' },
    { icon: '🔍', label: 'Browse Tasks',    path: '/listings' },
    { icon: '💬', label: 'Messages',        path: '/messages' },
    { icon: '👤', label: 'Edit Profile',    path: '/profile/edit' },
  ],
  admin: [
    { icon: '📊', label: 'Overview',        path: '/dashboard/admin' },
    { icon: '👥', label: 'Users',           path: '/admin/users' },
    { icon: '📋', label: 'Tasks',           path: '/listings' },
    { icon: '💬', label: 'Messages',        path: '/messages' },
  ],
};

export default function Sidebar() {
  const { user, logout, isBusiness, isProfessional, isAdmin } = useAuth();
  const location = useLocation();

  const role  = isAdmin ? 'admin' : isBusiness ? 'business' : 'professional';
  const items = NAV_ITEMS[role] || [];

  const roleTag = {
    business:     { label: '🏢 Business',     bg: '#eff6ff', color: '#2563eb' },
    professional: { label: '💼 Professional', bg: '#f0fdf4', color: '#15803d' },
    admin:        { label: '⚙️ Admin',         bg: '#fef3c7', color: '#b45309' },
  }[role];

  const isActive = path => location.pathname === path.split('#')[0];

  return (
    <aside style={s.sidebar}>
      {/* Brand + role */}
      <div style={s.header}>
        <Link to="/" style={s.logo}>Fugigeek</Link>
        <span style={{ ...s.roleTag, background: roleTag.bg, color: roleTag.color }}>
          {roleTag.label}
        </span>
      </div>

      {/* User info */}
      <div style={s.userInfo}>
        <div style={s.avatar}>{user?.name?.[0]}</div>
        <div style={s.userText}>
          <div style={s.userName}>{user?.name}</div>
          <div style={s.userSub}>
            {isBusiness
              ? user?.businessProfile?.companyName
              : user?.professionalProfile?.headline || user?.email}
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={s.nav}>
        {items.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...s.navItem,
              ...(isActive(item.path) ? s.navItemActive : {}),
            }}
          >
            <span style={s.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Sign out */}
      <button style={s.logoutBtn} onClick={logout}>
        🚪 Sign out
      </button>
    </aside>
  );
}

const s = {
  sidebar:      { width: 230, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0, minHeight: '100vh' },
  header:       { padding: '20px 16px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 6 },
  logo:         { fontSize: 20, fontWeight: 700, color: '#2563eb', textDecoration: 'none' },
  roleTag:      { fontSize: 12, display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontWeight: 500, alignSelf: 'flex-start' },
  userInfo:     { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid #f3f4f6' },
  avatar:       { width: 36, height: 36, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 },
  userText:     { minWidth: 0 },
  userName:     { fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userSub:      { fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 },
  nav:          { flex: 1, padding: '10px 8px' },
  navItem:      { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, fontSize: 14, color: '#374151', textDecoration: 'none', marginBottom: 2, transition: 'background .1s' },
  navItemActive:{ background: '#eff6ff', color: '#2563eb', fontWeight: 600 },
  navIcon:      { fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 },
  logoutBtn:    { margin: '8px 12px 20px', padding: '10px 12px', background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#6b7280', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 },
};
