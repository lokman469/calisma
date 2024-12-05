import React from 'react';
import { Box, Typography } from '@mui/material';

const Home = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Ana Sayfa
      </Typography>
      <Typography variant="body1">
        Hoş geldiniz! Bu, uygulamanızın ana sayfasıdır.
      </Typography>
    </Box>
  );
};

export default Home; 