import { createSlice } from '@reduxjs/toolkit';

// In a services marketplace the "cart" holds the selected proposal before checkout
const cartSlice = createSlice({
  name: 'cart',
  initialState: { selectedProposal: null, taskId: null },
  reducers: {
    setCheckoutItem(state, { payload }) {
      state.selectedProposal = payload.proposal;
      state.taskId           = payload.taskId;
    },
    clearCart(state) {
      state.selectedProposal = null;
      state.taskId           = null;
    },
  },
});

export const { setCheckoutItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
