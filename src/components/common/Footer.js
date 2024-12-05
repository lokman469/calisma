import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider,
  useTheme
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  YouTube,
  Telegram
} from '@mui/icons-material';

const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  // Footer bağlantıları
  const footerLinks = {
    hakkimizda: [
      { title: 'Şirket Hakkında', url: '/about' },
      { title: 'Kariyer', url: '/careers' },
      { title: 'İletişim', url: '/contact' },
      { title: 'Blog', url: '/blog' }
    ],
    urunler: [
      { title: 'Spot İşlemler', url: '/trade/spot' },
      { title: 'Vadeli İşlemler', url: '/trade/futures' },
      { title: 'Staking', url: '/staking' },
      { title: 'OTC', url: '/otc' }
    ],
    destek: [
      { title: 'Yardım Merkezi', url: '/help' },
      { title: 'SSS', url: '/faq' },
      { title: 'Güvenlik', url: '/security' },
      { title: 'API Dokümantasyonu', url: '/api-docs' }
    ],
    yasal: [
      { title: 'Kullanım Koşulları', url: '/terms' },
      { title: 'Gizlilik Politikası', url: '/privacy' },
      { title: 'Risk Açıklaması', url: '/risk' },
      { title: 'KYC/AML Politikası', url: '/kyc-aml' }
    ]
  };

  // Sosyal medya bağlantıları
  const socialLinks = [
    { icon: <Facebook />, url: 'https://facebook.com' },
    { icon: <Twitter />, url: 'https://twitter.com' },
    { icon: <Instagram />, url: 'https://instagram.com' },
    { icon: <LinkedIn />, url: 'https://linkedin.com' },
    { icon: <YouTube />, url: 'https://youtube.com' },
    { icon: <Telegram />, url: 'https://telegram.org' }
  ];

  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        px: 2,
        mt: 'auto',
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-evenly">
          {/* Hakkımızda */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Hakkımızda
            </Typography>
            {footerLinks.hakkimizda.map((link) => (
              <Link
                key={link.title}
                href={link.url}
                color="text.secondary"
                display="block"
                sx={{ mb: 1, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                {link.title}
              </Link>
            ))}
          </Grid>

          {/* Ürünler */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Ürünler
            </Typography>
            {footerLinks.urunler.map((link) => (
              <Link
                key={link.title}
                href={link.url}
                color="text.secondary"
                display="block"
                sx={{ mb: 1, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                {link.title}
              </Link>
            ))}
          </Grid>

          {/* Destek */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Destek
            </Typography>
            {footerLinks.destek.map((link) => (
              <Link
                key={link.title}
                href={link.url}
                color="text.secondary"
                display="block"
                sx={{ mb: 1, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                {link.title}
              </Link>
            ))}
          </Grid>

          {/* Yasal */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Yasal
            </Typography>
            {footerLinks.yasal.map((link) => (
              <Link
                key={link.title}
                href={link.url}
                color="text.secondary"
                display="block"
                sx={{ mb: 1, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                {link.title}
              </Link>
            ))}
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Alt Footer */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: { xs: 2, sm: 0 } }}
          >
            © {currentYear} Kripto Borsa. Tüm hakları saklıdır.
          </Typography>

          {/* Sosyal Medya İkonları */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {socialLinks.map((social, index) => (
              <IconButton
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' }
                }}
              >
                {social.icon}
              </IconButton>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 