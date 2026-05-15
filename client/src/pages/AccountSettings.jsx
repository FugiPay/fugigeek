import { usePageTitle } from '../hooks/usePageTitle';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import authAPI from '../api/auth';
import { logout as logoutAction, setCredentials } from '../store/slices/authSlice';

export default function AccountSettings() {
  const { user, isAdmin, isManager } = useAuth();
  usePageTitle('Account settings');
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const dashPath = (isAdmin || isManager) ? '/dashboard/admin'
    : user?.role === 'professional'       ? '/dashboard/professional'
    : '/dashboard/business';

  // Deactivate
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivatePass,  setDeactivatePass]  = useState('');
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [deactivateError,   setDeactivateError]   = useState('');

  // Change password
  const [showPassword,    setShowPassword]    = useState(false);
  const [passForm,        setPassForm]        = useState({ current: '', next: '', confirm: '' });
  const [passLoading,     setPassLoading]     = useState(false);
  const [passError,       setPassError]       = useState('');
  const [passSaved,       setPassSaved]       = useState(false);

  // Delete
  const [showDelete,    setShowDelete]    = useState(false);
  const [deletePass,    setDeletePass]    = useState('');
  const [deleteReason,  setDeleteReason]  = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState('');

  // Cancel task
  const [cancelTaskId,     setCancelTaskId]     = useState('');
  const [cancelTaskReason, setCancelTaskReason] = useState('');

  const handleDeactivate = async () => {
    if (!deactivatePass) return setDeactivateError('Please enter your password');
    setDeactivateLoading(true); setDeactivateError('');
    try {
      await authAPI.deactivateAccount(deactivatePass);
      dispatch(logoutAction());
      navigate('/login?deactivated=true');
    } catch (err) {
      setDeactivateError(err.response?.data?.message || 'Failed to deactivate account');
    } finally { setDeactivateLoading(false); }
  };

  const handleChangePassword = async () => {
    setPassError(''); setPassSaved(false);
    if (!passForm.current)                 return setPassError('Enter your current password');
    if (passForm.next.length < 8)          return setPassError('New password must be at least 8 characters');
    if (passForm.next !== passForm.confirm) return setPassError('Passwords do not match');
    if (passForm.next === passForm.current) return setPassError('New password must be different from current');
    setPassLoading(true);
    try {
      const { data } = await authAPI.updatePassword({
        currentPassword: passForm.current,
        newPassword:     passForm.next,
      });
      // Server returns a new JWT — update the store so the user stays logged in
      if (data?.token) {
        localStorage.setItem('tb_token', data.token);
        if (data.user) {
          localStorage.setItem('tb_user', JSON.stringify(data.user));
          dispatch(setCredentials({ user: data.user, token: data.token }));
        }
      }
      setPassSaved(true);
      setPassForm({ current: '', next: '', confirm: '' });
      setTimeout(() => { setPassSaved(false); setShowPassword(false); }, 3000);
    } catch (err) {
      setPassError(err.response?.data?.message || 'Failed to change password');
    } finally { setPassLoading(false); }
  };

  const handleDeleteRequest = async () => {
    if (!deletePass) return setDeleteError('Please enter your password');
    setDeleteLoading(true); setDeleteError('');
    try {
      await authAPI.requestDeleteAccount(deletePass, deleteReason);
      dispatch(logoutAction());
      navigate('/login?deleted=true');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to submit deletion request');
    } finally { setDeleteLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.breadcrumb}>
        <Link to={dashPath} style={s.breadLink}>← Dashboard</Link>
        <span style={s.sep}>·</span>
        <span style={{ fontSize: 14, color: '#6b7280' }}>Account Settings</span>
      </div>

      <div style={s.wrap}>
        <h1 style={s.title}>Account Settings</h1>
        <p style={s.sub}>Manage your account access and data</p>

        {/* Account info */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Account information</h2>
          <div style={s.infoRow}><span>Name</span><strong>{user?.name}</strong></div>
          <div style={s.infoRow}><span>Email</span><strong>{user?.email}</strong></div>
          <div style={s.infoRow}><span>Role</span><strong style={{ textTransform: 'capitalize' }}>{user?.role}</strong></div>
          <div style={s.infoRow}><span>Member since</span><strong>{new Date(user?.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <Link to="/profile/edit" style={s.editBtn}>✏️ Edit Profile</Link>
          </div>
        </div>

        {/* Change password */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Change password</h2>
          {!showPassword ? (
            <>
              <p style={s.cardDesc}>Keep your account secure with a strong password.</p>
              <button style={s.editBtn} onClick={() => setShowPassword(true)}>🔒 Change password</button>
            </>
          ) : (
            <>
              {passError && <div style={s.errorMsg}>{passError}</div>}
              {passSaved  && <div style={{ ...s.errorMsg, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>✅ Password changed successfully</div>}

              <label style={s.fieldLabel}>Current password</label>
              <input style={{ ...s.input, marginBottom: 4 }} type="password"
                placeholder="Your current password"
                value={passForm.current}
                onChange={e => setPassForm(p => ({ ...p, current: e.target.value }))} />
              {/* Forgot password link — useful if they can't remember current password */}
              <div style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', fontSize: 12, color: '#2563eb', cursor: 'pointer', padding: 0 }}
                  onClick={async () => {
                    try {
                      await authAPI.forgotPassword(user?.email);
                      setPassError('');
                      alert(`A password reset link has been sent to ${user?.email}`);
                    } catch {
                      alert('Could not send reset email. Please try again.');
                    }
                  }}>
                  Forgot your current password?
                </button>
              </div>

              <label style={s.fieldLabel}>New password</label>
              <input style={{ ...s.input, marginBottom: 4 }} type="password"
                placeholder="Min. 8 characters"
                value={passForm.next}
                onChange={e => setPassForm(p => ({ ...p, next: e.target.value }))} />
              {/* Strength indicator */}
              {passForm.next.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ height: 4, borderRadius: 2, background: '#f3f4f6', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: passForm.next.length < 8 ? '33%' : passForm.next.length < 12 ? '66%' : '100%',
                      background: passForm.next.length < 8 ? '#ef4444' : passForm.next.length < 12 ? '#f59e0b' : '#16a34a',
                      borderRadius: 2, transition: 'all .2s',
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: passForm.next.length < 8 ? '#ef4444' : passForm.next.length < 12 ? '#f59e0b' : '#16a34a' }}>
                    {passForm.next.length < 8 ? 'Too short' : passForm.next.length < 12 ? 'Good' : 'Strong'}
                  </span>
                </div>
              )}

              <label style={s.fieldLabel}>Confirm new password</label>
              <input style={{ ...s.input, marginBottom: 16 }} type="password"
                placeholder="Repeat new password"
                value={passForm.confirm}
                onChange={e => setPassForm(p => ({ ...p, confirm: e.target.value }))} />

              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ ...s.editBtn, opacity: passLoading ? .6 : 1 }}
                  onClick={handleChangePassword} disabled={passLoading}>
                  {passLoading ? 'Saving…' : 'Save new password'}
                </button>
                <button style={s.cancelBtn}
                  onClick={() => { setShowPassword(false); setPassForm({ current: '', next: '', confirm: '' }); setPassError(''); }}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>

        {/* Deactivate */}
        <div style={{ ...s.card, borderColor: '#fde68a' }}>
          <h2 style={{ ...s.cardTitle, color: '#b45309' }}>Deactivate account</h2>
          <p style={s.cardDesc}>
            Temporarily deactivate your account. Your profile will be hidden and you won't be able to log in.
            You can reactivate by contacting support at <a href="mailto:support@fugigeek.com" style={{ color: '#2563eb' }}>support@fugigeek.com</a>.
          </p>
          {!showDeactivate ? (
            <button style={s.warnBtn} onClick={() => setShowDeactivate(true)}>
              Deactivate my account
            </button>
          ) : (
            <div style={s.confirmBox}>
              <p style={s.confirmText}>Enter your password to confirm deactivation:</p>
              {deactivateError && <div style={s.errorMsg}>{deactivateError}</div>}
              <input style={s.input} type="password" placeholder="Your password"
                value={deactivatePass} onChange={e => setDeactivatePass(e.target.value)} />
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button style={{ ...s.warnBtn, opacity: deactivateLoading ? .6 : 1 }}
                  onClick={handleDeactivate} disabled={deactivateLoading}>
                  {deactivateLoading ? 'Deactivating…' : 'Confirm deactivation'}
                </button>
                <button style={s.cancelBtn} onClick={() => { setShowDeactivate(false); setDeactivatePass(''); setDeactivateError(''); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete */}
        <div style={{ ...s.card, borderColor: '#fecaca' }}>
          <h2 style={{ ...s.cardTitle, color: '#b91c1c' }}>Delete account</h2>
          <p style={s.cardDesc}>
            Permanently delete your account and all associated data. This is processed within <strong>30 days</strong> in
            accordance with the <strong>Zambia Data Protection Act (2021)</strong>. Order and transaction records
            may be retained for legal compliance. <strong>This cannot be undone.</strong>
          </p>
          {!showDelete ? (
            <button style={s.dangerBtn} onClick={() => setShowDelete(true)}>
              Request account deletion
            </button>
          ) : (
            <div style={s.confirmBox}>
              <p style={s.confirmText}>This action is irreversible. Enter your password and an optional reason:</p>
              {deleteError && <div style={s.errorMsg}>{deleteError}</div>}
              <input style={s.input} type="password" placeholder="Your password"
                value={deletePass} onChange={e => setDeletePass(e.target.value)} />
              <textarea style={{ ...s.input, marginTop: 10, resize: 'vertical', fontFamily: 'inherit', height: 80 }}
                placeholder="Reason for leaving (optional)"
                value={deleteReason} onChange={e => setDeleteReason(e.target.value)} />
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button style={{ ...s.dangerBtn, opacity: deleteLoading ? .6 : 1 }}
                  onClick={handleDeleteRequest} disabled={deleteLoading}>
                  {deleteLoading ? 'Submitting request…' : 'Confirm deletion request'}
                </button>
                <button style={s.cancelBtn} onClick={() => { setShowDelete(false); setDeletePass(''); setDeleteError(''); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:        { minHeight: '100vh', background: '#f9fafb' },
  breadcrumb:  { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb' },
  breadLink:   { fontSize: 14, color: '#374151', textDecoration: 'none' },
  sep:         { color: '#d1d5db' },
  wrap:        { maxWidth: 680, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 20 },
  title:       { fontSize: 26, fontWeight: 700, marginBottom: 4 },
  sub:         { color: '#6b7280', fontSize: 15, marginBottom: 8 },
  card:        { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 },
  cardTitle:   { fontSize: 16, fontWeight: 600, marginBottom: 10 },
  cardDesc:    { fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 16 },
  infoRow:     { display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid #f9fafb' },
  editBtn:     { padding: '9px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none', cursor: 'pointer' },
  fieldLabel:  { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 },
  warnBtn:     { padding: '10px 20px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  dangerBtn:   { padding: '10px 20px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  cancelBtn:   { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  confirmBox:  { background: '#f9fafb', borderRadius: 10, padding: 16, marginTop: 4 },
  confirmText: { fontSize: 14, color: '#374151', marginBottom: 10 },
  errorMsg:    { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginBottom: 10 },
  input:       { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', display: 'block' },
};
