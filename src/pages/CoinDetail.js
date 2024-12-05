import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { coinApi } from '../services/api';

function CoinDetail() {
  const { id } = useParams();
  const [price, setPrice] = useState(null);
  const { data: coinData, error, loading, execute: fetchCoin } = useApi(coinApi.getCoin);

  useEffect(() => {
    fetchCoin(id);
  }, [id, fetchCoin]);

  // WebSocket ile canlı fiyat takibi
  useWebSocket('ticker', (data) => {
    if (data.symbol.toLowerCase() === id) {
      setPrice(data.price);
    }
  });

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        {coinData && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h4" gutterBottom>
                {coinData.name} ({coinData.symbol.toUpperCase()})
              </Typography>
              {price && (
                <Typography variant="h5" color="primary">
                  ${parseFloat(price).toFixed(2)}
                </Typography>
              )}
            </Grid>
            {/* Diğer coin detayları */}
          </Grid>
        )}
      </Paper>
    </Container>
  );
}

export default CoinDetail; 