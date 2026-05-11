import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials, logout as logoutAction, setLoading, setError, clearError } from '../store/slices/authSlice';
import authAPI from '../api/auth';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, loading, error } = useSelector(s => s.auth);

  const register = async formData => {
    dispatch(setLoading(true)); dispatch(clearError());
    try {
      const { data } = await authAPI.register(formData);
      dispatch(setCredentials({ user: data.user, token: data.token }));
      navigate(data.user.role === 'business' ? '/dashboard/business' : '/dashboard/professional');
    } catch (err) {
      dispatch(setError(err.response?.data?.message || 'Registration failed'));
    } finally { dispatch(setLoading(false)); }
  };

  const login = async formData => {
    dispatch(setLoading(true)); dispatch(clearError());
    try {
      const { data } = await authAPI.login(formData);
      dispatch(setCredentials({ user: data.user, token: data.token }));
      navigate(data.user.role === 'business' ? '/dashboard/business' : '/dashboard/professional');
    } catch (err) {
      dispatch(setError(err.response?.data?.message || 'Login failed'));
    } finally { dispatch(setLoading(false)); }
  };

  const logout = () => { dispatch(logoutAction()); navigate('/'); };

  const updateProfile = async formData => {
    dispatch(setLoading(true));
    try {
      const { data } = await authAPI.updateProfile(formData);
      dispatch(setCredentials({ user: data.user, token }));
      return data.user;
    } catch (err) {
      dispatch(setError(err.response?.data?.message || 'Update failed'));
    } finally { dispatch(setLoading(false)); }
  };

  return {
    user, token, loading, error,
    register, login, logout, updateProfile,
    isAuthenticated: !!token,
    isBusiness:      user?.role === 'business',
    isProfessional:  user?.role === 'professional',
    isAdmin:         user?.role === 'admin',
  };
};
