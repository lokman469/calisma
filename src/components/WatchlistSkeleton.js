import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardHeader,
  CardContent,
  Skeleton,
  Box,
  Grid,
  useTheme,
  Paper,
  Fade,
  Divider
} from '@mui/material';

const CoinSkeleton = () => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1,
        '&:not(:last-child)': {
          borderBottom: `1px solid ${theme.palette.divider}`
        }
      }}
    >
      <Skeleton variant="circular" width={32} height={32} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="text" width="40%" height={20} />
      </Box>
      <Skeleton variant="rectangular" width={80} height={32} />
    </Box>
  );
};

const WatchlistSkeleton = ({
  count = 3,
  viewMode = 'grid',
  animation = 'wave',
  spacing = 3
}) => {
  const theme = useTheme();

  const skeletonCards = Array.from({ length: count }, (_, index) => (
    <Grid
      item
      key={index}
      xs={12}
      md={viewMode === 'grid' ? 6 : 12}
      lg={viewMode === 'grid' ? 4 : 12}
    >
      <Fade in timeout={300} style={{ transitionDelay: `${index * 100}ms` }}>
        <Card
          elevation={3}
          sx={{
            height: '100%',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: theme.palette.background.paper,
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)'
            }
          }}
        >
          <CardHeader
            avatar={
              <Skeleton 
                variant="circular"
                width={40}
                height={40}
                animation={animation}
              />
            }
            title={
              <Skeleton
                variant="text"
                width="60%"
                height={28}
                animation={animation}
              />
            }
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton
                  variant="circular"
                  width={32}
                  height={32}
                  animation={animation}
                />
                <Skeleton
                  variant="circular"
                  width={32}
                  height={32}
                  animation={animation}
                />
                <Skeleton
                  variant="circular"
                  width={32}
                  height={32}
                  animation={animation}
                />
              </Box>
            }
          />

          <Divider />

          <CardContent sx={{ p: 0 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                p: 2
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Skeleton
                  variant="rectangular"
                  width={80}
                  height={32}
                  animation={animation}
                  sx={{ borderRadius: 1 }}
                />
                <Skeleton
                  variant="rectangular"
                  width={80}
                  height={32}
                  animation={animation}
                  sx={{ borderRadius: 1 }}
                />
              </Box>

              {Array.from({ length: 5 }, (_, i) => (
                <CoinSkeleton key={i} />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Fade>
    </Grid>
  ));

  return (
    <Grid container spacing={spacing}>
      {/* Toolbar Skeleton */}
      <Grid item xs={12} sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          <Skeleton
            variant="rectangular"
            width={120}
            height={36}
            animation={animation}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            width={120}
            height={36}
            animation={animation}
            sx={{ borderRadius: 1 }}
          />
          <Box sx={{ flex: 1 }} />
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            animation={animation}
          />
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            animation={animation}
          />
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            animation={animation}
          />
        </Box>
      </Grid>

      {/* Watchlist Card Skeletons */}
      {skeletonCards}
    </Grid>
  );
};

WatchlistSkeleton.propTypes = {
  count: PropTypes.number,
  viewMode: PropTypes.oneOf(['grid', 'list']),
  animation: PropTypes.oneOf(['pulse', 'wave', false]),
  spacing: PropTypes.number
};

export default React.memo(WatchlistSkeleton); 