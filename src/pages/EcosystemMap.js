import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Box,
  IconButton
} from '@mui/material';
import ForceGraph2D from 'react-force-graph-2d';

function EcosystemMap() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const ecosystemData = {
    nodes: [
      { id: 'BTC', group: 'currency', label: 'Bitcoin' },
      { id: 'ETH', group: 'smart-contracts', label: 'Ethereum' },
      { id: 'DEFI', group: 'defi', label: 'DeFi Projeler' },
      // Daha fazla node eklenebilir
    ],
    links: [
      { source: 'BTC', target: 'ETH' },
      { source: 'ETH', target: 'DEFI' },
      // Daha fazla bağlantı eklenebilir
    ]
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Kripto Para Ekosistem Haritası
        </Typography>

        <Box sx={{ height: '600px' }}>
          <ForceGraph2D
            graphData={ecosystemData}
            nodeLabel="label"
            nodeColor={node => {
              switch(node.group) {
                case 'currency': return '#ff0000';
                case 'smart-contracts': return '#00ff00';
                case 'defi': return '#0000ff';
                default: return '#999999';
              }
            }}
          />
        </Box>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item>
            <Chip label="Para Birimleri" color="error" onClick={() => setSelectedCategory('currency')} />
          </Grid>
          <Grid item>
            <Chip label="Akıllı Kontratlar" color="success" onClick={() => setSelectedCategory('smart-contracts')} />
          </Grid>
          <Grid item>
            <Chip label="DeFi" color="primary" onClick={() => setSelectedCategory('defi')} />
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default EcosystemMap; 