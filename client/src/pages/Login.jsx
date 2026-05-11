import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login, loading, error } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const onChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>Fugigeek</div>
        <h1 style={s.title}>Welcome back</h1>
        <p style={s.sub}>Sign in to your account</p>

        {error && <div style={s.alert}>{error}</div>}

        <form onSubmit={e => { e.preventDefault(); login(form); }}>
          <label style={s.label}>Email</label>
          <input style={s.input} name="email" type="email" placeholder="jane@company.com"
            value={form.email} onChange={onChange} required />

          <label style={s.label}>Password</label>
          <input style={s.input} name="password" type="password" placeholder="Your password"
            value={form.password} onChange={onChange} required />

          <div style={{ textAlign: 'right', marginTop: 4 }}>
            <Link to="/forgot-password" style={{ color: '#2563eb', fontSize: 13 }}>Forgot password?</Link>
          </div>

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={s.footer}>New to Fugigeek? <Link to="/register" style={{ color: '#2563eb', fontWeight: 500 }}>Create an account</Link></p>
        <div style={s.hint}>🏢 For businesses &nbsp;·&nbsp; 💼 For professionals</div>
      </div>
    </div>
  );
}

const s = {
  page:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', padding: 16 },
  card:  { background: '#fff', borderRadius: 12, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,.08)' },
  logo:  { fontSize: 22, fontWeight: 700, color: '#2563eb', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 600, marginBottom: 4 },
  sub:   { color: '#6b7280', marginBottom: 24, fontSize: 15 },
  alert: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4, marginTop: 14 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' },
  btn:   { width: '100%', padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 20 },
  footer: { textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 20 },
  hint:   { textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 10 },
};
