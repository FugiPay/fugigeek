import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const SKILLS = [
  'Project Management','Web Development','Graphic Design','Content Writing','Data Analysis',
  'Digital Marketing','Financial Consulting','Legal Advisory','HR & Recruitment','Sales Strategy',
  'Mobile Development','IT & Networking','Engineering','Operations',
];
const INDUSTRIES = ['Technology','Finance','Healthcare','Education','Marketing','Legal','Design','Engineering','Operations','Other'];

const ROLES = [
  {
    key:   'individual',
    icon:  '👤',
    title: 'Individual',
    desc:  'I need to get something done — hire a professional for a personal or one-off task.',
  },
  {
    key:   'business',
    icon:  '🏢',
    title: 'Business',
    desc:  'I represent a company looking to hire professionals and scale our team on demand.',
  },
  {
    key:   'professional',
    icon:  '💼',
    title: 'Professional',
    desc:  'I have skills to offer — I want to find tasks and earn by helping others.',
  },
];

export default function Register() {
  const { register, loading, error } = useAuth();
  const [step,    setStep]    = useState(1);
  const [role,    setRole]    = useState('');
  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirm: '', phone: '' });
  const [profile, setProfile] = useState({});
  const [skills,  setSkills]  = useState([]);
  const [fErr,    setFErr]    = useState('');

  const onForm    = e => setForm(p    => ({ ...p, [e.target.name]: e.target.value }));
  const onProfile = e => setProfile(p => ({ ...p, [e.target.name]: e.target.value }));
  const toggleSkill = sk => setSkills(p => p.includes(sk) ? p.filter(s => s !== sk) : [...p, sk]);

  const submit = async e => {
    e.preventDefault(); setFErr('');
    if (form.password !== form.confirm) return setFErr('Passwords do not match');
    if (form.password.length < 8)       return setFErr('Password must be at least 8 characters');

    const payload = {
      name: form.name, email: form.email, password: form.password,
      role, phone: form.phone,
      ...(role === 'individual'   && { individualProfile:   profile }),
      ...(role === 'business'     && { businessProfile:     profile }),
      ...(role === 'professional' && { professionalProfile: { ...profile, skills } }),
    };
    await register(payload);
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link to="/" style={s.logo}>Fugigeek</Link>
        <h1 style={s.title}>Create your account</h1>

        {(error || fErr) && <div style={s.alert}>{error || fErr}</div>}

        {/* Step 1 — choose role */}
        {step === 1 && (
          <>
            <p style={s.sub}>How will you be using Fugigeek?</p>
            <div style={s.roleGrid}>
              {ROLES.map(r => (
                <button key={r.key} type="button"
                  style={{ ...s.roleBtn, ...(role === r.key ? s.roleActive : {}) }}
                  onClick={() => setRole(r.key)}>
                  <span style={s.roleIcon}>{r.icon}</span>
                  <strong style={s.roleTitle}>{r.title}</strong>
                  <span style={s.roleDesc}>{r.desc}</span>
                </button>
              ))}
            </div>
            <button style={s.btn} onClick={() => role && setStep(2)} disabled={!role}>
              Continue
            </button>
            <p style={s.footer}>
              Already have an account? <Link to="/login" style={{ color: '#2563eb' }}>Sign in</Link>
            </p>
          </>
        )}

        {/* Step 2 — account + profile details */}
        {step === 2 && (
          <form onSubmit={submit}>
            <div style={s.roleBadge}>
              {ROLES.find(r => r.key === role)?.icon} {ROLES.find(r => r.key === role)?.title}
            </div>

            {/* Core fields */}
            <label style={s.label}>Full name</label>
            <input style={s.input} name="name" placeholder="Jane Smith"
              value={form.name} onChange={onForm} required />

            <label style={s.label}>Email address</label>
            <input style={s.input} name="email" type="email" placeholder="jane@email.com"
              value={form.email} onChange={onForm} required />

            <label style={s.label}>Phone number</label>
            <input style={s.input} name="phone" type="tel" placeholder="+260 97 000 0000"
              value={form.phone} onChange={onForm} />

            <label style={s.label}>Password</label>
            <input style={s.input} name="password" type="password" placeholder="Min. 8 characters"
              value={form.password} onChange={onForm} required />

            <label style={s.label}>Confirm password</label>
            <input style={s.input} name="confirm" type="password" placeholder="Repeat password"
              value={form.confirm} onChange={onForm} required />

            {/* Individual profile */}
            {role === 'individual' && (
              <>
                <hr style={s.hr} />
                <p style={s.section}>A bit about you</p>
                <label style={s.label}>Occupation</label>
                <input style={s.input} name="occupation" placeholder="e.g. Teacher, Student, Entrepreneur"
                  onChange={onProfile} />
                <label style={s.label}>Location</label>
                <input style={s.input} name="location" placeholder="City, Zambia"
                  onChange={onProfile} />
              </>
            )}

            {/* Business profile */}
            {role === 'business' && (
              <>
                <hr style={s.hr} />
                <p style={s.section}>Company details</p>
                <label style={s.label}>Company name</label>
                <input style={s.input} name="companyName" placeholder="Acme Corp"
                  onChange={onProfile} />
                <label style={s.label}>Industry</label>
                <select style={s.input} name="industry" onChange={onProfile} defaultValue="">
                  <option value="" disabled>Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <label style={s.label}>Company size</label>
                <select style={s.input} name="companySize" onChange={onProfile} defaultValue="">
                  <option value="" disabled>Select size</option>
                  {['1-10','11-50','51-200','201-500','500+'].map(s => (
                    <option key={s} value={s}>{s} employees</option>
                  ))}
                </select>
                <label style={s.label}>Location</label>
                <input style={s.input} name="location" placeholder="City, Zambia"
                  onChange={onProfile} />
              </>
            )}

            {/* Professional profile */}
            {role === 'professional' && (
              <>
                <hr style={s.hr} />
                <p style={s.section}>Professional details</p>
                <label style={s.label}>Headline</label>
                <input style={s.input} name="headline"
                  placeholder="e.g. Senior Full-Stack Developer" onChange={onProfile} />
                <label style={s.label}>Hourly rate (ZMW)</label>
                <input style={s.input} name="hourlyRate" type="number"
                  placeholder="e.g. 500" onChange={onProfile} />
                <label style={s.label}>Location</label>
                <input style={s.input} name="location" placeholder="City, Zambia"
                  onChange={onProfile} />
                <label style={s.label}>Skills</label>
                <div style={s.skillWrap}>
                  {SKILLS.map(sk => (
                    <button key={sk} type="button"
                      style={{ ...s.skillBtn, ...(skills.includes(sk) ? s.skillOn : {}) }}
                      onClick={() => toggleSkill(sk)}>{sk}</button>
                  ))}
                </div>
              </>
            )}

            <button style={{ ...s.btn, marginTop: 24 }} type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
            <button type="button" style={s.back} onClick={() => setStep(1)}>← Back</button>
          </form>
        )}
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', padding: '24px 16px' },
  card:      { background: '#fff', borderRadius: 12, padding: '40px 36px', width: '100%', maxWidth: 540, boxShadow: '0 4px 24px rgba(0,0,0,.08)' },
  logo:      { fontSize: 22, fontWeight: 800, color: '#2563eb', textDecoration: 'none', display: 'block', marginBottom: 12 },
  title:     { fontSize: 24, fontWeight: 700, marginBottom: 6 },
  sub:       { color: '#6b7280', marginBottom: 20, fontSize: 15 },
  alert:     { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14 },
  roleGrid:  { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 },
  roleBtn:   { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px', border: '2px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', background: '#fff', textAlign: 'left' },
  roleActive:{ borderColor: '#2563eb', background: '#eff6ff' },
  roleIcon:  { fontSize: 26, flexShrink: 0, marginTop: 2 },
  roleTitle: { display: 'block', fontSize: 15, fontWeight: 600, marginBottom: 2 },
  roleDesc:  { display: 'block', fontSize: 13, color: '#6b7280', lineHeight: 1.5 },
  btn:       { width: '100%', padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 8 },
  back:      { width: '100%', padding: 10, background: 'none', color: '#6b7280', border: 'none', fontSize: 14, cursor: 'pointer', marginTop: 8 },
  roleBadge: { display: 'inline-block', background: '#eff6ff', color: '#2563eb', fontSize: 13, borderRadius: 6, padding: '4px 10px', marginBottom: 20 },
  label:     { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4, marginTop: 12 },
  input:     { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' },
  hr:        { border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0 4px' },
  section:   { fontSize: 13, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 },
  skillWrap: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  skillBtn:  { padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: '#fff' },
  skillOn:   { background: '#eff6ff', borderColor: '#2563eb', color: '#2563eb' },
  footer:    { textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 16 },
};
