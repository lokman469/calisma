import { Container, Paper, Typography } from '@mui/material';

function Analytics() {
  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Gelişmiş Analitik ve Raporlama
        </Typography>
        <Typography variant="body1">
          Burada kullanıcıların portföy performanslarını analiz edebilecekleri grafikler ve raporlar yer alacak.
        </Typography>
      </Paper>
    </Container>
  );
}

export default Analytics; 