import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Grid, Link } from '@mui/material';
import axios from 'axios';

function NewsSection() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Crypto news API'den haberler çekilecek
        const response = await axios.get('YOUR_CRYPTO_NEWS_API_ENDPOINT');
        setNews(response.data);
      } catch (error) {
        console.error('Haberler yüklenirken hata oluştu:', error);
      }
    };

    fetchNews();
  }, []);

  return (
    <Grid container spacing={2}>
      {news.map((item) => (
        <Grid item xs={12} md={6} key={item.id}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {item.title}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {item.description}
              </Typography>
              <Link href={item.url} target="_blank" rel="noopener">
                Devamını Oku
              </Link>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default NewsSection; 