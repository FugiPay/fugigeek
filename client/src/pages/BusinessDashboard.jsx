import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import listingsAPI from '../api/listings';
import ordersAPI   from '../api/orders';
import { useAuth } from '../hooks/useAuth';
import Sidebar     from '../components/common/Sidebar';

const statusColor = s => ({
  open:            '#16a34a',
  'in-progress':   '#2563eb',
  completed:       '#6b7280',
  cancelled:       '#dc2626',
  pending_payment: '#d97706',
  submitted:       '#7c3aed',
}[s] || '#6b7280');

const statusBg = s => ({
  open:            '#dcfce7',
  'in-progress':   '#dbeafe',
  completed:       '#f3f4f6',
  cancelled:       '#fee2e2',
  pending_payment: '#fef3c7',
  submitted:       '#ede9fe',
}[s] || '#f3f4f6');

export default function BusinessDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: tasksData  } = useQuery('myTasks',  () => listingsAPI.getMyTasks().then(r => r.data));
  const { data: ordersData } = useQuery('myOrders', () => ordersAPI.getAll().then(r => r.data));

  const tasks  = tasksData?.tasks  || [];
  const orders = ordersData?.orders || [];

  const openTasks      = tasks.filter(t  => t.status === 'open').length;
  const activeTasks    = tasks.filter(t  => t.status === 'in-progress').length;
  const activeOrders   = orders.filter(o => ['active','submitted'].includes(o.status)).length;
  const completedTasks = tasks.filter(t  => t.status === 'completed').length;

  return (
    <div style={s.page}>
      <Sidebar />

      {/* Main */}
      <main style={s.main}>
        {/* Top bar */}
        <div style={s.topBar}>
          <div>
            <h1 style={s.greeting}>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p style={{ fontSize: 14, color: '#6b7280' }}>{user?.businessProfile?.companyName}</p>
          </div>
          <Link to="/tasks/new" style={s.postBtn}>+ Post a Task</Link>
        </div>

        {/* Stats */}
        <div style={s.statsRow}>
          {[
            ['Open tasks',       openTasks,      '#16a34a'],
            ['In progress',      activeTasks,    '#2563eb'],
            ['Active orders',    activeOrders,   '#7c3aed'],
            ['Completed',        completedTasks, '#6b7280'],
          ].map(([label, val, color]) => (
            <div key={label} style={s.statCard}>
              <div style={{ ...s.statNum, color }}>{val}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          ))}
        </div>

        {/* My tasks */}
        <section id="tasks" style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>My tasks</h2>
            <Link to="/tasks/new" style={s.sectionAction}>+ New task</Link>
          </div>

          {tasks.length === 0 ? (
            <div style={s.empty}>
              <p>You haven't posted any tasks yet.</p>
              <Link to="/tasks/new" style={s.emptyBtn}>Post your first task</Link>
            </div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Title','Category','Budget','Proposals','Status','Actions'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task._id} style={s.tr}>
                      <td style={s.td}>
                        <Link to={`/listings/${task._id}`} style={{ color: '#2563eb', fontWeight: 500, fontSize: 14 }}>
                          {task.title.length > 50 ? task.title.slice(0, 50) + '…' : task.title}
                        </Link>
                      </td>
                      <td style={s.td}><span style={s.catBadge}>{task.category}</span></td>
                      <td style={s.td}>{task.budgetMax ? `$${task.budgetMax}` : '—'}</td>
                      <td style={s.td}>{task.proposalCount}</td>
                      <td style={s.td}>
                        <span style={{ ...s.statusBadge, background: statusBg(task.status), color: statusColor(task.status) }}>
                          {task.status}
                        </span>
                      </td>
                      <td style={s.td}>
                        <Link to={`/listings/${task._id}/proposals`} style={s.actionLink}>View proposals</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Active orders */}
        <section id="orders" style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>Active orders</h2>
          </div>

          {orders.length === 0 ? (
            <div style={s.empty}><p>No orders yet. Accept a proposal to start an order.</p></div>
          ) : (
            <div style={s.orderGrid}>
              {orders.map(order => (
                <div key={order._id} style={s.orderCard}>
                  <div style={s.orderTop}>
                    <span style={{ ...s.statusBadge, background: statusBg(order.status), color: statusColor(order.status) }}>
                      {order.status.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>${order.amount}</span>
                  </div>
                  <div style={s.orderTitle}>{order.task?.title}</div>
                  <div style={s.orderMeta}>
                    Professional: <strong>{order.professional?.name}</strong>
                  </div>
                  {order.deadline && (
                    <div style={s.orderMeta}>Due: {new Date(order.deadline).toLocaleDateString()}</div>
                  )}
                  <div style={s.orderActions}>
                    <Link to={`/orders/${order._id}`} style={s.orderBtn}>View order</Link>
                    {order.status === 'submitted' && (
                      <button style={{ ...s.orderBtn, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer' }}
                        onClick={() => navigate(`/orders/${order._id}`)}>
                        Review & approve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const s = {
  page:         { display: 'flex', minHeight: '100vh', background: '#f9fafb' },
  sidebar:      { width: 220, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sideHeader:   { padding: '20px 16px', borderBottom: '1px solid #e5e7eb' },
  logo:         { fontSize: 18, fontWeight: 700, color: '#2563eb', marginBottom: 6 },
  roleTag:      { fontSize: 12, background: '#eff6ff', color: '#2563eb', display: 'inline-block', padding: '3px 8px', borderRadius: 6 },
  sideNav:      { flex: 1, padding: '12px 8px' },
  sideLink:     { display: 'block', padding: '10px 12px', borderRadius: 8, fontSize: 14, color: '#374151', marginBottom: 2 },
  logoutBtn:    { margin: 12, padding: '10px 12px', background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, color: '#6b7280', cursor: 'pointer', textAlign: 'left' },
  main:         { flex: 1, padding: 28, overflow: 'auto' },
  topBar:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting:     { fontSize: 22, fontWeight: 700, marginBottom: 2 },
  postBtn:      { background: '#2563eb', color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500 },
  statsRow:     { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
  statCard:     { background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '18px 20px' },
  statNum:      { fontSize: 28, fontWeight: 700, marginBottom: 4 },
  statLabel:    { fontSize: 13, color: '#6b7280' },
  section:      { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 20 },
  sectionHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 600 },
  sectionAction:{ fontSize: 13, color: '#2563eb', fontWeight: 500 },
  empty:        { textAlign: 'center', padding: '32px 0', color: '#6b7280' },
  emptyBtn:     { display: 'inline-block', marginTop: 12, padding: '10px 20px', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 14 },
  tableWrap:    { overflowX: 'auto' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  th:           { padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' },
  tr:           { borderBottom: '1px solid #f9fafb' },
  td:           { padding: '12px', fontSize: 13, verticalAlign: 'middle' },
  catBadge:     { background: '#f3f4f6', color: '#4b5563', fontSize: 11, padding: '3px 8px', borderRadius: 12 },
  statusBadge:  { fontSize: 11, padding: '3px 8px', borderRadius: 12, fontWeight: 500 },
  actionLink:   { color: '#2563eb', fontSize: 13, fontWeight: 500 },
  orderGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  orderCard:    { border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 },
  orderTop:     { display: 'flex', justifyContent: 'space-between', marginBottom: 10 },
  orderTitle:   { fontWeight: 600, fontSize: 14, marginBottom: 8 },
  orderMeta:    { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  orderActions: { display: 'flex', gap: 8, marginTop: 12 },
  orderBtn:     { padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#374151', background: '#fff' },
};
