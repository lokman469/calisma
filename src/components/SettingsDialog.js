import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Divider,
  Alert,
  Tooltip,
  IconButton,
  Collapse,
  useTheme,
  TextField
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  VolumeUp as VolumeIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  RestartAlt as ResetIcon
} from '@mui/icons-material';

const THEMES = [
  { value: 'light', label: 'Açık Tema' },
  { value: 'dark', label: 'Koyu Tema' },
  { value: 'system', label: 'Sistem Teması' }
];

const LANGUAGES = [
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' }
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'TRY', label: 'TRY (₺)', symbol: '₺' }
];

const SettingsDialog = ({
  open,
  onClose,
  onSave,
  initialSettings,
  loading = false,
  error = null
}) => {
  const theme = useTheme();
  const [settings, setSettings] = useState({
    theme: 'system',
    language: 'tr',
    currency: 'USD',
    notifications: {
      push: true,
      email: false,
      sound: true,
      desktop: true
    },
    privacy: {
      analytics: true,
      crashReports: true
    },
    advanced: {
      autoRefresh: true,
      refreshInterval: 30,
      cacheEnabled: true
    },
    ...initialSettings
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Settings değişikliklerini izle
  useEffect(() => {
    const isChanged = JSON.stringify(settings) !== JSON.stringify(initialSettings);
    setHasChanges(isChanged);
  }, [settings, initialSettings]);

  // Ayarları sıfırla
  const handleReset = useCallback(() => {
    setSettings({
      theme: 'system',
      language: 'tr',
      currency: 'USD',
      notifications: {
        push: true,
        email: false,
        sound: true,
        desktop: true
      },
      privacy: {
        analytics: true,
        crashReports: true
      },
      advanced: {
        autoRefresh: true,
        refreshInterval: 30,
        cacheEnabled: true
      }
    });
  }, []);

  // Ayar değişiklik handler'ı
  const handleChange = useCallback((section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: typeof key === 'string'
        ? value
        : {
          ...prev[section],
          [key]: value
        }
    }));
  }, []);

  // Form gönderme
  const handleSubmit = useCallback(() => {
    onSave(settings);
  }, [settings, onSave]);

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
        <Typography variant="h6">Ayarlar</Typography>
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

        <List>
          {/* Tema Ayarları */}
          <ListItem>
            <ListItemIcon>
              <PaletteIcon />
            </ListItemIcon>
            <FormControl fullWidth>
              <InputLabel>Tema</InputLabel>
              <Select
                value={settings.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
                disabled={loading}
              >
                {THEMES.map(theme => (
                  <MenuItem key={theme.value} value={theme.value}>
                    {theme.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </ListItem>

          {/* Dil Ayarları */}
          <ListItem>
            <ListItemIcon>
              <LanguageIcon />
            </ListItemIcon>
            <FormControl fullWidth>
              <InputLabel>Dil</InputLabel>
              <Select
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                disabled={loading}
              >
                {LANGUAGES.map(lang => (
                  <MenuItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </ListItem>

          {/* Para Birimi */}
          <ListItem>
            <ListItemIcon>
              <StorageIcon />
            </ListItemIcon>
            <FormControl fullWidth>
              <InputLabel>Para Birimi</InputLabel>
              <Select
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                disabled={loading}
              >
                {CURRENCIES.map(currency => (
                  <MenuItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </ListItem>

          <Divider sx={{ my: 2 }} />

          {/* Bildirim Ayarları */}
          <ListItem>
            <ListItemIcon>
              <NotificationsIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Bildirimler"
              secondary="Bildirim tercihlerini yönetin"
            />
          </ListItem>

          <List component="div" disablePadding>
            {Object.entries(settings.notifications).map(([key, value]) => (
              <ListItem key={key} sx={{ pl: 4 }}>
                <ListItemText primary={key.charAt(0).toUpperCase() + key.slice(1)} />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={value}
                    onChange={(e) => handleChange('notifications', key, e.target.checked)}
                    disabled={loading}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          {/* Gizlilik Ayarları */}
          <ListItem>
            <ListItemIcon>
              <SecurityIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Gizlilik"
              secondary="Gizlilik tercihlerini yönetin"
            />
          </ListItem>

          <List component="div" disablePadding>
            {Object.entries(settings.privacy).map(([key, value]) => (
              <ListItem key={key} sx={{ pl: 4 }}>
                <ListItemText 
                  primary={key.charAt(0).toUpperCase() + key.slice(1)}
                  secondary={
                    <Typography variant="caption" color="textSecondary">
                      {key === 'analytics' 
                        ? 'Kullanım istatistiklerini topla'
                        : 'Hata raporlarını gönder'}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={value}
                    onChange={(e) => handleChange('privacy', key, e.target.checked)}
                    disabled={loading}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          {/* Gelişmiş Ayarlar */}
          <Divider sx={{ my: 2 }} />
          
          <ListItem button onClick={() => setShowAdvanced(!showAdvanced)}>
            <ListItemIcon>
              <StorageIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Gelişmiş Ayarlar"
              secondary="Performans ve önbellek ayarları"
            />
          </ListItem>

          <Collapse in={showAdvanced}>
            <List component="div" disablePadding>
              <ListItem sx={{ pl: 4 }}>
                <ListItemText 
                  primary="Otomatik Yenileme"
                  secondary="Verileri otomatik güncelle"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.advanced.autoRefresh}
                    onChange={(e) => handleChange('advanced', 'autoRefresh', e.target.checked)}
                    disabled={loading}
                  />
                </ListItemSecondaryAction>
              </ListItem>

              {settings.advanced.autoRefresh && (
                <ListItem sx={{ pl: 4 }}>
                  <TextField
                    label="Yenileme Aralığı (saniye)"
                    type="number"
                    value={settings.advanced.refreshInterval}
                    onChange={(e) => handleChange('advanced', 'refreshInterval', parseInt(e.target.value))}
                    disabled={loading}
                    fullWidth
                    InputProps={{ inputProps: { min: 5, max: 3600 } }}
                  />
                </ListItem>
              )}

              <ListItem sx={{ pl: 4 }}>
                <ListItemText 
                  primary="Önbellek"
                  secondary="Verileri önbellekte sakla"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.advanced.cacheEnabled}
                    onChange={(e) => handleChange('advanced', 'cacheEnabled', e.target.checked)}
                    disabled={loading}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Collapse>
        </List>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Tooltip title="Varsayılan ayarlara dön">
          <IconButton 
            onClick={handleReset}
            disabled={loading}
            color="error"
          >
            <ResetIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} disabled={loading}>
          İptal
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !hasChanges}
          startIcon={<SaveIcon />}
        >
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

SettingsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialSettings: PropTypes.shape({
    theme: PropTypes.string,
    language: PropTypes.string,
    currency: PropTypes.string,
    notifications: PropTypes.object,
    privacy: PropTypes.object,
    advanced: PropTypes.object
  }),
  loading: PropTypes.bool,
  error: PropTypes.string
};

export default React.memo(SettingsDialog); 