import React, { useState, useEffect } from 'react';
import { exchangeService } from '../services/exchangeService';
import { Box, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';

function MarketDepth() {
  const [markets, setMarkets] = useState({});
  const [selectedExchange, setSelectedExchange] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [depthData, setDepthData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMarkets = async () => {
      try {
        const allMarkets = await exchangeService.getAllSpotMarkets();
        setMarkets(allMarkets);
      } catch (error) {
        console.error('Piyasalar yüklenemedi:', error);
      }
    };
    loadMarkets();
  }, []);

  useEffect(() => {
    if (selectedExchange && selectedMarket) {
      const loadDepthData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const depth = await exchangeService.getMarketDepth(selectedExchange, selectedMarket);
          setDepthData(depth);
        } catch (error) {
          setError(error.message);
        } finally {
          setIsLoading(false);
        }
      };
      loadDepthData();
    }
  }, [selectedExchange, selectedMarket]);

  return (
    <Box p={3}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Borsa Seçin</InputLabel>
            <Select
              value={selectedExchange}
              onChange={(e) => setSelectedExchange(e.target.value)}
            >
              <MenuItem value="">Seçiniz</MenuItem>
              <MenuItem value="Binance">Binance</MenuItem>
              <MenuItem value="KuCoin">KuCoin</MenuItem>
              <MenuItem value="Bybit">Bybit</MenuItem>
              <MenuItem value="MEXC">MEXC</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Market Seçin</InputLabel>
            <Select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              disabled={!selectedExchange}
            >
              <MenuItem value="">Seçiniz</MenuItem>
              {selectedExchange && markets[selectedExchange.toLowerCase()]?.map(market => (
                <MenuItem key={market.symbol} value={market.symbol}>
                  {market.baseAsset}/{market.quoteAsset}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <div id="depthChart" style={{ width: '100%', height: '500px' }}></div>
        </Grid>
      </Grid>
    </Box>
  );
}

export default MarketDepth; 