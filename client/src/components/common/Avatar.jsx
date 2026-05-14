// Reusable Avatar component
// Shows profile photo if available, falls back to coloured initials circle

const COLOURS = [
  '#2563eb', '#7c3aed', '#db2777', '#ea580c',
  '#16a34a', '#0891b2', '#b45309', '#4f46e5',
];

const colourFor = name => {
  if (!name) return COLOURS[0];
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return COLOURS[code % COLOURS.length];
};

export default function Avatar({ src, name = '', size = 40, style = {}, onClick }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  const base = {
    width:          size,
    height:         size,
    borderRadius:   '50%',
    flexShrink:     0,
    overflow:       'hidden',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    cursor:         onClick ? 'pointer' : 'default',
    ...style,
  };

  if (src) {
    return (
      <div style={base} onClick={onClick}>
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.style.display = 'none'; e.target.parentNode.dataset.fallback = 'true'; }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...base,
        background:  colourFor(name),
        color:       '#fff',
        fontSize:    size * 0.38,
        fontWeight:  700,
        letterSpacing: '-0.5px',
      }}
      onClick={onClick}
    >
      {initials || '?'}
    </div>
  );
}
