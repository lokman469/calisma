import {
  Container,
  Paper,
  Typography,
  Grid,
  Slider,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { Radar } from 'react-chartjs-2';

function RiskAnalysis() {
  const [riskFactors, setRiskFactors] = useState({
    volatility: 50,
    marketCap: 50,
    volume: 50,
    team: 50,
    technology: 50
  });

  const riskScore = Object.values(riskFactors).reduce((a, b) => a + b, 0) / 5;

  const chartData = {
    labels: ['Volatilite', 'Piyasa Değeri', 'İşlem Hacmi', 'Takım', 'Teknoloji'],
    datasets: [{
      label: 'Risk Faktörleri',
      data: Object.values(riskFactors),
      fill: true,
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgb(255, 99, 132)',
      pointBackgroundColor: 'rgb(255, 99, 132)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(255, 99, 132)'
    }]
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Kripto Para Risk Analizi
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            {Object.entries(riskFactors).map(([factor, value]) => (
              <Box key={factor} sx={{ mb: 3 }}>
                <Typography gutterBottom>
                  {factor.charAt(0).toUpperCase() + factor.slice(1)}
                </Typography>
                <Slider
                  value={value}
                  onChange={(e, newValue) => 
                    setRiskFactors(prev => ({ ...prev, [factor]: newValue }))
                  }
                  valueLabelDisplay="auto"
                />
              </Box>
            ))}
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative', height: '300px' }}>
              <Radar data={chartData} />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Alert severity={riskScore > 70 ? "error" : riskScore > 40 ? "warning" : "success"}>
              Genel Risk Skoru: {riskScore.toFixed(1)}
            </Alert>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default RiskAnalysis; 