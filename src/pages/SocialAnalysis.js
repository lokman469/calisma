import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import TwitterIcon from '@mui/icons-material/Twitter';
import RedditIcon from '@mui/icons-material/Reddit';
import TelegramIcon from '@mui/icons-material/Telegram';

function SocialAnalysis() {
  const socialMetrics = {
    twitter: {
      followers: 1200000,
      engagement: 75,
      sentiment: 85
    },
    reddit: {
      subscribers: 800000,
      activeUsers: 50000,
      sentiment: 70
    },
    telegram: {
      members: 500000,
      activeUsers: 30000,
      sentiment: 80
    }
  };

  const recentMentions = [
    {
      platform: 'twitter',
      user: '@cryptoExpert',
      content: 'Bitcoin yükselişe geçti! #BTC',
      timestamp: '5 dakika önce'
    },
    // Daha fazla mention eklenebilir
  ];

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Sosyal Medya Analizi
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TwitterIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Twitter Metrikleri</Typography>
                </Box>
                <Typography variant="body2" gutterBottom>
                  Takipçi: {socialMetrics.twitter.followers.toLocaleString()}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Etkileşim Oranı
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={socialMetrics.twitter.engagement} 
                  sx={{ mb: 2 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Son Bahsedilmeler
                </Typography>
                <List>
                  {recentMentions.map((mention, index) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar>
                          {mention.platform === 'twitter' && <TwitterIcon />}
                          {mention.platform === 'reddit' && <RedditIcon />}
                          {mention.platform === 'telegram' && <TelegramIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={mention.user}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">
                              {mention.content}
                            </Typography>
                            <br />
                            <Typography component="span" variant="caption" color="text.secondary">
                              {mention.timestamp}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default SocialAnalysis; 