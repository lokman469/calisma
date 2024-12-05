import { useState } from 'react';
import { Paper, Typography, TextField, Button } from '@mui/material';

function Newsletter() {
  const [email, setEmail] = useState('');

  const handleSubscribe = () => {
    // E-posta bültenine abone etme işlemi
    console.log('Abone olundu:', email);
  };

  return (
    <Paper sx={{ p: 3, my: 4 }}>
      <Typography variant="h6" gutterBottom>
        Kripto Para Haber Bülteni
      </Typography>
      <TextField
        fullWidth
        label="E-posta Adresi"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button variant="contained" onClick={handleSubscribe}>
        Abone Ol
      </Button>
    </Paper>
  );
}

export default Newsletter; 