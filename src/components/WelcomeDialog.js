import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  FormControlLabel,
  Checkbox,
  IconButton,
  useTheme,
  Paper,
  Fade,
  Grow,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Done as DoneIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Palette as ThemeIcon,
  AccountCircle as ProfileIcon
} from '@mui/icons-material';

const WELCOME_STEPS = [
  {
    label: 'Profil Bilgileri',
    icon: ProfileIcon,
    description: 'Temel bilgilerinizi girin',
    optional: false
  },
  {
    label: 'Tercihler',
    icon: ThemeIcon,
    description: 'Uygulama tercihlerinizi belirleyin',
    optional: true
  },
  {
    label: 'Bildirimler',
    icon: NotificationsIcon,
    description: 'Bildirim ayarlarınızı yapılandırın',
    optional: true
  },
  {
    label: 'Tamamlandı',
    icon: DoneIcon,
    description: 'Kurulum tamamlandı',
    optional: false
  }
];

const WelcomeDialog = ({
  open,
  onClose,
  onComplete,
  loading = false,
  error = null
}) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    preferences: {
      theme: 'system',
      language: 'tr',
      notifications: true,
      newsletter: false
    }
  });
  const [skippedSteps, setSkippedSteps] = useState(new Set());

  // Form validasyonu
  const isStepValid = useCallback((step) => {
    switch (step) {
      case 0:
        return formData.name.length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      case 1:
      case 2:
        return true;
      default:
        return true;
    }
  }, [formData]);

  // Adım atlama kontrolü
  const isStepSkipped = useCallback((step) => {
    return skippedSteps.has(step);
  }, [skippedSteps]);

  // Sonraki adıma geç
  const handleNext = useCallback(() => {
    let newSkipped = skippedSteps;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkippedSteps(newSkipped);
  }, [activeStep, skippedSteps, isStepSkipped]);

  // Önceki adıma dön
  const handleBack = useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  }, []);

  // Adımı atla
  const handleSkip = useCallback(() => {
    if (!WELCOME_STEPS[activeStep].optional) {
      throw new Error('Zorunlu adımlar atlanamaz');
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkippedSteps((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  }, [activeStep]);

  // Form verilerini güncelle
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Tercihleri güncelle
  const handlePreferenceChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    }));
  }, []);

  // Kurulumu tamamla
  const handleComplete = useCallback(() => {
    onComplete(formData);
  }, [formData, onComplete]);

  // Adım içeriğini render et
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="İsim"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={formData.name.length > 0 && formData.name.length < 2}
              helperText={formData.name.length > 0 && formData.name.length < 2 ? 'En az 2 karakter giriniz' : ''}
              disabled={loading}
              fullWidth
            />
            <TextField
              label="E-posta"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={formData.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)}
              helperText={formData.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'Geçerli bir e-posta adresi giriniz' : ''}
              disabled={loading}
              fullWidth
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.preferences.theme === 'dark'}
                  onChange={(e) => handlePreferenceChange('theme', e.target.checked ? 'dark' : 'light')}
                  disabled={loading}
                />
              }
              label="Koyu tema kullan"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.preferences.language === 'tr'}
                  onChange={(e) => handlePreferenceChange('language', e.target.checked ? 'tr' : 'en')}
                  disabled={loading}
                />
              }
              label="Türkçe dil"
            />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.preferences.notifications}
                  onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                  disabled={loading}
                />
              }
              label="Bildirimleri etkinleştir"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.preferences.newsletter}
                  onChange={(e) => handlePreferenceChange('newsletter', e.target.checked)}
                  disabled={loading}
                />
              }
              label="Bülten aboneliği"
            />
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Grow in timeout={1000}>
              <DoneIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
            </Grow>
            <Typography variant="h6" gutterBottom>
              Tebrikler!
            </Typography>
            <Typography color="textSecondary">
              Kurulum tamamlandı. Uygulamayı kullanmaya başlayabilirsiniz.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 3,
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Hoş Geldiniz
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} orientation="vertical">
          {WELCOME_STEPS.map((step, index) => (
            <Step key={step.label} completed={isStepValid(index) && activeStep > index}>
              <StepLabel
                optional={
                  step.optional && (
                    <Typography variant="caption">İsteğe bağlı</Typography>
                  )
                }
                icon={
                  <step.icon 
                    color={activeStep === index ? 'primary' : 'inherit'}
                  />
                }
              >
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1">
                    {step.label}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {step.description}
                  </Typography>
                </Box>
              </StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  {renderStepContent(index)}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    disabled={index === 0 || loading}
                    onClick={handleBack}
                    startIcon={<BackIcon />}
                  >
                    Geri
                  </Button>
                  {step.optional && (
                    <Button
                      color="inherit"
                      onClick={handleSkip}
                      disabled={loading}
                    >
                      Atla
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    onClick={index === WELCOME_STEPS.length - 1 ? handleComplete : handleNext}
                    disabled={!isStepValid(index) || loading}
                    endIcon={index === WELCOME_STEPS.length - 1 ? <DoneIcon /> : <NextIcon />}
                  >
                    {index === WELCOME_STEPS.length - 1 ? 'Bitir' : 'İleri'}
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
    </Dialog>
  );
};

WelcomeDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string
};

export default React.memo(WelcomeDialog); 