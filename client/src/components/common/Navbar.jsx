import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import messagesAPI from '../../api/messages';
import NotificationBell from './NotificationBell';
import MessagesDropdown from './MessagesDropdown';
import Avatar from './Avatar';

export default function Navbar() {
  const { user, isAuthenticated, isBusiness, isIndividual, isProfessional, isAdmin, isManager, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    messagesAPI.getUnreadCount()
      .then(r => setUnread(r.data.unread))
      .catch(() => { });
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = path => location.pathname === path;

  const dashboardPath =
    isAdmin || isManager ? '/dashboard/admin'
      : isBusiness || isIndividual ? '/dashboard/business'
        : '/dashboard/professional';

  const displayName =
    isBusiness ? user?.businessProfile?.companyName || user?.name
      : user?.name;

  const roleLabel =
    isAdmin ? '⚙️ Admin'
      : isManager ? '🛡 Manager'
        : isBusiness ? '🏢 Business'
          : isIndividual ? '👤 Individual'
            : '💼 Professional';

  const canPostTask = isAuthenticated && !isAdmin && !isManager;

  return (
    <header style={s.header}>
      <div style={s.inner}>
        <Link to="/" style={s.logo}>
          <img src="/fugigeek-logo.svg" alt="Fugigeek" height="36" />
        </Link>

        <nav style={s.navLinks}>
          <Link to="/listings"
            style={{ ...s.navLink, ...(isActive('/listings') ? s.navLinkActive : {}) }}>
            Browse Tasks
          </Link>
          <Link to="/users/professionals"
            style={{ ...s.navLink, ...(isActive('/users/professionals') ? s.navLinkActive : {}) }}>
            Find Professionals
          </Link>
          {canPostTask && (
            <Link to="/tasks/new"
              style={{ ...s.navLink, ...(isActive('/tasks/new') ? s.navLinkActive : {}) }}>
              Post a Task
            </Link>
          )}
        </nav>

        <div style={s.right}>
          {!isAuthenticated ? (
            <>
              <Link to="/login" style={s.loginBtn}>Sign in</Link>
              <Link to="/register" style={s.registerBtn}>Get Started</Link>
            </>
          ) : (
            <>
              {/* Messages dropdown — replaces direct link */}
              <MessagesDropdown unread={unread} />

              {/* Notifications bell */}
              <NotificationBell />

              {/* User dropdown */}
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button style={s.avatarBtn} onClick={() => setMenuOpen(p => !p)}>
                  <Avatar src={user?.avatar} name={user?.name || ''} size={28} />
                  <span style={s.avatarName}>{displayName?.split(' ')[0]}</span>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>▼</span>
                </button>

                {menuOpen && (
                  <div style={s.dropdown}>
                    <div style={s.dropHeader}>
                      <Avatar src={user?.avatar} name={user?.name || ''} size={36} />
                      <div>
                        <div style={s.dropName}>{user?.name}</div>
                        <div style={s.dropRole}>{roleLabel}</div>
                      </div>
                    </div>
                    <div style={s.dropDivider} />
                    <Link to={dashboardPath} style={s.dropItem} onClick={() => setMenuOpen(false)}>📊 Dashboard</Link>
                    <Link to="/messages" style={s.dropItem} onClick={() => setMenuOpen(false)}>
                      💬 Messages {unread > 0 && <span style={s.dropBadge}>{unread}</span>}
                    </Link>
                    <Link to="/profile/view" style={s.dropItem} onClick={() => setMenuOpen(false)}>👁 View Profile</Link>
                    <Link to="/profile/edit" style={s.dropItem} onClick={() => setMenuOpen(false)}>✏️ Edit Profile</Link>
                    <Link to="/account/settings" style={s.dropItem} onClick={() => setMenuOpen(false)}>⚙️ Account Settings</Link>
                    {canPostTask && (
                      <Link to="/tasks/new" style={s.dropItem} onClick={() => setMenuOpen(false)}>➕ Post a Task</Link>
                    )}
                    <div style={s.dropDivider} />
                    <button style={s.dropLogout} onClick={() => { setMenuOpen(false); logout(); }}>
                      🚪 Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          <button style={s.hamburger} onClick={() => setMobileOpen(p => !p)}>
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div style={s.mobileMenu}>
          <Link to="/listings" style={s.mobileLink}>Browse Tasks</Link>
          <Link to="/users/professionals" style={s.mobileLink}>Find Professionals</Link>
          {isAuthenticated && (
            <>
              <Link to={dashboardPath} style={s.mobileLink}>Dashboard</Link>
              <Link to="/messages" style={s.mobileLink}>
                Messages {unread > 0 && `(${unread})`}
              </Link>
              <Link to="/profile/view" style={s.mobileLink}>View Profile</Link>
              <Link to="/profile/edit" style={s.mobileLink}>Edit Profile</Link>
              {canPostTask && <Link to="/tasks/new" style={s.mobileLink}>Post a Task</Link>}
              <button style={s.mobileLogout} onClick={logout}>Sign out</button>
            </>
          )}
          {!isAuthenticated && (
            <>
              <Link to="/login" style={s.mobileLink}>Sign in</Link>
              <Link to="/register" style={{ ...s.mobileLink, color: '#2563eb', fontWeight: 600 }}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

const s = {
  header: { background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 200 },
  inner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 64, gap: 32 },
  logo: { fontSize: 20, fontWeight: 800, color: '#2563eb', textDecoration: 'none', flexShrink: 0 },
  navLinks: { display: 'flex', alignItems: 'center', gap: 4, flex: 1 },
  navLink: { fontSize: 14, color: '#374151', padding: '6px 12px', borderRadius: 8, textDecoration: 'none' },
  navLinkActive: { color: '#2563eb', background: '#eff6ff', fontWeight: 500 },
  right: { display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' },
  loginBtn: { fontSize: 14, color: '#374151', padding: '8px 14px', textDecoration: 'none' },
  registerBtn: { fontSize: 14, background: '#2563eb', color: '#fff', padding: '8px 16px', borderRadius: 8, fontWeight: 500, textDecoration: 'none' },
  avatarBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', cursor: 'pointer', fontSize: 14 },
  avatarName: { fontSize: 13, fontWeight: 500, color: '#374151', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  dropdown: { position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.1)', minWidth: 220, zIndex: 300, overflow: 'hidden' },
  dropHeader: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px' },
  dropName: { fontSize: 14, fontWeight: 600 },
  dropRole: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  dropDivider: { height: 1, background: '#f3f4f6', margin: '4px 0' },
  dropItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', fontSize: 14, color: '#374151', textDecoration: 'none', cursor: 'pointer' },
  dropBadge: { background: '#dc2626', color: '#fff', fontSize: 10, borderRadius: 10, padding: '1px 6px', fontWeight: 700 },
  dropLogout: { width: '100%', padding: '10px 16px', background: 'none', border: 'none', fontSize: 14, color: '#dc2626', cursor: 'pointer', textAlign: 'left' },
  hamburger: { display: 'none', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 8 },
  mobileMenu: { display: 'flex', flexDirection: 'column', background: '#fff', borderTop: '1px solid #f3f4f6', padding: '8px 0' },
  mobileLink: { padding: '12px 24px', fontSize: 15, color: '#374151', textDecoration: 'none', borderBottom: '1px solid #f9fafb' },
  mobileLogout: { padding: '12px 24px', fontSize: 15, color: '#dc2626', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', width: '100%' },
};
