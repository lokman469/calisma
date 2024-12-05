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
  Link,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

// Form doğrulama şeması
const schema = yup.object().shape({
  username: yup
    .string()
    .min(3, 'Kullanıcı adı en az 3 karakter olmalıdır')
    .max(20, 'Kullanıcı adı en fazla 20 karakter olabilir')
    .required('Kullanıcı adı gereklidir'),
  email: yup
    .string()
    .email('Geçerli bir e-posta adresi giriniz')
    .required('E-posta adresi gereklidir'),
  phone: yup
    .string()
    .matches(/^[0-9]+$/, 'Geçerli bir telefon numarası giriniz')
    .min(10, 'Telefon numarası en az 10 karakter olmalıdır')
    .max(15, 'Telefon numarası en fazla 15 karakter olabilir'),
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
    .required('Şifre tekrarı gereklidir'),
  terms: yup
    .boolean()
    .oneOf([true], 'Kullanım koşullarını kabul etmelisiniz')
});

// Kayıt adımları
const steps = ['Hesap Bilgileri', 'Kişisel Bilgiler', 'Doğrulama'];

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  
  // Form yönetimi
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  // State
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form gönderimi
  const onSubmit = async (data) => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await registerUser({
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: data.password
      });
      navigate('/auth/verify-email');
    } catch (err) {
      setError(err.message || 'Kayıt olurken bir hata oluştu');
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  // Adım içeriği
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
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
          </>
        );
      case 1:
        return (
          <>
            <TextField
              fullWidth
              label="Kullanıcı Adı"
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Telefon"
              {...register('phone')}
              error={!!errors.phone}
              helperText={errors.phone?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone />
                  </InputAdornment>
                )
              }}
            />
          </>
        );
      case 2:
        return (
          <>
            <FormControlLabel
              control={
                <Checkbox
                  {...register('terms')}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  <Link href="/terms" target="_blank">
                    Kullanım koşullarını
                  </Link>
                  {' '}ve{' '}
                  <Link href="/privacy" target="_blank">
                    Gizlilik politikasını
                  </Link>
                  {' '}okudum, kabul ediyorum
                </Typography>
              }
            />
            {errors.terms && (
              <Typography color="error" variant="caption">
                {errors.terms.message}
              </Typography>
            )}
          </>
        );
      default:
        return null;
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
        Kayıt Ol
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {getStepContent(activeStep)}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          disabled={activeStep === 0}
          onClick={() => setActiveStep(prev => prev - 1)}
        >
          Geri
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : activeStep === steps.length - 1 ? (
            'Kayıt Ol'
          ) : (
            'İleri'
          )}
        </Button>
      </Box>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2">
          Zaten hesabınız var mı?{' '}
          <Link
            component={RouterLink}
            to="/auth/login"
            underline="hover"
          >
            Giriş yapın
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterForm; 