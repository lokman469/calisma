import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Box,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';

function TradeHistory() {
  const [trades, setTrades] = useState(() => {
    const saved = localStorage.getItem('tradeHistory');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [newTrade, setNewTrade] = useState({
    coin: '',
    type: 'buy',
    price: '',
    amount: '',
    date: new Date(),
    exchange: 'binance',
    notes: ''
  });
  const [filter, setFilter] = useState({
    coin: '',
    type: 'all',
    dateFrom: null,
    dateTo: null
  });
  const [stats, setStats] = useState({
    totalProfit: 0,
    totalTrades: 0,
    successRate: 0,
    averageProfit: 0
  });

  // İşlemleri localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('tradeHistory', JSON.stringify(trades));
    calculateStats();
  }, [trades]);

  // İstatistikleri hesapla
  const calculateStats = () => {
    const totalProfit = trades.reduce((acc, trade) => {
      if (trade.type === 'sell') {
        const buyTrade = trades.find(t => 
          t.coin === trade.coin && 
          t.type === 'buy' && 
          new Date(t.date) < new Date(trade.date)
        );
        if (buyTrade) {
          return acc + ((trade.price - buyTrade.price) * trade.amount);
        }
      }
      return acc;
    }, 0);

    const successfulTrades = trades.filter(trade => {
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

    const totalSellTrades = trades.filter(t => t.type === 'sell').length;

    setStats({
      totalProfit,
      totalTrades: trades.length,
      successRate: totalSellTrades ? (successfulTrades / totalSellTrades) * 100 : 0,
      averageProfit: totalSellTrades ? totalProfit / totalSellTrades : 0
    });
  };

  // İşlem ekle/düzenle
  const handleSaveTrade = () => {
    if (editingTrade) {
      setTrades(trades.map(trade => 
        trade.id === editingTrade.id ? { ...newTrade, id: trade.id } : trade
      ));
    } else {
      setTrades([...trades, { ...newTrade, id: Date.now() }]);
    }
    handleCloseDialog();
  };

  // İşlem sil
  const handleDeleteTrade = (id) => {
    setTrades(trades.filter(trade => trade.id !== id));
  };

  // Dialog kapat
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTrade(null);
    setNewTrade({
      coin: '',
      type: 'buy',
      price: '',
      amount: '',
      date: new Date(),
      exchange: 'binance',
      notes: ''
    });
  };

  // İşlem düzenle
  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
    setNewTrade(trade);
    setDialogOpen(true);
  };

  // CSV olarak dışa aktar
  const exportToCSV = () => {
    const headers = ['Tarih', 'Coin', 'Tip', 'Fiyat', 'Miktar', 'Toplam', 'Borsa', 'Notlar'];
    const data = trades.map(trade => [
      new Date(trade.date).toLocaleString(),
      trade.coin,
      trade.type === 'buy' ? 'Alış' : 'Satış',
      trade.price,
      trade.amount,
      (trade.price * trade.amount).toFixed(2),
      trade.exchange,
      trade.notes
    ]);

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'trade_history.csv';
    link.click();
  };

  // Filtreleme
  const filteredTrades = trades.filter(trade => {
    const matchesCoin = !filter.coin || trade.coin.toLowerCase().includes(filter.coin.toLowerCase());
    const matchesType = filter.type === 'all' || trade.type === filter.type;
    const matchesDateFrom = !filter.dateFrom || new Date(trade.date) >= filter.dateFrom;
    const matchesDateTo = !filter.dateTo || new Date(trade.date) <= filter.dateTo;

    return matchesCoin && matchesType && matchesDateFrom && matchesDateTo;
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          İşlem Geçmişi
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Coin Ara"
              value={filter.coin}
              onChange={(e) => setFilter({ ...filter, coin: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="İşlem Tipi"
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            >
              <MenuItem value="all">Tümü</MenuItem>
              <MenuItem value="buy">Alış</MenuItem>
              <MenuItem value="sell">Satış</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
              <DateTimePicker
                label="Başlangıç Tarihi"
                value={filter.dateFrom}
                onChange={(date) => setFilter({ ...filter, dateFrom: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
              <DateTimePicker
                label="Bitiş Tarihi"
                value={filter.dateTo}
                onChange={(date) => setFilter({ ...filter, dateTo: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Toplam Kâr/Zarar
              </Typography>
              <Typography 
                variant="h6" 
                color={stats.totalProfit >= 0 ? 'success.main' : 'error.main'}
              >
                ${stats.totalProfit.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Toplam İşlem
              </Typography>
              <Typography variant="h6">
                {stats.totalTrades}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Başarı Oranı
              </Typography>
              <Typography variant="h6">
                {stats.successRate.toFixed(1)}%
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Ortalama Kâr
              </Typography>
              <Typography 
                variant="h6"
                color={stats.averageProfit >= 0 ? 'success.main' : 'error.main'}
              >
                ${stats.averageProfit.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => setDialogOpen(true)}
          >
            Yeni İşlem Ekle
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportToCSV}
          >
            CSV Olarak İndir
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tarih</TableCell>
                <TableCell>Coin</TableCell>
                <TableCell>Tip</TableCell>
                <TableCell align="right">Fiyat</TableCell>
                <TableCell align="right">Miktar</TableCell>
                <TableCell align="right">Toplam</TableCell>
                <TableCell>Borsa</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTrades
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>
                      {new Date(trade.date).toLocaleString()}
                    </TableCell>
                    <TableCell>{trade.coin}</TableCell>
                    <TableCell>
                      <Chip
                        icon={trade.type === 'buy' ? <TrendingDownIcon /> : <TrendingUpIcon />}
                        label={trade.type === 'buy' ? 'Alış' : 'Satış'}
                        color={trade.type === 'buy' ? 'primary' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">${trade.price}</TableCell>
                    <TableCell align="right">{trade.amount}</TableCell>
                    <TableCell align="right">
                      ${(trade.price * trade.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>{trade.exchange}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditTrade(trade)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteTrade(trade.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredTrades.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Sayfa başına satır:"
        />

        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingTrade ? 'İ��lem Düzenle' : 'Yeni İşlem Ekle'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Coin"
                  value={newTrade.coin}
                  onChange={(e) => setNewTrade({ ...newTrade, coin: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="İşlem Tipi"
                  value={newTrade.type}
                  onChange={(e) => setNewTrade({ ...newTrade, type: e.target.value })}
                >
                  <MenuItem value="buy">Alış</MenuItem>
                  <MenuItem value="sell">Satış</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Fiyat"
                  value={newTrade.price}
                  onChange={(e) => setNewTrade({ ...newTrade, price: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Miktar"
                  value={newTrade.amount}
                  onChange={(e) => setNewTrade({ ...newTrade, amount: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                  <DateTimePicker
                    label="Tarih"
                    value={newTrade.date}
                    onChange={(date) => setNewTrade({ ...newTrade, date })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Borsa"
                  value={newTrade.exchange}
                  onChange={(e) => setNewTrade({ ...newTrade, exchange: e.target.value })}
                >
                  <MenuItem value="binance">Binance</MenuItem>
                  <MenuItem value="ftx">FTX</MenuItem>
                  <MenuItem value="kucoin">KuCoin</MenuItem>
                  <MenuItem value="other">Diğer</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notlar"
                  value={newTrade.notes}
                  onChange={(e) => setNewTrade({ ...newTrade, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>İptal</Button>
            <Button onClick={handleSaveTrade} variant="contained">
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}

export default TradeHistory; 