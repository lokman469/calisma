import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import authService from '../../../services/auth.service';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await authService.login({ email, password });
      window.location.href = '/';
    } catch (err) {
      setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Giriş Yap
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
      <Button variant="contained" color="primary" fullWidth onClick={handleLogin}>
        Giriş Yap
      </Button>
    </Box>
  );
};

export default Login; 