import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Button,
  Box,
  Chip
} from '@mui/material';
import axios from 'axios';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

const EXCHANGES = [
  { id: 'binance', name: 'Binance' },
  { id: 'kucoin', name: 'KuCoin' },
  { id: 'gate', name: 'Gate.io' },
  { id: 'huobi', name: 'Huobi' },
  { id: 'okx', name: 'OKX' }
];

function ArbitrageOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [minProfit, setMinProfit] = useState(1);
  const [selectedExchanges, setSelectedExchanges] = useState(['binance', 'kucoin']);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError(null);

      // Her borsadan fiyatları çek
      const pricePromises = selectedExchanges.map(async (exchange) => {
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/exchanges/${exchange}/tickers`
        );
        return {
          exchange,
          tickers: response.data.tickers
        };
      });

      const results = await Promise.all(pricePromises);
      
      // Arbitraj fırsatlarını hesapla
      const opportunities = [];
      const coins = new Set();

      // Tüm ortak coinleri bul
      results.forEach(result => {
        result.tickers.forEach(ticker => {
          if (ticker.base === ticker.target) return; // USDT/USDT gibi çiftleri atla
          coins.add(ticker.base);
        });
      });

      // Her coin için fiyat farklarını kontrol et
      coins.forEach(coin => {
        const prices = [];

        results.forEach(result => {
          const ticker = result.tickers.find(t => t.base === coin && t.target === 'USDT');
          if (ticker) {
            prices.push({
              exchange: result.exchange,
              price: ticker.last,
              volume: ticker.volume
            });
          }
        });

        // En az 2 borsada işlem gören coinler için arbitraj hesapla
        if (prices.length >= 2) {
          const maxPrice = Math.max(...prices.map(p => p.price));
          const minPrice = Math.min(...prices.map(p => p.price));
          const profitPercentage = ((maxPrice - minPrice) / minPrice) * 100;

          if (profitPercentage >= minProfit) {
            const buyExchange = prices.find(p => p.price === minPrice);
            const sellExchange = prices.find(p => p.price === maxPrice);

            opportunities.push({
              coin,
              buyExchange: buyExchange.exchange,
              sellExchange: sellExchange.exchange,
              buyPrice: minPrice,
              sellPrice: maxPrice,
              profit: profitPercentage,
              volume: Math.min(buyExchange.volume, sellExchange.volume),
              timestamp: Date.now()
            });
          }
        }
      });

      setOpportunities(opportunities.sort((a, b) => b.profit - a.profit));
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Arbitraj fırsatları yüklenirken hata:', error);
      setError('Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [selectedExchanges, minProfit, refreshInterval]);

  const handleExchangeToggle = (exchangeId) => {
    if (selectedExchanges.includes(exchangeId)) {
      if (selectedExchanges.length > 2) {
        setSelectedExchanges(selectedExchanges.filter(id => id !== exchangeId));
      }
    } else {
      setSelectedExchanges([...selectedExchanges, exchangeId]);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Arbitraj Fırsatları
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Minimum Kâr (%)"
              value={minProfit}
              onChange={(e) => setMinProfit(Number(e.target.value))}
              InputProps={{ inputProps: { min: 0.1, step: 0.1 } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="number"
              label="Yenileme Aralığı (sn)"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              InputProps={{ inputProps: { min: 5, step: 5 } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={fetchPrices}
              disabled={loading}
              sx={{ height: '100%' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Yenile'}
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Borsalar:
          </Typography>
          {EXCHANGES.map((exchange) => (
            <Chip
              key={exchange.id}
              label={exchange.name}
              onClick={() => handleExchangeToggle(exchange.id)}
              color={selectedExchanges.includes(exchange.id) ? 'primary' : 'default'}
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {lastUpdate && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Son güncelleme: {lastUpdate.toLocaleTimeString()}
          </Typography>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Coin</TableCell>
                <TableCell>Al</TableCell>
                <TableCell>Sat</TableCell>
                <TableCell align="right">Alış Fiyatı</TableCell>
                <TableCell align="right">Satış Fiyatı</TableCell>
                <TableCell align="right">Kâr (%)</TableCell>
                <TableCell align="right">Hacim (24s)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {opportunities.map((opp) => (
                <TableRow 
                  key={`${opp.coin}-${opp.buyExchange}-${opp.sellExchange}`}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CompareArrowsIcon color="primary" />
                      {opp.coin}
                    </Box>
                  </TableCell>
                  <TableCell>{EXCHANGES.find(e => e.id === opp.buyExchange)?.name}</TableCell>
                  <TableCell>{EXCHANGES.find(e => e.id === opp.sellExchange)?.name}</TableCell>
                  <TableCell align="right">${opp.buyPrice.toFixed(4)}</TableCell>
                  <TableCell align="right">${opp.sellPrice.toFixed(4)}</TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      color: 'success.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 1
                    }}
                  >
                    <TrendingUpIcon fontSize="small" />
                    {opp.profit.toFixed(2)}%
                  </TableCell>
                  <TableCell align="right">
                    {opp.volume.toLocaleString()} {opp.coin}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {opportunities.length === 0 && !loading && (
          <Typography 
            color="text.secondary" 
            sx={{ textAlign: 'center', mt: 2 }}
          >
            Şu anda arbitraj fırsatı bulunamadı
          </Typography>
        )}
      </Paper>
    </Container>
  );
}

export default ArbitrageOpportunities; 