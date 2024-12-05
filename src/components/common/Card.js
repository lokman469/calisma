import React from 'react';
import {
  Card as MuiCard,
  CardHeader,
  CardContent,
  CardActions,
  CardMedia,
  IconButton,
  Typography,
  Skeleton,
  Box,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  MoreVert,
  Refresh,
  KeyboardArrowRight,
  ExpandMore
} from '@mui/icons-material';

const Card = ({
  title,
  subtitle,
  action,
  media,
  mediaHeight = 140,
  content,
  footer,
  loading = false,
  error = false,
  onRefresh,
  expanded = false,
  expandable = false,
  onExpand,
  headerDivider = false,
  footerDivider = false,
  elevation = 1,
  sx = {}
}) => {
  const theme = useTheme();

  // Loading durumu
  if (loading) {
    return (
      <MuiCard elevation={elevation} sx={sx}>
        <CardHeader
          title={<Skeleton animation="wave" height={10} width="40%" />}
          subheader={<Skeleton animation="wave" height={10} width="20%" />}
          action={
            <IconButton disabled>
              <MoreVert />
            </IconButton>
          }
        />
        {media && (
          <Skeleton
            animation="wave"
            variant="rectangular"
            sx={{ height: mediaHeight }}
          />
        )}
        <CardContent>
          <Skeleton animation="wave" height={10} sx={{ mb: 1 }} />
          <Skeleton animation="wave" height={10} width="80%" />
        </CardContent>
        {footer && (
          <CardActions>
            <Skeleton animation="wave" height={10} width="20%" />
          </CardActions>
        )}
      </MuiCard>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <MuiCard
        elevation={elevation}
        sx={{
          borderColor: theme.palette.error.main,
          ...sx
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              py: 3
            }}
          >
            <Typography
              variant="body1"
              color="error"
              gutterBottom
            >
              Veri yüklenirken bir hata oluştu
            </Typography>
            {onRefresh && (
              <IconButton
                onClick={onRefresh}
                color="primary"
                sx={{ mt: 1 }}
              >
                <Refresh />
              </IconButton>
            )}
          </Box>
        </CardContent>
      </MuiCard>
    );
  }

  return (
    <MuiCard elevation={elevation} sx={sx}>
      {/* Başlık */}
      {(title || subtitle) && (
        <>
          <CardHeader
            title={
              typeof title === 'string' ? (
                <Typography variant="h6">{title}</Typography>
              ) : (
                title
              )
            }
            subheader={
              typeof subtitle === 'string' ? (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              ) : (
                subtitle
              )
            }
            action={
              action || (
                expandable && (
                  <IconButton
                    onClick={onExpand}
                    sx={{
                      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: theme.transitions.create('transform')
                    }}
                  >
                    <ExpandMore />
                  </IconButton>
                )
              )
            }
          />
          {headerDivider && <Divider />}
        </>
      )}

      {/* Medya */}
      {media && (
        <CardMedia
          component="img"
          height={mediaHeight}
          image={media}
          alt={typeof title === 'string' ? title : 'card media'}
        />
      )}

      {/* İçerik */}
      <CardContent>
        {typeof content === 'string' ? (
          <Typography variant="body2" color="text.secondary">
            {content}
          </Typography>
        ) : (
          content
        )}
      </CardContent>

      {/* Alt Kısım */}
      {footer && (
        <>
          {footerDivider && <Divider />}
          <CardActions>
            {footer}
          </CardActions>
        </>
      )}
    </MuiCard>
  );
};

// Kullanım örnekleri:
/*
// Basit kullanım
<Card
  title="Kart Başlığı"
  subtitle="Alt Başlık"
  content="Kart içeriği buraya gelecek..."
/>

// Medya ile
<Card
  title="Resimli Kart"
  media="/path/to/image.jpg"
  mediaHeight={200}
  content="Resimli kart içeriği..."
/>

// Aksiyonlar ile
<Card
  title="Aksiyon Kartı"
  action={
    <IconButton>
      <MoreVert />
    </IconButton>
  }
  content="İçerik..."
  footer={
    <Button size="small" endIcon={<KeyboardArrowRight />}>
      Detaylar
    </Button>
  }
/>

// Loading durumu
<Card
  title="Yükleniyor"
  content="İçerik..."
  loading
/>

// Hata durumu
<Card
  title="Hata"
  error
  onRefresh={() => handleRefresh()}
/>

// Genişletilebilir
<Card
  title="Genişletilebilir Kart"
  expandable
  expanded={expanded}
  onExpand={() => setExpanded(!expanded)}
  content="İçerik..."
/>
*/

export default Card; 