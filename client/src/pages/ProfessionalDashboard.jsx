import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import ordersAPI   from '../api/orders';
import listingsAPI from '../api/listings';
import { useAuth } from '../hooks/useAuth';

const statusColor = s => ({
  open: '#16a34a', 'in-progress': '#2563eb', completed: '#6b7280',
  active: '#2563eb', submitted: '#7c3aed', pending_payment: '#d97706',
}[s] || '#6b7280');
const statusBg = s => ({
  open: '#dcfce7', 'in-progress': '#dbeafe', completed: '#f3f4f6',
  active: '#dbeafe', submitted: '#ede9fe', pending_payment: '#fef3c7',
}[s] || '#f3f4f6');

export default function ProfessionalDashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const qc               = useQueryClient();

  const { data: ordersData } = useQuery('myOrders', () => ordersAPI.getAll().then(r => r.data));
  const orders = ordersData?.orders || [];

  const activeOrders    = orders.filter(o => o.status === 'active').length;
  const submittedOrders = orders.filter(o => o.status === 'submitted').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalEarned     = user?.stats?.totalEarnings || 0;

  const submitMutation = useMutation(
    ({ id, data }) => ordersAPI.submit(id, data),
    { onSuccess: () => qc.invalidateQueries('myOrders') }
  );

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sideHeader}>
          <div style={s.logo}>Fugigeek</div>
          <div style={s.roleTag}>💼 Professional</div>
        </div>
        <nav style={s.sideNav}>
          {[
            ['📊', 'Overview',      '#'],
            ['📋', 'My Orders',     '#orders'],
            ['🔍', 'Browse Tasks',  '/listings'],
            ['👤', 'My Profile',    '#profile'],
          ].map(([icon, label, href]) => (
            <a key={label} href={href} style={s.sideLink}>{icon} {label}</a>
          ))}
        </nav>
        <button style={s.logoutBtn} onClick={logout}>Sign out</button>
      </aside>

      {/* Main */}
      <main style={s.main}>
        {/* Top bar */}
        <div style={s.topBar}>
          <div>
            <h1 style={s.greeting}>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p style={{ fontSize: 14, color: '#6b7280' }}>{user?.professionalProfile?.headline}</p>
          </div>
          <Link to="/listings" style={s.browseBtn}>Browse open tasks</Link>
        </div>

        {/* Stats */}
        <div style={s.statsRow}>
          {[
            ['Active orders',    activeOrders,    '#2563eb'],
            ['Submitted',        submittedOrders, '#7c3aed'],
            ['Completed',        completedOrders, '#16a34a'],
            ['Total earned',     `$${totalEarned.toLocaleString()}`, '#d97706'],
          ].map(([label, val, color]) => (
            <div key={label} style={s.statCard}>
              <div style={{ ...s.statNum, color }}>{val}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          ))}
        </div>

        {/* Profile completeness nudge */}
        {!user?.professionalProfile?.bio && (
          <div style={s.nudge}>
            <span>💡 Complete your profile to get more proposals accepted.</span>
            <Link to="/profile/edit" style={s.nudgeBtn}>Complete profile</Link>
          </div>
        )}

        {/* Skills */}
        {user?.professionalProfile?.skills?.length > 0 && (
          <div style={s.skillsBar}>
            {user.professionalProfile.skills.map(sk => (
              <span key={sk} style={s.skill}>{sk}</span>
            ))}
          </div>
        )}

        {/* Orders */}
        <section id="orders" style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>My orders</h2>
            <Link to="/listings" style={{ fontSize: 13, color: '#2563eb' }}>Find more tasks →</Link>
          </div>

          {orders.length === 0 ? (
            <div style={s.empty}>
              <p style={{ marginBottom: 12 }}>You don't have any orders yet.</p>
              <Link to="/listings" style={s.emptyBtn}>Browse open tasks</Link>
            </div>
          ) : (
            <div style={s.orderGrid}>
              {orders.map(order => (
                <div key={order._id} style={s.orderCard}>
                  <div style={s.orderTop}>
                    <span style={{ ...s.statusBadge, background: statusBg(order.status), color: statusColor(order.status) }}>
                      {order.status.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#16a34a' }}>${order.amount}</span>
                  </div>

                  <div style={s.orderTitle}>{order.task?.title}</div>
                  <div style={s.orderMeta}>{order.task?.category}</div>
                  <div style={s.orderMeta}>
                    Client: <strong>{order.business?.businessProfile?.companyName || order.business?.name}</strong>
                  </div>
                  {order.deadline && (
                    <div style={{ ...s.orderMeta, color: new Date(order.deadline) < new Date() ? '#dc2626' : '#6b7280' }}>
                      Due: {new Date(order.deadline).toLocaleDateString()}
                    </div>
                  )}

                  <div style={s.orderActions}>
                    <Link to={`/orders/${order._id}`} style={s.orderBtn}>View details</Link>
                    {order.status === 'active' && (
                      <button style={{ ...s.orderBtn, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}
                        onClick={() => navigate(`/orders/${order._id}`)}>
                        Submit work
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Rating summary */}
        {user?.stats?.reviewCount > 0 && (
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Your reputation</h2>
            <div style={s.repRow}>
              <div style={s.repStat}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#d97706' }}>⭐ {user.stats.rating}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Average rating</div>
              </div>
              <div style={s.repStat}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#2563eb' }}>{user.stats.reviewCount}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Reviews received</div>
              </div>
              <div style={s.repStat}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#16a34a' }}>{user.stats.completedTasks}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Tasks completed</div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const s = {
  page:         { display: 'flex', minHeight: '100vh', background: '#f9fafb' },
  sidebar:      { width: 220, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sideHeader:   { padding: '20px 16px', borderBottom: '1px solid #e5e7eb' },
  logo:         { fontSize: 18, fontWeight: 700, color: '#2563eb', marginBottom: 6 },
  roleTag:      { fontSize: 12, background: '#f0fdf4', color: '#15803d', display: 'inline-block', padding: '3px 8px', borderRadius: 6 },
  sideNav:      { flex: 1, padding: '12px 8px' },
  sideLink:     { display: 'block', padding: '10px 12px', borderRadius: 8, fontSize: 14, color: '#374151', marginBottom: 2 },
  logoutBtn:    { margin: 12, padding: '10px 12px', background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, color: '#6b7280', cursor: 'pointer', textAlign: 'left' },
  main:         { flex: 1, padding: 28, overflow: 'auto' },
  topBar:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting:     { fontSize: 22, fontWeight: 700, marginBottom: 2 },
  browseBtn:    { background: '#2563eb', color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500 },
  statsRow:     { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 },
  statCard:     { background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '18px 20px' },
  statNum:      { fontSize: 26, fontWeight: 700, marginBottom: 4 },
  statLabel:    { fontSize: 13, color: '#6b7280' },
  nudge:        { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, marginBottom: 20 },
  nudgeBtn:     { background: '#f59e0b', color: '#fff', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500 },
  skillsBar:    { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  skill:        { padding: '5px 12px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, fontSize: 12 },
  section:      { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 20 },
  sectionHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 600 },
  empty:        { textAlign: 'center', padding: '32px 0', color: '#6b7280' },
  emptyBtn:     { display: 'inline-block', padding: '10px 20px', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 14 },
  orderGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  orderCard:    { border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 },
  orderTop:     { display: 'flex', justifyContent: 'space-between', marginBottom: 10 },
  orderTitle:   { fontWeight: 600, fontSize: 14, marginBottom: 6 },
  orderMeta:    { fontSize: 13, color: '#6b7280', marginBottom: 3 },
  statusBadge:  { fontSize: 11, padding: '3px 8px', borderRadius: 12, fontWeight: 500 },
  orderActions: { display: 'flex', gap: 8, marginTop: 12 },
  orderBtn:     { padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#374151', background: '#fff' },
  repRow:       { display: 'flex', gap: 40, marginTop: 12 },
  repStat:      { textAlign: 'center' },
};
