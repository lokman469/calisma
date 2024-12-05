import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function Reports() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });
  const [reportType, setReportType] = useState('profit');
  const [reportData, setReportData] = useState({
    profitLoss: [],
    tradeVolume: [],
    coinDistribution: [],
    successRate: [],
    summary: {
      totalProfit: 0,
      totalTrades: 0,
      successRate: 0,
      bestTrade: null,
      worstTrade: null
    }
  });

  // İşlem geçmişini yükle
  useEffect(() => {
    const loadTrades = () => {
      try {
        setLoading(true);
        const savedTrades = localStorage.getItem('tradeHistory');
        if (savedTrades) {
          setTrades(JSON.parse(savedTrades));
        }
      } catch (error) {
        setError('İşlem geçmişi yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    loadTrades();
  }, []);

  // Rapor verilerini hesapla
  useEffect(() => {
    if (!trades.length) return;

    const filteredTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate >= dateRange.start && tradeDate <= dateRange.end;
    });

    // Kâr/Zarar grafiği
    const profitByDate = {};
    filteredTrades.forEach(trade => {
      const date = format(new Date(trade.date), 'yyyy-MM-dd');
      if (!profitByDate[date]) {
        profitByDate[date] = 0;
      }
      
      if (trade.type === 'sell') {
        const buyTrade = trades.find(t => 
          t.coin === trade.coin && 
          t.type === 'buy' && 
          new Date(t.date) < new Date(trade.date)
        );
        if (buyTrade) {
          profitByDate[date] += (trade.price - buyTrade.price) * trade.amount;
        }
      }
    });

    // İşlem hacmi grafiği
    const volumeByDate = {};
    filteredTrades.forEach(trade => {
      const date = format(new Date(trade.date), 'yyyy-MM-dd');
      if (!volumeByDate[date]) {
        volumeByDate[date] = 0;
      }
      volumeByDate[date] += trade.price * trade.amount;
    });

    // Coin dağılımı
    const coinVolume = {};
    filteredTrades.forEach(trade => {
      if (!coinVolume[trade.coin]) {
        coinVolume[trade.coin] = 0;
      }
      coinVolume[trade.coin] += trade.price * trade.amount;
    });

    // Başarı oranı
    const successByMonth = {};
    filteredTrades.forEach(trade => {
      if (trade.type === 'sell') {
        const month = format(new Date(trade.date), 'yyyy-MM');
        if (!successByMonth[month]) {
          successByMonth[month] = { success: 0, total: 0 };
        }

        const buyTrade = trades.find(t => 
          t.coin === trade.coin && 
          t.type === 'buy' && 
          new Date(t.date) < new Date(trade.date)
        );

        if (buyTrade) {
          successByMonth[month].total++;
          if (trade.price > buyTrade.price) {
            successByMonth[month].success++;
          }
        }
      }
    });

    // Özet istatistikler
    let totalProfit = 0;
    let bestTrade = null;
    let worstTrade = null;

    filteredTrades.forEach(trade => {
      if (trade.type === 'sell') {
        const buyTrade = trades.find(t => 
          t.coin === trade.coin && 
          t.type === 'buy' && 
          new Date(t.date) < new Date(trade.date)
        );

        if (buyTrade) {
          const profit = (trade.price - buyTrade.price) * trade.amount;
          totalProfit += profit;

          if (!bestTrade || profit > bestTrade.profit) {
            bestTrade = { ...trade, profit };
          }
          if (!worstTrade || profit < worstTrade.profit) {
            worstTrade = { ...trade, profit };
          }
        }
      }
    });

    const successfulTrades = filteredTrades.filter(trade => {
      if (trade.type === 'sell') {
        const buyTrade = trades.find(t => 
          t.coin === trade.coin && 
          t.type === 'buy' && 
          new Date(t.date) < new Date(trade.date)
        );
        return buyTrade && (trade.price > buyTrade.price);
      }
      return false;
    }).length;

    setReportData({
      profitLoss: Object.entries(profitByDate).map(([date, value]) => ({
        date,
        value
      })),
      tradeVolume: Object.entries(volumeByDate).map(([date, value]) => ({
        date,
        value
      })),
      coinDistribution: Object.entries(coinVolume)
        .map(([coin, value]) => ({
          coin,
          value
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      successRate: Object.entries(successByMonth).map(([month, data]) => ({
        month,
        rate: (data.success / data.total) * 100
      })),
      summary: {
        totalProfit,
        totalTrades: filteredTrades.length,
        successRate: filteredTrades.length ? 
          (successfulTrades / filteredTrades.filter(t => t.type === 'sell').length) * 100 : 0,
        bestTrade,
        worstTrade
      }
    });
  }, [trades, dateRange]);

  const renderChart = () => {
    switch (reportType) {
      case 'profit':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={reportData.profitLoss}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                name="Kâr/Zarar ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'volume':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={reportData.tradeVolume}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="value" 
                fill="#82ca9d" 
                name="İşlem Hacmi ($)"
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'distribution':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={reportData.coinDistribution}
                dataKey="value"
                nameKey="coin"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label
              >
                {reportData.coinDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'success':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={reportData.successRate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="#ff7300" 
                name="Başarı Oranı (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Raporlar ve Analizler
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
              <DatePicker
                label="Başlangıç Tarihi"
                value={dateRange.start}
                onChange={(date) => setDateRange({ ...dateRange, start: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
              <DatePicker
                label="Bitiş Tarihi"
                value={dateRange.end}
                onChange={(date) => setDateRange({ ...dateRange, end: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Rapor Tipi"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <MenuItem value="profit">Kâr/Zarar Grafiği</MenuItem>
              <MenuItem value="volume">İşlem Hacmi</MenuItem>
              <MenuItem value="distribution">Coin Dağılımı</MenuItem>
              <MenuItem value="success">Başarı Oranı</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Toplam Kâr/Zarar
                </Typography>
                <Typography 
                  variant="h6"
                  color={reportData.summary.totalProfit >= 0 ? 'success.main' : 'error.main'}
                >
                  ${reportData.summary.totalProfit.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Toplam İşlem
                </Typography>
                <Typography variant="h6">
                  {reportData.summary.totalTrades}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Başarı Oranı
                </Typography>
                <Typography variant="h6">
                  {reportData.summary.successRate.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  En İyi İşlem
                </Typography>
                <Typography variant="h6" color="success.main">
                  {reportData.summary.bestTrade
                    ? `$${reportData.summary.bestTrade.profit.toFixed(2)}`
                    : '-'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ height: 400 }}>
            {renderChart()}
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default Reports; 