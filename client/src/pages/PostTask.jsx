import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import listingsAPI from '../api/listings';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES = [
  'Web Development','Mobile Development','Design & Creative','Digital Marketing',
  'Content & Writing','Data & Analytics','Finance & Accounting','Legal & Compliance',
  'HR & Recruitment','Sales & Business Dev','Project Management','IT & Networking',
  'Engineering','Operations','Other',
];
const SKILLS = [
  'Project Management','Web Development','Graphic Design','Content Writing','Data Analysis',
  'Digital Marketing','Financial Consulting','Legal Advisory','HR & Recruitment','Sales Strategy',
  'Mobile Development','IT & Networking','Engineering','Operations',
];

export default function PostTask() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const dashPath = user?.role === 'professional'
    ? '/dashboard/professional'
    : '/dashboard/business';
  const [form, setForm] = useState({
    title: '', description: '', category: '', budgetType: 'fixed',
    budgetMin: '', budgetMax: '', currency: 'ZMW', deadline: '',
    duration: '', locationType: 'remote', location: '',
  });
  const [skills,   setSkills]   = useState([]);
  const [tags,     setTags]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const onChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const toggleSkill = sk => setSkills(p => p.includes(sk) ? p.filter(s => s !== sk) : [...p, sk]);

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = {
        ...form,
        budgetMin: Number(form.budgetMin) || undefined,
        budgetMax: Number(form.budgetMax) || undefined,
        skillsRequired: skills,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      const { data } = await listingsAPI.create(payload);
      navigate(`/listings/${data.task._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post task');
    } finally { setLoading(false); }
  };

  if (!isAuthenticated) return (
    <div style={s.center}>
      <p>Please sign in to post a task.</p>
      <Link to="/login" style={s.btn}>Sign in</Link>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={{ padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <Link to={dashPath} style={{ fontSize: 14, color: '#374151' }}>← Dashboard</Link>
      </div>

      <div style={s.wrap}>
        <h1 style={s.title}>Post a new task</h1>
        <p style={s.sub}>Describe what you need and receive proposals from experienced professionals</p>

        {error && <div style={s.alert}>{error}</div>}

        <form onSubmit={submit} style={s.form}>
          {/* Basic info */}
          <div style={s.card}>
            <h2 style={s.cardTitle}>Task details</h2>

            <label style={s.label}>Task title *</label>
            <input style={s.input} name="title" placeholder="e.g. Build a React dashboard for our SaaS platform"
              value={form.title} onChange={onChange} required maxLength={150} />

            <label style={s.label}>Category *</label>
            <select style={s.input} name="category" value={form.category} onChange={onChange} required>
              <option value="">Select a category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <label style={s.label}>Description *</label>
            <textarea style={s.textarea} name="description" rows={8}
              placeholder="Describe the task in detail. Include goals, deliverables, technical requirements, and any context that will help professionals understand what you need…"
              value={form.description} onChange={onChange} required maxLength={5000} />
            <div style={s.charCount}>{form.description.length}/5000</div>
          </div>

          {/* Skills */}
          <div style={s.card}>
            <h2 style={s.cardTitle}>Skills required</h2>
            <div style={s.skillWrap}>
              {SKILLS.map(sk => (
                <button key={sk} type="button"
                  style={{ ...s.skillBtn, ...(skills.includes(sk) ? s.skillOn : {}) }}
                  onClick={() => toggleSkill(sk)}>{sk}</button>
              ))}
            </div>
            <label style={{ ...s.label, marginTop: 16 }}>Tags (comma separated)</label>
            <input style={s.input} name="tags" placeholder="e.g. react, typescript, dashboard"
              value={tags} onChange={e => setTags(e.target.value)} />
          </div>

          {/* Budget */}
          <div style={s.card}>
            <h2 style={s.cardTitle}>Budget & timeline</h2>

            <label style={s.label}>Budget type *</label>
            <div style={s.radioGroup}>
              {['fixed','hourly'].map(t => (
                <label key={t} style={s.radioLabel}>
                  <input type="radio" name="budgetType" value={t} checked={form.budgetType === t} onChange={onChange} />
                  {t === 'fixed' ? 'Fixed price' : 'Hourly rate'}
                </label>
              ))}
            </div>

            <div style={s.row}>
              <div style={{ flex: 1 }}>
                <label style={s.label}>Min budget (ZMW)</label>
                <input style={s.input} name="budgetMin" type="number" min="0" placeholder="e.g. 200"
                  value={form.budgetMin} onChange={onChange} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={s.label}>Max budget (ZMW)</label>
                <input style={s.input} name="budgetMax" type="number" min="0" placeholder="e.g. 1000"
                  value={form.budgetMax} onChange={onChange} />
              </div>
            </div>

            <div style={s.row}>
              <div style={{ flex: 1 }}>
                <label style={s.label}>Deadline</label>
                <input style={s.input} name="deadline" type="date" value={form.deadline} onChange={onChange} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={s.label}>Expected duration</label>
                <select style={s.input} name="duration" value={form.duration} onChange={onChange}>
                  <option value="">Select duration</option>
                  {['less than a week','1-2 weeks','2-4 weeks','1-3 months','3-6 months','ongoing'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div style={s.card}>
            <h2 style={s.cardTitle}>Location preference</h2>
            <div style={s.radioGroup}>
              {['remote','on-site','hybrid'].map(t => (
                <label key={t} style={s.radioLabel}>
                  <input type="radio" name="locationType" value={t} checked={form.locationType === t} onChange={onChange} />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </label>
              ))}
            </div>
            {form.locationType !== 'remote' && (
              <>
                <label style={{ ...s.label, marginTop: 12 }}>Location</label>
                <input style={s.input} name="location" placeholder="City, Country" value={form.location} onChange={onChange} />
              </>
            )}
          </div>

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Posting task…' : 'Post task'}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  page:       { minHeight: '100vh', background: '#f9fafb' },
  center:     { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '60vh' },
  nav:        { background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px' },
  navInner:   { maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 },
  logo:       { fontSize: 20, fontWeight: 700, color: '#2563eb' },
  wrap:       { maxWidth: 780, margin: '0 auto', padding: '32px 24px' },
  title:      { fontSize: 26, fontWeight: 700, marginBottom: 6 },
  sub:        { color: '#6b7280', marginBottom: 28, fontSize: 15 },
  alert:      { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14 },
  form:       { display: 'flex', flexDirection: 'column', gap: 20 },
  card:       { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 },
  cardTitle:  { fontSize: 16, fontWeight: 600, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' },
  label:      { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4, marginTop: 12 },
  input:      { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' },
  textarea:   { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
  charCount:  { fontSize: 11, color: '#9ca3af', textAlign: 'right', marginTop: 4 },
  row:        { display: 'flex', gap: 16 },
  radioGroup: { display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 4 },
  radioLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' },
  skillWrap:  { display: 'flex', flexWrap: 'wrap', gap: 8 },
  skillBtn:   { padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 20, fontSize: 13, cursor: 'pointer', background: '#fff' },
  skillOn:    { background: '#eff6ff', borderColor: '#2563eb', color: '#2563eb' },
  btn:        { padding: '13px 28px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'pointer' },
};
