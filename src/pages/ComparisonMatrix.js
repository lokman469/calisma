import { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Autocomplete,
  TextField,
  Button,
  Rating,
  Box
} from '@mui/material';

function ComparisonMatrix() {
  const [selectedCoins, setSelectedCoins] = useState([]);
  
  const comparisonCriteria = [
    { name: 'Market Değeri', key: 'marketCap' },
    { name: 'İşlem Hacmi', key: 'volume' },
    { name: 'Toplam Arz', key: 'supply' },
    { name: 'Teknoloji Altyapısı', key: 'technology' },
    { name: 'Topluluk Büyüklüğü', key: 'community' },
    { name: 'Geliştirici Aktivitesi', key: 'development' }
  ];

  const handleAddCoin = (coin) => {
    if (selectedCoins.length < 3) {
      setSelectedCoins([...selectedCoins, coin]);
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Kripto Para Karşılaştırma Matrisi
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Autocomplete
            options={[]} // Kripto para listesi buraya gelecek
            renderInput={(params) => (
              <TextField {...params} label="Kripto Para Ekle" />
            )}
            onChange={(event, value) => handleAddCoin(value)}
          />
        </Box>

        {selectedCoins.length > 0 && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Kriter</TableCell>
                {selectedCoins.map((coin, index) => (
                  <TableCell key={index}>{coin.name}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {comparisonCriteria.map((criteria, index) => (
                <TableRow key={index}>
                  <TableCell>{criteria.name}</TableCell>
                  {selectedCoins.map((coin, coinIndex) => (
                    <TableCell key={coinIndex}>
                      {criteria.key === 'technology' || 
                       criteria.key === 'community' || 
                       criteria.key === 'development' ? (
                        <Rating value={4} readOnly />
                      ) : (
                        coin[criteria.key]
                      )}
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

export default ComparisonMatrix; 