import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function PaymentCancel() {
  const [params]  = useSearchParams();
  const { isBusiness, isIndividual } = useAuth();
  const reason    = params.get('reason');
  const error     = params.get('error');
  const orderId   = params.get('orderId');
  const dashPath  = (isBusiness || isIndividual) ? '/dashboard/business' : '/dashboard/professional';

  const isCancelled = reason === 'cancelled';

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.icon}>{isCancelled ? '↩️' : '❌'}</div>
        <h1 style={s.title}>
          {isCancelled ? 'Payment cancelled' : 'Payment failed'}
        </h1>
        <p style={s.sub}>
          {isCancelled
            ? 'You cancelled the payment. No charge was made. You can try again from your order page.'
            : `Something went wrong with your payment${error ? `: ${error}` : '. Please try again.'}`}
        </p>

        {orderId && (
          <Link to={`/orders/${orderId}`} style={s.primaryBtn}>
            Return to order →
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
  page:        { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', padding: 24 },
  card:        { background: '#fff', borderRadius: 16, padding: '48px 40px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,.08)' },
  icon:        { fontSize: 56, marginBottom: 20 },
  title:       { fontSize: 26, fontWeight: 700, color: '#111827', marginBottom: 12 },
  sub:         { fontSize: 15, color: '#6b7280', lineHeight: 1.7, marginBottom: 28 },
  primaryBtn:  { display: 'block', background: '#2563eb', color: '#fff', padding: '13px 24px', borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none', marginBottom: 12 },
  secondaryBtn:{ display: 'block', background: '#f3f4f6', color: '#374151', padding: '13px 24px', borderRadius: 10, fontWeight: 500, fontSize: 15, textDecoration: 'none' },
};
