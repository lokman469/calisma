import { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Paper,
  Box,
  Chip,
  Skeleton,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import { Star, StarBorder, TrendingUp, TrendingDown } from '@mui/icons-material';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { useRenderMetrics, useApiMetrics } from '../hooks/usePerformance';
import { withPerformance } from '../hoc/withPerformance';

function CoinList({ 
  coins = [], 
  onSelect, 
  onFavorite,
  loading = false,
  favorites = [],
  error = null 
}) {
  const theme = useTheme();
  useRenderMetrics('CoinList');
  const measureApi = useApiMetrics('/api/coins');

  // Sıralanmış ve filtrelenmiş coinleri memoize et
  const sortedCoins = useMemo(() => {
    return [...coins].sort((a, b) => b.marketCap - a.marketCap);
  }, [coins]);

  // API çağrısını ölç
  const handleRefresh = useCallback(async () => {
    const endMeasure = measureApi();
    try {
      await fetchCoins();
    } finally {
      endMeasure();
    }
  }, [measureApi]);

  // Favori durumunu kontrol et
  const isFavorite = useCallback((coinId) => {
    return favorites.includes(coinId);
  }, [favorites]);

  // Loading skeletons
  const renderSkeletons = () => (
    Array(5).fill(0).map((_, index) => (
      <ListItem key={`skeleton-${index}`} divider>
        <ListItemAvatar>
          <Skeleton variant="circular" width={40} height={40} />
        </ListItemAvatar>
        <ListItemText
          primary={<Skeleton width="60%" />}
          secondary={<Skeleton width="40%" />}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton width={80} />
          <Skeleton width={60} />
        </Box>
      </ListItem>
    ))
  );

  // Hata durumu
  if (error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
        <Typography variant="h6">
          {error}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3}>
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {loading ? renderSkeletons() : (
          sortedCoins.map((coin) => (
            <ListItem
              key={coin.id}
              divider
              button
              onClick={() => onSelect(coin)}
              sx={{
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <ListItemAvatar>
                <Avatar
                  src={coin.image}
                  alt={`${coin.name} logo`}
                  sx={{ width: 40, height: 40 }}
                />
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">
                      {coin.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {coin.symbol.toUpperCase()}
                    </Typography>
                  </Box>
                }
                secondary={formatCurrency(coin.current_price)}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  icon={coin.price_change_percentage_24h >= 0 ? <TrendingUp /> : <TrendingDown />}
                  label={formatPercentage(coin.price_change_percentage_24h)}
                  color={coin.price_change_percentage_24h >= 0 ? 'success' : 'error'}
                  size="small"
                />

                <Tooltip title={isFavorite(coin.id) ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onFavorite(coin.id);
                    }}
                    size="small"
                    color="primary"
                    aria-label={`${coin.name} favorilere ekle/çıkar`}
                  >
                    {isFavorite(coin.id) ? <Star /> : <StarBorder />}
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItem>
          ))
        )}
      </List>
    </Paper>
  );
}

CoinList.propTypes = {
  coins: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      symbol: PropTypes.string.isRequired,
      image: PropTypes.string.isRequired,
      current_price: PropTypes.number.isRequired,
      price_change_percentage_24h: PropTypes.number.isRequired,
      marketCap: PropTypes.number.isRequired
    })
  ),
  onSelect: PropTypes.func.isRequired,
  onFavorite: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  favorites: PropTypes.arrayOf(PropTypes.string),
  error: PropTypes.string
};

// Performans HOC ile sarmala
export default withPerformance(CoinList, { 
  name: 'CoinList',
  metrics: true
}); 