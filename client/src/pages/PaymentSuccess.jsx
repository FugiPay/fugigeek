import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function PaymentSuccess() {
  const [params]     = useSearchParams();
  const { isBusiness, isIndividual, isProfessional } = useAuth();
  const orderId      = params.get('orderId');
  const dashPath     = (isBusiness || isIndividual) ? '/dashboard/business' : isProfessional ? '/dashboard/professional' : '/dashboard/admin';

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.icon}>✅</div>
        <h1 style={s.title}>Payment confirmed!</h1>
        <p style={s.sub}>
          Your payment was successful. The professional has been notified
          and your order is now active.
        </p>

        {orderId && (
          <Link to={`/orders/${orderId}`} style={s.primaryBtn}>
            View order →
          </Link>
        )}

        <Link to={dashPath} style={s.secondaryBtn}>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

const s = {
  page:        { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', padding: 24 },
  card:        { background: '#fff', borderRadius: 16, padding: '48px 40px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,.08)' },
  icon:        { fontSize: 56, marginBottom: 20 },
  title:       { fontSize: 26, fontWeight: 700, color: '#111827', marginBottom: 12 },
  sub:         { fontSize: 15, color: '#6b7280', lineHeight: 1.7, marginBottom: 28 },
  primaryBtn:  { display: 'block', background: '#16a34a', color: '#fff', padding: '13px 24px', borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none', marginBottom: 12 },
  secondaryBtn:{ display: 'block', background: '#f3f4f6', color: '#374151', padding: '13px 24px', borderRadius: 10, fontWeight: 500, fontSize: 15, textDecoration: 'none' },
};
