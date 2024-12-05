import React from 'react';
import { Box, Typography, Switch, FormControlLabel } from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';

const Settings = () => {
  const { themeMode, toggleTheme } = useTheme();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Ayarlar
      </Typography>
      <FormControlLabel
        control={<Switch checked={themeMode === 'dark'} onChange={toggleTheme} />}
        label="Karanlık Mod"
      />
    </Box>
  );
};

export default Settings; 