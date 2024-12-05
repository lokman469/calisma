import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Switch,
  FormControlLabel,
  Tooltip,
  Alert,
  Chip,
  Typography,
  useTheme,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { formatCurrency } from '../utils/formatters';

const ALERT_TYPES = [
  { value: 'price_above', label: 'Fiyat Yükseldiğinde' },
  { value: 'price_below', label: 'Fiyat Düştüğünde' },
  { value: 'price_change_up', label: 'Yüzde Artış' },
  { value: 'price_change_down', label: 'Yüzde Düşüş' }
];

const NOTIFICATION_CHANNELS = [
  { value: 'push', label: 'Push Bildirimi' },
  { value: 'email', label: 'E-posta' },
  { value: 'telegram', label: 'Telegram' }
];

const PriceAlertForm = ({
  open,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  currentPrice,
  loading = false,
  error = null
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    type: 'price_above',
    price: '',
    percentage: '',
    notifications: {
      push: true,
      email: false,
      telegram: false
    },
    repeat: false,
    note: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Form verilerini sıfırla
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        type: 'price_above',
        price: '',
        percentage: '',
        notifications: {
          push: true,
          email: false,
          telegram: false
        },
        repeat: false,
        note: ''
      });
    }
  }, [initialData, open]);

  // Form doğrulama
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (formData.type.includes('price_')) {
      if (!formData.price || formData.price <= 0) {
        errors.price = 'Geçerli bir fiyat giriniz';
      }
    } else {
      if (!formData.percentage || formData.percentage <= 0) {
        errors.percentage = 'Geçerli bir yüzde giriniz';
      }
    }

    if (!Object.values(formData.notifications).some(v => v)) {
      errors.notifications = 'En az bir bildirim kanalı seçiniz';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Form gönderme
  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      onSubmit(formData);
    }
  }, [formData, onSubmit, validateForm]);

  // Input değişiklik handler'ı
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setValidationErrors(prev => ({
      ...prev,
      [field]: null
    }));
  }, []);

  // Bildirim kanalı değişiklik handler'ı
  const handleNotificationChange = useCallback((channel) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [channel]: !prev.notifications[channel]
      }
    }));
    setValidationErrors(prev => ({
      ...prev,
      notifications: null
    }));
  }, []);

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
        <Box display="flex" alignItems="center" gap={1}>
          <NotificationsIcon color="primary" />
          <Typography>
            {initialData ? 'Fiyat Alarmını Düzenle' : 'Yeni Fiyat Alarmı'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Alarm Tipi */}
          <FormControl fullWidth error={!!validationErrors.type}>
            <InputLabel>Alarm Tipi</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              disabled={loading}
            >
              {ALERT_TYPES.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Fiyat/Yüzde Input */}
          {formData.type.includes('price_') ? (
            <TextField
              label="Hedef Fiyat"
              type="number"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              error={!!validationErrors.price}
              helperText={validationErrors.price}
              disabled={loading}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                endAdornment: (
                  <Tooltip title="Mevcut Fiyat">
                    <Chip
                      label={formatCurrency(currentPrice)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Tooltip>
                )
              }}
            />
          ) : (
            <TextField
              label="Yüzde Değişim"
              type="number"
              value={formData.percentage}
              onChange={(e) => handleChange('percentage', e.target.value)}
              error={!!validationErrors.percentage}
              helperText={validationErrors.percentage}
              disabled={loading}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
            />
          )}

          {/* Bildirim Kanalları */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Bildirim Kanalları
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {NOTIFICATION_CHANNELS.map(channel => (
                <FormControlLabel
                  key={channel.value}
                  control={
                    <Switch
                      checked={formData.notifications[channel.value]}
                      onChange={() => handleNotificationChange(channel.value)}
                      disabled={loading}
                    />
                  }
                  label={channel.label}
                />
              ))}
            </Box>
            {validationErrors.notifications && (
              <Typography color="error" variant="caption">
                {validationErrors.notifications}
              </Typography>
            )}
          </Box>

          {/* Tekrarlama Seçeneği */}
          <FormControlLabel
            control={
              <Switch
                checked={formData.repeat}
                onChange={(e) => handleChange('repeat', e.target.checked)}
                disabled={loading}
              />
            }
            label="Alarm tetiklendikten sonra tekrarla"
          />

          {/* Not */}
          <TextField
            label="Not"
            multiline
            rows={3}
            value={formData.note}
            onChange={(e) => handleChange('note', e.target.value)}
            disabled={loading}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {initialData && (
          <Button
            startIcon={<DeleteIcon />}
            onClick={() => onDelete(initialData.id)}
            color="error"
            disabled={loading}
          >
            Sil
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} disabled={loading}>
          İptal
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={<SaveIcon />}
        >
          {initialData ? 'Güncelle' : 'Oluştur'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

PriceAlertForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  initialData: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    percentage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    notifications: PropTypes.object.isRequired,
    repeat: PropTypes.bool,
    note: PropTypes.string
  }),
  currentPrice: PropTypes.number,
  loading: PropTypes.bool,
  error: PropTypes.string
};

export default React.memo(PriceAlertForm); 