import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';

function PortfolioOptimization() {
  const [portfolio, setPortfolio] = useState([]);
  const [newAsset, setNewAsset] = useState({ name: '', amount: '' });
  const [optimizedPortfolio, setOptimizedPortfolio] = useState([]);

  const handleAddAsset = () => {
    if (newAsset.name && newAsset.amount) {
      setPortfolio([...portfolio, newAsset]);
      setNewAsset({ name: '', amount: '' });
    }
  };

  const handleOptimize = () => {
    const totalAmount = portfolio.reduce((sum, asset) => sum + parseFloat(asset.amount), 0);
    const optimized = portfolio.map(asset => ({
      ...asset,
      percentage: ((parseFloat(asset.amount) / totalAmount) * 100).toFixed(2)
    }));
    setOptimizedPortfolio(optimized);
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Portföy Optimizasyonu
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Kripto Para Adı"
              value={newAsset.name}
              onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Miktar ($)"
              value={newAsset.amount}
              onChange={(e) => setNewAsset({ ...newAsset, amount: e.target.value })}
              sx={{ mb: 2 }}
            />
            <Button 
              variant="contained" 
              onClick={handleAddAsset}
              disabled={!newAsset.name || !newAsset.amount}
            >
              Varlık Ekle
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleOptimize}
              disabled={portfolio.length === 0}
              fullWidth
            >
              Portföyü Optimize Et
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Mevcut Portföy
          </Typography>
          <List>
            {portfolio.map((asset, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={asset.name}
                  secondary={`Miktar: $${asset.amount}`}
                />
              </ListItem>
            ))}
          </List>

          {optimizedPortfolio.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Optimize Edilmiş Portföy
              </Typography>
              <List>
                {optimizedPortfolio.map((asset, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={asset.name}
                      secondary={`Önerilen Dağılım: %${asset.percentage}`}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default PortfolioOptimization; 