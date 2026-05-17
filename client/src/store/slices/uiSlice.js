import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { mobileMenuOpen: false, searchQuery: '', notification: null },
  reducers: {
    toggleMobileMenu(state)             { state.mobileMenuOpen = !state.mobileMenuOpen; },
    setSearchQuery(state, { payload })  { state.searchQuery    = payload; },
    setNotification(state, { payload }) { state.notification   = payload; },
    clearNotification(state)            { state.notification   = null; },
  },
});

export const { toggleMobileMenu, setSearchQuery, setNotification, clearNotification } = uiSlice.actions;
export default uiSlice.reducer;