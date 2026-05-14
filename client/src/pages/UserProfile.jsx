import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import usersAPI    from '../api/users';
import messagesAPI from '../api/messages';
import { useAuth } from '../hooks/useAuth';
import Avatar from '../components/common/Avatar';

export default function UserProfile() {
  const { id } = useParams();
  const { isBusiness, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery(['user', id], () =>
    usersAPI.getOne(id).then(r => r.data)
  );

  const messageMutation = useMutation(
    () => messagesAPI.startConversation(id),
    { onSuccess: ({ data }) => navigate(`/messages?conv=${data.conversation._id}`) }
  );

  const user    = data?.user;
  const reviews = data?.reviews || [];

  if (isLoading) return <div style={s.center}>Loading profile…</div>;
  if (!user)     return <div style={s.center}>User not found.</div>;

  const isBiz = user.role === 'business';
  const isPro = user.role === 'professional';

  return (
    <div style={s.page}>
      <div style={{ padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <Link to="/users/professionals" style={{ fontSize: 14, color: '#374151' }}>← All professionals</Link>
      </div>

      <div style={s.layout}>
        {/* Main column */}
        <div style={s.main}>

          {/* Hero card */}
          <div style={s.heroCard}>
            <Avatar src={user.avatar} name={user.name} size={72} />
            <div style={s.identity}>
              <h1 style={s.name}>{user.name}</h1>
              {isPro && <p style={s.headline}>{user.professionalProfile?.headline}</p>}
              {isBiz && <p style={s.headline}>{user.businessProfile?.companyName}</p>}
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
              </div>
              {user.stats?.rating > 0 && (
                <div style={s.rating}>
                  ⭐ {user.stats.rating} &nbsp;·&nbsp; {user.stats.reviewCount} reviews &nbsp;·&nbsp; {user.stats.completedTasks} tasks completed
                </div>
              )}
            </div>
            {isPro && user.professionalProfile?.hourlyRate && (
              <div style={s.rate}>K{user.professionalProfile.hourlyRate}<span style={{ fontSize: 13, fontWeight: 400 }}>/hr</span></div>
            )}
          </div>

          {/* Bio */}
          {isPro && user.professionalProfile?.bio && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>About</h2>
              <p style={s.body}>{user.professionalProfile.bio}</p>
            </div>
          )}

          {/* Company description */}
          {isBiz && user.businessProfile?.description && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>About the company</h2>
              <p style={s.body}>{user.businessProfile.description}</p>
            </div>
          )}

          {/* Skills */}
          {isPro && user.professionalProfile?.skills?.length > 0 && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Skills</h2>
              <div style={s.skills}>
                {user.professionalProfile.skills.map(sk => (
                  <span key={sk} style={s.skill}>{sk}</span>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio */}
          {isPro && user.professionalProfile?.portfolio?.length > 0 && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Portfolio</h2>
              <div style={s.portfolioGrid}>
                {user.professionalProfile.portfolio.map((p, i) => (
                  <div key={i} style={s.portfolioCard}>
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt={p.title}
                        style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: '8px 8px 0 0' }} />
                    )}
                    <div style={s.portfolioBody}>
                      {p.url
                        ? <a href={p.url} target="_blank" rel="noreferrer" style={s.portfolioTitle}>{p.title}</a>
                        : <div style={{ fontSize: 14, fontWeight: 600 }}>{p.title}</div>
                      }
                      {p.description && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6, lineHeight: 1.5 }}>{p.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
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
        </div>

        {/* Sidebar */}
        <aside style={s.sidebar}>
          {/* CTA */}
          {isAuthenticated && isPro && (
            <div style={s.sideCard}>
              <h3 style={s.sideTitle}>Contact {user.name.split(' ')[0]}</h3>

              {/* Call button */}
              {user.phone ? (
                <a href={`tel:${user.phone}`} style={s.callBtn}>
                  📞 Call {user.name.split(' ')[0]}
                </a>
              ) : (
                <div style={s.noPhone}>📞 Phone not listed</div>
              )}

              {/* Message button */}
              <button
                style={s.messageBtn}
                onClick={() => messageMutation.mutate()}
                disabled={messageMutation.isLoading}
              >
                {messageMutation.isLoading ? 'Opening…' : '💬 Send a Message'}
              </button>

              {user.professionalProfile?.responseTime && (
                <p style={s.responseTime}>
                  ⚡ Typically responds {user.professionalProfile.responseTime}
                </p>
              )}
            </div>
          )}

          {/* Stats */}
          <div style={s.sideCard}>
            <h3 style={s.sideTitle}>Stats</h3>
            <div style={s.statRow}><span>Tasks completed</span><strong>{user.stats?.completedTasks || 0}</strong></div>
            <div style={s.statRow}><span>Rating</span><strong>{user.stats?.rating > 0 ? `⭐ ${user.stats.rating}` : 'No reviews yet'}</strong></div>
            <div style={s.statRow}><span>Reviews</span><strong>{user.stats?.reviewCount || 0}</strong></div>
            <div style={s.statRow}><span>Member since</span><strong>{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong></div>
          </div>

          {/* Business info */}
          {isBiz && (
            <div style={s.sideCard}>
              <h3 style={s.sideTitle}>Company info</h3>
              {user.businessProfile?.industry   && <div style={s.statRow}><span>Industry</span><strong>{user.businessProfile.industry}</strong></div>}
              {user.businessProfile?.companySize && <div style={s.statRow}><span>Size</span><strong>{user.businessProfile.companySize} employees</strong></div>}
              {user.businessProfile?.website    && (
                <div style={s.statRow}>
                  <span>Website</span>
                  <a href={user.businessProfile.website} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 13 }}>Visit</a>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

const s = {
  page:          { minHeight: '100vh', background: '#f9fafb' },
  center:        { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#6b7280' },
  nav:           { background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px' },
  navInner:      { maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 },
  logo:          { fontSize: 20, fontWeight: 700, color: '#2563eb' },
  layout:        { maxWidth: 1100, margin: '0 auto', padding: 24, display: 'flex', gap: 24, alignItems: 'flex-start' },
  main:          { flex: 1, minWidth: 0 },
  sidebar:       { width: 260, flexShrink: 0 },
  heroCard:      { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 28, display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 16 },
  avatar:        { width: 72, height: 72, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 },
  identity:      { flex: 1 },
  name:          { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  headline:      { fontSize: 15, color: '#4b5563', marginBottom: 8 },
  metaRow:       { display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 8 },
  meta:          { fontSize: 13, color: '#6b7280' },
  rating:        { fontSize: 14, color: '#374151' },
  rate:          { fontSize: 22, fontWeight: 700, color: '#16a34a', flexShrink: 0 },
  card:          { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 16 },
  cardTitle:     { fontSize: 16, fontWeight: 600, marginBottom: 14 },
  body:          { fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' },
  skills:        { display: 'flex', flexWrap: 'wrap', gap: 8 },
  skill:         { padding: '6px 14px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, fontSize: 13 },
  portfolioItem: { paddingBottom: 12, borderBottom: '1px solid #f3f4f6', marginBottom: 12 },
  portfolioTitle:{ fontSize: 14, fontWeight: 600, color: '#2563eb' },
  portfolioGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 },
  portfolioCard: { border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fff' },
  portfolioBody: { padding: 14 },
  certItem:      { padding: '8px 0', borderBottom: '1px solid #f3f4f6' },
  review:        { padding: '16px 0', borderBottom: '1px solid #f3f4f6' },
  reviewTop:     { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar:  { width: 32, height: 32, borderRadius: '50%', background: '#6b7280', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 },
  reviewRating:  { marginLeft: 'auto', fontSize: 13 },
  reviewComment: { fontSize: 14, color: '#374151', lineHeight: 1.6 },
  sideCard:      { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16 },
  sideTitle:     { fontSize: 14, fontWeight: 600, marginBottom: 12 },
  hireBtn:       { display: 'block', background: '#2563eb', color: '#fff', padding: '11px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, textAlign: 'center', textDecoration: 'none' },
  callBtn:       { display: 'block', background: '#16a34a', color: '#fff', padding: '13px 16px', borderRadius: 10, fontSize: 15, fontWeight: 600, textAlign: 'center', textDecoration: 'none', marginBottom: 10 },
  messageBtn:    { width: '100%', background: '#2563eb', color: '#fff', padding: '13px 16px', borderRadius: 10, fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', marginBottom: 10 },
  noPhone:       { background: '#f3f4f6', color: '#9ca3af', padding: '13px 16px', borderRadius: 10, fontSize: 14, textAlign: 'center', marginBottom: 10 },
  responseTime:  { fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 4 },
  statRow:       { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid #f9fafb' },
};
