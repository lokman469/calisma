import React from 'react';
import { Box, Typography } from '@mui/material';

const NotFound = () => {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        404 - Sayfa Bulunamadı
      </Typography>
      <Typography variant="body1">
        Üzgünüz, aradığınız sayfa bulunamadı.
      </Typography>
    </Box>
  );
};

export default NotFound; 