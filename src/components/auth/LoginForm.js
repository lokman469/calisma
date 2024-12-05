import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Link
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

// Form doğrulama şeması
const schema = yup.object().shape({
  email: yup
    .string()
    .email('Geçerli bir e-posta adresi giriniz')
    .required('E-posta adresi gereklidir'),
  password: yup
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .required('Şifre gereklidir')
});

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Form yönetimi
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  // State
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form gönderimi
  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Giriş yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        maxWidth: 400,
        p: 3
      }}
    >
      <Typography variant="h5" align="center" gutterBottom>
        Giriş Yap
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="E-posta"
        type="email"
        {...register('email')}
        error={!!errors.email}
        helperText={errors.email?.message}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Email />
            </InputAdornment>
          )
        }}
      />

      <TextField
        fullWidth
        label="Şifre"
        type={showPassword ? 'text' : 'password'}
        {...register('password')}
        error={!!errors.password}
        helperText={errors.password?.message}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Link
          component={RouterLink}
          to="/auth/register"
          variant="body2"
          underline="hover"
        >
          Hesabınız yok mu? Kayıt olun
        </Link>
        <Link
          component={RouterLink}
          to="/auth/forgot-password"
          variant="body2"
          underline="hover"
        >
          Şifremi unuttum
        </Link>
      </Box>

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={loading}
        sx={{ py: 1.5 }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'Giriş Yap'
        )}
      </Button>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Veya şununla giriş yapın:
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {/* Google ile giriş */}}
          >
            Google
          </Button>
          <Button
            variant="outlined"
            onClick={() => {/* Apple ile giriş */}}
          >
            Apple
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginForm; 