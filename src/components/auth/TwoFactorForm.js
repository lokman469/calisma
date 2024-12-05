import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
  IconButton
} from '@mui/material';
import {
  Security,
  ContentCopy,
  Refresh,
  ArrowBack,
  CheckCircle
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import QRCode from 'qrcode.react';

const TwoFactorForm = ({ setup = false, onVerify }) => {
  const navigate = useNavigate();
  const { verify2FA, setup2FA, user } = useAuth();
  const [codeInputs, setCodeInputs] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Setup modunda QR ve secret key al
  useEffect(() => {
    if (setup) {
      const getSetupData = async () => {
        try {
          const data = await setup2FA();
          setSetupData(data);
        } catch (err) {
          setError('2FA kurulum bilgileri alınamadı');
        }
      };
      getSetupData();
    }
  }, [setup, setup2FA]);

  // Input referanslarını oluştur
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Input değişimi
  const handleChange = (index, value) => {
    if (!/^[0-9]*$/.test(value)) return;

    const newInputs = [...codeInputs];
    newInputs[index] = value;
    setCodeInputs(newInputs);

    // Otomatik sonraki input'a geç
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    // Tüm inputlar doluysa otomatik doğrula
    if (newInputs.every(val => val) && newInputs.join('').length === 6) {
      handleVerify(newInputs.join(''));
    }
  };

  // Backspace tuşu yönetimi
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeInputs[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Paste yönetimi
  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    if (!/^\d{6}$/.test(paste)) return;

    const newInputs = paste.split('');
    setCodeInputs(newInputs);
    inputRefs.current[5].focus();
  };

  // Secret key kopyalama
  const handleCopySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Kod doğrulama
  const handleVerify = async (code = codeInputs.join('')) => {
    if (code.length !== 6) return;
    
    setLoading(true);
    setError(null);

    try {
      if (setup) {
        await verify2FA(code, setupData?.secret);
      } else {
        await verify2FA(code);
      }
      
      setSuccess(true);
      if (onVerify) {
        onVerify();
      } else {
        // 3 saniye sonra yönlendir
        setTimeout(() => {
          navigate(setup ? '/settings/security' : '/dashboard');
        }, 3000);
      }
    } catch (err) {
      setError(err.message || 'Doğrulama kodu geçersiz');
      // Inputları temizle
      setCodeInputs(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Security sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          {setup ? '2FA Kurulumu' : '2FA Doğrulama'}
        </Typography>
        <Typography color="text.secondary">
          {setup 
            ? 'Google Authenticator veya benzer bir uygulama kullanarak QR kodu tarayın'
            : 'Kimlik doğrulama uygulamanızdaki 6 haneli kodu girin'
          }
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert 
          severity="success" 
          icon={<CheckCircle />}
          sx={{ mb: 3 }}
        >
          {setup 
            ? '2FA başarıyla kuruldu! Yönlendiriliyorsunuz...'
            : 'Doğrulama başarılı! Yönlendiriliyorsunuz...'
          }
        </Alert>
      )}

      {setup && setupData && (
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <QRCode 
            value={setupData.qrCode}
            size={200}
            level="H"
            includeMargin
            renderAs="svg"
          />
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Manuel giriş için kod:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: 'monospace',
                bgcolor: 'action.hover',
                px: 1,
                py: 0.5,
                borderRadius: 1
              }}
            >
              {setupData.secret}
            </Typography>
            <IconButton 
              size="small"
              onClick={handleCopySecret}
              color={copied ? 'success' : 'default'}
            >
              {copied ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
            </IconButton>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {codeInputs.map((value, index) => (
          <TextField
            key={index}
            inputRef={el => inputRefs.current[index] = el}
            value={value}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            variant="outlined"
            inputProps={{
              maxLength: 1,
              style: { 
                textAlign: 'center',
                fontSize: '1.5rem',
                padding: '12px 0'
              }
            }}
            sx={{ width: '52px' }}
          />
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => handleVerify()}
          disabled={loading || codeInputs.join('').length !== 6}
          sx={{ py: 1.5 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Doğrula'
          )}
        </Button>

        <Button
          component={RouterLink}
          to={setup ? '/settings/security' : '/auth/login'}
          startIcon={<ArrowBack />}
          variant="outlined"
        >
          {setup ? 'Ayarlara Dön' : 'Giriş Sayfasına Dön'}
        </Button>
      </Box>

      <Typography 
        variant="body2" 
        color="text.secondary" 
        align="center"
        sx={{ mt: 3 }}
      >
        Yardıma mı ihtiyacınız var?{' '}
        <Link href="/support" underline="hover">
          Destek ekibimizle iletişime geçin
        </Link>
      </Typography>
    </Paper>
  );
};

export default TwoFactorForm; 