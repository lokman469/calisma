import React from 'react';
import {
  Skeleton as MuiSkeleton,
  Box,
  useTheme
} from '@mui/material';

// Skeleton varyantları
const SKELETON_VARIANTS = {
  TEXT: 'text',
  RECTANGLE: 'rectangular',
  CIRCLE: 'circular'
};

// Skeleton boyutları
const SKELETON_SIZES = {
  SMALL: { width: 100, height: 20 },
  MEDIUM: { width: 200, height: 40 },
  LARGE: { width: 300, height: 60 }
};

const Skeleton = ({
  variant = SKELETON_VARIANTS.TEXT,
  size = 'medium',
  width,
  height,
  animation = 'wave',
  sx = {}
}) => {
  const theme = useTheme();

  // Boyutları belirle
  const skeletonSize = typeof size === 'string' ? SKELETON_SIZES[size.toUpperCase()] : { width, height };

  return (
    <MuiSkeleton
      variant={variant}
      animation={animation}
      width={skeletonSize.width}
      height={skeletonSize.height}
      sx={{
        bgcolor: theme.palette.grey[200],
        ...sx
      }}
    />
  );
};

// Kullanım örnekleri:
/*
// Basit kullanım
<Skeleton />

// Dikdörtgen varyant
<Skeleton variant="rectangular" size="large" />

// Daire varyant
<Skeleton variant="circular" size="small" />

// Özel boyut
<Skeleton width={150} height={30} />

// Animasyon kapalı
<Skeleton animation={false} />

// Özel stil
<Skeleton
  sx={{
    bgcolor: 'primary.main',
    borderRadius: 1
  }}
/>
*/

export default Skeleton; 