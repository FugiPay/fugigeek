import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import usersAPI from '../api/users';
import { useAuth } from '../hooks/useAuth';
import Avatar from '../components/common/Avatar';

export default function ViewProfile() {
  const { user: authUser, isBusiness, isProfessional, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();
  const isStaff  = isAdmin || isManager;

  const { data, isLoading } = useQuery(
    ['user', authUser?._id],
    () => usersAPI.getOne(authUser._id).then(r => r.data),
    { enabled: !!authUser?._id }
  );

  const user    = data?.user;
  const reviews = data?.reviews || [];

  if (isLoading) return <div style={s.center}>Loading your profile…</div>;
  if (!user)     return <div style={s.center}>Profile not found.</div>;

  const isPro = user.role === 'professional';
  const isBiz = user.role === 'business';

  const dashboardPath = isStaff ? '/dashboard/admin' : isBusiness ? '/dashboard/business' : '/dashboard/professional';

  return (
    <div style={s.page}>
      {/* Breadcrumb */}
      <div style={s.breadcrumb}>
        <Link to={dashboardPath} style={s.breadcrumbLink}>← Dashboard</Link>
        <span style={s.breadcrumbSep}>·</span>
        <span style={{ fontSize: 14, color: '#6b7280' }}>Your public profile</span>
      </div>

      <div style={s.layout}>
        {/* Main column */}
        <div style={s.main}>

          {/* Preview notice */}
          <div style={s.previewBanner}>
            <span>👁 This is how others see your profile</span>
            <Link to="/profile/edit" style={s.editBtn}>Edit Profile</Link>
          </div>

          {/* Hero card */}
          <div style={s.heroCard}>
            <Avatar src={user.avatar} name={user.name} size={72} />
            <div style={s.identity}>
              <h1 style={s.name}>{user.name}</h1>
              {isPro && user.professionalProfile?.headline && (
                <p style={s.headline}>{user.professionalProfile.headline}</p>
              )}
              {isBiz && user.businessProfile?.companyName && (
                <p style={s.headline}>{user.businessProfile.companyName}</p>
              )}
              <div style={s.metaRow}>
                {isPro && user.professionalProfile?.location && (
                  <span style={s.meta}>📍 {user.professionalProfile.location}</span>
                )}
                {isBiz && user.businessProfile?.location && (
                  <span style={s.meta}>📍 {user.businessProfile.location}</span>
                )}
                {isPro && user.professionalProfile?.availability && (
                  <span style={s.meta}>🕐 {user.professionalProfile.availability}</span>
                )}
                {isPro && user.professionalProfile?.responseTime && (
                  <span style={s.meta}>⚡ Responds {user.professionalProfile.responseTime}</span>
                )}
                {user.phone && (
                  <span style={s.meta}>📞 {user.phone}</span>
                )}
              </div>
              {user.stats?.rating > 0 && (
                <div style={s.rating}>
                  ⭐ {user.stats.rating} &nbsp;·&nbsp; {user.stats.reviewCount} reviews &nbsp;·&nbsp; {user.stats.completedTasks} tasks completed
                </div>
              )}
            </div>
            {isPro && user.professionalProfile?.hourlyRate && (
              <div style={s.rate}>
                ${user.professionalProfile.hourlyRate}
                <span style={{ fontSize: 13, fontWeight: 400 }}>/hr</span>
              </div>
            )}
          </div>

          {/* Completeness nudge */}
          {isPro && !user.professionalProfile?.bio && (
            <div style={s.nudge}>
              <span>💡 Your profile is missing a bio — clients are much more likely to hire professionals with a full profile.</span>
              <Link to="/profile/edit" style={s.nudgeBtn}>Add bio</Link>
            </div>
          )}
          {!user.phone && (
            <div style={s.nudge}>
              <span>📞 Add a phone number so clients can contact you directly.</span>
              <Link to="/profile/edit" style={s.nudgeBtn}>Add phone</Link>
            </div>
          )}

          {/* Bio */}
          {isPro && user.professionalProfile?.bio && (
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h2 style={s.cardTitle}>About</h2>
                <Link to="/profile/edit" style={s.cardEdit}>Edit</Link>
              </div>
              <p style={s.body}>{user.professionalProfile.bio}</p>
            </div>
          )}

          {/* Company description */}
          {isBiz && user.businessProfile?.description && (
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h2 style={s.cardTitle}>About the company</h2>
                <Link to="/profile/edit" style={s.cardEdit}>Edit</Link>
              </div>
              <p style={s.body}>{user.businessProfile.description}</p>
            </div>
          )}

          {/* Skills */}
          {isPro && (
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h2 style={s.cardTitle}>Skills</h2>
                <Link to="/profile/edit" style={s.cardEdit}>Edit</Link>
              </div>
              {user.professionalProfile?.skills?.length > 0 ? (
                <div style={s.skills}>
                  {user.professionalProfile.skills.map(sk => (
                    <span key={sk} style={s.skill}>{sk}</span>
                  ))}
                </div>
              ) : (
                <p style={s.empty}>No skills added yet. <Link to="/profile/edit" style={{ color: '#2563eb' }}>Add skills →</Link></p>
              )}
            </div>
          )}

          {/* Portfolio */}
          {isPro && user.professionalProfile?.portfolio?.length > 0 && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Portfolio</h2>
              {user.professionalProfile.portfolio.map((p, i) => (
                <div key={i} style={s.portfolioItem}>
                  <a href={p.url} target="_blank" rel="noreferrer" style={s.portfolioTitle}>{p.title}</a>
                  {p.description && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{p.description}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {isPro && user.professionalProfile?.certifications?.length > 0 && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Certifications</h2>
              {user.professionalProfile.certifications.map((c, i) => (
                <div key={i} style={s.certItem}>
                  <strong style={{ fontSize: 14 }}>{c.name}</strong>
                  <span style={{ fontSize: 13, color: '#6b7280' }}> — {c.issuer} {c.year && `(${c.year})`}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Reviews ({reviews.length})</h2>
              {reviews.map(r => (
                <div key={r._id} style={s.review}>
                  <div style={s.reviewTop}>
                    <div style={s.reviewAvatar}>{r.reviewer?.name?.[0]}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.reviewer?.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style={s.reviewRating}>{'⭐'.repeat(r.rating)}</div>
                  </div>
                  {r.comment && <p style={s.reviewComment}>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}

          {reviews.length === 0 && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Reviews</h2>
              <p style={s.empty}>No reviews yet — complete your first task to start building your reputation.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside style={s.sidebar}>
          {/* Quick actions */}
          <div style={s.sideCard}>
            <h3 style={s.sideTitle}>Quick actions</h3>
            <Link to="/profile/edit" style={s.actionBtn}>✏️ Edit Profile</Link>
            <Link to="/tasks/new"    style={{ ...s.actionBtn, marginTop: 8, background: '#f0fdf4', color: '#15803d' }}>➕ Post a Task</Link>
            <Link to="/messages"     style={{ ...s.actionBtn, marginTop: 8, background: '#f9fafb', color: '#374151' }}>💬 Messages</Link>
          </div>

          {/* Stats */}
          <div style={s.sideCard}>
            <h3 style={s.sideTitle}>Your stats</h3>
            <div style={s.statRow}><span>Tasks completed</span><strong>{user.stats?.completedTasks || 0}</strong></div>
            <div style={s.statRow}><span>Rating</span><strong>{user.stats?.rating > 0 ? `⭐ ${user.stats.rating}` : 'No reviews yet'}</strong></div>
            <div style={s.statRow}><span>Reviews</span><strong>{user.stats?.reviewCount || 0}</strong></div>
            {isPro && <div style={s.statRow}><span>Total earned</span><strong>K{user.stats?.totalEarnings || 0}</strong></div>}
            {isBiz && <div style={s.statRow}><span>Total spent</span><strong>K{user.stats?.totalSpent || 0}</strong></div>}
            <div style={s.statRow}><span>Member since</span><strong>{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong></div>
          </div>

          {/* Contact info */}
          <div style={s.sideCard}>
            <h3 style={s.sideTitle}>Contact info</h3>
            <div style={s.statRow}><span>Email</span><strong style={{ fontSize: 12 }}>{user.email}</strong></div>
            {user.phone
              ? <div style={s.statRow}><span>Phone</span><strong>{user.phone}</strong></div>
              : <div style={s.addPhone}><Link to="/profile/edit" style={{ color: '#2563eb', fontSize: 13 }}>+ Add phone number</Link></div>
            }
            {isBiz && user.businessProfile?.website && (
              <div style={s.statRow}><span>Website</span><a href={user.businessProfile.website} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 13 }}>Visit</a></div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

const s = {
  page:          { minHeight: '100vh', background: '#f9fafb' },
  center:        { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#6b7280' },
  breadcrumb:    { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb' },
  breadcrumbLink:{ fontSize: 14, color: '#374151', textDecoration: 'none' },
  breadcrumbSep: { color: '#d1d5db' },
  layout:        { maxWidth: 1100, margin: '0 auto', padding: 24, display: 'flex', gap: 24, alignItems: 'flex-start' },
  main:          { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 },
  sidebar:       { width: 260, flexShrink: 0 },
  previewBanner: { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: '#92400e' },
  editBtn:       { background: '#f59e0b', color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  heroCard:      { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 28, display: 'flex', gap: 20, alignItems: 'flex-start' },
  avatar:        { width: 72, height: 72, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 },
  identity:      { flex: 1 },
  name:          { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  headline:      { fontSize: 15, color: '#4b5563', marginBottom: 8 },
  metaRow:       { display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 8 },
  meta:          { fontSize: 13, color: '#6b7280' },
  rating:        { fontSize: 14, color: '#374151' },
  rate:          { fontSize: 22, fontWeight: 700, color: '#16a34a', flexShrink: 0 },
  nudge:         { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#92400e', gap: 12 },
  nudgeBtn:      { background: '#f59e0b', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', flexShrink: 0 },
  card:          { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 },
  cardHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle:     { fontSize: 16, fontWeight: 600 },
  cardEdit:      { fontSize: 13, color: '#2563eb', textDecoration: 'none' },
  body:          { fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' },
  skills:        { display: 'flex', flexWrap: 'wrap', gap: 8 },
  skill:         { padding: '6px 14px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, fontSize: 13 },
  empty:         { fontSize: 14, color: '#9ca3af' },
  portfolioItem: { paddingBottom: 12, borderBottom: '1px solid #f3f4f6', marginBottom: 12 },
  portfolioTitle:{ fontSize: 14, fontWeight: 600, color: '#2563eb', textDecoration: 'none' },
  certItem:      { padding: '8px 0', borderBottom: '1px solid #f3f4f6' },
  review:        { padding: '16px 0', borderBottom: '1px solid #f3f4f6' },
  reviewTop:     { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar:  { width: 32, height: 32, borderRadius: '50%', background: '#6b7280', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 },
  reviewRating:  { marginLeft: 'auto', fontSize: 13 },
  reviewComment: { fontSize: 14, color: '#374151', lineHeight: 1.6 },
  sideCard:      { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16 },
  sideTitle:     { fontSize: 14, fontWeight: 600, marginBottom: 12 },
  actionBtn:     { display: 'block', background: '#2563eb', color: '#fff', padding: '11px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, textAlign: 'center', textDecoration: 'none' },
  statRow:       { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid #f9fafb' },
  addPhone:      { padding: '8px 0' },
};
