import { createSlice } from '@reduxjs/toolkit';

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