import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('userSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      notifications: {
        email: true,
        push: true,
        priceAlerts: true,
        newsAlerts: false,
        portfolioAlerts: true
      },
      display: {
        showBalance: true,
        currency: 'USD',
        language: 'tr',
        timeFormat: '24h'
      },
      trading: {
        defaultExchange: 'binance',
        confirmTrades: true,
        showProfitLoss: true
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 30 // dakika
      }
    };
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  const updateUser = (newData) => {
    setUser(current => ({
      ...current,
      ...newData
    }));
  };

  const updateSettings = (newSettings) => {
    setSettings(current => ({
      ...current,
      ...newSettings
    }));
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    settings,
    updateUser,
    updateSettings,
    logout
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 