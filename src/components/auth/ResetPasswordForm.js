import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  Check,
  Close
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

// Form doğrulama şeması
const schema = yup.object().shape({
  password: yup
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .matches(/[a-z]/, 'Şifre en az bir küçük harf içermelidir')
    .matches(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
    .matches(/[0-9]/, 'Şifre en az bir rakam içermelidir')
    .matches(/[^a-zA-Z0-9]/, 'Şifre en az bir özel karakter içermelidir')
    .required('Şifre gereklidir'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Şifreler eşleşmiyor')
    .required('Şifre tekrarı gereklidir')
});

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const { verifyResetToken, resetPassword } = useAuth();
  
  // Form yönetimi
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  // State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);
  const [tokenValid, setTokenValid] = useState(false);

  // Şifre gücü kontrolü
  const password = watch('password', '');
  const passwordStrength = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password)
  };

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;
  const strengthPercent = (strengthScore / 5) * 100;

  // Token doğrulama
  useEffect(() => {
    const verifyToken = async () => {
      try {
        await verifyResetToken(token);
        setTokenValid(true);
      } catch (err) {
        setError('Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı');
      } finally {
        setVerifying(false);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token, verifyResetToken]);

  // Form gönderimi
  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      await resetPassword(token, data.password);
      navigate('/auth/login', { 
        state: { message: 'Şifreniz başarıyla değiştirildi. Lütfen yeni şifrenizle giriş yapın.' } 
      });
    } catch (err) {
      setError(err.message || 'Şifre değiştirme işlemi başarısız oldu');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography align="center" gutterBottom>
          Token doğrulanıyor...
        </Typography>
        <CircularProgress sx={{ display: 'block', mx: 'auto' }} />
      </Paper>
    );
  }

  if (!tokenValid) {
    return (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate('/auth/forgot-password')}
        >
          Yeni şifre sıfırlama bağlantısı al
        </Button>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Yeni Şifre Belirleme
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lütfen yeni şifrenizi belirleyin
          </Typography>
        </Box>

        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Yeni Şifre"
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

        <Box sx={{ mb: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={strengthPercent}
            color={
              strengthScore <= 2 ? 'error' :
              strengthScore <= 3 ? 'warning' :
              'success'
            }
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {Object.entries(passwordStrength).map(([key, valid]) => (
              <Box
                key={key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: valid ? 'success.main' : 'error.main'
                }}
              >
                {valid ? <Check fontSize="small" /> : <Close fontSize="small" />}
                <Typography variant="caption">
                  {key === 'length' && 'En az 8 karakter'}
                  {key === 'lowercase' && 'En az bir küçük harf'}
                  {key === 'uppercase' && 'En az bir büyük harf'}
                  {key === 'number' && 'En az bir rakam'}
                  {key === 'special' && 'En az bir özel karakter'}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <TextField
          fullWidth
          label="Şifre Tekrarı"
          type={showConfirmPassword ? 'text' : 'password'}
          {...register('confirmPassword')}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

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
            'Şifreyi Değiştir'
          )}
        </Button>
      </Box>
    </Paper>
  );
};

export default ResetPasswordForm; 