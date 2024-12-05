import { useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Autocomplete, 
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import { useSelector } from 'react-redux';

function Compare() {
  const { data } = useSelector(state => state.crypto);
  const [selectedCoins, setSelectedCoins] = useState([]);

  const compareMetrics = [
    'Fiyat',
    'Market Değeri',
    '24s Değişim',
    'Hacim',
    'Dolaşımdaki Arz'
  ];

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Kripto Para Karşılaştırma
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={data}
              getOptionLabel={(option) => option.name}
              onChange={(event, newValue) => {
                if (newValue && selectedCoins.length < 3) {
                  setSelectedCoins([...selectedCoins, newValue]);
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Kripto Para Seç" />
              )}
            />
          </Grid>
        </Grid>

        {selectedCoins.length > 0 && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Metrik</TableCell>
                {selectedCoins.map(coin => (
                  <TableCell key={coin.id}>{coin.name}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {compareMetrics.map(metric => (
                <TableRow key={metric}>
                  <TableCell>{metric}</TableCell>
                  {selectedCoins.map(coin => (
                    <TableCell key={`${coin.id}-${metric}`}>
                      {coin[metric.toLowerCase()]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Container>
  );
}

export default Compare; 