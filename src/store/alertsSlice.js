import { createSlice } from '@reduxjs/toolkit';

const alertsSlice = createSlice({
  name: 'alerts',
  initialState: {
    items: []
  },
  reducers: {
    addAlert: (state, action) => {
      state.items.push({
        ...action.payload,
        id: Date.now()
      });
    },
    removeAlert: (state, action) => {
      state.items = state.items.filter(alert => alert.id !== action.payload);
    }
  }
});

export const { addAlert, removeAlert } = alertsSlice.actions;
export default alertsSlice.reducer; 