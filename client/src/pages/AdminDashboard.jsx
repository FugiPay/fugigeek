import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link, useLocation } from 'react-router-dom';
import adminAPI from '../api/admin';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/common/Sidebar';

const TABS = ['Overview', 'Users', 'Tasks', 'Orders', 'Categories'];

const HASH_TO_TAB = {
  '#users':      'Users',
  '#tasks':      'Tasks',
  '#orders':     'Orders',
  '#categories': 'Categories',
};

export default function AdminDashboard() {
  const { user, isAdmin, isManager } = useAuth();
  const qc       = useQueryClient();
  const location = useLocation();

  // Sync active tab to URL hash so sidebar links work
  const [tab, setTab] = useState(HASH_TO_TAB[location.hash] || 'Overview');

  useEffect(() => {
    setTab(HASH_TO_TAB[location.hash] || 'Overview');
  }, [location.hash]);

  const [userSearch,   setUserSearch]   = useState('');
  const [userRole,     setUserRole]     = useState('');
  const [taskStatus,   setTaskStatus]   = useState('');
  const [orderStatus,  setOrderStatus]  = useState('disputed');
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [selectedUser, setSelectedUser] = useState(null); // user detail modal
  const [newAdmin,     setNewAdmin]     = useState({ name: '', email: '', password: '', role: 'manager' });
  const [adminMsg,     setAdminMsg]     = useState('');

  const { data: statsData  } = useQuery('adminStats',  () => adminAPI.getStats().then(r => r.data.stats), { enabled: tab === 'Overview' });
  const { data: usersData  } = useQuery(['adminUsers', userSearch, userRole], () => adminAPI.getUsers({ search: userSearch, role: userRole || undefined }).then(r => r.data), { enabled: tab === 'Users' });
  const { data: tasksData  } = useQuery(['adminTasks', taskStatus], () => adminAPI.getTasks({ status: taskStatus || undefined }).then(r => r.data), { enabled: tab === 'Tasks' });
  const { data: ordersData } = useQuery(['adminOrders', orderStatus], () => adminAPI.getOrders({ status: orderStatus || undefined }).then(r => r.data), { enabled: tab === 'Orders' });
  const { data: catsData   } = useQuery('adminCats', () => adminAPI.getCategories().then(r => r.data), { enabled: tab === 'Categories' });

  const updateUserMutation = useMutation(
    ({ id, data }) => adminAPI.updateUser(id, data),
    { onSuccess: () => qc.invalidateQueries('adminUsers') }
  );
  const deleteUserMutation = useMutation(
    id => adminAPI.deleteUser(id),
    { onSuccess: () => qc.invalidateQueries('adminUsers') }
  );
  const deleteTaskMutation = useMutation(
    id => adminAPI.deleteTask(id),
    { onSuccess: () => qc.invalidateQueries('adminTasks') }
  );
  const resolveMutation = useMutation(
    ({ id, data }) => adminAPI.resolveOrder(id, data),
    { onSuccess: () => { qc.invalidateQueries('adminOrders'); setResolveModal(null); setResolveNotes(''); } }
  );
  const createAdminMutation = useMutation(
    data => adminAPI.createAdmin(data),
    { onSuccess: () => { setAdminMsg('Account created successfully.'); setNewAdmin({ name: '', email: '', password: '', role: 'manager' }); } }
  );

  const s = styles;

  // Tab click also updates the hash
  const handleTabClick = t => {
    const tabToHash = { Users: '#users', Tasks: '#tasks', Orders: '#orders', Categories: '#categories' };
    window.location.hash = tabToHash[t] || '';
    setTab(t);
  };

  return (
    <div style={s.page}>
      <Sidebar />
      <main style={s.main}>
        {/* Top bar */}
        <div style={s.topBar}>
          <div>
            <h1 style={s.heading}>Admin Dashboard</h1>
            <p style={{ fontSize: 14, color: '#6b7280' }}>Welcome, {user?.name}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {TABS.map(t => (
            <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
              onClick={() => handleTabClick(t)}>{t}</button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === 'Overview' && statsData && (
          <div>
            <div style={s.statGrid}>
              {[
                ['Total Users',     statsData.users.total,         '#2563eb'],
                ['Professionals',   statsData.users.professionals, '#16a34a'],
                ['Businesses',      statsData.users.businesses,    '#7c3aed'],
                ['Individuals',     statsData.users.individuals,   '#d97706'],
                ['Total Tasks',     statsData.tasks.total,         '#0891b2'],
                ['Open Tasks',      statsData.tasks.open,          '#16a34a'],
                ['Completed Tasks', statsData.tasks.completed,     '#6b7280'],
                ['Active Orders',   statsData.orders.active,       '#2563eb'],
                ['Disputed Orders', statsData.orders.disputed,     '#dc2626'],
                ['Reviews',         statsData.reviews.total,       '#d97706'],
                ['Avg Rating',      `${statsData.reviews.avgRating}/5`, '#f59e0b'],
              ].map(([label, val, color]) => (
                <div key={label} style={s.statCard}>
                  <div style={{ ...s.statNum, color }}>{val}</div>
                  <div style={s.statLabel}>{label}</div>
                </div>
              ))}
            </div>

            {/* Create staff account — admin only */}
            {isAdmin && (
              <div style={s.card}>
                <h2 style={s.cardTitle}>Create Staff Account</h2>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
                  Managers have limited access — they cannot create accounts or change user roles.
                </p>
                {adminMsg && <div style={s.successMsg}>{adminMsg}</div>}
                <div style={s.formRow}>
                  <input style={s.input} placeholder="Full name"
                    value={newAdmin.name} onChange={e => setNewAdmin(p => ({ ...p, name: e.target.value }))} />
                  <input style={s.input} placeholder="Email address" type="email"
                    value={newAdmin.email} onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))} />
                  <input style={s.input} placeholder="Password" type="password"
                    value={newAdmin.password} onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))} />
                  <select style={s.input} value={newAdmin.role}
                    onChange={e => setNewAdmin(p => ({ ...p, role: e.target.value }))}>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button style={s.btn}
                    onClick={() => createAdminMutation.mutate(newAdmin)}
                    disabled={createAdminMutation.isLoading}>
                    {createAdminMutation.isLoading ? 'Creating…' : 'Create account'}
                  </button>
                </div>
              </div>
            )}
            {isManager && (
              <div style={{ ...s.card, background: '#fffbeb', borderColor: '#fde68a' }}>
                <p style={{ fontSize: 14, color: '#92400e' }}>
                  🛡 You are signed in as a <strong>Manager</strong>. You can manage users, tasks, and orders, but cannot create staff accounts or change user roles.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Users ── */}
        {tab === 'Users' && (
          <div style={s.card}>
            <div style={s.filterRow}>
              <input style={{ ...s.input, maxWidth: 220 }} placeholder="Search name or email…"
                value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              <select style={{ ...s.input, maxWidth: 160 }} value={userRole} onChange={e => setUserRole(e.target.value)}>
                <option value="">All roles</option>
                {['individual', 'business', 'professional', 'manager', 'admin'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <table style={s.table}>
              <thead>
                <tr>{['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {usersData?.users?.map(u => (
                  <tr key={u._id} style={s.tr}>
                    <td style={s.td}>
                      <button style={s.nameBtn} onClick={() => setSelectedUser(u)}>
                        {u.name}
                      </button>
                    </td>
                    <td style={s.td}>{u.email}</td>
                    <td style={s.td}><span style={{ ...s.roleBadge, ...roleBadgeColor(u.role) }}>{u.role}</span></td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: u.isActive ? '#dcfce7' : '#fee2e2', color: u.isActive ? '#15803d' : '#b91c1c' }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={s.td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        {isAdmin && !['admin'].includes(u.role) && (
                          <select style={{ ...s.input, padding: '4px 8px', fontSize: 12, maxWidth: 130 }}
                            value={u.role}
                            onChange={e => updateUserMutation.mutate({ id: u._id, data: { role: e.target.value } })}>
                            <option value="individual">Individual</option>
                            <option value="business">Business</option>
                            <option value="professional">Professional</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                        <button style={s.actionBtn}
                          onClick={() => updateUserMutation.mutate({ id: u._id, data: { isActive: !u.isActive } })}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        {isAdmin && !['admin', 'manager'].includes(u.role) && (
                          <button style={{ ...s.actionBtn, background: '#fef2f2', color: '#dc2626' }}
                            onClick={() => { if (window.confirm(`Deactivate ${u.name}?`)) deleteUserMutation.mutate(u._id); }}>
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!usersData?.users?.length) && <div style={s.empty}>No users found</div>}
          </div>
        )}

        {/* ── Tasks ── */}
        {tab === 'Tasks' && (
          <div style={s.card}>
            <div style={s.filterRow}>
              <select style={{ ...s.input, maxWidth: 180 }} value={taskStatus} onChange={e => setTaskStatus(e.target.value)}>
                <option value="">All statuses</option>
                {['open', 'in-progress', 'completed', 'cancelled'].map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
            <table style={s.table}>
              <thead>
                <tr>{['Title', 'Category', 'Posted By', 'Status', 'Proposals', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {tasksData?.tasks?.map(task => (
                  <tr key={task._id} style={s.tr}>
                    <td style={s.td}>
                      <Link to={`/listings/${task._id}`} style={{ color: '#2563eb', fontSize: 13 }}>
                        {task.title.length > 45 ? task.title.slice(0, 45) + '…' : task.title}
                      </Link>
                    </td>
                    <td style={s.td}>{task.category}</td>
                    <td style={s.td}>{task.postedBy?.name}</td>
                    <td style={s.td}><span style={s.badge}>{task.status}</span></td>
                    <td style={s.td}>{task.proposalCount}</td>
                    <td style={s.td}>
                      <button style={{ ...s.actionBtn, background: '#fef2f2', color: '#dc2626' }}
                        onClick={() => { if (window.confirm('Delete this task?')) deleteTaskMutation.mutate(task._id); }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!tasksData?.tasks?.length) && <div style={s.empty}>No tasks found</div>}
          </div>
        )}

        {/* ── Orders ── */}
        {tab === 'Orders' && (
          <div style={s.card}>
            <div style={s.filterRow}>
              <select style={{ ...s.input, maxWidth: 180 }} value={orderStatus} onChange={e => setOrderStatus(e.target.value)}>
                <option value="">All statuses</option>
                {['pending_payment','active','submitted','verified','disputed','withdrawn','cancelled'].map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
            <table style={s.table}>
              <thead>
                <tr>{['Task', 'Client', 'Professional', 'Amount', 'Status', 'Date', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {ordersData?.orders?.map(order => (
                  <tr key={order._id} style={s.tr}>
                    <td style={s.td}>{order.task?.title?.slice(0, 30)}…</td>
                    <td style={s.td}>{order.client?.name}</td>
                    <td style={s.td}>{order.professional?.name}</td>
                    <td style={s.td}>K{order.amount}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: order.status === 'disputed' ? '#fee2e2' : '#f3f4f6', color: order.status === 'disputed' ? '#b91c1c' : '#4b5563' }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={s.td}>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td style={s.td}>
                      {order.status === 'disputed' && (
                        <button style={{ ...s.actionBtn, background: '#fef3c7', color: '#b45309' }}
                          onClick={() => setResolveModal(order._id)}>
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!ordersData?.orders?.length) && <div style={s.empty}>No orders found</div>}
          </div>
        )}

        {/* ── Categories ── */}
        {tab === 'Categories' && (
          <div>
            <div style={s.card}>
              <h2 style={s.cardTitle}>Add Category</h2>
              <div style={s.formRow}>
                <input style={s.input} placeholder="Category name *" id="catName" />
                <input style={{ ...s.input, maxWidth: 120 }} placeholder="Icon e.g. 💻" id="catIcon" />
                <input style={s.input} placeholder="Description (optional)" id="catDesc" />
                <input style={{ ...s.input, maxWidth: 80 }} placeholder="Order" type="number" id="catOrder" />
                <button style={s.btn} onClick={() => {
                  const name  = document.getElementById('catName').value.trim();
                  const icon  = document.getElementById('catIcon').value.trim();
                  const desc  = document.getElementById('catDesc').value.trim();
                  const order = document.getElementById('catOrder').value;
                  if (!name) return;
                  adminAPI.createCategory({ name, icon: icon || '📁', description: desc, order: Number(order) || 0 })
                    .then(() => {
                      qc.invalidateQueries('adminCats');
                      qc.invalidateQueries('categories');
                      document.getElementById('catName').value = '';
                      document.getElementById('catIcon').value = '';
                      document.getElementById('catDesc').value = '';
                      document.getElementById('catOrder').value = '';
                    })
                    .catch(err => alert(err.response?.data?.message || 'Failed to create category'));
                }}>
                  Add
                </button>
              </div>
            </div>

            <div style={s.card}>
              <h2 style={s.cardTitle}>
                All Categories
                <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>
                  ({catsData?.categories?.length || 0})
                </span>
              </h2>
              <table style={s.table}>
                <thead>
                  <tr>{['Icon', 'Name', 'Description', 'Tasks', 'Status', 'Order', 'Actions'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {catsData?.categories?.map(cat => (
                    <tr key={cat._id} style={s.tr}>
                      <td style={{ ...s.td, fontSize: 22 }}>{cat.icon}</td>
                      <td style={s.td}><strong>{cat.name}</strong></td>
                      <td style={{ ...s.td, color: '#6b7280' }}>{cat.description || '—'}</td>
                      <td style={s.td}>{cat.taskCount || 0}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, background: cat.isActive ? '#dcfce7' : '#fee2e2', color: cat.isActive ? '#15803d' : '#b91c1c' }}>
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={s.td}>{cat.order}</td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={s.actionBtn}
                            onClick={() => {
                              adminAPI.updateCategory(cat._id, { isActive: !cat.isActive })
                                .then(() => { qc.invalidateQueries('adminCats'); qc.invalidateQueries('categories'); });
                            }}>
                            {cat.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          {isAdmin && (
                            <button style={{ ...s.actionBtn, background: '#fef2f2', color: '#dc2626' }}
                              onClick={() => {
                                if (cat.taskCount > 0) {
                                  alert(`Cannot delete — ${cat.taskCount} task(s) use this category. Deactivate it instead.`);
                                  return;
                                }
                                if (window.confirm(`Delete "${cat.name}"?`)) {
                                  adminAPI.deleteCategory(cat._id)
                                    .then(() => { qc.invalidateQueries('adminCats'); qc.invalidateQueries('categories'); })
                                    .catch(err => alert(err.response?.data?.message || 'Failed to delete'));
                                }
                              }}>
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!catsData?.categories?.length) && (
                <div style={s.empty}>No categories yet. Add one above or run: <code>node scripts/seedCategories.js</code></div>
              )}
            </div>
          </div>
        )}

        {/* ── User Detail Modal ── */}
        {selectedUser && (
          <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setSelectedUser(null); }}>
            <div style={{ ...s.modal, maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  {/* Avatar */}
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                    {selectedUser.avatar
                      ? <img src={selectedUser.avatar} alt={selectedUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : selectedUser.name?.[0]
                    }
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{selectedUser.name}</h2>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ ...s.roleBadge, ...roleBadgeColor(selectedUser.role) }}>{selectedUser.role}</span>
                      <span style={{ ...s.badge, background: selectedUser.isActive ? '#dcfce7' : '#fee2e2', color: selectedUser.isActive ? '#15803d' : '#b91c1c' }}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}
                  onClick={() => setSelectedUser(null)}>✕</button>
              </div>

              {/* Contact info */}
              <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 10 }}>Contact</div>
                <div style={s.detailRow}><span>Email</span><strong>{selectedUser.email}</strong></div>
                <div style={s.detailRow}><span>Phone</span><strong>{selectedUser.phone || '—'}</strong></div>
                <div style={s.detailRow}><span>Joined</span><strong>{new Date(selectedUser.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></div>
                <div style={s.detailRow}><span>Last seen</span><strong>{selectedUser.lastSeen ? new Date(selectedUser.lastSeen).toLocaleDateString() : '—'}</strong></div>
              </div>

              {/* Role-specific profile */}
              {selectedUser.role === 'business' && selectedUser.businessProfile?.companyName && (
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 10 }}>Company</div>
                  <div style={s.detailRow}><span>Name</span><strong>{selectedUser.businessProfile.companyName}</strong></div>
                  <div style={s.detailRow}><span>Industry</span><strong>{selectedUser.businessProfile.industry || '—'}</strong></div>
                  <div style={s.detailRow}><span>Size</span><strong>{selectedUser.businessProfile.companySize || '—'}</strong></div>
                  <div style={s.detailRow}><span>Location</span><strong>{selectedUser.businessProfile.location || '—'}</strong></div>
                </div>
              )}

              {selectedUser.role === 'professional' && (
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 10 }}>Professional</div>
                  <div style={s.detailRow}><span>Headline</span><strong>{selectedUser.professionalProfile?.headline || '—'}</strong></div>
                  <div style={s.detailRow}><span>Rate</span><strong>{selectedUser.professionalProfile?.hourlyRate ? `K${selectedUser.professionalProfile.hourlyRate}/hr` : '—'}</strong></div>
                  <div style={s.detailRow}><span>Availability</span><strong>{selectedUser.professionalProfile?.availability || '—'}</strong></div>
                  <div style={s.detailRow}><span>Location</span><strong>{selectedUser.professionalProfile?.location || '—'}</strong></div>
                  {selectedUser.professionalProfile?.skills?.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Skills</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {selectedUser.professionalProfile.skills.map(sk => (
                          <span key={sk} style={{ padding: '3px 10px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, fontSize: 12 }}>{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stats */}
              <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 10 }}>Stats</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[
                    ['Rating',     selectedUser.stats?.rating > 0 ? `⭐ ${selectedUser.stats.rating}` : '—'],
                    ['Reviews',    selectedUser.stats?.reviewCount || 0],
                    ['Completed',  selectedUser.stats?.completedTasks || 0],
                  ].map(([label, val]) => (
                    <div key={label} style={{ textAlign: 'center', background: '#fff', borderRadius: 8, padding: '10px 8px' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#2563eb' }}>{val}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href={`/users/${selectedUser._id}`} target="_blank" rel="noreferrer"
                  style={{ ...s.btn, textDecoration: 'none', fontSize: 13 }}>
                  👁 Public profile
                </a>
                <button style={{ ...s.btn, background: selectedUser.isActive ? '#dc2626' : '#16a34a', fontSize: 13 }}
                  onClick={() => {
                    updateUserMutation.mutate({ id: selectedUser._id, data: { isActive: !selectedUser.isActive } });
                    setSelectedUser(u => ({ ...u, isActive: !u.isActive }));
                  }}>
                  {selectedUser.isActive ? 'Deactivate account' : 'Activate account'}
                </button>
                {isAdmin && !['admin', 'manager'].includes(selectedUser.role) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>Role:</span>
                    <select style={{ ...s.input, padding: '6px 10px', fontSize: 13 }}
                      value={selectedUser.role}
                      onChange={e => {
                        updateUserMutation.mutate({ id: selectedUser._id, data: { role: e.target.value } });
                        setSelectedUser(u => ({ ...u, role: e.target.value }));
                      }}>
                      {['individual','business','professional','manager','admin'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Resolve Modal ── */}
        {resolveModal && (
          <div style={s.overlay}>
            <div style={s.modal}>
              <h2 style={s.cardTitle}>Resolve Disputed Order</h2>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                Choose a resolution. This will update the order status and notify both parties.
              </p>
              <label style={s.label}>Admin notes</label>
              <textarea style={s.textarea} rows={3} placeholder="Explain the resolution…"
                value={resolveNotes} onChange={e => setResolveNotes(e.target.value)} />
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button style={{ ...s.btn, background: '#16a34a' }}
                  onClick={() => resolveMutation.mutate({ id: resolveModal, data: { resolution: 'verified', notes: resolveNotes } })}
                  disabled={resolveMutation.isLoading}>
                  ✅ Accept work
                </button>
                <button style={{ ...s.btn, background: '#dc2626' }}
                  onClick={() => resolveMutation.mutate({ id: resolveModal, data: { resolution: 'cancelled', notes: resolveNotes } })}
                  disabled={resolveMutation.isLoading}>
                  ❌ Reject work
                </button>
                <button style={{ ...s.btn, background: '#f3f4f6', color: '#374151' }}
                  onClick={() => setResolveModal(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const roleBadgeColor = role => ({
  admin:        { background: '#fee2e2', color: '#b91c1c' },
  manager:      { background: '#fef3c7', color: '#b45309' },
  business:     { background: '#dbeafe', color: '#1d4ed8' },
  professional: { background: '#dcfce7', color: '#15803d' },
  individual:   { background: '#f3f4f6', color: '#374151' },
}[role] || {});

const styles = {
  page:       { display: 'flex', minHeight: '100vh', background: '#f9fafb' },
  main:       { flex: 1, padding: 28, overflow: 'auto' },
  topBar:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  heading:    { fontSize: 22, fontWeight: 700, marginBottom: 2 },
  tabs:       { display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb' },
  tab:        { padding: '10px 18px', border: 'none', background: 'none', fontSize: 14, color: '#6b7280', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1 },
  tabActive:  { color: '#2563eb', fontWeight: 600, borderBottomColor: '#2563eb' },
  statGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 },
  statCard:   { background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '16px 18px' },
  statNum:    { fontSize: 26, fontWeight: 700, marginBottom: 4 },
  statLabel:  { fontSize: 12, color: '#6b7280' },
  card:       { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 20 },
  cardTitle:  { fontSize: 16, fontWeight: 600, marginBottom: 16 },
  filterRow:  { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  formRow:    { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  input:      { padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' },
  btn:        { padding: '9px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' },
  tr:         { borderBottom: '1px solid #f9fafb' },
  td:         { padding: '11px 12px', fontSize: 13, verticalAlign: 'middle' },
  badge:      { fontSize: 11, padding: '3px 8px', borderRadius: 12, background: '#f3f4f6', color: '#4b5563' },
  roleBadge:  { fontSize: 11, padding: '3px 8px', borderRadius: 12, fontWeight: 500 },
  actionBtn:  { padding: '5px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: '#f9fafb', color: '#374151' },
  empty:      { textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 14 },
  successMsg: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: 14 },
  nameBtn:    { background: 'none', border: 'none', padding: 0, fontSize: 13, color: '#2563eb', cursor: 'pointer', fontWeight: 500, textAlign: 'left' },
  detailRow:  { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid #f3f4f6' },
  modal:      { background: '#fff', borderRadius: 12, padding: 28, maxWidth: 520, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,.15)' },
  label:      { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 },
  textarea:   { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
};
