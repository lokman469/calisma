import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Card, Grid, Typography, Tabs, Tab, 
  TextField, InputAdornment, IconButton,
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TableSortLabel
} from '@mui/material';
import { 
  Search, Star, StarBorder, TrendingUp, 
  TrendingDown, Refresh 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useMarketData } from '../hooks/useMarketData';
import { useWatchlist } from '../hooks/useWatchlist';
import { useSettings } from '../hooks/useSettings';

import MarketChart from '../components/charts/MarketChart';
import MarketStats from '../components/market/MarketStats';
import TopMovers from '../components/market/TopMovers';
import VolumeLeaders from '../components/market/VolumeLeaders';
import MarketNews from '../components/market/MarketNews';

// Market kategorileri
const MARKET_CATEGORIES = {
  ALL: 'all',
  SPOT: 'spot',
  MARGIN: 'margin',
  FUTURES: 'futures'
};

// Para birimleri
const QUOTE_CURRENCIES = ['USDT', 'BTC', 'ETH', 'EUR', 'TRY'];

const Markets = () => {
  const navigate = useNavigate();
  const { markets, loading: marketsLoading } = useMarketData();
  const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { settings } = useSettings();

  // State
  const [category, setCategory] = useState(MARKET_CATEGORIES.ALL);
  const [quoteCurrency, setQuoteCurrency] = useState('USDT');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'volume',
    direction: 'desc'
  });
  const [refreshing, setRefreshing] = useState(false);

  // Filtrelenmiş ve sıralanmış marketler
  const filteredMarkets = useMemo(() => {
    if (!markets) return [];

    return markets
      .filter(market => {
        // Kategori filtresi
        if (category !== MARKET_CATEGORIES.ALL && market.type !== category) {
          return false;
        }

        // Quote currency filtresi
        if (quoteCurrency && !market.symbol.endsWith(quoteCurrency)) {
          return false;
        }

        // Arama filtresi
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return market.symbol.toLowerCase().includes(query) ||
                 market.name.toLowerCase().includes(query);
        }

        return true;
      })
      .sort((a, b) => {
        const { key, direction } = sortConfig;
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [markets, category, quoteCurrency, searchQuery, sortConfig]);

  // Top movers
  const topMovers = useMemo(() => {
    if (!markets) return [];
    return [...markets]
      .sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange))
      .slice(0, 5);
  }, [markets]);

  // Volume leaders
  const volumeLeaders = useMemo(() => {
    if (!markets) return [];
    return [...markets]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  }, [markets]);

  // Sıralama değişimi
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Market seçimi
  const handleMarketSelect = (symbol) => {
    navigate(`/trade/${symbol}`);
  };

  // Yenileme
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Market verilerini yenile
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Üst Panel - İstatistikler */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <MarketStats loading={marketsLoading} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Piyasa Trendi
            </Typography>
            <MarketChart loading={marketsLoading} />
          </Card>
        </Grid>
      </Grid>

      {/* Filtreler ve Arama */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Tabs value={category} onChange={(e, v) => setCategory(v)}>
              {Object.entries(MARKET_CATEGORIES).map(([key, value]) => (
                <Tab key={key} label={key} value={value} />
              ))}
            </Tabs>
          </Grid>
          <Grid item>
            <Tabs value={quoteCurrency} onChange={(e, v) => setQuoteCurrency(v)}>
              {QUOTE_CURRENCIES.map(currency => (
                <Tab key={currency} label={currency} value={currency} />
              ))}
            </Tabs>
          </Grid>
          <Grid item xs>
            <TextField
              fullWidth
              size="small"
              placeholder="Market Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item>
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <Refresh />
            </IconButton>
          </Grid>
        </Grid>
      </Card>

      {/* Market Tablosu */}
      <Card sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Favori</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'symbol'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('symbol')}
                  >
                    Market
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortConfig.key === 'price'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('price')}
                  >
                    Fiyat
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortConfig.key === 'priceChange'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('priceChange')}
                  >
                    24s Değişim
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortConfig.key === 'volume'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('volume')}
                  >
                    24s Hacim
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMarkets.map(market => (
                <TableRow 
                  key={market.symbol}
                  hover
                  onClick={() => handleMarketSelect(market.symbol)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <IconButton 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        watchlist.includes(market.symbol)
                          ? removeFromWatchlist(market.symbol)
                          : addToWatchlist(market.symbol);
                      }}
                    >
                      {watchlist.includes(market.symbol) ? <Star /> : <StarBorder />}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">
                        {market.symbol}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="textSecondary"
                        sx={{ ml: 1 }}
                      >
                        {market.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {market.price.toLocaleString()}
                  </TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      color: market.priceChange >= 0 
                        ? 'success.main' 
                        : 'error.main' 
                    }}
                  >
                    {market.priceChange >= 0 ? <TrendingUp /> : <TrendingDown />}
                    {market.priceChange.toFixed(2)}%
                  </TableCell>
                  <TableCell align="right">
                    {market.volume.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    {/* İşlem butonları */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Alt Panel */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <TopMovers data={topMovers} loading={marketsLoading} />
        </Grid>
        <Grid item xs={12} md={4}>
          <VolumeLeaders data={volumeLeaders} loading={marketsLoading} />
        </Grid>
        <Grid item xs={12} md={4}>
          <MarketNews />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Markets; 