import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCryptoData } from '../store/cryptoSlice';
import { Container, Grid, Box } from '@mui/material';
import CryptoCard from '../components/CryptoCard';
import NewsFlow from '../components/NewsFlow';
import AdvancedSearch from '../components/AdvancedSearch';
import PriceAlerts from '../components/PriceAlerts';

function Home() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector((state) => state.crypto);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    dispatch(fetchCryptoData());
  }, [dispatch]);

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  const handleSearch = (filters) => {
    let filtered = data;

    // Arama filtresi
    if (filters.searchTerm) {
      filtered = filtered.filter(crypto =>
        crypto.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Fiyat aralığı filtresi
    filtered = filtered.filter(crypto =>
      crypto.current_price >= filters.priceRange[0] &&
      crypto.current_price <= filters.priceRange[1]
    );

    // Market değeri filtresi
    if (filters.marketCap !== 'all') {
      switch (filters.marketCap) {
        case 'high':
          filtered = filtered.filter(crypto => crypto.market_cap > 10000000000);
          break;
        case 'medium':
          filtered = filtered.filter(crypto => 
            crypto.market_cap <= 10000000000 && crypto.market_cap > 1000000000
          );
          break;
        case 'low':
          filtered = filtered.filter(crypto => crypto.market_cap <= 1000000000);
          break;
        default:
          break;
      }
    }

    setFilteredData(filtered);
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Grid container spacing={3}>
          {/* Gelişmiş Arama */}
          <Grid item xs={12}>
            <AdvancedSearch onSearch={handleSearch} />
          </Grid>

          {/* Fiyat Uyarıları */}
          <Grid item xs={12} md={4}>
            <PriceAlerts />
          </Grid>

          {/* Haberler */}
          <Grid item xs={12} md={8}>
            <NewsFlow />
          </Grid>

          {/* Kripto Kartları */}
          {filteredData.map((crypto) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={crypto.id}>
              <CryptoCard crypto={crypto} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}

export default Home; 