import { createSlice } from '@reduxjs/toolkit';

// Safari can store/return the literal string "undefined" — guard against it
const safeParseUser = () => {
  try {
    const raw = localStorage.getItem('tb_user');
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    return JSON.parse(raw);
  } catch { return null; }
};

const safeGetToken = () => {
  try {
    const raw = localStorage.getItem('tb_token');
    if (!raw || raw === 'undefined') return null;
    return raw;
  } catch { return null; }
};

const user  = safeParseUser();
const token = safeGetToken();

const authSlice = createSlice({
  name: 'auth',
  initialState: { user, token, loading: false, error: null },
  reducers: {
    setCredentials(state, { payload }) {
      state.user  = payload.user;
      state.token = payload.token;
      localStorage.setItem('tb_user',  JSON.stringify(payload.user));
      localStorage.setItem('tb_token', payload.token);
    },
    logout(state) {
      state.user  = null;
      state.token = null;
      localStorage.removeItem('tb_user');
      localStorage.removeItem('tb_token');
    },
    setLoading(state, { payload }) { state.loading = payload; },
    setError(state,   { payload }) { state.error   = payload; },
    clearError(state)               { state.error   = null; },
  },
});

export const { setCredentials, logout, setLoading, setError, clearError } = authSlice.actions;
export default authSlice.reducer;