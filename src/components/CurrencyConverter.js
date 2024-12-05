import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Paper,
  Typography,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Box,
  Tooltip,
  Alert,
  CircularProgress,
  useTheme,
  Divider
} from '@mui/material';
import {
  SwapHoriz as SwapIcon,
  Calculate as CalculateIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { formatCurrency } from '../utils/formatters';
import { debounce } from 'lodash';

const FIAT_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'ABD Doları' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'TRY', symbol: '₺', name: 'Türk Lirası' },
  { code: 'GBP', symbol: '£', name: 'İngiliz Sterlini' },
  { code: 'JPY', symbol: '¥', name: 'Japon Yeni' }
];

function CurrencyConverter({ loading = false, error = null }) {
  const theme = useTheme();
  const { data: cryptoData } = useSelector(state => state.crypto);
  
  const [formData, setFormData] = useState({
    amount: '',
    fromCurrency: '',
    toCurrency: '',
    result: null
  });

  // Kullanılabilir kripto paraları memoize et
  const availableCryptos = useMemo(() => {
    return cryptoData?.map(crypto => ({
      code: crypto.symbol.toUpperCase(),
      name: crypto.name,
      price: crypto.current_price,
      image: crypto.image
    })) || [];
  }, [cryptoData]);

  // Para birimlerini değiştir
  const handleSwapCurrencies = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      fromCurrency: prev.toCurrency,
      toCurrency: prev.fromCurrency,
      result: null
    }));
  }, []);

  // Dönüşüm hesaplama
  const calculateConversion = useCallback(debounce(() => {
    const { amount, fromCurrency, toCurrency } = formData;
    if (!amount || !fromCurrency || !toCurrency) return null;

    try {
      let rate = 1;
      const fromCrypto = availableCryptos.find(c => c.code === fromCurrency);
      const toCrypto = availableCryptos.find(c => c.code === toCurrency);
      
      if (fromCrypto && toCrypto) {
        rate = fromCrypto.price / toCrypto.price;
      } else if (fromCrypto) {
        rate = fromCrypto.price;
      } else if (toCrypto) {
        rate = 1 / toCrypto.price;
      }

      const result = parseFloat(amount) * rate;
      setFormData(prev => ({ ...prev, result }));
    } catch (err) {
      console.error('Dönüşüm hatası:', err);
    }
  }, 500), [formData.amount, formData.fromCurrency, formData.toCurrency, availableCryptos]);

  // Input değişiklik handler'ı
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      result: null
    }));
  }, []);

  // Tüm para birimlerini birleştir
  const allCurrencies = useMemo(() => [
    ...FIAT_CURRENCIES,
    ...availableCryptos
  ], [availableCryptos]);

  if (error) {
    return (
      <Alert 
        severity="error" 
        icon={<ErrorIcon />}
        sx={{ mb: 2 }}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalculateIcon color="primary" />
        <Typography variant="h6">
          Para Birimi Dönüştürücü
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Miktar"
            type="number"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: formData.fromCurrency && (
                <Typography sx={{ mr: 1 }}>
                  {allCurrencies.find(c => c.code === formData.fromCurrency)?.symbol || ''}
                </Typography>
              )
            }}
          />
        </Grid>

        <Grid item xs={12} sm={5}>
          <TextField
            select
            fullWidth
            label="Kaynak Para Birimi"
            value={formData.fromCurrency}
            onChange={(e) => handleChange('fromCurrency', e.target.value)}
            disabled={loading}
          >
            {allCurrencies.map((currency) => (
              <MenuItem key={currency.code} value={currency.code}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {currency.image && (
                    <img 
                      src={currency.image} 
                      alt={currency.name}
                      style={{ width: 20, height: 20 }}
                    />
                  )}
                  {currency.name} ({currency.code})
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Tooltip title="Para Birimlerini Değiştir">
            <IconButton 
              onClick={handleSwapCurrencies}
              disabled={loading || !formData.fromCurrency || !formData.toCurrency}
            >
              <SwapIcon />
            </IconButton>
          </Tooltip>
        </Grid>

        <Grid item xs={12} sm={5}>
          <TextField
            select
            fullWidth
            label="Hedef Para Birimi"
            value={formData.toCurrency}
            onChange={(e) => handleChange('toCurrency', e.target.value)}
            disabled={loading}
          >
            {allCurrencies.map((currency) => (
              <MenuItem key={currency.code} value={currency.code}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {currency.image && (
                    <img 
                      src={currency.image} 
                      alt={currency.name}
                      style={{ width: 20, height: 20 }}
                    />
                  )}
                  {currency.name} ({currency.code})
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {loading && (
          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <CircularProgress size={24} />
          </Grid>
        )}

        {formData.result !== null && (
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5">
                {formatCurrency(formData.result, formData.toCurrency)}
              </Typography>
              <Tooltip title="Anlık piyasa verilerine göre hesaplanmıştır">
                <InfoIcon color="action" fontSize="small" />
              </Tooltip>
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}

CurrencyConverter.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.string
};

export default React.memo(CurrencyConverter); 