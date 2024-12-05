import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../config/constants';

// ThemeContext oluştur
const ThemeContext = createContext();

// ThemeProvider bileşeni
export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(localStorage.getItem(STORAGE_KEYS.THEME_MODE) || 'light');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ThemeContext kullanımı için hook
export const useTheme = () => {
  return useContext(ThemeContext);
}; 