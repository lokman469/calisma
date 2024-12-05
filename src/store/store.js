import { configureStore } from '@reduxjs/toolkit';
import cryptoReducer from './cryptoSlice';
import alertsReducer from './alertsSlice';

export const store = configureStore({
  reducer: {
    crypto: cryptoReducer,
    alerts: alertsReducer
  }
}); 