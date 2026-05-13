import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import authAPI from '../api/auth';
import { setCredentials } from '../store/slices/authSlice';

export default function ResetPassword() {
  const { token }  = useParams();
  const navigate   = useNavigate();
  const dispatch   = useDispatch();
  const [form,     setForm]    = useState({ password: '', confirm: '' });
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');

  const onChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 8)       return setError('Password must be at least 8 characters');
    setLoading(true);
    try {
      const { data } = await authAPI.resetPassword(token, { password: form.password });
      dispatch(setCredentials({ user: data.user, token: data.token }));
      const role = data.user.role;
      navigate(role === 'professional' ? '/dashboard/professional' : '/dashboard/business');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired reset link.');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link to="/" style={s.logo}>Fugigeek</Link>
        <h1 style={s.title}>Set a new password</h1>
        <p style={s.sub}>Enter your new password below.</p>

        {error && <div style={s.alert}>{error}</div>}

        <form onSubmit={submit}>
          <label style={s.label}>New password</label>
          <input style={s.input} name="password" type="password" placeholder="Min. 8 characters"
            value={form.password} onChange={onChange} required />

          <label style={s.label}>Confirm new password</label>
          <input style={s.input} name="confirm" type="password" placeholder="Repeat password"
            value={form.confirm} onChange={onChange} required />

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Set new password'}
          </button>
        </form>

        <p style={s.footer}>
          <Link to="/login" style={{ color: '#2563eb' }}>← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', padding: 16 },
  card:  { background: '#fff', borderRadius: 12, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,.08)' },
  logo:  { fontSize: 22, fontWeight: 800, color: '#2563eb', textDecoration: 'none', display: 'block', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 6 },
  sub:   { color: '#6b7280', marginBottom: 24, fontSize: 15 },
  alert: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4, marginTop: 12 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' },
  btn:   { width: '100%', padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 20 },
  footer:{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 16 },
};
