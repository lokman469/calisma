import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Skeleton
} from '@mui/material';
import {
  AreaChart,
  Area,
  ResponsiveContainer
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const MiniChart = ({
  data,
  loading = false,
  width = 120,
  height = 40,
  showPrice = true,
  showChange = true
}) => {
  const theme = useTheme();

  // Fiyat değişimi hesapla
  const priceChange = useMemo(() => {
    if (!data?.length) return { value: 0, percent: 0 };
    
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const change = last - first;
    const percent = (change / first) * 100;

    return {
      value: change,
      percent: percent,
      currentPrice: last
    };
  }, [data]);

  // Pozitif/negatif değişime göre renk belirleme
  const chartColor = priceChange.percent >= 0 
    ? theme.palette.success.main 
    : theme.palette.error.main;

  if (loading) {
    return (
      <Box sx={{ width, height: '100%' }}>
        <Skeleton variant="text" width={width} height={20} />
        <Skeleton variant="text" width={width} height={16} />
        <Skeleton variant="rectangular" width={width} height={height} />
      </Box>
    );
  }

  return (
    <Box sx={{ width, height: '100%' }}>
      {showPrice && (
        <Typography 
          variant="body1" 
          sx={{ 
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          ${priceChange.currentPrice.toLocaleString()}
        </Typography>
      )}

      {showChange && (
        <Typography
          variant="body2"
          sx={{
            color: chartColor,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            whiteSpace: 'nowrap'
          }}
        >
          {priceChange.percent >= 0 ? (
            <TrendingUp fontSize="small" />
          ) : (
            <TrendingDown fontSize="small" />
          )}
          {priceChange.percent >= 0 ? '+' : ''}
          {priceChange.percent.toFixed(2)}%
        </Typography>
      )}

      <Box sx={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`gradient-${chartColor}`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={chartColor}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={chartColor}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={1.5}
              fill={`url(#gradient-${chartColor})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default MiniChart; 