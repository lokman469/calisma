import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Chart.js kayıt
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Stats() {
  const [loading, setLoading] = useState(true);
  const [marketStats, setMarketStats] = useState({
    totalMarketCap: "2.1T",
    volume24h: "98.5B",
    btcDominance: "46.2%",
    activeCoins: "2,547"
  });

  const chartData = {
    labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
    datasets: [
      {
        label: 'Toplam Piyasa Değeri (Trilyon $)',
        data: [1.8, 1.9, 2.0, 2.1, 2.2, 2.1],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const topGainers = [
    { name: "Bitcoin", change: "+5.2%", price: "$52,345" },
    { name: "Ethereum", change: "+4.8%", price: "$3,245" },
    { name: "Cardano", change: "+7.1%", price: "$1.25" }
  ];

  const topLosers = [
    { name: "Dogecoin", change: "-3.2%", price: "$0.12" },
    { name: "Solana", change: "-2.8%", price: "$98.45" },
    { name: "Polkadot", change: "-1.9%", price: "$18.75" }
  ];

  useEffect(() => {
    // API'den verileri çekme simülasyonu
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Piyasa İstatistikleri
        </Typography>

        <Grid container spacing={3}>
          {/* Genel İstatistikler */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              {Object.entries(marketStats).map(([key, value]) => (
                <Grid item xs={12} sm={6} md={3} key={key}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Typography>
                      <Typography variant="h5">
                        {value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Grafik */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Piyasa Değeri Trendi
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Line data={chartData} options={{ maintainAspectRatio: false }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* En Çok Yükselenler ve Düşenler */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  En Çok Yükselenler
                </Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Coin</TableCell>
                      <TableCell align="right">Değişim</TableCell>
                      <TableCell align="right">Fiyat</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topGainers.map((coin) => (
                      <TableRow key={coin.name}>
                        <TableCell>{coin.name}</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main' }}>
                          {coin.change}
                        </TableCell>
                        <TableCell align="right">{coin.price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  En Çok Düşenler
                </Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Coin</TableCell>
                      <TableCell align="right">Değişim</TableCell>
                      <TableCell align="right">Fiyat</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topLosers.map((coin) => (
                      <TableRow key={coin.name}>
                        <TableCell>{coin.name}</TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>
                          {coin.change}
                        </TableCell>
                        <TableCell align="right">{coin.price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default Stats; 