import { useNavigate } from 'react-router-dom';

export default function BackButton({ label = '← Back', fallback = '/', style = {} }) {
  const navigate = useNavigate();

  const handleClick = () => {
    // If there's history to go back to, use it — otherwise go to fallback
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        background: 'none',
        border: 'none',
        fontSize: 14,
        color: '#374151',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        ...style,
      }}
    >
      {label}
    </button>
  );
}
