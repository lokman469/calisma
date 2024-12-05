import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Box,
  Typography,
  Grid,
  Chip,
  Tooltip,
  IconButton,
  CircularProgress,
  Alert,
  useTheme,
  Divider,
  LinearProgress,
  Card,
  CardContent,
  Fade,
  Collapse
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart as ChartIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { formatCurrency, formatPercentage, formatNumber } from '../utils/formatters';

const StatCard = ({ title, value, icon: Icon, change, loading, tooltip, color }) => {
  const theme = useTheme();
  
  return (
    <Card
      elevation={3}
      sx={{
        height: '100%',
        borderRadius: 2,
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)'
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: `${color || theme.palette.primary.main}20`,
              color: color || theme.palette.primary.main,
              mr: 1
            }}
          >
            <Icon />
          </Box>
          <Typography variant="subtitle2" color="textSecondary">
            {title}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Tooltip title={tooltip || ''}>
            <InfoIcon fontSize="small" color="action" />
          </Tooltip>
        </Box>

        {loading ? (
          <CircularProgress size={20} />
        ) : (
          <>
            <Typography variant="h5" gutterBottom>
              {value}
            </Typography>
            {change && (
              <Chip
                icon={change > 0 ? <TrendingUp /> : <TrendingDown />}
                label={formatPercentage(change)}
                size="small"
                color={change > 0 ? 'success' : 'error'}
                sx={{ mt: 1 }}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

const WatchlistStats = ({
  watchlist,
  marketData,
  onRefresh,
  loading = false,
  error = null,
  timeRange = '24h'
}) => {
  const theme = useTheme();

  // İstatistikleri hesapla
  const stats = useMemo(() => {
    if (!watchlist?.coins || !marketData) return null;

    const totalValue = watchlist.coins.reduce((sum, coin) => {
      const marketInfo = marketData[coin.id];
      return sum + (coin.amount * (marketInfo?.current_price || 0));
    }, 0);

    const totalChange24h = watchlist.coins.reduce((sum, coin) => {
      const marketInfo = marketData[coin.id];
      return sum + (marketInfo?.price_change_percentage_24h || 0);
    }, 0) / watchlist.coins.length;

    const highestGainer = watchlist.coins.reduce((max, coin) => {
      const marketInfo = marketData[coin.id];
      return marketInfo?.price_change_percentage_24h > (max?.change || -Infinity)
        ? { coin, change: marketInfo.price_change_percentage_24h }
        : max;
    }, null);

    const biggestLoser = watchlist.coins.reduce((min, coin) => {
      const marketInfo = marketData[coin.id];
      return marketInfo?.price_change_percentage_24h < (min?.change || Infinity)
        ? { coin, change: marketInfo.price_change_percentage_24h }
        : min;
    }, null);

    const marketDominance = watchlist.coins.reduce((acc, coin) => {
      const marketInfo = marketData[coin.id];
      const value = coin.amount * (marketInfo?.current_price || 0);
      return {
        ...acc,
        [coin.id]: (value / totalValue) * 100
      };
    }, {});

    return {
      totalValue,
      totalChange24h,
      highestGainer,
      biggestLoser,
      marketDominance
    };
  }, [watchlist, marketData]);

  // Pazar dominasyonu grafiği için renk oluştur
  const getColorForIndex = useCallback((index) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main
    ];
    return colors[index % colors.length];
  }, [theme]);

  if (error) {
    return (
      <Alert 
        severity="error"
        action={
          <IconButton
            color="inherit"
            size="small"
            onClick={onRefresh}
          >
            <RefreshIcon />
          </IconButton>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* İstatistik Kartları */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Toplam Değer"
            value={formatCurrency(stats?.totalValue)}
            icon={MoneyIcon}
            loading={loading}
            tooltip="Portföyünüzün toplam değeri"
            color={theme.palette.primary.main}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="24s Değişim"
            value={formatPercentage(stats?.totalChange24h)}
            icon={TimelineIcon}
            loading={loading}
            tooltip="Son 24 saatteki toplam değişim"
            color={theme.palette.secondary.main}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="En Yüksek Kazanç"
            value={stats?.highestGainer?.coin.name}
            change={stats?.highestGainer?.change}
            icon={TrendingUp}
            loading={loading}
            tooltip="En yüksek artış gösteren coin"
            color={theme.palette.success.main}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="En Yüksek Kayıp"
            value={stats?.biggestLoser?.coin.name}
            change={stats?.biggestLoser?.change}
            icon={TrendingDown}
            loading={loading}
            tooltip="En yüksek düşüş gösteren coin"
            color={theme.palette.error.main}
          />
        </Grid>
      </Grid>

      {/* Market Dominasyonu */}
      <Card sx={{ mt: 3, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PieChartIcon sx={{ mr: 1 }} color="primary" />
            <Typography variant="h6">
              Market Dominasyonu
            </Typography>
            <Box sx={{ flex: 1 }} />
            <IconButton
              onClick={onRefresh}
              disabled={loading}
              size="small"
            >
              <RefreshIcon />
            </IconButton>
          </Box>

          <Divider sx={{ my: 2 }} />

          {loading ? (
            <CircularProgress />
          ) : (
            <Box>
              {Object.entries(stats?.marketDominance || {})
                .sort(([, a], [, b]) => b - a)
                .map(([coinId, percentage], index) => {
                  const coin = watchlist.coins.find(c => c.id === coinId);
                  return (
                    <Box key={coinId} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2">
                          {coin.name}
                        </Typography>
                        <Box sx={{ flex: 1 }} />
                        <Typography variant="body2" color="textSecondary">
                          {formatPercentage(percentage)}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: `${getColorForIndex(index)}20`,
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getColorForIndex(index)
                          }
                        }}
                      />
                    </Box>
                  );
                })}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

WatchlistStats.propTypes = {
  watchlist: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    coins: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired
      })
    ).isRequired
  }),
  marketData: PropTypes.object,
  onRefresh: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  timeRange: PropTypes.string
};

export default React.memo(WatchlistStats); 