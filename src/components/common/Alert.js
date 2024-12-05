import React from 'react';
import {
  Alert as MuiAlert,
  AlertTitle,
  Collapse,
  IconButton,
  Box,
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircleOutline,
  ErrorOutline,
  InfoOutline,
  WarningAmber
} from '@mui/icons-material';

// Alert tipleri
const ALERT_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Tip bazlı ikonlar
const ALERT_ICONS = {
  [ALERT_TYPES.SUCCESS]: CheckCircleOutline,
  [ALERT_TYPES.ERROR]: ErrorOutline,
  [ALERT_TYPES.WARNING]: WarningAmber,
  [ALERT_TYPES.INFO]: InfoOutline
};

const Alert = ({
  type = ALERT_TYPES.INFO,
  title,
  message,
  action,
  onClose,
  autoHideDuration,
  icon: CustomIcon,
  variant = 'standard',
  elevation = 0,
  sx = {}
}) => {
  const theme = useTheme();
  const [open, setOpen] = React.useState(true);
  const Icon = CustomIcon || ALERT_ICONS[type];

  // Otomatik kapanma
  React.useEffect(() => {
    if (autoHideDuration && open) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration, open]);

  // Kapatma işleyicisi
  const handleClose = () => {
    setOpen(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <Collapse in={open}>
      <MuiAlert
        severity={type}
        variant={variant}
        icon={<Icon />}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {action}
            {onClose && (
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={handleClose}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            )}
          </Box>
        }
        sx={{
          position: 'relative',
          ...(variant === 'filled' && {
            color: '#fff',
            backgroundColor: theme.palette[type].main,
            '& .MuiAlert-icon': {
              color: '#fff'
            }
          }),
          ...(variant === 'outlined' && {
            borderWidth: 2,
            '& .MuiAlert-icon': {
              color: theme.palette[type].main
            }
          }),
          ...(variant === 'standard' && {
            backgroundColor: alpha(theme.palette[type].main, 0.12),
            '& .MuiAlert-icon': {
              color: theme.palette[type].main
            }
          }),
          ...sx
        }}
        elevation={elevation}
      >
        {/* Başlık */}
        {title && (
          <AlertTitle
            sx={{
              fontWeight: 500,
              mb: message ? 0.5 : 0
            }}
          >
            {title}
          </AlertTitle>
        )}

        {/* Mesaj */}
        {message && (
          <Typography
            variant="body2"
            component="div"
            sx={{
              ...(title && {
                ml: '35px'
              })
            }}
          >
            {message}
          </Typography>
        )}
      </MuiAlert>
    </Collapse>
  );
};

// Kullanım örnekleri:
/*
// Basit kullanım
<Alert
  type="success"
  message="İşlem başarıyla tamamlandı!"
/>

// Başlık ile
<Alert
  type="error"
  title="Hata!"
  message="Bir hata oluştu, lütfen tekrar deneyin."
/>

// Aksiyon ile
<Alert
  type="warning"
  title="Uyarı"
  message="Bu işlem geri alınamaz."
  action={
    <Button color="inherit" size="small">
      Geri Al
    </Button>
  }
/>

// Otomatik kapanma
<Alert
  type="info"
  message="Bu bildirim 5 saniye sonra kapanacak."
  autoHideDuration={5000}
/>

// Farklı varyant
<Alert
  type="success"
  message="Filled varyant örneği"
  variant="filled"
/>

// Özel ikon
<Alert
  type="info"
  message="Özel ikon örneği"
  icon={<CustomIcon />}
/>

// Yükseltilmiş
<Alert
  type="warning"
  message="Gölgeli alert örneği"
  elevation={3}
/>
*/

export default Alert; 