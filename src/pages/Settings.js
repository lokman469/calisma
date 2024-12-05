import React, { useState, useEffect } from 'react';
import {
  Box, Card, Grid, Typography, Tabs, Tab,
  List, ListItem, ListItemText, ListItemIcon,
  Switch, Select, MenuItem, TextField, Button,
  Divider, Alert, CircularProgress
} from '@mui/material';
import {
  Person, Security, Notifications, Palette,
  Language, Api, Devices, Payment, Save,
  CheckCircle
} from '@mui/icons-material';

import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { useTheme } from '../hooks/useTheme';
import { useNotifications } from '../hooks/useNotifications';
import { useApi } from '../hooks/useApi';

import ProfileForm from '../components/settings/ProfileForm';
import SecuritySettings from '../components/settings/SecuritySettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import ThemeSettings from '../components/settings/ThemeSettings';
import ApiKeyManager from '../components/settings/ApiKeyManager';
import PaymentMethods from '../components/settings/PaymentMethods';
import DeviceManager from '../components/settings/DeviceManager';
import LanguageSelector from '../components/settings/LanguageSelector';

// Ayar kategorileri
const SETTING_CATEGORIES = {
  PROFILE: 'profile',
  SECURITY: 'security',
  NOTIFICATIONS: 'notifications',
  APPEARANCE: 'appearance',
  API: 'api',
  PAYMENT: 'payment',
  DEVICES: 'devices',
  PREFERENCES: 'preferences'
};

