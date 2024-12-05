import React from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Button,
  IconButton,
  Tooltip,
  Skeleton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  NavigateNext,
  ArrowBack,
  Refresh,
  MoreVert,
  Help
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PageTitle = ({
  title,
  subtitle,
  breadcrumbs,
  backButton = false,
  backUrl,
  actions,
  loading = false,
  onRefresh,
  helpText,
  moreMenu,
  divider = true,
  gutterBottom = true,
  sx = {}
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Geri dönme işlemi
  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  return (
    <Box
      sx={{
        mb: gutterBottom ? 3 : 0,
        pb: divider ? 2 : 0,
        borderBottom: divider ? `1px solid ${theme.palette.divider}` : 'none',
        ...sx
      }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <Box sx={{ mb: 1 }}>
          {loading ? (
            <Skeleton width={200} height={24} />
          ) : (
            <Breadcrumbs
              separator={<NavigateNext fontSize="small" />}
              sx={{ '& .MuiBreadcrumbs-separator': { mx: 1 } }}
            >
              {breadcrumbs}
            </Breadcrumbs>
          )}
        </Box>
      )}

      {/* Başlık Satırı */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        {/* Sol Kısım: Başlık ve Alt Başlık */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {backButton && (
            <IconButton
              onClick={handleBack}
              sx={{ mr: 1 }}
              size="small"
              edge="start"
            >
              <ArrowBack />
            </IconButton>
          )}

          <Box>
            {loading ? (
              <>
                <Skeleton width={300} height={40} />
                {subtitle && <Skeleton width={200} height={24} />}
              </>
            ) : (
              <>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 500
                  }}
                >
                  {title}
                  {helpText && (
                    <Tooltip title={helpText} arrow>
                      <Help
                        fontSize="small"
                        sx={{ color: 'text.secondary', cursor: 'help' }}
                      />
                    </Tooltip>
                  )}
                </Typography>

                {subtitle && (
                  <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* Sağ Kısım: Aksiyonlar */}
        {(actions || onRefresh || moreMenu) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: isMobile ? 1 : 0,
              width: isMobile ? '100%' : 'auto'
            }}
          >
            {onRefresh && (
              <Tooltip title="Yenile">
                <IconButton onClick={onRefresh} size="small">
                  <Refresh />
                </IconButton>
              </Tooltip>
            )}

            {actions && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                {actions}
              </Box>
            )}

            {moreMenu && (
              <Tooltip title="Daha fazla">
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Kullanım örnekleri:
/*
// Basit kullanım
<PageTitle title="Piyasalar" />

// Alt başlık ile
<PageTitle
  title="BTC/USDT"
  subtitle="Bitcoin/Tether US"
/>

// Breadcrumbs ile
<PageTitle
  title="İşlem Geçmişi"
  breadcrumbs={[
    <Link to="/">Ana Sayfa</Link>,
    <Link to="/trade">İşlemler</Link>,
    <Typography>Geçmiş</Typography>
  ]}
/>

// Geri butonu ile
<PageTitle
  title="İşlem Detayı"
  backButton
  backUrl="/trade/history"
/>

// Aksiyonlar ile
<PageTitle
  title="Portföy"
  actions={
    <>
      <Button variant="contained" startIcon={<Add />}>
        Para Yatır
      </Button>
      <Button variant="outlined" startIcon={<Remove />}>
        Para Çek
      </Button>
    </>
  }
/>

// Loading durumu
<PageTitle
  title="Piyasalar"
  subtitle="Tüm kripto para birimleri"
  loading
/>

// Yardım metni ile
<PageTitle
  title="API Anahtarları"
  helpText="API anahtarları hakkında detaylı bilgi için dokümantasyonu inceleyebilirsiniz."
/>

// Yenileme butonu ile
<PageTitle
  title="İşlemler"
  onRefresh={() => fetchTransactions()}
/>
*/

export default PageTitle; 