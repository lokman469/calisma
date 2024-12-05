import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  Alert,
  CircularProgress,
  Link,
  Paper
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
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
    .required('E-posta adresi gereklidir')
});

const ForgotPasswordForm = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  
  // Form yönetimi
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form gönderimi
  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      await resetPassword(data.email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Şifre sıfırlama isteği gönderilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

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
            Şifremi Unuttum
          </Typography>
          <Typography variant="body2" color="text.secondary">
            E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim
          </Typography>
        </Box>

        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        {success ? (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. 
              Lütfen gelen kutunuzu kontrol edin.
            </Alert>
            <Typography variant="body2" gutterBottom>
              E-posta almadınız mı?
            </Typography>
            <Button
              onClick={() => {
                setSuccess(false);
                setError(null);
              }}
            >
              Tekrar gönder
            </Button>
          </Box>
        ) : (
          <>
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
                'Sıfırlama Bağlantısı Gönder'
              )}
            </Button>
          </>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            component={RouterLink}
            to="/auth/login"
            startIcon={<ArrowBack />}
            sx={{ textTransform: 'none' }}
          >
            Giriş sayfasına dön
          </Button>
          
          <Link
            component={RouterLink}
            to="/auth/register"
            variant="body2"
            underline="hover"
          >
            Hesap oluştur
          </Link>
        </Box>

        <Typography 
          variant="body2" 
          color="text.secondary" 
          align="center"
          sx={{ mt: 2 }}
        >
          Yardıma mı ihtiyacınız var?{' '}
          <Link href="/support" underline="hover">
            Destek ekibimizle iletişime geçin
          </Link>
        </Typography>
      </Box>
    </Paper>
  );
};

export default ForgotPasswordForm; 