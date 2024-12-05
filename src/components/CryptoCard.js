import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  useTheme,
  LinearProgress,
  Collapse
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Star,
  StarBorder,
  ShowChart,
  Notifications,
  Info as InfoIcon
} from '@mui/icons-material';
import { formatCurrency, formatPercentage, formatVolume } from '../utils/formatters';

const CryptoCard = React.memo(({ 
  crypto, 
  onFavorite, 
  onShowChart, 
  onSetAlert,
  isFavorite = false,
  loading = false,
  expanded = false 
}) => {
  const theme = useTheme();

  // Fiyat değişimi rengini belirle
  const priceChangeColor = useMemo(() => {
    if (!crypto?.price_change_percentage_24h) return theme.palette.text.secondary;
    return crypto.price_change_percentage_24h > 0 
      ? theme.palette.success.main 
      : theme.palette.error.main;
  }, [crypto?.price_change_percentage_24h, theme]);

  // Market değeri yüzdesini hesapla
  const marketCapPercentage = useMemo(() => {
    if (!crypto?.market_cap || !crypto?.total_supply) return 0;
    return (crypto.market_cap / (crypto.total_supply * crypto.current_price)) * 100;
  }, [crypto]);

  if (loading) {
    return (
      <Card elevation={3}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Skeleton variant="circular" width={30} height={30} />
            <Box ml={1}>
              <Skeleton width={100} height={24} />
              <Skeleton width={60} height={20} />
            </Box>
          </Box>
          <Skeleton width="60%" height={24} />
          <Skeleton width="40%" height={20} />
          <Skeleton width="80%" height={20} />
        </CardContent>
        <CardActions>
          <Skeleton width={120} height={36} />
        </CardActions>
      </Card>
    );
  }

  return (
    <Card 
      elevation={3}
      sx={{
        position: 'relative',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)'
        }
      }}
    >
      {/* Progress bar for market dominance */}
      <LinearProgress
        variant="determinate"
        value={marketCapPercentage}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: theme.palette.action.hover
        }}
      />

      <CardContent>
        {/* Header with logo and name */}
        <Box display="flex" alignItems="center" mb={2}>
          <img 
            src={crypto.image} 
            alt={crypto.name}
            style={{ width: 30, height: 30, marginRight: 10 }}
            loading="lazy"
          />
          <Box>
            <Typography variant="h6" component="div">
              {crypto.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {crypto.symbol.toUpperCase()}
            </Typography>
          </Box>
        </Box>

        {/* Price information */}
        <Box mb={2}>
          <Typography variant="h5" component="div">
            {formatCurrency(crypto.current_price)}
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
            <Chip
              icon={crypto.price_change_percentage_24h > 0 ? <TrendingUp /> : <TrendingDown />}
              label={formatPercentage(crypto.price_change_percentage_24h)}
              size="small"
              sx={{ 
                backgroundColor: `${priceChangeColor}20`,
                color: priceChangeColor
              }}
            />
            <Typography variant="body2" color="textSecondary">
              24s
            </Typography>
          </Box>
        </Box>

        {/* Market statistics */}
        <Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="textSecondary">
              Hacim (24s)
            </Typography>
            <Typography variant="body2">
              {formatVolume(crypto.total_volume)}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="textSecondary">
              Piyasa Değeri
            </Typography>
            <Typography variant="body2">
              {formatCurrency(crypto.market_cap)}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Tooltip title={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}>
            <IconButton 
              onClick={() => onFavorite(crypto.id)}
              size="small"
              color={isFavorite ? "primary" : "default"}
            >
              {isFavorite ? <Star /> : <StarBorder />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Grafik Göster">
            <IconButton 
              onClick={() => onShowChart(crypto.id)}
              size="small"
            >
              <ShowChart />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fiyat Alarmı Oluştur">
            <IconButton 
              onClick={() => onSetAlert(crypto)}
              size="small"
            >
              <Notifications />
            </IconButton>
          </Tooltip>
        </Box>
        <Tooltip title="Detaylı Bilgi">
          <IconButton size="small">
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </CardActions>

      {/* Expanded content */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography paragraph>
            Detaylı İstatistikler
          </Typography>
          {/* Additional statistics can be added here */}
        </CardContent>
      </Collapse>
    </Card>
  );
});

CryptoCard.propTypes = {
  crypto: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    symbol: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    current_price: PropTypes.number.isRequired,
    price_change_percentage_24h: PropTypes.number,
    market_cap: PropTypes.number.isRequired,
    total_volume: PropTypes.number.isRequired,
    total_supply: PropTypes.number,
  }).isRequired,
  onFavorite: PropTypes.func.isRequired,
  onShowChart: PropTypes.func.isRequired,
  onSetAlert: PropTypes.func.isRequired,
  isFavorite: PropTypes.bool,
  loading: PropTypes.bool,
  expanded: PropTypes.bool
};

export default CryptoCard; 