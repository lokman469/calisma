import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../config/constants';

// Tema modunu yöneten hook
const useTheme = () => {
  const [themeMode, setThemeMode] = useState(localStorage.getItem(STORAGE_KEYS.THEME_MODE) || 'light');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return { themeMode, toggleTheme };
};

export default useTheme; 