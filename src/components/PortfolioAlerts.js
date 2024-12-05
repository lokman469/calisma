import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { priceAlertService } from '../services/priceAlertService';

function PortfolioAlerts({ portfolio }) {
  const [settings, setSettings] = useState({
    stopLoss: {
      enabled: true,
      percentage: 5
    },
    takeProfit: {
      enabled: true,
      percentage: 10
    },
    volatility: {
      enabled: false,
      percentage: 5,
      timeframe: '1h'
    }
  });

  const [openSettings, setOpenSettings] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);

  useEffect(() => {
    loadActiveAlerts();
  }, [portfolio]);

  const loadActiveAlerts = () => {
    // LocalStorage'dan mevcut alarmları yükle
    const alerts = JSON.parse(localStorage.getItem('portfolioAlerts') || '[]');
    setActiveAlerts(alerts);
  };

  const generateAlerts = async () => {
    const newAlerts = [];

    for (const asset of portfolio.assets) {
      if (settings.stopLoss.enabled) {
        const stopLossPrice = asset.averagePrice * (1 - settings.stopLoss.percentage / 100);
        newAlerts.push({
          type: 'stop_loss',
          exchange: asset.exchange,
          symbol: asset.symbol,
          targetPrice: stopLossPrice,
          condition: 'below',
          note: `Stop Loss - ${settings.stopLoss.percentage}% altında`
        });
      }

      if (settings.takeProfit.enabled) {
        const takeProfitPrice = asset.averagePrice * (1 + settings.takeProfit.percentage / 100);
        newAlerts.push({
          type: 'take_profit',
          exchange: asset.exchange,
          symbol: asset.symbol,
          targetPrice: takeProfitPrice,
          condition: 'above',
          note: `Take Profit - ${settings.takeProfit.percentage}% üzerinde`
        });
      }

      if (settings.volatility.enabled) {
        newAlerts.push({
          type: 'volatility',
          exchange: asset.exchange,
          symbol: asset.symbol,
          percentage: settings.volatility.percentage,
          timeframe: settings.volatility.timeframe,
          note: `Volatilite - ${settings.volatility.percentage}% ${settings.volatility.timeframe}`
        });
      }
    }

    // Alarmları oluştur
    for (const alert of newAlerts) {
      await priceAlertService.createAlert(alert);
    }

    // LocalStorage'a kaydet
    localStorage.setItem('portfolioAlerts', JSON.stringify(newAlerts));
    setActiveAlerts(newAlerts);
  };

  const handleSettingsChange = (type, field, value) => {
    setSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Portföy Alarmları</Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={() => setOpenSettings(true)}
            sx={{ mr: 1 }}
          >
            Ayarlar
          </Button>
          <Button
            variant="contained"
            onClick={generateAlerts}
          >
            Alarmları Oluştur
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sembol</TableCell>
              <TableCell>Ortalama Fiyat</TableCell>
              <TableCell>Stop Loss</TableCell>
              <TableCell>Take Profit</TableCell>
              <TableCell>Volatilite Alarmı</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {portfolio.assets.map((asset) => (
              <TableRow key={asset.symbol}>
                <TableCell>{asset.symbol}</TableCell>
                <TableCell>{asset.averagePrice}</TableCell>
                <TableCell>
                  {settings.stopLoss.enabled && 
                    `${(asset.averagePrice * (1 - settings.stopLoss.percentage / 100)).toFixed(2)}`}
                </TableCell>
                <TableCell>
                  {settings.takeProfit.enabled &&
                    `${(asset.averagePrice * (1 + settings.takeProfit.percentage / 100)).toFixed(2)}`}
                </TableCell>
                <TableCell>
                  {settings.volatility.enabled && 
                    `${settings.volatility.percentage}% / ${settings.volatility.timeframe}`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openSettings} onClose={() => setOpenSettings(false)}>
        <DialogTitle>Portföy Alarm Ayarları</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, mt: 2 }}>
            {/* Stop Loss Ayarları */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.stopLoss.enabled}
                      onChange={(e) => handleSettingsChange('stopLoss', 'enabled', e.target.checked)}
                    />
                  }
                  label="Stop Loss"
                />
                <Box sx={{ px: 2 }}>
                  <Typography gutterBottom>Yüzde</Typography>
                  <Slider
                    disabled={!settings.stopLoss.enabled}
                    value={settings.stopLoss.percentage}
                    onChange={(_, value) => handleSettingsChange('stopLoss', 'percentage', value)}
                    min={1}
                    max={20}
                    valueLabelDisplay="auto"
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Take Profit Ayarları */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.takeProfit.enabled}
                      onChange={(e) => handleSettingsChange('takeProfit', 'enabled', e.target.checked)}
                    />
                  }
                  label="Take Profit"
                />
                <Box sx={{ px: 2 }}>
                  <Typography gutterBottom>Yüzde</Typography>
                  <Slider
                    disabled={!settings.takeProfit.enabled}
                    value={settings.takeProfit.percentage}
                    onChange={(_, value) => handleSettingsChange('takeProfit', 'percentage', value)}
                    min={1}
                    max={50}
                    valueLabelDisplay="auto"
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Volatilite Ayarları */}
            <Card>
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.volatility.enabled}
                      onChange={(e) => handleSettingsChange('volatility', 'enabled', e.target.checked)}
                    />
                  }
                  label="Volatilite Alarmı"
                />
                <Box sx={{ px: 2 }}>
                  <Typography gutterBottom>Yüzde</Typography>
                  <Slider
                    disabled={!settings.volatility.enabled}
                    value={settings.volatility.percentage}
                    onChange={(_, value) => handleSettingsChange('volatility', 'percentage', value)}
                    min={1}
                    max={20}
                    valueLabelDisplay="auto"
                  />
                  <TextField
                    select
                    fullWidth
                    label="Zaman Dilimi"
                    value={settings.volatility.timeframe}
                    onChange={(e) => handleSettingsChange('volatility', 'timeframe', e.target.value)}
                    disabled={!settings.volatility.enabled}
                    sx={{ mt: 2 }}
                  >
                    <MenuItem value="15m">15 dakika</MenuItem>
                    <MenuItem value="1h">1 saat</MenuItem>
                    <MenuItem value="4h">4 saat</MenuItem>
                    <MenuItem value="1d">1 gün</MenuItem>
                  </TextField>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettings(false)}>Kapat</Button>
          <Button onClick={() => setOpenSettings(false)} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PortfolioAlerts; 