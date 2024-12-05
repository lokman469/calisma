import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  ButtonGroup,
  Button,
  Tooltip
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

// Zaman aralıkları
const TIME_RANGES = [
  { label: '24s', value: '1D' },
  { label: '7G', value: '7D' },
  { label: '1A', value: '1M' },
  { label: '3A', value: '3M' }
];

const MarketChart = ({
  symbol,
  data,
  loading = false,
  height = 200,
  showControls = true,
  showPrice = true,
  miniChart = false
}) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('1D');

  // Veriyi seçilen zaman aralığına göre filtrele
  const filteredData = useMemo(() => {
    if (!data) return [];

    const now = new Date();
    const filterDate = new Date();

    switch (timeRange) {
      case '1D':
        filterDate.setDate(filterDate.getDate() - 1);
        break;
      case '7D':
        filterDate.setDate(filterDate.getDate() - 7);
        break;
      case '1M':
        filterDate.setMonth(filterDate.getMonth() - 1);
        break;
      case '3M':
        filterDate.setMonth(filterDate.getMonth() - 3);
        break;
      default:
        return data;
    }

    return data.filter(item => new Date(item.timestamp) >= filterDate);
  }, [data, timeRange]);

  // Fiyat değişimi hesapla
  const priceChange = useMemo(() => {
    if (!filteredData.length) return { value: 0, percent: 0 };
    
    const first = filteredData[0].price;
    const last = filteredData[filteredData.length - 1].price;
    const change = last - first;
    const percent = (change / first) * 100;

    return {
      value: change,
      percent: percent
    };
  }, [filteredData]);

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
          <Typography variant="body1" color="text.primary">
            ${payload[0].value.toLocaleString()}
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

  return (
    <Box sx={{ width: '100%', height }}>
      {showControls && !miniChart && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {showPrice && (
            <Box>
              <Typography variant="h6" component="span">
                ${filteredData[filteredData.length - 1]?.price.toLocaleString()}
              </Typography>
              <Typography
                variant="body1"
                component="span"
                sx={{
                  ml: 2,
                  color: priceChange.percent >= 0 ? 'success.main' : 'error.main',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                {priceChange.percent >= 0 ? <TrendingUp /> : <TrendingDown />}
                {priceChange.percent >= 0 ? '+' : ''}
                {priceChange.percent.toFixed(2)}%
              </Typography>
            </Box>
          )}

          <ButtonGroup size="small" variant="outlined">
            {TIME_RANGES.map(range => (
              <Button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                variant={timeRange === range.value ? 'contained' : 'outlined'}
              >
                {range.label}
              </Button>
            ))}
          </ButtonGroup>
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
          <CircularProgress size={24} />
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={miniChart ? '100%' : '85%'}>
          <LineChart
            data={filteredData}
            margin={miniChart ? { top: 5, right: 5, bottom: 5, left: 5 } : { top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {!miniChart && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.palette.divider}
              />
            )}
            {!miniChart && (
              <XAxis
                dataKey="timestamp"
                tickFormatter={timestamp => {
                  const date = new Date(timestamp);
                  switch (timeRange) {
                    case '1D':
                      return format(date, 'HH:mm');
                    case '7D':
                      return format(date, 'EEE');
                    case '1M':
                      return format(date, 'd MMM');
                    default:
                      return format(date, 'MMM yyyy');
                  }
                }}
                stroke={theme.palette.text.secondary}
              />
            )}
            {!miniChart && (
              <YAxis
                tickFormatter={value => `$${value.toLocaleString()}`}
                stroke={theme.palette.text.secondary}
              />
            )}
            {!miniChart && <Tooltip content={<CustomTooltip />} />}
            <Line
              type="monotone"
              dataKey="price"
              stroke={priceChange.percent >= 0 ? theme.palette.success.main : theme.palette.error.main}
              strokeWidth={miniChart ? 1 : 2}
              dot={false}
            />
            {!miniChart && (
              <ReferenceLine
                y={filteredData[0]?.price}
                stroke={theme.palette.divider}
                strokeDasharray="3 3"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
};

export default MarketChart; 