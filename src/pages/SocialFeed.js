import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Box,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TwitterIcon from '@mui/icons-material/Twitter';
import RedditIcon from '@mui/icons-material/Reddit';
import TelegramIcon from '@mui/icons-material/Telegram';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import CommentIcon from '@mui/icons-material/Comment';
import axios from 'axios';

function SocialFeed() {
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    twitter: true,
    reddit: true,
    telegram: true
  });

  // Sosyal medya verilerini çek
  const fetchSocialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Twitter verileri
      const twitterPosts = filters.twitter ? await fetchTwitterPosts() : [];
      
      // Reddit verileri
      const redditPosts = filters.reddit ? await fetchRedditPosts() : [];
      
      // Telegram verileri
      const telegramPosts = filters.telegram ? await fetchTelegramPosts() : [];

      // Tüm verileri birleştir ve sırala
      const allPosts = [...twitterPosts, ...redditPosts, ...telegramPosts]
        .sort((a, b) => b.timestamp - a.timestamp);

      setPosts(allPosts);
    } catch (error) {
      console.error('Sosyal medya verileri yüklenirken hata:', error);
      setError('Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Twitter verileri
  const fetchTwitterPosts = async () => {
    try {
      const response = await axios.get(
        'https://api.twitter.com/2/tweets/search/recent',
        {
          params: {
            query: 'crypto OR bitcoin OR ethereum',
            max_results: 20,
            'tweet.fields': 'created_at,public_metrics,author_id'
          },
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_TWITTER_TOKEN}`
          }
        }
      );

      return response.data.data.map(tweet => ({
        id: tweet.id,
        source: 'twitter',
        content: tweet.text,
        author: tweet.author_id,
        timestamp: new Date(tweet.created_at).getTime(),
        metrics: tweet.public_metrics,
        link: `https://twitter.com/twitter/status/${tweet.id}`
      }));
    } catch (error) {
      console.error('Twitter verileri alınamadı:', error);
      return [];
    }
  };

  // Reddit verileri
  const fetchRedditPosts = async () => {
    try {
      const subreddits = ['cryptocurrency', 'bitcoin', 'ethereum'];
      const allPosts = [];

      for (const subreddit of subreddits) {
        const response = await axios.get(
          `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`
        );

        const posts = response.data.data.children.map(post => ({
          id: post.data.id,
          source: 'reddit',
          content: post.data.title,
          author: post.data.author,
          timestamp: post.data.created_utc * 1000,
          metrics: {
            upvotes: post.data.ups,
            comments: post.data.num_comments
          },
          link: `https://reddit.com${post.data.permalink}`
        }));

        allPosts.push(...posts);
      }

      return allPosts;
    } catch (error) {
      console.error('Reddit verileri alınamadı:', error);
      return [];
    }
  };

  // Telegram verileri
  const fetchTelegramPosts = async () => {
    try {
      // Telegram API entegrasyonu burada olacak
      return [];
    } catch (error) {
      console.error('Telegram verileri alınamadı:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchSocialData();
    const interval = setInterval(fetchSocialData, 5 * 60 * 1000); // 5 dakikada bir güncelle
    return () => clearInterval(interval);
  }, [filters]);

  // Filtreleme
  const filteredPosts = posts.filter(post => {
    if (searchTerm) {
      return post.content.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  // Tab değişimi
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Sosyal medya ikonları
  const getSourceIcon = (source) => {
    switch (source) {
      case 'twitter':
        return <TwitterIcon color="primary" />;
      case 'reddit':
        return <RedditIcon color="error" />;
      case 'telegram':
        return <TelegramIcon color="info" />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Sosyal Medya Akışı
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                icon={<TwitterIcon />}
                label="Twitter"
                clickable
                color={filters.twitter ? 'primary' : 'default'}
                onClick={() => setFilters({ ...filters, twitter: !filters.twitter })}
              />
              <Chip
                icon={<RedditIcon />}
                label="Reddit"
                clickable
                color={filters.reddit ? 'primary' : 'default'}
                onClick={() => setFilters({ ...filters, reddit: !filters.reddit })}
              />
              <Chip
                icon={<TelegramIcon />}
                label="Telegram"
                clickable
                color={filters.telegram ? 'primary' : 'default'}
                onClick={() => setFilters({ ...filters, telegram: !filters.telegram })}
              />
            </Box>
          </Grid>
        </Grid>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Tümü" />
          <Tab label="En Popüler" />
          <Tab label="En Yeni" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredPosts.map((post) => (
              <Grid item xs={12} key={`${post.source}-${post.id}`}>
                <Card>
                  <CardHeader
                    avatar={
                      <Avatar>
                        {getSourceIcon(post.source)}
                      </Avatar>
                    }
                    title={post.author}
                    subheader={new Date(post.timestamp).toLocaleString()}
                    action={
                      <IconButton 
                        component="a" 
                        href={post.link} 
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ShareIcon />
                      </IconButton>
                    }
                  />
                  <CardContent>
                    <Typography variant="body1" gutterBottom>
                      {post.content}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Chip
                        icon={<FavoriteIcon />}
                        label={post.metrics?.likes || post.metrics?.upvotes || 0}
                        size="small"
                      />
                      <Chip
                        icon={<CommentIcon />}
                        label={post.metrics?.comments || 0}
                        size="small"
                      />
                      <Chip
                        icon={getSourceIcon(post.source)}
                        label={post.source}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && filteredPosts.length === 0 && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
            Gösterilecek gönderi bulunamadı
          </Typography>
        )}
      </Paper>
    </Container>
  );
}

export default SocialFeed; 