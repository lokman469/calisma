import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import { priceAlertService } from '../services/priceAlertService';
import { statisticsService } from '../services/statisticsService';
import AlertStatistics from '../components/AlertStatistics';
import AlertTemplates from '../components/AlertTemplates';
import PortfolioAlerts from '../components/PortfolioAlerts';
import CreateAlertDialog from '../components/CreateAlertDialog';
import AlertsTable from '../components/AlertsTable';

function TabPanel({ children, value, index }) {
  return (
    <Box hidden={value !== index} sx={{ pt: 2 }}>
      {value === index && children}
    </Box>
  );
}

function PriceAlerts() {
  const [activeTab, setActiveTab] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [portfolio, setPortfolio] = useState({ assets: [] });
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'success' });

  // İstatistikleri hesapla
  const statistics = useMemo(() => {
    return statisticsService.calculateAlertStats(alerts);
  }, [alerts]);

  useEffect(() => {
    loadAlerts();
    loadPortfolio();
    requestNotificationPermission();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const savedAlerts = await priceAlertService.loadAlerts();
      setAlerts(savedAlerts);
    } catch (error) {
      setError('Alarmlar yüklenirken bir hata oluştu');
      console.error('Alarm yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolio = async () => {
    try {
      // Portfolio verilerini API'den al
      const response = await fetch('/api/portfolio');
      const data = await response.json();
      setPortfolio(data);
    } catch (error) {
      console.error('Portföy yükleme hatası:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if (Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  };

  const handleCreateAlert = async (alertData) => {
    try {
      await priceAlertService.createAlert(alertData);
      await loadAlerts();
      setOpenCreateDialog(false);
      showNotification('Alarm başarıyla oluşturuldu', 'success');
    } catch (error) {
      showNotification('Alarm oluşturulurken bir hata oluştu', 'error');
      console.error('Alarm oluşturma hatası:', error);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await priceAlertService.deleteAlert(alertId);
      await loadAlerts();
      showNotification('Alarm başarıyla silindi', 'success');
    } catch (error) {
      showNotification('Alarm silinirken bir hata oluştu', 'error');
      console.error('Alarm silme hatası:', error);
    }
  };

  const handleApplyTemplate = (template) => {
    setOpenCreateDialog(true);
    // Template verilerini form'a doldur
  };

  const showNotification = (message, type = 'success') => {
    setNotification({
      open: true,
      message,
      type
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* İstatistikler */}
        <Grid item xs={12}>
          <AlertStatistics alerts={alerts} />
        </Grid>

        {/* Ana İçerik */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">Fiyat Alarmları</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddAlertIcon />}
                  onClick={() => setOpenCreateDialog(true)}
                >
                  Yeni Alarm
                </Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{ mb: 2 }}
              >
                <Tab label="Aktif Alarmlar" />
                <Tab label="Şablonlar" />
                <Tab label="Portföy Alarmları" />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                <AlertsTable
                  alerts={alerts}
                  onDelete={handleDeleteAlert}
                  onEdit={(alert) => {
                    // Edit işlemleri
                  }}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <AlertTemplates onApplyTemplate={handleApplyTemplate} />
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <PortfolioAlerts
                  portfolio={portfolio}
                  onCreateAlerts={loadAlerts}
                />
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <CreateAlertDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        onSubmit={handleCreateAlert}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.type} onClose={() => setNotification({ ...notification, open: false })}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default PriceAlerts; 