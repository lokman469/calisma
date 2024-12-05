import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Zaman aralıkları
const TIME_RANGES = [
  { label: '24s', value: '1D' },
  { label: '1H', value: '1W' },
  { label: '1A', value: '1M' },
  { label: '3A', value: '3M' },
  { label: '6A', value: '6M' },
  { label: '1Y', value: '1Y' },
  { label: 'TÜM', value: 'ALL' }
];

const PortfolioChart = ({
  data,
  loading = false,
  height = 400,
  showControls = true,
  gradient = true
}) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('1M');

  // Veriyi seçilen zaman aralığına göre filtrele
  const filteredData = useMemo(() => {
    if (!data) return [];

    const now = new Date();
    const filterDate = new Date();

    switch (timeRange) {
      case '1D':
        filterDate.setDate(filterDate.getDate() - 1);
        break;
      case '1W':
        filterDate.setDate(filterDate.getDate() - 7);
        break;
      case '1M':
        filterDate.setMonth(filterDate.getMonth() - 1);
        break;
      case '3M':
        filterDate.setMonth(filterDate.getMonth() - 3);
        break;
      case '6M':
        filterDate.setMonth(filterDate.getMonth() - 6);
        break;
      case '1Y':
        filterDate.setFullYear(filterDate.getFullYear() - 1);
        break;
      default:
        return data;
    }

    return data.filter(item => new Date(item.timestamp) >= filterDate);
  }, [data, timeRange]);

  // Değişim yüzdesi hesapla
  const changePercent = useMemo(() => {
    if (!filteredData.length) return 0;
    const first = filteredData[0].value;
    const last = filteredData[filteredData.length - 1].value;
    return ((last - first) / first) * 100;
  }, [filteredData]);

  // Custom tooltip
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
          <Typography variant="body1" color="text.primary">
            ₺{payload[0].value.toLocaleString()}
          </Typography>
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

  // Gradyan tanımı
  const gradientOffset = useMemo(() => {
    if (!filteredData.length) return 0;

    const dataMax = Math.max(...filteredData.map(d => d.value));
    const dataMin = Math.min(...filteredData.map(d => d.value));
    
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;

    return dataMax / (dataMax - dataMin);
  }, [filteredData]);

  return (
    <Box sx={{ width: '100%', height }}>
      {showControls && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" component="span">
              Portföy Değeri
            </Typography>
            <Typography
              variant="body1"
              component="span"
              sx={{
                ml: 2,
                color: changePercent >= 0 ? 'success.main' : 'error.main'
              }}
            >
              {changePercent >= 0 ? '+' : ''}
              {changePercent.toFixed(2)}%
            </Typography>
          </Box>

          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(e, value) => value && setTimeRange(value)}
            size="small"
          >
            {TIME_RANGES.map(range => (
              <ToggleButton
                key={range.value}
                value={range.value}
                sx={{ px: 2 }}
              >
                {range.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
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
          <AreaChart
            data={filteredData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset={gradientOffset}
                  stopColor={theme.palette.primary.main}
                  stopOpacity={0.3}
                />
                <stop
                  offset={gradientOffset}
                  stopColor={theme.palette.error.main}
                  stopOpacity={0.3}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.divider}
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={timestamp => {
                const date = new Date(timestamp);
                switch (timeRange) {
                  case '1D':
                    return format(date, 'HH:mm');
                  case '1W':
                    return format(date, 'EEE');
                  case '1M':
                    return format(date, 'd MMM');
                  default:
                    return format(date, 'MMM yyyy');
                }
              }}
              stroke={theme.palette.text.secondary}
            />
            <YAxis
              tickFormatter={value => `₺${value.toLocaleString()}`}
              stroke={theme.palette.text.secondary}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={theme.palette.primary.main}
              fill={gradient ? "url(#colorValue)" : theme.palette.primary.main}
              fillOpacity={gradient ? 1 : 0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
};

export default PortfolioChart; 