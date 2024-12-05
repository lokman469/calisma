import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
  Fade,
  LinearProgress
} from '@mui/material';
import { CurrencyBitcoin } from '@mui/icons-material';

const LoadingScreen = ({
  loading = true,
  fullScreen = true,
  message = 'Yükleniyor...',
  showProgress = false,
  progress = 0,
  icon = true,
  delay = 800
}) => {
  const theme = useTheme();
  const [show, setShow] = React.useState(!delay);

  // Gecikmeli gösterim için
  React.useEffect(() => {
    if (delay) {
      const timer = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  // Loading ekranı henüz gösterilmeyecekse
  if (!show || !loading) {
    return null;
  }

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        p: 3,
        height: fullScreen ? '100vh' : '100%',
        width: '100%',
        position: fullScreen ? 'fixed' : 'absolute',
        top: 0,
        left: 0,
        zIndex: theme.zIndex.modal + 1,
        backgroundColor: theme.palette.background.default
      }}
    >
      {/* İkon */}
      {icon && (
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CurrencyBitcoin
            sx={{
              fontSize: 64,
              color: theme.palette.primary.main,
              animation: 'pulse 2s infinite'
            }}
          />
          <CircularProgress
            size={80}
            sx={{
              position: 'absolute',
              color: theme.palette.primary.main
            }}
          />
        </Box>
      )}

      {/* Mesaj */}
      {message && (
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          {message}
        </Typography>
      )}

      {/* İlerleme çubuğu */}
      {showProgress && (
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.action.hover,
              '& .MuiLinearProgress-bar': {
                borderRadius: 4
              }
            }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 1 }}
          >
            {`${Math.round(progress)}%`}
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Fade in={show} timeout={300}>
      {content}
    </Fade>
  );
};

// Özel CSS animasyonu
const styles = `
  @keyframes pulse {
    0% {
      transform: scale(0.95);
      opacity: 0.5;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.8;
    }
    100% {
      transform: scale(0.95);
      opacity: 0.5;
    }
  }
`;

// Stil ekle
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default LoadingScreen; 