const Settings = () => {
  // Custom hooks
  const { user, updateProfile } = useAuth();
  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  const { theme, updateTheme } = useTheme();
  const { notificationSettings, updateNotifications } = useNotifications();
  const { apiKeys, generateApiKey, deleteApiKey } = useApi();

  // State
  const [activeTab, setActiveTab] = useState(SETTING_CATEGORIES.PROFILE);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    profile: {
      username: user?.username || '',
      email: user?.email || '',
      phone: user?.phone || '',
      country: user?.country || '',
      language: settings?.language || 'tr',
      timezone: settings?.timezone || 'Europe/Istanbul'
    },
    security: {
      twoFactorEnabled: user?.twoFactorEnabled || false,
      loginNotifications: settings?.security?.loginNotifications || true,
      withdrawalConfirmation: settings?.security?.withdrawalConfirmation || true
    },
    notifications: {
      email: notificationSettings?.email || {},
      push: notificationSettings?.push || {},
      telegram: notificationSettings?.telegram || {}
    },
    appearance: {
      theme: theme?.mode || 'light',
      density: settings?.appearance?.density || 'comfortable',
      chartStyle: settings?.appearance?.chartStyle || 'candles',
      orderBookStyle: settings?.appearance?.orderBookStyle || 'default'
    },
    preferences: {
      defaultMarket: settings?.preferences?.defaultMarket || 'BTC/USDT',
      defaultTimeframe: settings?.preferences?.defaultTimeframe || '1h',
      defaultOrderType: settings?.preferences?.defaultOrderType || 'limit'
    }
  });

  // Form değişikliği
  const handleFormChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  // Ayarları kaydetme
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Profil güncelleme
      if (activeTab === SETTING_CATEGORIES.PROFILE) {
        await updateProfile(formData.profile);
      }

      // Güvenlik ayarları
      if (activeTab === SETTING_CATEGORIES.SECURITY) {
        await updateSettings({ security: formData.security });
      }

      // Bildirim ayarları
      if (activeTab === SETTING_CATEGORIES.NOTIFICATIONS) {
        await updateNotifications(formData.notifications);
      }

      // Görünüm ayarları
      if (activeTab === SETTING_CATEGORIES.APPEARANCE) {
        await updateTheme(formData.appearance.theme);
        await updateSettings({ appearance: formData.appearance });
      }

      // Tercih ayarları
      if (activeTab === SETTING_CATEGORIES.PREFERENCES) {
        await updateSettings({ preferences: formData.preferences });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        {/* Sol Panel - Kategoriler */}
        <Grid item xs={12} md={3}>
          <Card>
            <List>
              <ListItem 
                button 
                selected={activeTab === SETTING_CATEGORIES.PROFILE}
                onClick={() => setActiveTab(SETTING_CATEGORIES.PROFILE)}
              >
                <ListItemIcon><Person /></ListItemIcon>
                <ListItemText primary="Profil" />
              </ListItem>
              <ListItem 
                button 
                selected={activeTab === SETTING_CATEGORIES.SECURITY}
                onClick={() => setActiveTab(SETTING_CATEGORIES.SECURITY)}
              >
                <ListItemIcon><Security /></ListItemIcon>
                <ListItemText primary="Güvenlik" />
              </ListItem>
              <ListItem 
                button 
                selected={activeTab === SETTING_CATEGORIES.NOTIFICATIONS}
                onClick={() => setActiveTab(SETTING_CATEGORIES.NOTIFICATIONS)}
              >
                <ListItemIcon><Notifications /></ListItemIcon>
                <ListItemText primary="Bildirimler" />
              </ListItem>
              <ListItem 
                button 
                selected={activeTab === SETTING_CATEGORIES.APPEARANCE}
                onClick={() => setActiveTab(SETTING_CATEGORIES.APPEARANCE)}
              >
                <ListItemIcon><Palette /></ListItemIcon>
                <ListItemText primary="Görünüm" />
              </ListItem>
              <ListItem 
                button 
                selected={activeTab === SETTING_CATEGORIES.API}
                onClick={() => setActiveTab(SETTING_CATEGORIES.API)}
              >
                <ListItemIcon><Api /></ListItemIcon>
                <ListItemText primary="API" />
              </ListItem>
              <ListItem 
                button 
                selected={activeTab === SETTING_CATEGORIES.PAYMENT}
                onClick={() => setActiveTab(SETTING_CATEGORIES.PAYMENT)}
              >
                <ListItemIcon><Payment /></ListItemIcon>
                <ListItemText primary="Ödeme" />
              </ListItem>
              <ListItem 
                button 
                selected={activeTab === SETTING_CATEGORIES.DEVICES}
                onClick={() => setActiveTab(SETTING_CATEGORIES.DEVICES)}
              >
                <ListItemIcon><Devices /></ListItemIcon>
                <ListItemText primary="Cihazlar" />
              </ListItem>
              <ListItem 
                button 
                selected={activeTab === SETTING_CATEGORIES.PREFERENCES}
                onClick={() => setActiveTab(SETTING_CATEGORIES.PREFERENCES)}
              >
                <ListItemIcon><Language /></ListItemIcon>
                <ListItemText primary="Tercihler" />
              </ListItem>
            </List>
          </Card>
        </Grid>

        {/* Sağ Panel - Ayar Detayları */}
        <Grid item xs={12} md={9}>
          <Card sx={{ p: 3 }}>
            {/* Başlık */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5">
                {activeTab === SETTING_CATEGORIES.PROFILE && 'Profil Ayarları'}
                {activeTab === SETTING_CATEGORIES.SECURITY && 'Güvenlik Ayarları'}
                {activeTab === SETTING_CATEGORIES.NOTIFICATIONS && 'Bildirim Ayarları'}
                {activeTab === SETTING_CATEGORIES.APPEARANCE && 'Görünüm Ayarları'}
                {activeTab === SETTING_CATEGORIES.API && 'API Yönetimi'}
                {activeTab === SETTING_CATEGORIES.PAYMENT && 'Ödeme Yöntemleri'}
                {activeTab === SETTING_CATEGORIES.DEVICES && 'Cihaz Yönetimi'}
                {activeTab === SETTING_CATEGORIES.PREFERENCES && 'Tercihler'}
              </Typography>
              {activeTab !== SETTING_CATEGORIES.API && (
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  Kaydet
                </Button>
              )}
            </Box>

            {/* Hata ve Başarı Mesajları */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {saveSuccess && (
              <Alert 
                severity="success" 
                icon={<CheckCircle />}
                sx={{ mb: 2 }}
              >
                Ayarlar başarıyla kaydedildi
              </Alert>
            )}

            {/* Ayar İçeriği */}
            {activeTab === SETTING_CATEGORIES.PROFILE && (
              <ProfileForm 
                data={formData.profile}
                onChange={(field, value) => handleFormChange('profile', field, value)}
              />
            )}
            {activeTab === SETTING_CATEGORIES.SECURITY && (
              <SecuritySettings 
                data={formData.security}
                onChange={(field, value) => handleFormChange('security', field, value)}
              />
            )}
            {activeTab === SETTING_CATEGORIES.NOTIFICATIONS && (
              <NotificationSettings 
                data={formData.notifications}
                onChange={(field, value) => handleFormChange('notifications', field, value)}
              />
            )}
            {activeTab === SETTING_CATEGORIES.APPEARANCE && (
              <ThemeSettings 
                data={formData.appearance}
                onChange={(field, value) => handleFormChange('appearance', field, value)}
              />
            )}
            {activeTab === SETTING_CATEGORIES.API && (
              <ApiKeyManager 
                apiKeys={apiKeys}
                onGenerate={generateApiKey}
                onDelete={deleteApiKey}
              />
            )}
            {activeTab === SETTING_CATEGORIES.PAYMENT && (
              <PaymentMethods />
            )}
            {activeTab === SETTING_CATEGORIES.DEVICES && (
              <DeviceManager />
            )}
            {activeTab === SETTING_CATEGORIES.PREFERENCES && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <LanguageSelector 
                      value={formData.profile.language}
                      onChange={(value) => handleFormChange('profile', 'language', value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Varsayılan Market
                    </Typography>
                    <Select
                      fullWidth
                      value={formData.preferences.defaultMarket}
                      onChange={(e) => handleFormChange('preferences', 'defaultMarket', e.target.value)}
                    >
                      <MenuItem value="BTC/USDT">BTC/USDT</MenuItem>
                      <MenuItem value="ETH/USDT">ETH/USDT</MenuItem>
                      <MenuItem value="BNB/USDT">BNB/USDT</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Varsayılan Zaman Dilimi
                    </Typography>
                    <Select
                      fullWidth
                      value={formData.preferences.defaultTimeframe}
                      onChange={(e) => handleFormChange('preferences', 'defaultTimeframe', e.target.value)}
                    >
                      <MenuItem value="1m">1 dakika</MenuItem>
                      <MenuItem value="5m">5 dakika</MenuItem>
                      <MenuItem value="15m">15 dakika</MenuItem>
                      <MenuItem value="1h">1 saat</MenuItem>
                      <MenuItem value="4h">4 saat</MenuItem>
                      <MenuItem value="1d">1 gün</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Varsayılan Emir Tipi
                    </Typography>
                    <Select
                      fullWidth
                      value={formData.preferences.defaultOrderType}
                      onChange={(e) => handleFormChange('preferences', 'defaultOrderType', e.target.value)}
                    >
                      <MenuItem value="limit">Limit</MenuItem>
                      <MenuItem value="market">Market</MenuItem>
                      <MenuItem value="stop_limit">Stop Limit</MenuItem>
                    </Select>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings; 