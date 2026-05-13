// ── Skeleton pulse animation via inline keyframes ────────────────────────────
const pulse = `
@keyframes skeleton-pulse {
  0%   { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}`;

const injectStyles = () => {
  if (document.getElementById('skeleton-styles')) return;
  const style = document.createElement('style');
  style.id = 'skeleton-styles';
  style.textContent = pulse;
  document.head.appendChild(style);
};

// ── Base skeleton block ───────────────────────────────────────────────────────
export const Skeleton = ({ width = '100%', height = 16, radius = 6, style = {} }) => {
  injectStyles();
  return (
    <div style={{
      width, height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200px 100%',
      animation: 'skeleton-pulse 1.4s ease-in-out infinite',
      flexShrink: 0,
      ...style,
    }} />
  );
};

// ── Task card skeleton ────────────────────────────────────────────────────────
export const TaskCardSkeleton = () => (
  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ display: 'flex', gap: 8 }}>
      <Skeleton width={60}  height={20} radius={10} />
      <Skeleton width={50}  height={20} radius={10} />
    </div>
    <Skeleton width="80%"   height={18} />
    <Skeleton width="100%"  height={13} />
    <Skeleton width="90%"   height={13} />
    <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
      <Skeleton width={80}  height={12} />
      <Skeleton width={80}  height={12} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: 10, marginTop: 4 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Skeleton width={24} height={24} radius="50%" />
        <Skeleton width={90} height={13} />
      </div>
      <Skeleton width={70} height={13} />
    </div>
  </div>
);

// ── Professional card skeleton ────────────────────────────────────────────────
export const ProCardSkeleton = () => (
  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <Skeleton width={48} height={48} radius="50%" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton width="60%" height={15} />
        <Skeleton width="80%" height={12} />
        <Skeleton width="40%" height={12} />
      </div>
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      <Skeleton width={70}  height={24} radius={20} />
      <Skeleton width={90}  height={24} radius={20} />
      <Skeleton width={60}  height={24} radius={20} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>
      <Skeleton width={60} height={14} />
      <Skeleton width={70} height={20} radius={10} />
    </div>
  </div>
);

// ── Grid of skeletons ─────────────────────────────────────────────────────────
export const SkeletonGrid = ({ count = 6, Card = TaskCardSkeleton }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
    {Array.from({ length: count }).map((_, i) => <Card key={i} />)}
  </div>
);

// ── Empty state ───────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = '📭', title, message, action, actionLabel }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
    <div style={{ fontSize: 56, marginBottom: 16 }}>{icon}</div>
    <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>{title}</h3>
    {message && <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 360, lineHeight: 1.7, marginBottom: 24 }}>{message}</p>}
    {action && (
      <button onClick={action} style={{ background: '#2563eb', color: '#fff', padding: '10px 22px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
        {actionLabel}
      </button>
    )}
  </div>
);
