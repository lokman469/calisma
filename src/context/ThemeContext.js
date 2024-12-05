import { createContext, useContext, useState, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'dark';
  });

  const [primaryColor, setPrimaryColor] = useState(() => {
    const savedColor = localStorage.getItem('themePrimaryColor');
    return savedColor || '#1976d2';
  });

  const toggleMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  const handlePrimaryColor = (color) => {
    setPrimaryColor(color);
    localStorage.setItem('themePrimaryColor', color);
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: primaryColor,
          },
          background: {
            default: mode === 'dark' ? '#121212' : '#f5f5f5',
            paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
          },
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
        },
      }),
    [mode, primaryColor]
  );

  const value = {
    mode,
    primaryColor,
    toggleMode,
    setPrimaryColor: handlePrimaryColor,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 