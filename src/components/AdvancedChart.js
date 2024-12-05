import { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Box, Paper, Select, MenuItem, FormControl, InputLabel, Typography, useTheme } from '@mui/material';
import { formatCurrency, formatDate } from '../utils/formatters';

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Sabitler
const TIME_RANGES = [
  { value: '24h', label: '24 Saat' },
  { value: '7d', label: '7 Gün' },
  { value: '30d', label: '30 Gün' },
  { value: '90d', label: '90 Gün' },
  { value: '1y', label: '1 Yıl' }
];

function AdvancedChart({ data, title = 'Kripto Para Fiyat Grafiği', height = 400 }) {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('24h');

  // Grafik verilerini memoize et
  const chartData = useMemo(() => ({
    labels: data.map(item => formatDate(item.timestamp, timeRange)),
    datasets: [
      {
        label: 'Fiyat (USD)',
        data: data.map(item => item.price),
        borderColor: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.main}20`,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHitRadius: 10,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: theme.palette.primary.main
      }
    ]
  }), [data, timeRange, theme.palette.primary.main]);

  // Grafik ayarlarını memoize et
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme.palette.text.primary
        }
      },
      title: {
        display: true,
        text: title,
        color: theme.palette.text.primary,
        font: {
          size: 16,
          weight: 'bold'
        }
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
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }), [theme, title]);

  // Zaman aralığı değişikliği handler'ı
  const handleTimeRangeChange = useCallback((event) => {
    setTimeRange(event.target.value);
  }, []);

  // Veri yoksa veya hatalıysa
  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Grafik verisi bulunamadı
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        my: 2,
        backgroundColor: theme.palette.background.paper
      }}
    >
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="time-range-select-label">Zaman Aralığı</InputLabel>
          <Select
            labelId="time-range-select-label"
            id="time-range-select"
            value={timeRange}
            label="Zaman Aralığı"
            onChange={handleTimeRangeChange}
          >
            {TIME_RANGES.map(range => (
              <MenuItem key={range.value} value={range.value}>
                {range.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Box sx={{ height, position: 'relative' }}>
        <Line 
          data={chartData} 
          options={options}
          aria-label={`${title} grafik görünümü`}
        />
      </Box>
    </Paper>
  );
}

AdvancedChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      price: PropTypes.number.isRequired
    })
  ).isRequired,
  title: PropTypes.string,
  height: PropTypes.number
};

export default AdvancedChart; 