import { useState, useEffect, memo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Chip,
  Link,
  CardMedia,
  Tabs,
  Tab
} from '@mui/material';
import axios from 'axios';

// Cache için basit bir util fonksiyonu
const createCache = (ttl = 5 * 60 * 1000) => {
  let cache = {};
  
  return {
    get: (key) => {
      const item = cache[key];
      if (!item) return null;
      
      if (Date.now() - item.timestamp > ttl) {
        delete cache[key];
        return null;
      }
      
      return item.value;
    },
    set: (key, value) => {
      cache[key] = {
        value,
        timestamp: Date.now()
      };
    }
  };
};

const newsCache = createCache();

function NewsAnalysis() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // CryptoCompare API çağrısını cache ile optimize edelim
  const fetchCryptoCompareNews = async () => {
    try {
      const cachedNews = newsCache.get('cryptocompare');
      if (cachedNews) return cachedNews;

      const response = await axios.get(
        'https://min-api.cryptocompare.com/data/v2/news/?lang=EN',
        {
          headers: {
            'authorization': 'Apikey YOUR_API_KEY'
          }
        }
      );
      
      if (response.data?.Data) {
        const formattedNews = response.data.Data.map(article => ({
          id: article.id,
          title: article.title,
          body: article.body,
          imageurl: article.imageurl,
          categories: article.categories,
          url: article.url,
          source: article.source_info?.name || 'CryptoCompare',
          published_on: article.published_on,
          source_type: 'cryptocompare'
        }));

        newsCache.set('cryptocompare', formattedNews);
        return formattedNews;
      }
      return [];
    } catch (error) {
      console.error('CryptoCompare haberleri yüklenirken hata:', error);
      throw new Error('Haberler yüklenirken bir hata oluştu');
    }
  };

  // Reddit API çağrısını da cache ile optimize edelim
  const fetchRedditNews = async () => {
    try {
      const cachedNews = newsCache.get('reddit');
      if (cachedNews) return cachedNews;

      const subreddits = ['cryptocurrency', 'bitcoin', 'CryptoMarkets'];
      const allPosts = [];

      for (const subreddit of subreddits) {
        const response = await axios.get(
          `https://www.reddit.com/r/${subreddit}/hot.json?limit=5`
        );

        if (response.data?.data?.children) {
          const posts = response.data.data.children.map(post => ({
            id: post.data.id,
            title: post.data.title,
            body: post.data.selftext || post.data.url,
            imageurl: post.data.thumbnail !== 'self' ? post.data.thumbnail : '',
            categories: `r/${subreddit}`,
            url: `https://reddit.com${post.data.permalink}`,
            source: 'Reddit',
            published_on: post.data.created_utc,
            source_type: 'reddit',
            upvotes: post.data.ups,
            comments: post.data.num_comments
          }));
          allPosts.push(...posts);
        }
      }

      newsCache.set('reddit', allPosts);
      return allPosts;
    } catch (error) {
      console.error('Reddit haberleri yüklenirken hata:', error);
      throw new Error('Reddit haberleri yüklenirken bir hata oluştu');
    }
  };

  // useEffect'i optimize edelim
  useEffect(() => {
    let mounted = true;

    const fetchAllNews = async () => {
      try {
        setLoading(true);
        const [cryptoCompareNews, redditNews] = await Promise.all([
          fetchCryptoCompareNews(),
          fetchRedditNews()
        ]);
        
        if (mounted) {
          const allNews = [...cryptoCompareNews, ...redditNews]
            .filter(Boolean)
            .sort((a, b) => b.published_on - a.published_on);

          setNews(allNews);
        }
      } catch (error) {
        console.error('Haberler yüklenirken hata:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAllNews();

    const interval = setInterval(fetchAllNews, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const getSourceColor = (sourceType) => {
    const colors = {
      'cryptocompare': 'primary',
      'reddit': 'secondary'
    };
    return colors[sourceType] || 'default';
  };

  const filteredNews = activeTab === 0 
    ? news 
    : news.filter(article => {
        switch(activeTab) {
          case 1: return article.source_type === 'cryptocompare';
          case 2: return article.source_type === 'reddit';
          default: return true;
        }
      });

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Kripto Para Haberleri
        </Typography>

        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="Tüm Haberler" />
          <Tab label="CryptoCompare" />
          <Tab label="Reddit" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredNews.length > 0 ? (
          <Grid container spacing={3}>
            {filteredNews.map((article) => (
              <Grid item xs={12} md={6} key={article.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {article.imageurl && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={article.imageurl}
                      alt={article.title}
                      sx={{ objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ flexGrow: 1 }}>
                        {article.title}
                      </Typography>
                      <Chip 
                        label={article.categories}
                        color={getSourceColor(article.source_type)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {article.body && article.body.length > 200 
                        ? `${article.body.slice(0, 200)}...` 
                        : article.body}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mt: 'auto' 
                    }}>
                      <Link 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        sx={{ textDecoration: 'none' }}
                      >
                        Devamını Oku
                      </Link>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {article.source_type === 'reddit' && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              ⬆️ {article.upvotes}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              💬 {article.comments}
                            </Typography>
                          </Box>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {article.source}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(article.published_on * 1000).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Şu anda haber bulunmuyor
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default memo(NewsAnalysis); 