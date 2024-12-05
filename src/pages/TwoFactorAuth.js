import { useState } from 'react';
import { Container, Paper, Typography, TextField, Button } from '@mui/material';

function TwoFactorAuth() {
  const [code, setCode] = useState('');

  const handleVerify = () => {
    // 2FA kodunu doğrulama işlemi
    console.log('2FA kodu doğrulandı:', code);
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 3, my: 4 }}>
        <Typography variant="h4" gutterBottom>
          İki Faktörlü Kimlik Doğrulama
        </Typography>
        <TextField
          fullWidth
          label="Doğrulama Kodu"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={handleVerify}>
          Doğrula
        </Button>
      </Paper>
    </Container>
  );
}

export default TwoFactorAuth; 