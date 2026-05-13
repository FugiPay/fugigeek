import { useState } from 'react';
import { Link } from 'react-router-dom';
import authAPI from '../api/auth';

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link to="/" style={s.logo}>Fugigeek</Link>
        <h1 style={s.title}>Forgot your password?</h1>

        {sent ? (
          <div style={s.success}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
            <p>If an account exists for <strong>{email}</strong>, you'll receive a reset link shortly.</p>
            <p style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>Check your spam folder if you don't see it.</p>
            <Link to="/login" style={s.btn}>Back to sign in</Link>
          </div>
        ) : (
          <>
            <p style={s.sub}>Enter your email and we'll send you a link to reset your password.</p>
            {error && <div style={s.alert}>{error}</div>}
            <form onSubmit={submit}>
              <label style={s.label}>Email address</label>
              <input style={s.input} type="email" placeholder="jane@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
              <button style={s.btn} type="submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <p style={s.footer}>
              <Link to="/login" style={{ color: '#2563eb' }}>← Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page:    { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', padding: 16 },
  card:    { background: '#fff', borderRadius: 12, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,.08)' },
  logo:    { fontSize: 22, fontWeight: 800, color: '#2563eb', textDecoration: 'none', display: 'block', marginBottom: 12 },
  title:   { fontSize: 24, fontWeight: 700, marginBottom: 6 },
  sub:     { color: '#6b7280', marginBottom: 24, fontSize: 15 },
  alert:   { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14 },
  success: { textAlign: 'center', color: '#374151', lineHeight: 1.6 },
  label:   { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4, marginTop: 12 },
  input:   { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' },
  btn:     { display: 'block', width: '100%', padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 20, textAlign: 'center', textDecoration: 'none' },
  footer:  { textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 16 },
};
