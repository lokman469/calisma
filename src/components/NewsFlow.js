import { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Link,
  Chip,
  Box
} from '@mui/material';
import axios from 'axios';

function NewsFlow() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Crypto news API'den haberler çekilecek
        const response = await axios.get('YOUR_CRYPTO_NEWS_API_ENDPOINT');
        setNews(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Haberler yüklenirken hata:', error);
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Kripto Para Haberleri
      </Typography>

      <Grid container spacing={3}>
        {news.map((item, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card>
              {item.image && (
                <CardMedia
                  component="img"
                  height="140"
                  image={item.image}
                  alt={item.title}
                />
              )}
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {item.description}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link href={item.url} target="_blank" rel="noopener">
                    Devamını Oku
                  </Link>
                  <Chip label={item.source} size="small" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

export default NewsFlow; 