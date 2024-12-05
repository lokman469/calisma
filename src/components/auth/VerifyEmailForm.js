import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Link,
  Divider
} from '@mui/material';
import {
  Email,
  CheckCircle,
  Refresh,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const VerifyEmailForm = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const { verifyEmail, resendVerification, user } = useAuth();

  // State
  const [verifying, setVerifying] = useState(!!token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Token doğrulama
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) return;

      try {
        await verifyEmail(token);
        setSuccess(true);
        // 3 saniye sonra login sayfasına yönlendir
        setTimeout(() => {
          navigate('/auth/login', {
            state: { message: 'E-posta adresiniz doğrulandı. Şimdi giriş yapabilirsiniz.' }
          });
        }, 3000);
      } catch (err) {
        setError(err.message || 'E-posta doğrulama işlemi başarısız oldu');
      } finally {
        setVerifying(false);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token, verifyEmail, navigate]);

  // Geri sayım
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Yeniden gönderme
  const handleResend = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await resendVerification(user.email);
      setCountdown(60); // 60 saniyelik bekleme süresi
    } catch (err) {
      setError(err.message || 'Doğrulama e-postası gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>
            E-posta doğrulanıyor...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (success) {
    return (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            E-posta Doğrulandı!
          </Typography>
          <Typography color="text.secondary" paragraph>
            Giriş sayfasına yönlendiriliyorsunuz...
          </Typography>
          <CircularProgress size={20} />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Email sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          E-posta Doğrulama
        </Typography>
        <Typography color="text.secondary">
          {token ? 'Doğrulama bağlantısı geçersiz veya süresi dolmuş.' : 
          `Doğrulama e-postası ${user?.email} adresine gönderildi.`}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={handleResend}
          disabled={loading || countdown > 0}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : countdown > 0 ? (
            `Tekrar gönder (${countdown}s)`
          ) : (
            'Doğrulama e-postasını tekrar gönder'
          )}
        </Button>

        <Divider sx={{ my: 2 }}>veya</Divider>

        <Button
          component={RouterLink}
          to="/auth/login"
          startIcon={<ArrowBack />}
          variant="outlined"
        >
          Giriş sayfasına dön
        </Button>
      </Box>

      <Typography 
        variant="body2" 
        color="text.secondary" 
        align="center"
        sx={{ mt: 3 }}
      >
        E-posta adresinizi değiştirmek mi istiyorsunuz?{' '}
        <Link 
          component={RouterLink} 
          to="/settings/profile"
          underline="hover"
        >
          Profil ayarlarına gidin
        </Link>
      </Typography>

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
    </Paper>
  );
};

export default VerifyEmailForm; 