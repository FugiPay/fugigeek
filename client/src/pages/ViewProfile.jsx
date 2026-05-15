import { usePageTitle } from '../hooks/usePageTitle';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import usersAPI from '../api/users';
import { useAuth } from '../hooks/useAuth';
import Avatar from '../components/common/Avatar';

// ── Portfolio gallery + lightbox carousel ─────────────────────────────────────
function PortfolioSection({ items }) {
  const [lightbox, setLightbox] = useState(null); // { itemIdx, imgIdx }

  const getImages = item =>
    item.images?.length > 0
      ? item.images
      : item.imageUrl
      ? [{ url: item.imageUrl }]
      : [];

  const allImages = items.flatMap((item, ii) =>
    getImages(item).map((img, ji) => ({ ...img, title: item.title, itemIdx: ii, imgIdx: ji }))
  );

  const openLightbox = (itemIdx, imgIdx) => setLightbox({ itemIdx, imgIdx });

  const currentFlat = lightbox
    ? allImages.findIndex(i => i.itemIdx === lightbox.itemIdx && i.imgIdx === lightbox.imgIdx)
    : -1;

  const goTo = offset => {
    const next = (currentFlat + offset + allImages.length) % allImages.length;
    setLightbox({ itemIdx: allImages[next].itemIdx, imgIdx: allImages[next].imgIdx });
  };

  return (
    <>
      <div style={ps.card}>
        <div style={ps.header}>
          <h2 style={ps.cardTitle}>Portfolio</h2>
          <span style={ps.count}>{items.length} project{items.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Project cards */}
        <div style={ps.grid}>
          {items.map((item, ii) => {
            const images = getImages(item);
            const cover  = images[0];
            return (
              <div key={ii} style={ps.projectCard}>
                {/* Cover image — clickable */}
                <div style={ps.coverWrap} onClick={() => images.length && openLightbox(ii, 0)}>
                  {cover
                    ? <img src={cover.url} alt={item.title} style={ps.coverImg} />
                    : <div style={ps.coverPlaceholder}>
                        <span style={{ fontSize: 36 }}>🖼</span>
                        <span style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>No images</span>
                      </div>
                  }
                  {images.length > 1 && (
                    <div style={ps.imageBadge}>
                      🖼 {images.length}
                    </div>
                  )}
                  {images.length > 0 && (
                    <div style={ps.coverOverlay}>
                      <span style={ps.viewLabel}>View gallery</span>
                    </div>
                  )}
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div style={ps.thumbStrip}>
                    {images.slice(0, 4).map((img, ji) => (
                      <div key={ji} style={ps.thumbWrap} onClick={() => openLightbox(ii, ji)}>
                        <img src={img.url} alt="" style={ps.thumb} />
                        {ji === 3 && images.length > 4 && (
                          <div style={ps.thumbMore}>+{images.length - 4}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Info */}
                <div style={ps.info}>
                  <div style={ps.titleRow}>
                    <span style={ps.projectTitle}>{item.title}</span>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer" style={ps.linkBtn}>
                        🔗 Visit
                      </a>
                    )}
                  </div>
                  {item.description && (
                    <p style={ps.desc}>{item.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox !== null && (() => {
        const flat    = allImages[currentFlat];
        const item    = items[lightbox.itemIdx];
        const images  = getImages(item);
        const total   = allImages.length;
        return (
          <div style={ps.overlay} onClick={() => setLightbox(null)}>
            <div style={ps.lightbox} onClick={e => e.stopPropagation()}>
              {/* Close */}
              <button style={ps.closeBtn} onClick={() => setLightbox(null)}>✕</button>

              {/* Main image */}
              <div style={ps.mainImgWrap}>
                <img src={flat.url} alt={flat.title} style={ps.mainImg} />
              </div>

              {/* Prev / Next */}
              {total > 1 && (
                <>
                  <button style={{ ...ps.navBtn, left: 12 }} onClick={() => goTo(-1)}>‹</button>
                  <button style={{ ...ps.navBtn, right: 12 }} onClick={() => goTo(1)}>›</button>
                </>
              )}

              {/* Caption */}
              <div style={ps.caption}>
                <div style={ps.captionTitle}>
                  {item.title}
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noreferrer" style={ps.captionLink}>🔗 Visit project</a>
                  )}
                </div>
                {item.description && <p style={ps.captionDesc}>{item.description}</p>}
                <p style={ps.captionCount}>{currentFlat + 1} / {total}</p>
              </div>

              {/* Thumbnail strip */}
              {total > 1 && (
                <div style={ps.lbThumbs}>
                  {allImages.map((img, idx) => (
                    <div key={idx}
                      style={{ ...ps.lbThumb, ...(idx === currentFlat ? ps.lbThumbActive : {}) }}
                      onClick={() => setLightbox({ itemIdx: img.itemIdx, imgIdx: img.imgIdx })}>
                      <img src={img.url} alt="" style={ps.lbThumbImg} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}

export default function ViewProfile() {
  usePageTitle('My profile');
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
            <PortfolioSection items={user.professionalProfile.portfolio} />
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

// ── Portfolio styles (separate object so PortfolioSection can use them) ──────
const ps = {
  card:           { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 20 },
  header:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #f3f4f6' },
  cardTitle:      { fontSize: 16, fontWeight: 600, margin: 0 },
  count:          { fontSize: 12, color: '#9ca3af', background: '#f3f4f6', padding: '3px 10px', borderRadius: 20 },
  grid:           { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  projectCard:    { border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.05)', display: 'flex', flexDirection: 'column' },
  coverWrap:      { position: 'relative', height: 220, cursor: 'pointer', overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  coverImg:       { width: '100%', height: '100%', objectFit: 'contain', padding: 8, transition: 'transform .25s ease' },
  coverPlaceholder:{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 },
  coverOverlay:   { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s' },
  viewLabel:      { color: '#fff', fontSize: 13, fontWeight: 600, background: 'rgba(0,0,0,.5)', padding: '7px 18px', borderRadius: 20 },
  imageBadge:     { position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20 },
  thumbStrip:     { display: 'flex', gap: 4, padding: '8px 12px 0' },
  thumbWrap:      { position: 'relative', width: 48, height: 48, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', flexShrink: 0, border: '1.5px solid #e5e7eb' },
  thumb:          { width: '100%', height: '100%', objectFit: 'contain', background: '#1e293b' },
  thumbMore:      { position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 },
  info:           { padding: '16px 18px 20px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 },
  titleRow:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  projectTitle:   { fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.4, margin: 0 },
  linkBtn:        { fontSize: 12, color: '#2563eb', textDecoration: 'none', fontWeight: 600, background: '#eff6ff', padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 },
  desc:           { fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: 0 },
  divider:        { height: 1, background: '#f1f5f9', margin: '2px 0' },
  imgCount:       { fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 },
  // ── Lightbox ──
  overlay:        { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' },
  lightbox:       { position: 'relative', width: '90vw', maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 12 },
  closeBtn:       { position: 'absolute', top: -46, right: 0, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', fontSize: 16, cursor: 'pointer', width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  // Top bar
  lbTop:          { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '0 2px' },
  lbTitle:        { fontSize: 15, fontWeight: 600, color: '#f1f5f9', lineHeight: 1.4, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  lbTopRight:     { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  lbVisitBtn:     { fontSize: 12, color: '#93c5fd', textDecoration: 'none', fontWeight: 500, border: '1px solid rgba(147,197,253,.3)', padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap' },
  lbCounter:      { fontSize: 12, color: '#475569', whiteSpace: 'nowrap' },
  // Image frame
  frameWrap:      { position: 'relative', background: '#0f172a', borderRadius: 10, width: '100%', height: 420, flexShrink: 0, border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden' },
  frameImg:       { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: 16, boxSizing: 'border-box' },
  navBtn:         { position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: '#2563eb', border: 'none', color: '#fff', fontSize: 22, fontWeight: 700, width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, lineHeight: 1, boxShadow: '0 2px 8px rgba(0,0,0,.4)' },
  // Description
  lbDesc:         { fontSize: 13, color: '#94a3b8', lineHeight: 1.65, margin: 0, padding: '0 2px' },
  // Thumbnail strip
  lbThumbs:       { display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, paddingTop: 2 },
  lbThumb:        { width: 54, height: 54, borderRadius: 7, overflow: 'hidden', cursor: 'pointer', flexShrink: 0, border: '2px solid transparent', opacity: 0.5, transition: 'opacity .15s, border-color .15s' },
  lbThumbActive:  { borderColor: '#60a5fa', opacity: 1 },
  lbThumbImg:     { width: '100%', height: '100%', objectFit: 'contain', background: '#1e293b' },
};
