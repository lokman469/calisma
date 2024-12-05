import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  ShowChart,
  BarChart,
  ZoomIn,
  ZoomOut,
  Refresh,
  Settings
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { usePrice } from '../../hooks/usePrice';

// Grafik tipleri
const CHART_TYPES = {
  LINE: 'line',
  CANDLE: 'candle',
  BAR: 'bar'
};

// Zaman dilimleri
const TIME_RANGES = [
  { label: '1s', value: '1H' },
  { label: '24s', value: '1D' },
  { label: '7g', value: '7D' },
  { label: '30g', value: '30D' },
  { label: '90g', value: '90D' },
  { label: '1y', value: '1Y' }
];

const PriceChart = ({
  symbol,
  height = 400,
  showVolume = true,
  showControls = true
}) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState(CHART_TYPES.LINE);
  const [timeRange, setTimeRange] = useState('1D');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Custom hooks
  const { 
    data, 
    loading, 
    error, 
    fetchData 
  } = usePrice(symbol, timeRange);

  // Fiyat değişimi hesapla
  const priceChange = useMemo(() => {
    if (!data?.length) return { value: 0, percent: 0 };
    
    const first = data[0].price;
    const last = data[data.length - 1].price;
    const change = last - first;
    const percent = (change / first) * 100;

    return {
      value: change,
      percent: percent,
      currentPrice: last
    };
  }, [data]);

  // Custom tooltip bileşeni
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          elevation={3}
          sx={{
            p: 1.5,
            backgroundColor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {format(new Date(label), 'PPpp', { locale: tr })}
          </Typography>
          <Typography variant="body1" color="text.primary" gutterBottom>
            ${payload[0].value.toLocaleString()}
          </Typography>
          {showVolume && (
            <Typography variant="body2" color="text.secondary">
              Hacim: ${payload[1]?.value.toLocaleString()}
            </Typography>
          )}
          {payload[0].payload.change && (
            <Typography
              variant="body2"
              color={payload[0].payload.change >= 0 ? 'success.main' : 'error.main'}
            >
              {payload[0].payload.change >= 0 ? '+' : ''}
              {payload[0].payload.change.toFixed(2)}%
            </Typography>
          )}
        </Paper>
      );
    }
    return null;
  };

  // Zoom kontrolü
  const handleZoom = (direction) => {
    setZoomLevel(prev => {
      const newLevel = direction === 'in' ? prev + 0.2 : prev - 0.2;
      return Math.max(0.5, Math.min(2, newLevel));
    });
  };

  return (
    <Box sx={{ width: '100%', height }}>
      {showControls && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" component="span">
              ${priceChange.currentPrice.toLocaleString()}
            </Typography>
            <Typography
              variant="body1"
              component="span"
              sx={{
                ml: 2,
                color: priceChange.percent >= 0 ? 'success.main' : 'error.main'
              }}
            >
              {priceChange.percent >= 0 ? '+' : ''}
              {priceChange.percent.toFixed(2)}%
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={(e, value) => value && setChartType(value)}
              size="small"
            >
              <ToggleButton value={CHART_TYPES.LINE}>
                <Tooltip title="Çizgi Grafik">
                  <ShowChart />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value={CHART_TYPES.CANDLE}>
                <Tooltip title="Mum Grafik">
                  <BarChart />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value={CHART_TYPES.BAR}>
                <Tooltip title="Bar Grafik">
                  <BarChart />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              value={timeRange}
              exclusive
              onChange={(e, value) => value && setTimeRange(value)}
              size="small"
            >
              {TIME_RANGES.map(range => (
                <ToggleButton key={range.value} value={range.value}>
                  {range.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Box>
              <Tooltip title="Yakınlaştır">
                <IconButton onClick={() => handleZoom('in')} size="small">
                  <ZoomIn />
                </IconButton>
              </Tooltip>
              <Tooltip title="Uzaklaştır">
                <IconButton onClick={() => handleZoom('out')} size="small">
                  <ZoomOut />
                </IconButton>
              </Tooltip>
              <Tooltip title="Yenile">
                <IconButton onClick={fetchData} size="small">
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title="Ayarlar">
                <IconButton size="small">
                  <Settings />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      )}

      {loading ? (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={timestamp => {
                const date = new Date(timestamp);
                switch (timeRange) {
                  case '1H':
                    return format(date, 'HH:mm');
                  case '1D':
                    return format(date, 'HH:mm');
                  case '7D':
                    return format(date, 'EEE');
                  case '30D':
                  case '90D':
                    return format(date, 'd MMM');
                  default:
                    return format(date, 'MMM yyyy');
                }
              }}
              stroke={theme.palette.text.secondary}
            />
            <YAxis
              yAxisId="price"
              tickFormatter={value => `$${value.toLocaleString()}`}
              stroke={theme.palette.text.secondary}
              domain={['auto', 'auto']}
              scale={zoomLevel}
            />
            {showVolume && (
              <YAxis
                yAxisId="volume"
                orientation="right"
                tickFormatter={value => `$${(value / 1000000).toFixed(1)}M`}
                stroke={theme.palette.text.secondary}
              />
            )}
            <RechartsTooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={data?.[0]?.price}
              yAxisId="price"
              stroke={theme.palette.divider}
              strokeDasharray="3 3"
            />
            {chartType === CHART_TYPES.LINE && (
              <Line
                type="monotone"
                dataKey="price"
                yAxisId="price"
                stroke={theme.palette.primary.main}
                dot={false}
              />
            )}
            {showVolume && (
              <Bar
                dataKey="volume"
                yAxisId="volume"
                fill={theme.palette.primary.main}
                opacity={0.3}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
};

export default PriceChart; 