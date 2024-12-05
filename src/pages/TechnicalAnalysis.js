import React, { useState, useEffect } from 'react';
import { exchangeService } from '../services/exchangeService';
import { Box, FormControl, InputLabel, Select, MenuItem, Grid, Tab, Tabs } from '@mui/material';

function TechnicalAnalysis() {
  const [markets, setMarkets] = useState({});
  const [selectedExchange, setSelectedExchange] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [marketType, setMarketType] = useState('spot');

  useEffect(() => {
    const loadMarkets = async () => {
      try {
        if (marketType === 'spot') {
          const spotMarkets = await exchangeService.getAllSpotMarkets();
          setMarkets(spotMarkets);
        } else {
          const futuresMarkets = await exchangeService.getBinanceFuturesMarkets();
          setMarkets({ binance: futuresMarkets });
        }
      } catch (error) {
        console.error('Piyasalar yüklenemedi:', error);
      }
    };
    loadMarkets();
  }, [marketType]);

  return (
    <Box p={3}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Tabs
            value={marketType}
            onChange={(e, newValue) => setMarketType(newValue)}
            centered
          >
            <Tab label="Spot Piyasalar" value="spot" />
            <Tab label="Vadeli Piyasalar" value="futures" />
          </Tabs>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Borsa Seçin</InputLabel>
            <Select
              value={selectedExchange}
              onChange={(e) => setSelectedExchange(e.target.value)}
            >
              <MenuItem value="">Seçiniz</MenuItem>
              <MenuItem value="Binance">Binance</MenuItem>
              {marketType === 'spot' && (
                <>
                  <MenuItem value="KuCoin">KuCoin</MenuItem>
                  <MenuItem value="Bybit">Bybit</MenuItem>
                  <MenuItem value="MEXC">MEXC</MenuItem>
                </>
              )}
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
          <div id="technicalChart" style={{ width: '100%', height: '600px' }}></div>
        </Grid>
      </Grid>
    </Box>
  );
}

export default TechnicalAnalysis; 