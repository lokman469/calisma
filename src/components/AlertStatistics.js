import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Tooltip,
  useTheme,
  Skeleton,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Timeline,
  Assessment,
  Error as ErrorIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { formatNumber, formatPercentage } from '../utils/formatters';

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// İstatistik kartı bileşeni
const StatCard = React.memo(({ title, value, icon: Icon, color, subtitle, loading }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Skeleton width="60%" height={24} />
            <Skeleton variant="circular" width={40} height={40} />
          </Box>
          <Skeleton width="40%" height={40} sx={{ mt: 2 }} />
          {subtitle && <Skeleton width="30%" height={20} sx={{ mt: 1 }} />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" color="textSecondary">
            {title}
          </Typography>
          <Icon sx={{ fontSize: 40, color }} />
        </Box>
        <Typography variant="h4" sx={{ mt: 2, mb: subtitle ? 1 : 0 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="textSecondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
});

function AlertStatistics({ stats, loading = false, error = null }) {
  const theme = useTheme();

  // Grafik verilerini ve ayarlarını memoize et
  const { chartData, chartOptions } = useMemo(() => {
    const data = {
      labels: stats?.timelineData?.map(d => new Date(d.date).toLocaleDateString()) || [],
      datasets: [{
        label: 'Alarm Sayısı',
        data: stats?.timelineData?.map(d => d.count) || [],
        fill: true,
        borderColor: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.main}20`,
        tension: 0.4
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
          intersect: false
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxRotation: 0
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    };

    return { chartData: data, chartOptions: options };
  }, [stats?.timelineData, theme.palette.primary.main]);

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
    <Box sx={{ py: 2 }}>
      <Grid container spacing={3}>
        {/* İstatistik Kartları */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Toplam Alarm"
            value={loading ? '-' : formatNumber(stats.total)}
            icon={Assessment}
            color={theme.palette.primary.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Aktif Alarmlar"
            value={loading ? '-' : formatNumber(stats.active)}
            subtitle={`Toplam alarmların ${formatPercentage(stats.active / stats.total)}%'i`}
            icon={TrendingUp}
            color={theme.palette.success.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tetiklenen Alarmlar"
            value={loading ? '-' : formatNumber(stats.triggered)}
            subtitle="Son 24 saat"
            icon={Timeline}
            color={theme.palette.info.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Başarısız Alarmlar"
            value={loading ? '-' : formatNumber(stats.failed)}
            subtitle="Son 24 saat"
            icon={TrendingDown}
            color={theme.palette.error.main}
            loading={loading}
          />
        </Grid>

        {/* Grafik */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Alarm Aktivitesi
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <Box sx={{ height: 300 }}>
                  <Line data={chartData} options={chartOptions} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* En Çok Kullanılan Semboller */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                En Çok Kullanılan Semboller
              </Typography>
              {loading ? (
                Array(5).fill(0).map((_, index) => (
                  <Box key={index} my={1}>
                    <Skeleton width="60%" />
                    <Skeleton height={8} sx={{ my: 1 }} />
                  </Box>
                ))
              ) : (
                Array.from(stats.mostUsedSymbols.entries())
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([symbol, count]) => (
                    <Box key={symbol} my={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">
                          {symbol}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {count} alarm
                        </Typography>
                      </Box>
                      <Tooltip title={`${count} alarm (${formatPercentage(count / stats.total)}%)`}>
                        <LinearProgress
                          variant="determinate"
                          value={(count / stats.total) * 100}
                          sx={{ 
                            height: 8, 
                            borderRadius: 5,
                            backgroundColor: theme.palette.action.hover,
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 5
                            }
                          }}
                        />
                      </Tooltip>
                    </Box>
                  ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

AlertStatistics.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    active: PropTypes.number.isRequired,
    triggered: PropTypes.number.isRequired,
    failed: PropTypes.number.isRequired,
    mostUsedSymbols: PropTypes.instanceOf(Map).isRequired,
    timelineData: PropTypes.arrayOf(
      PropTypes.shape({
        date: PropTypes.string.isRequired,
        count: PropTypes.number.isRequired
      })
    ).isRequired
  }),
  loading: PropTypes.bool,
  error: PropTypes.string
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string,
  subtitle: PropTypes.string,
  loading: PropTypes.bool
};

export default AlertStatistics; 