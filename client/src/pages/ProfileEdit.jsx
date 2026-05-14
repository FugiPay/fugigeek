import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import uploadAPI from '../api/upload';
import Avatar from '../components/common/Avatar';
import { setCredentials } from '../store/slices/authSlice';

const SKILLS = [
  'Project Management','Web Development','Graphic Design','Content Writing','Data Analysis',
  'Digital Marketing','Financial Consulting','Legal Advisory','HR & Recruitment','Sales Strategy',
  'Mobile Development','IT & Networking','Engineering','Operations',
];
const INDUSTRIES = ['Technology','Finance','Healthcare','Education','Marketing','Legal','Design','Engineering','Operations','Other'];

export default function ProfileEdit() {
  const { user, updateProfile, loading, error, isBusiness, isProfessional, isAdmin, isManager } = useAuth();
  const dispatch = useDispatch();
  const isStaff  = isAdmin || isManager;
  const [saved,           setSaved]           = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview,   setAvatarPreview]   = useState(user?.avatar || '');
  const avatarInputRef = useRef(null);

  // Keep preview in sync with store (e.g. after Redux updates)
  useEffect(() => {
    if (user?.avatar) setAvatarPreview(user.avatar);
  }, [user?.avatar]);

  const [form, setForm] = useState({
    name:  user?.name  || '',
    phone: user?.phone || '',
    companyName:  user?.businessProfile?.companyName  || '',
    industry:     user?.businessProfile?.industry     || '',
    companySize:  user?.businessProfile?.companySize  || '',
    website:      user?.businessProfile?.website      || '',
    description:  user?.businessProfile?.description  || '',
    bizLocation:  user?.businessProfile?.location     || '',
    headline:     user?.professionalProfile?.headline     || '',
    bio:          user?.professionalProfile?.bio          || '',
    hourlyRate:   user?.professionalProfile?.hourlyRate   || '',
    availability: user?.professionalProfile?.availability || 'contract',
    proLocation:  user?.professionalProfile?.location     || '',
    responseTime: user?.professionalProfile?.responseTime || 'within 24 hours',
  });

  const [skills,    setSkills]    = useState(user?.professionalProfile?.skills    || []);
  const [portfolio, setPortfolio] = useState(user?.professionalProfile?.portfolio || []);
  const [newPortfolioItem, setNewPortfolioItem] = useState({ title: '', url: '', description: '', imageUrl: '', imageKey: '' });
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const portfolioImgRef = useRef(null);

  const onChange    = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const toggleSkill = sk => setSkills(p => p.includes(sk) ? p.filter(s => s !== sk) : [...p, sk]);

  // ── Avatar upload ────────────────────────────────────────────────────────────
  const handleAvatarChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);

    // Show instant local preview
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    try {
      const response = await uploadAPI.avatar(file);
      console.log('=== UPLOAD RESPONSE ===', response.data);
      const newAvatarUrl = response.data.avatar;
      console.log('New avatar URL:', newAvatarUrl);

      if (!newAvatarUrl) {
        console.error('No avatar URL returned from server');
        setAvatarPreview(user?.avatar || '');
        return;
      }

      setAvatarPreview(newAvatarUrl);
      const token = localStorage.getItem('tb_token');
      dispatch(setCredentials({
        user:  { ...user, avatar: newAvatarUrl },
        token,
      }));
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setAvatarPreview(user?.avatar || ''); // revert on error
    } finally {
      setAvatarUploading(false);
    }
  };

  // ── Portfolio image upload ────────────────────────────────────────────────────
  const handlePortfolioImageChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPortfolioUploading(true);
    try {
      const { data } = await uploadAPI.portfolioImage(file);
      setNewPortfolioItem(p => ({ ...p, imageUrl: data.url, imageKey: data.key }));
    } catch (err) {
      console.error('Portfolio image upload failed:', err);
    } finally { setPortfolioUploading(false); }
  };

  const addPortfolioItem = () => {
    if (!newPortfolioItem.title) return;
    setPortfolio(p => [...p, { ...newPortfolioItem }]);
    setNewPortfolioItem({ title: '', url: '', description: '', imageUrl: '', imageKey: '' });
  };

  const removePortfolioItem = async (index) => {
    const item = portfolio[index];
    if (item.imageKey) {
      await uploadAPI.deletePortfolioImage(item.imageKey).catch(() => {});
    }
    setPortfolio(p => p.filter((_, i) => i !== index));
  };

  // ── Save profile ──────────────────────────────────────────────────────────────
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
        portfolio,
      };
    }

    const updated = await updateProfile(payload);
    if (updated) setSaved(true);
  };

  const dashPath = isStaff ? '/dashboard/admin' : isBusiness ? '/dashboard/business' : '/dashboard/professional';

  return (
    <div style={s.page}>
      <div style={{ padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <Link to={dashPath} style={{ fontSize: 14, color: '#374151' }}>← Back to dashboard</Link>
      </div>

      <div style={s.wrap}>
        <h1 style={s.title}>Edit Profile</h1>
        <p style={s.sub}>Keep your profile up to date to attract the right opportunities</p>

        {error && <div style={s.alert}>{error}</div>}
        {saved  && <div style={s.success}>✅ Profile updated successfully!</div>}

        <form onSubmit={submit} style={s.form}>

          {/* ── Avatar ── */}
          <div style={s.card}>
            <h2 style={s.cardTitle}>Profile Photo</h2>
            <div style={s.avatarRow}>
              <div style={{ position: 'relative' }}>
                <Avatar src={avatarPreview} name={user?.name} size={80} />
                {avatarUploading && (
                  <div style={s.avatarOverlay}>⏳</div>
                )}
              </div>
              <div>
                <button type="button" style={s.uploadBtn}
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}>
                  {avatarUploading ? 'Uploading…' : '📷 Change photo'}
                </button>
                <p style={s.uploadHint}>JPG, PNG or WebP. Max 5MB.</p>
                <input ref={avatarInputRef} type="file" accept="image/*"
                  style={{ display: 'none' }} onChange={handleAvatarChange} />
              </div>
            </div>
          </div>

          {/* ── Basic info ── */}
          <div style={s.card}>
            <h2 style={s.cardTitle}>Basic information</h2>
            <label style={s.label}>Full name</label>
            <input style={s.input} name="name" value={form.name} onChange={onChange} required />
            <label style={s.label}>Phone number</label>
            <input style={s.input} name="phone" type="tel" placeholder="+260 97 000 0000"
              value={form.phone} onChange={onChange} />
            <p style={s.hint}>Visible on your public profile so clients can call you directly.</p>
          </div>

          {/* ── Business profile ── */}
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
              <input style={s.input} name="bizLocation" value={form.bizLocation} onChange={onChange} placeholder="City, Zambia" />
              <label style={s.label}>Company description</label>
              <textarea style={s.textarea} name="description" rows={4} value={form.description}
                onChange={onChange} placeholder="Tell professionals about your company…" maxLength={1000} />
              <div style={s.charCount}>{form.description.length}/1000</div>
            </div>
          )}

          {/* ── Professional profile ── */}
          {isProfessional && (
            <>
              <div style={s.card}>
                <h2 style={s.cardTitle}>Professional details</h2>
                <label style={s.label}>Headline</label>
                <input style={s.input} name="headline" value={form.headline} onChange={onChange}
                  placeholder="e.g. Senior Full-Stack Developer" maxLength={150} />
                <label style={s.label}>Bio</label>
                <textarea style={s.textarea} name="bio" rows={5} value={form.bio} onChange={onChange}
                  placeholder="Tell clients about your experience and what makes you stand out…" maxLength={2000} />
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
                <input style={s.input} name="proLocation" value={form.proLocation} onChange={onChange} placeholder="City, Zambia" />
                <label style={s.label}>Typical response time</label>
                <select style={s.input} name="responseTime" value={form.responseTime} onChange={onChange}>
                  {['within 1 hour','within a few hours','within 24 hours','within 2 days'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* ── Skills ── */}
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

              {/* ── Portfolio ── */}
              <div style={s.card}>
                <h2 style={s.cardTitle}>Portfolio</h2>
                <p style={s.hint}>Showcase your best work. Clients look at portfolio items before hiring.</p>

                {/* Existing items */}
                {portfolio.map((item, i) => (
                  <div key={i} style={s.portfolioItem}>
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.title}
                        style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />
                    )}
                    <div style={s.portfolioItemHeader}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</div>
                        {item.url && <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb' }}>{item.url}</a>}
                        {item.description && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{item.description}</p>}
                      </div>
                      <button type="button" style={s.removeBtn}
                        onClick={() => removePortfolioItem(i)}>✕ Remove</button>
                    </div>
                  </div>
                ))}

                {/* Add new item */}
                <div style={s.addPortfolio}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                    Add portfolio item
                  </p>

                  {/* Image upload */}
                  <div style={s.imageUploadBox}
                    onClick={() => portfolioImgRef.current?.click()}>
                    {newPortfolioItem.imageUrl ? (
                      <img src={newPortfolioItem.imageUrl} alt="preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <div style={s.imageUploadPlaceholder}>
                        <span style={{ fontSize: 32 }}>🖼</span>
                        <span style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
                          {portfolioUploading ? 'Uploading…' : 'Click to upload image'}
                        </span>
                      </div>
                    )}
                    <input ref={portfolioImgRef} type="file" accept="image/*"
                      style={{ display: 'none' }} onChange={handlePortfolioImageChange} />
                  </div>

                  <label style={s.label}>Title *</label>
                  <input style={s.input} placeholder="e.g. E-commerce Website for Shoprite"
                    value={newPortfolioItem.title}
                    onChange={e => setNewPortfolioItem(p => ({ ...p, title: e.target.value }))} />

                  <label style={s.label}>Project link (optional)</label>
                  <input style={s.input} placeholder="https://project-url.com"
                    value={newPortfolioItem.url}
                    onChange={e => setNewPortfolioItem(p => ({ ...p, url: e.target.value }))} />

                  <label style={s.label}>Description (optional)</label>
                  <textarea style={s.textarea} rows={3}
                    placeholder="What did you build? What was the outcome?"
                    value={newPortfolioItem.description}
                    onChange={e => setNewPortfolioItem(p => ({ ...p, description: e.target.value }))} />

                  <button type="button" style={s.addBtn}
                    onClick={addPortfolioItem}
                    disabled={!newPortfolioItem.title}>
                    + Add to portfolio
                  </button>
                </div>
              </div>
            </>
          )}

          <div style={s.actions}>
            <button style={s.btn} type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </button>
            <Link to={dashPath} style={s.cancel}>Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  page:               { minHeight: '100vh', background: '#f9fafb' },
  wrap:               { maxWidth: 720, margin: '0 auto', padding: '32px 24px' },
  title:              { fontSize: 26, fontWeight: 700, marginBottom: 6 },
  sub:                { color: '#6b7280', marginBottom: 28, fontSize: 15 },
  alert:              { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 14 },
  success:            { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 14 },
  form:               { display: 'flex', flexDirection: 'column', gap: 20 },
  card:               { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 },
  cardTitle:          { fontSize: 16, fontWeight: 600, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' },
  // Avatar
  avatarRow:          { display: 'flex', alignItems: 'center', gap: 20 },
  avatarOverlay:      { position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  uploadBtn:          { padding: '9px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'block', marginBottom: 8 },
  uploadHint:         { fontSize: 12, color: '#9ca3af' },
  // Form fields
  label:              { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4, marginTop: 12 },
  input:              { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' },
  textarea:           { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
  charCount:          { fontSize: 11, color: '#9ca3af', textAlign: 'right', marginTop: 4 },
  hint:               { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  row:                { display: 'flex', gap: 16 },
  skillWrap:          { display: 'flex', flexWrap: 'wrap', gap: 8 },
  skillBtn:           { padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 20, fontSize: 13, cursor: 'pointer', background: '#fff' },
  skillOn:            { background: '#eff6ff', borderColor: '#2563eb', color: '#2563eb' },
  // Portfolio
  portfolioItem:      { border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 12 },
  portfolioItemHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  removeBtn:          { padding: '5px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, cursor: 'pointer', flexShrink: 0 },
  addPortfolio:       { background: '#f9fafb', borderRadius: 10, padding: 16, border: '1px dashed #d1d5db', marginTop: 4 },
  imageUploadBox:     { width: '100%', height: 180, border: '2px dashed #d1d5db', borderRadius: 10, cursor: 'pointer', overflow: 'hidden', marginBottom: 8, position: 'relative' },
  imageUploadPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' },
  addBtn:             { marginTop: 12, padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  actions:            { display: 'flex', alignItems: 'center', gap: 16 },
  btn:                { padding: '12px 28px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'pointer' },
  cancel:             { fontSize: 14, color: '#6b7280', textDecoration: 'none' },
};
