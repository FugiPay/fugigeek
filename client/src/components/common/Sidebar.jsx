import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Avatar from './Avatar';

const NAV_ITEMS = {
  individual: [
    { icon: '📊', label: 'Overview', path: '/dashboard/business' },
    { icon: '📋', label: 'My Tasks', path: '/dashboard/business#tasks' },
    { icon: '📦', label: 'Orders', path: '/dashboard/business#orders' },
    { icon: '➕', label: 'Post a Task', path: '/tasks/new' },
    { icon: '🔍', label: 'Find Professionals', path: '/users/professionals' },
    { icon: '💬', label: 'Messages', path: '/messages' },
    { icon: '👁', label: 'View Profile', path: '/profile/view' },
    { icon: '✏️', label: 'Edit Profile', path: '/profile/edit' },
    { icon: '⚙️', label: 'Account Settings', path: '/account/settings' },
  ],
  business: [
    { icon: '📊', label: 'Overview', path: '/dashboard/business' },
    { icon: '📋', label: 'My Tasks', path: '/dashboard/business#tasks' },
    { icon: '📦', label: 'Orders', path: '/dashboard/business#orders' },
    { icon: '➕', label: 'Post a Task', path: '/tasks/new' },
    { icon: '🔍', label: 'Find Professionals', path: '/users/professionals' },
    { icon: '💬', label: 'Messages', path: '/messages' },
    { icon: '👁', label: 'View Profile', path: '/profile/view' },
    { icon: '✏️', label: 'Edit Profile', path: '/profile/edit' },
    { icon: '⚙️', label: 'Account Settings', path: '/account/settings' },
  ],
  professional: [
    { icon: '📊', label: 'Overview', path: '/dashboard/professional' },
    { icon: '📦', label: 'My Orders', path: '/dashboard/professional#orders' },
    { icon: '🔍', label: 'Browse Tasks', path: '/listings' },
    { icon: '➕', label: 'Post a Task', path: '/tasks/new' },
    { icon: '💬', label: 'Messages', path: '/messages' },
    { icon: '👁', label: 'View Profile', path: '/profile/view' },
    { icon: '✏️', label: 'Edit Profile', path: '/profile/edit' },
    { icon: '⚙️', label: 'Account Settings', path: '/account/settings' },
  ],
  admin: [
    { icon: '📊', label: 'Overview', path: '/dashboard/admin' },
    { icon: '👥', label: 'Users', path: '/dashboard/admin#users' },
    { icon: '📋', label: 'Tasks', path: '/dashboard/admin#tasks' },
    { icon: '📦', label: 'Orders', path: '/dashboard/admin#orders' },
    { icon: '🏷', label: 'Categories', path: '/dashboard/admin#categories' },
    { icon: '💬', label: 'Messages', path: '/messages' },
    { icon: '👁', label: 'View Profile', path: '/profile/view' },
    { icon: '✏️', label: 'Edit Profile', path: '/profile/edit' },
    { icon: '⚙️', label: 'Account Settings', path: '/account/settings' },
  ],
};

export default function Sidebar() {
  const { user, logout, isBusiness, isIndividual, isProfessional, isAdmin, isManager } = useAuth();
  const location = useLocation();

  const role = isAdmin ? 'admin' : isManager ? 'manager' : isBusiness ? 'business' : isIndividual ? 'individual' : 'professional';
  const items = NAV_ITEMS[role] || NAV_ITEMS['admin']; // managers use admin nav

  const roleTag = {
    individual: { label: '👤 Individual', bg: '#f3f4f6', color: '#374151' },
    business: { label: '🏢 Business', bg: '#eff6ff', color: '#2563eb' },
    professional: { label: '💼 Professional', bg: '#f0fdf4', color: '#15803d' },
    manager: { label: '🛡 Manager', bg: '#fef3c7', color: '#b45309' },
    admin: { label: '⚙️ Admin', bg: '#fee2e2', color: '#b91c1c' },
  }[role];

  const isActive = path => {
    const base = path.split('#')[0];
    const hash = path.includes('#') ? '#' + path.split('#')[1] : '';
    return location.pathname === base && (!hash || location.hash === hash);
  };

  return (
    <aside style={s.sidebar}>
      {/* Brand + role */}
      <div style={s.header}>
        <Link to="/" style={s.logo}>
          <img src="/fugigeek-logo.svg" alt="Fugigeek" height="28" />
        </Link>
        <span style={{ ...s.roleTag, background: roleTag.bg, color: roleTag.color }}>
          {roleTag.label}
        </span>
      </div>

      {/* User info */}
      <div style={s.userInfo}>
        <Avatar src={user?.avatar} name={user?.name || ''} size={36} />
        <div style={s.userText}>
          <div style={s.userName}>{user?.name}</div>
          <div style={s.userSub}>
            {isBusiness
              ? user?.businessProfile?.companyName
              : isIndividual
                ? user?.individualProfile?.occupation || user?.email
                : user?.professionalProfile?.headline || user?.email}
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={s.nav}>
        {items.map(item => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              style={{ ...s.navItem, ...(active ? s.navItemActive : {}) }}
            >
              {/* Active indicator bar on left edge */}
              <span style={{ ...s.activeBar, opacity: active ? 1 : 0 }} />
              <span style={{
                ...s.navIcon,
                background: active ? '#2563eb' : '#f3f4f6',
                color: active ? '#fff' : '#6b7280',
              }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {active && <span style={s.activeDot} />}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <button style={s.logoutBtn} onClick={logout}>
        🚪 Sign out
      </button>
    </aside>
  );
}

const s = {
  sidebar: { width: 240, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0, minHeight: '100vh' },
  header: { padding: '20px 16px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 6 },
  logo: { fontSize: 20, fontWeight: 700, color: '#2563eb', textDecoration: 'none' },
  roleTag: { fontSize: 12, display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontWeight: 500, alignSelf: 'flex-start' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid #f3f4f6' },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 },
  userText: { minWidth: 0 },
  userName: { fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userSub: { fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 },
  nav: { flex: 1, padding: '10px 8px' },
  navItem: {
    position: 'relative',
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px 9px 8px',
    borderRadius: 10, fontSize: 14,
    color: '#6b7280', textDecoration: 'none',
    marginBottom: 2,
    transition: 'all .15s ease',
  },
  navItemActive: {
    background: 'linear-gradient(90deg, #eff6ff 0%, #f8faff 100%)',
    color: '#1d4ed8',
    fontWeight: 600,
    boxShadow: '0 1px 3px rgba(37,99,235,.08)',
  },
  activeBar: {
    position: 'absolute', left: 0, top: '20%', bottom: '20%',
    width: 3, borderRadius: 4,
    background: '#2563eb',
    transition: 'opacity .15s',
  },
  navIcon: {
    width: 30, height: 30, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 15, flexShrink: 0,
    transition: 'all .15s ease',
  },
  activeDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#2563eb', flexShrink: 0,
  },
  logoutBtn: { margin: '8px 12px 20px', padding: '10px 12px', background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#6b7280', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 },
};
