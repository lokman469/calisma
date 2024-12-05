import React from 'react';
import {
  Badge as MuiBadge,
  Box,
  Typography,
  useTheme,
  alpha
} from '@mui/material';

// Badge varyantları
const BADGE_VARIANTS = {
  DOT: 'dot',
  STANDARD: 'standard'
};

// Badge boyutları
const BADGE_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
};

// Özel badge stilleri
const badgeStyles = {
  [BADGE_SIZES.SMALL]: {
    '& .MuiBadge-badge': {
      minWidth: 16,
      height: 16,
      padding: '0 4px',
      fontSize: '0.65rem'
    }
  },
  [BADGE_SIZES.MEDIUM]: {
    '& .MuiBadge-badge': {
      minWidth: 20,
      height: 20,
      padding: '0 6px',
      fontSize: '0.75rem'
    }
  },
  [BADGE_SIZES.LARGE]: {
    '& .MuiBadge-badge': {
      minWidth: 24,
      height: 24,
      padding: '0 8px',
      fontSize: '0.85rem'
    }
  }
};

const Badge = ({
  children,
  content,
  color = 'primary',
  variant = BADGE_VARIANTS.STANDARD,
  size = BADGE_SIZES.MEDIUM,
  max = 99,
  showZero = false,
  overlap = 'rectangular',
  horizontal = 'right',
  vertical = 'top',
  invisible = false,
  pulse = false,
  dot = false,
  sx = {}
}) => {
  const theme = useTheme();

  // Pulse animasyonu için stil
  const pulseStyles = pulse ? {
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""'
    },
    '@keyframes ripple': {
      '0%': {
        transform: 'scale(.8)',
        opacity: 1
      },
      '100%': {
        transform: 'scale(2.4)',
        opacity: 0
      }
    }
  } : {};

  return (
    <MuiBadge
      badgeContent={content}
      color={color}
      variant={variant}
      max={max}
      showZero={showZero}
      overlap={overlap}
      horizontal={horizontal}
      vertical={vertical}
      invisible={invisible}
      {...(dot && { variant: 'dot' })}
      sx={{
        ...badgeStyles[size],
        '& .MuiBadge-badge': {
          ...pulseStyles,
          ...(variant === 'dot' && {
            minWidth: 'auto',
            height: 'auto',
            padding: size === BADGE_SIZES.SMALL ? 3 : 4
          })
        },
        ...sx
      }}
    >
      {children}
    </MuiBadge>
  );
};

// Özel badge renkleri
export const badgeColors = {
  custom: (color, theme) => ({
    '& .MuiBadge-badge': {
      backgroundColor: color,
      color: theme.palette.getContrastText(color)
    }
  }),
  light: (theme) => ({
    '& .MuiBadge-badge': {
      backgroundColor: theme.palette.grey[200],
      color: theme.palette.grey[800]
    }
  }),
  dark: (theme) => ({
    '& .MuiBadge-badge': {
      backgroundColor: theme.palette.grey[800],
      color: theme.palette.common.white
    }
  })
};

// Kullanım örnekleri:
/*
// Basit kullanım
<Badge content={4}>
  <NotificationsIcon />
</Badge>

// Nokta varyantı
<Badge variant="dot" color="error">
  <MailIcon />
</Badge>

// Maksimum değer
<Badge content={150} max={99}>
  <NotificationsIcon />
</Badge>

// Farklı boyut
<Badge content={4} size="large">
  <NotificationsIcon />
</Badge>

// Pulse efekti
<Badge content={3} pulse>
  <NotificationsIcon />
</Badge>

// Özel renk
<Badge
  content={5}
  sx={badgeColors.custom('#ff9800', theme)}
>
  <NotificationsIcon />
</Badge>

// Özel pozisyon
<Badge
  content={4}
  horizontal="left"
  vertical="bottom"
>
  <NotificationsIcon />
</Badge>

// Sıfır gösterimi
<Badge content={0} showZero>
  <MailIcon />
</Badge>

// Görünmez
<Badge content={4} invisible>
  <NotificationsIcon />
</Badge>
*/

export default Badge; 