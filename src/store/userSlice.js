import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: null,
    favorites: [],
    settings: {
      notifications: true,
      language: 'tr',
      priceAlerts: []
    }
  },
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    toggleFavorite: (state, action) => {
      const coinId = action.payload;
      const index = state.favorites.indexOf(coinId);
      if (index === -1) {
        state.favorites.push(coinId);
      } else {
        state.favorites.splice(index, 1);
      }
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    addPriceAlert: (state, action) => {
      state.settings.priceAlerts.push(action.payload);
    }
  }
});

export const { setProfile, toggleFavorite, updateSettings, addPriceAlert } = userSlice.actions;
export default userSlice.reducer; 