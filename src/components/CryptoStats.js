import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Typography,
  Grid,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Skeleton,
  Alert,
  Chip,
  useTheme,
  Tooltip
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  TrendingUp,
  TrendingDown,
  Error as ErrorIcon
} from '@mui/icons-material';
import { formatCurrency, formatPercentage, formatNumber } from '../utils/formatters';

// Yardımcı fonksiyonlar
const getPercentageColor = (value) => {
  if (value > 0) return 'success';
  if (value < 0) return 'error';
  return 'default';
};

const StatRow = React.memo(({ label, value, loading, percentageChange, tooltip }) => {
  const content = (
    <TableRow>
      <TableCell>
        <Typography variant="body2" color="textSecondary">
          {label}
        </Typography>
      </TableCell>
      <TableCell align="right">
        {loading ? (
          <Skeleton width={100} />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
            <Typography variant="body2">
              {value}
            </Typography>
            {percentageChange && (
              <Chip
                size="small"
                label={formatPercentage(percentageChange)}
                color={getPercentageColor(percentageChange)}
                icon={percentageChange > 0 ? <TrendingUp /> : <TrendingDown />}
              />
            )}
          </Box>
        )}
      </TableCell>
    </TableRow>
  );

  return tooltip ? (
    <Tooltip title={tooltip} arrow>
      {content}
    </Tooltip>
  ) : content;
});

function CryptoStats({ 
  cryptoData, 
  loading = false, 
  error = null 
}) {
  const theme = useTheme();

  // Grafik verilerini ve ayarlarını memoize et
  const { chartData, chartOptions } = useMemo(() => {
    const data = {
      labels: cryptoData?.sparkline_in_7d?.price?.map((_, index) => `Gün ${index + 1}`) || [],
      datasets: [{
        label: '7 Günlük Fiyat',
        data: cryptoData?.sparkline_in_7d?.price || [],
        fill: true,
        borderColor: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.main}20`,
        tension: 0.4,
        pointRadius: 0,
        pointHitRadius: 10,
        pointHoverRadius: 5
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => `Fiyat: ${formatCurrency(context.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            color: theme.palette.divider
          },
          ticks: {
            color: theme.palette.text.secondary,
            maxRotation: 0
          }
        },
        y: {
          grid: {
            color: theme.palette.divider
          },
          ticks: {
            color: theme.palette.text.secondary,
            callback: (value) => formatCurrency(value)
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };

    return { chartData: data, chartOptions: options };
  }, [cryptoData?.sparkline_in_7d?.price, theme]);

  // İstatistik verilerini hazırla
  const stats = useMemo(() => [
    {
      label: 'Güncel Fiyat',
      value: formatCurrency(cryptoData?.current_price),
      percentageChange: cryptoData?.price_change_percentage_24h,
      tooltip: '24 saatlik fiyat değişimi'
    },
    {
      label: 'Piyasa Değeri',
      value: formatCurrency(cryptoData?.market_cap),
      percentageChange: cryptoData?.market_cap_change_percentage_24h,
      tooltip: '24 saatlik piyasa değeri değişimi'
    },
    {
      label: '24s Hacim',
      value: formatCurrency(cryptoData?.total_volume),
      tooltip: 'Son 24 saatteki işlem hacmi'
    },
    {
      label: 'Dolaşımdaki Arz',
      value: formatNumber(cryptoData?.circulating_supply),
      tooltip: `Maksimum Arz: ${formatNumber(cryptoData?.max_supply || 'Sınırsız')}`
    }
  ], [cryptoData]);

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
      <Grid container spacing={3}>
        {/* Fiyat Grafiği */}
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            Fiyat Geçmişi
          </Typography>
          <Box sx={{ height: 400, position: 'relative' }}>
            {loading ? (
              <Skeleton variant="rectangular" height={400} />
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </Box>
        </Grid>

        {/* İstatistikler */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>
            İstatistikler
          </Typography>
          <TableBody>
            {stats.map((stat, index) => (
              <StatRow
                key={index}
                label={stat.label}
                value={stat.value}
                percentageChange={stat.percentageChange}
                tooltip={stat.tooltip}
                loading={loading}
              />
            ))}
          </TableBody>
        </Grid>
      </Grid>
    </Paper>
  );
}

CryptoStats.propTypes = {
  cryptoData: PropTypes.shape({
    current_price: PropTypes.number,
    market_cap: PropTypes.number,
    total_volume: PropTypes.number,
    circulating_supply: PropTypes.number,
    max_supply: PropTypes.number,
    price_change_percentage_24h: PropTypes.number,
    market_cap_change_percentage_24h: PropTypes.number,
    sparkline_in_7d: PropTypes.shape({
      price: PropTypes.arrayOf(PropTypes.number)
    })
  }),
  loading: PropTypes.bool,
  error: PropTypes.string
};

StatRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  loading: PropTypes.bool,
  percentageChange: PropTypes.number,
  tooltip: PropTypes.string
};

export default CryptoStats; 