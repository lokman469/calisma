import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import authService from '../../../services/auth.service';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    try {
      await authService.register({ email, password });
      window.location.href = '/';
    } catch (err) {
      setError('Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Kayıt Ol
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <TextField
        label="E-posta"
        fullWidth
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Şifre"
        type="password"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button variant="contained" color="primary" fullWidth onClick={handleRegister}>
        Kayıt Ol
      </Button>
    </Box>
  );
};

export default Register; 