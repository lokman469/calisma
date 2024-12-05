import React from 'react';
import {
  Avatar as MuiAvatar,
  AvatarGroup,
  Box,
  Typography,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Person as PersonIcon,
  Image as ImageIcon
} from '@mui/icons-material';

// Avatar boyutları
const AVATAR_SIZES = {
  TINY: 24,
  SMALL: 32,
  MEDIUM: 40,
  LARGE: 56,
  XLARGE: 72
};

// Varsayılan renkler
const DEFAULT_COLORS = [
  '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
  '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
  '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6', '#f39c12',
  '#d35400', '#c0392b', '#bdc3c7', '#7f8c8d'
];

const Avatar = ({
  src,
  alt,
  name,
  size = 'medium',
  variant = 'circular',
  color,
  online,
  group,
  max,
  tooltip,
  onClick,
  sx = {}
}) => {
  const theme = useTheme();
  
  // Avatar boyutunu al
  const avatarSize = typeof size === 'string' ? AVATAR_SIZES[size.toUpperCase()] : size;

  // İsimden baş harfleri al
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // İsimden renk üret
  const getColorFromName = (name) => {
    if (!name) return DEFAULT_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return DEFAULT_COLORS[Math.abs(hash) % DEFAULT_COLORS.length];
  };

  // Tekil avatar bileşeni
  const SingleAvatar = (
    <MuiAvatar
      src={src}
      alt={alt || name}
      variant={variant}
      onClick={onClick}
      sx={{
        width: avatarSize,
        height: avatarSize,
        fontSize: avatarSize * 0.4,
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: color || (name ? getColorFromName(name) : theme.palette.grey[300]),
        color: theme.palette.getContrastText(color || getColorFromName(name)),
        border: `2px solid ${theme.palette.background.paper}`,
        ...sx
      }}
    >
      {!src && (name ? getInitials(name) : <PersonIcon />)}
    </MuiAvatar>
  );

  // Online durumu göstergesi
  const AvatarWithStatus = online !== undefined ? (
    <Box sx={{ position: 'relative' }}>
      {SingleAvatar}
      <Box
        sx={{
          position: 'absolute',
          bottom: 2,
          right: 2,
          width: avatarSize * 0.25,
          height: avatarSize * 0.25,
          borderRadius: '50%',
          border: `2px solid ${theme.palette.background.paper}`,
          backgroundColor: online ? theme.palette.success.main : theme.palette.grey[500]
        }}
      />
    </Box>
  ) : SingleAvatar;

  // Tooltip wrapper
  const AvatarWithTooltip = tooltip ? (
    <Tooltip title={tooltip}>
      {AvatarWithStatus}
    </Tooltip>
  ) : AvatarWithStatus;

  // Grup avatarı
  if (group) {
    return (
      <AvatarGroup
        max={max}
        sx={{
          '& .MuiAvatar-root': {
            width: avatarSize,
            height: avatarSize,
            fontSize: avatarSize * 0.4,
            borderWidth: 2,
            '&:last-child': {
              fontSize: avatarSize * 0.35
            }
          }
        }}
      >
        {group.map((item, index) => (
          <MuiAvatar
            key={index}
            src={item.src}
            alt={item.alt || item.name}
            sx={{
              backgroundColor: item.color || (item.name ? getColorFromName(item.name) : theme.palette.grey[300])
            }}
          >
            {!item.src && (item.name ? getInitials(item.name) : <PersonIcon />)}
          </MuiAvatar>
        ))}
      </AvatarGroup>
    );
  }

  return AvatarWithTooltip;
};

// Kullanım örnekleri:
/*
// Basit kullanım
<Avatar name="John Doe" />

// Resimli avatar
<Avatar
  src="/path/to/image.jpg"
  alt="John Doe"
/>

// Boyut seçenekleri
<Avatar
  name="John Doe"
  size="large"
/>

// Online durumu
<Avatar
  name="John Doe"
  online={true}
/>

// Tooltip ile
<Avatar
  name="John Doe"
  tooltip="Frontend Developer"
/>

// Özel renk
<Avatar
  name="John Doe"
  color="#1abc9c"
/>

// Kare avatar
<Avatar
  name="John Doe"
  variant="square"
/>

// Grup avatar
<Avatar
  group={[
    { name: 'John Doe' },
    { name: 'Jane Doe' },
    { src: '/path/to/image.jpg' }
  ]}
  max={3}
/>

// Tıklanabilir
<Avatar
  name="John Doe"
  onClick={() => console.log('Avatar clicked')}
/>
*/

export default Avatar; 