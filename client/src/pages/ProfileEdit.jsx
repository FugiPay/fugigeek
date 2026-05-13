import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const SKILLS = [
  'Project Management','Web Development','Graphic Design','Content Writing','Data Analysis',
  'Digital Marketing','Financial Consulting','Legal Advisory','HR & Recruitment','Sales Strategy',
  'Mobile Development','IT & Networking','Engineering','Operations',
];
const INDUSTRIES = ['Technology','Finance','Healthcare','Education','Marketing','Legal','Design','Engineering','Operations','Other'];

export default function ProfileEdit() {
  const { user, updateProfile, loading, error, isBusiness, isProfessional } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name:  user?.name  || '',
    phone: user?.phone || '',
    // Business fields
    companyName:  user?.businessProfile?.companyName  || '',
    industry:     user?.businessProfile?.industry     || '',
    companySize:  user?.businessProfile?.companySize  || '',
    website:      user?.businessProfile?.website      || '',
    description:  user?.businessProfile?.description  || '',
    bizLocation:  user?.businessProfile?.location     || '',
    // Professional fields
    headline:     user?.professionalProfile?.headline     || '',
    bio:          user?.professionalProfile?.bio          || '',
    hourlyRate:   user?.professionalProfile?.hourlyRate   || '',
    availability: user?.professionalProfile?.availability || 'contract',
    proLocation:  user?.professionalProfile?.location     || '',
    responseTime: user?.professionalProfile?.responseTime || 'within 24 hours',
  });
  const [skills, setSkills] = useState(user?.professionalProfile?.skills || []);

  const onChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const toggleSkill = sk => setSkills(p => p.includes(sk) ? p.filter(s => s !== sk) : [...p, sk]);

  const submit = async e => {
    e.preventDefault();
    setSaved(false);

    const payload = { name: form.name, phone: form.phone };

    if (isBusiness) {
      payload.businessProfile = {
        companyName:  form.companyName,
        industry:     form.industry,
        companySize:  form.companySize,
        website:      form.website,
        description:  form.description,
        location:     form.bizLocation,
      };
    }

    if (isProfessional) {
      payload.professionalProfile = {
        headline:     form.headline,
        bio:          form.bio,
        hourlyRate:   Number(form.hourlyRate) || undefined,
        availability: form.availability,
        location:     form.proLocation,
        responseTime: form.responseTime,
        skills,
      };
    }

    const updated = await updateProfile(payload);
    if (updated) setSaved(true);
  };

  return (
    <div style={s.page}>
      <div style={{ padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <Link to={isBusiness ? '/dashboard/business' : '/dashboard/professional'} style={{ fontSize: 14, color: '#374151' }}>
          ← Back to dashboard
        </Link>
      </div>

      <div style={s.wrap}>
        <h1 style={s.title}>Edit Profile</h1>
        <p style={s.sub}>Keep your profile up to date to attract the right opportunities</p>

        {error && <div style={s.alert}>{error}</div>}
        {saved  && <div style={s.success}>✅ Profile updated successfully!</div>}

        <form onSubmit={submit} style={s.form}>

          {/* Basic info */}
          <div style={s.card}>
            <h2 style={s.cardTitle}>Basic information</h2>
            <label style={s.label}>Full name</label>
            <input style={s.input} name="name" value={form.name} onChange={onChange} required />

            <label style={s.label}>Phone number</label>
            <input style={s.input} name="phone" type="tel" value={form.phone} onChange={onChange}
              placeholder="+260 97 000 0000" />
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
              Visible to logged-in users on your public profile so clients can call you directly.
            </p>
          </div>

          {/* Business profile */}
          {isBusiness && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Company details</h2>

              <label style={s.label}>Company name</label>
              <input style={s.input} name="companyName" value={form.companyName} onChange={onChange} placeholder="Acme Corp" />

              <label style={s.label}>Industry</label>
              <select style={s.input} name="industry" value={form.industry} onChange={onChange}>
                <option value="">Select industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>

              <label style={s.label}>Company size</label>
              <select style={s.input} name="companySize" value={form.companySize} onChange={onChange}>
                <option value="">Select size</option>
                {['1-10','11-50','51-200','201-500','500+'].map(s => (
                  <option key={s} value={s}>{s} employees</option>
                ))}
              </select>

              <label style={s.label}>Website</label>
              <input style={s.input} name="website" value={form.website} onChange={onChange} placeholder="https://yourcompany.com" />

              <label style={s.label}>Location</label>
              <input style={s.input} name="bizLocation" value={form.bizLocation} onChange={onChange} placeholder="City, Country" />

              <label style={s.label}>Company description</label>
              <textarea style={s.textarea} name="description" rows={4} value={form.description} onChange={onChange}
                placeholder="Tell professionals about your company…" maxLength={1000} />
              <div style={s.charCount}>{form.description.length}/1000</div>
            </div>
          )}

          {/* Professional profile */}
          {isProfessional && (
            <>
              <div style={s.card}>
                <h2 style={s.cardTitle}>Professional details</h2>

                <label style={s.label}>Headline</label>
                <input style={s.input} name="headline" value={form.headline} onChange={onChange}
                  placeholder="e.g. Senior Full-Stack Developer" maxLength={150} />

                <label style={s.label}>Bio</label>
                <textarea style={s.textarea} name="bio" rows={5} value={form.bio} onChange={onChange}
                  placeholder="Tell businesses about your experience, approach, and what makes you stand out…" maxLength={2000} />
                <div style={s.charCount}>{form.bio.length}/2000</div>

                <div style={s.row}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Hourly rate (ZMW)</label>
                    <input style={s.input} name="hourlyRate" type="number" min="0"
                      value={form.hourlyRate} onChange={onChange} placeholder="e.g. 500" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Availability</label>
                    <select style={s.input} name="availability" value={form.availability} onChange={onChange}>
                      {['full-time','part-time','weekends','contract'].map(a => (
                        <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <label style={s.label}>Location</label>
                <input style={s.input} name="proLocation" value={form.proLocation} onChange={onChange} placeholder="City, Country" />

                <label style={s.label}>Typical response time</label>
                <select style={s.input} name="responseTime" value={form.responseTime} onChange={onChange}>
                  {['within 1 hour','within a few hours','within 24 hours','within 2 days'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div style={s.card}>
                <h2 style={s.cardTitle}>Skills</h2>
                <div style={s.skillWrap}>
                  {SKILLS.map(sk => (
                    <button key={sk} type="button"
                      style={{ ...s.skillBtn, ...(skills.includes(sk) ? s.skillOn : {}) }}
                      onClick={() => toggleSkill(sk)}>{sk}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div style={s.actions}>
            <button style={s.btn} type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </button>
            <Link to={isBusiness ? '/dashboard/business' : '/dashboard/professional'} style={s.cancel}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight: '100vh', background: '#f9fafb' },
  nav:       { background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px' },
  navInner:  { maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 },
  logo:      { fontSize: 20, fontWeight: 700, color: '#2563eb' },
  back:      { fontSize: 14, color: '#374151' },
  wrap:      { maxWidth: 680, margin: '0 auto', padding: '32px 24px' },
  title:     { fontSize: 26, fontWeight: 700, marginBottom: 6 },
  sub:       { color: '#6b7280', marginBottom: 28, fontSize: 15 },
  alert:     { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 14 },
  success:   { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 14 },
  form:      { display: 'flex', flexDirection: 'column', gap: 20 },
  card:      { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' },
  label:     { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4, marginTop: 12 },
  input:     { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' },
  textarea:  { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
  charCount: { fontSize: 11, color: '#9ca3af', textAlign: 'right', marginTop: 4 },
  row:       { display: 'flex', gap: 16 },
  skillWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  skillBtn:  { padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 20, fontSize: 13, cursor: 'pointer', background: '#fff' },
  skillOn:   { background: '#eff6ff', borderColor: '#2563eb', color: '#2563eb' },
  actions:   { display: 'flex', alignItems: 'center', gap: 16 },
  btn:       { padding: '12px 28px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'pointer' },
  cancel:    { fontSize: 14, color: '#6b7280' },
};
