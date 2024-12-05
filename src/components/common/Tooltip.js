import React from 'react';
import {
  Tooltip as MuiTooltip,
  Zoom,
  Box,
  Typography,
  useTheme,
  alpha
} from '@mui/material';

const Tooltip = ({
  title,
  description,
  children,
  placement = 'top',
  arrow = true,
  enterDelay = 200,
  leaveDelay = 0,
  maxWidth = 220,
  interactive = false,
  followCursor = false,
  TransitionComponent = Zoom,
  TransitionProps,
  sx = {},
  ...props
}) => {
  const theme = useTheme();

  // Özel tooltip içeriği
  const tooltipContent = description ? (
    <Box sx={{ p: 0.5, maxWidth }}>
      <Typography
        variant="subtitle2"
        component="div"
        sx={{ fontWeight: 600, mb: 0.5 }}
      >
        {title}
      </Typography>
      <Typography variant="body2" component="div">
        {description}
      </Typography>
    </Box>
  ) : (
    title
  );

  return (
    <MuiTooltip
      title={tooltipContent}
      placement={placement}
      arrow={arrow}
      enterDelay={enterDelay}
      leaveDelay={leaveDelay}
      TransitionComponent={TransitionComponent}
      TransitionProps={TransitionProps}
      interactive={interactive}
      followCursor={followCursor}
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: theme.palette.grey[800],
            '& .MuiTooltip-arrow': {
              color: theme.palette.grey[800]
            },
            ...((interactive || description) && {
              p: 1,
              maxWidth: maxWidth + 16
            }),
            ...sx
          }
        }
      }}
      {...props}
    >
      {children}
    </MuiTooltip>
  );
};

// Özel tooltip stilleri
export const tooltipClasses = {
  light: (theme) => ({
    bgcolor: theme.palette.common.white,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[1],
    '& .MuiTooltip-arrow': {
      color: theme.palette.common.white
    }
  }),
  success: (theme) => ({
    bgcolor: theme.palette.success.main,
    '& .MuiTooltip-arrow': {
      color: theme.palette.success.main
    }
  }),
  error: (theme) => ({
    bgcolor: theme.palette.error.main,
    '& .MuiTooltip-arrow': {
      color: theme.palette.error.main
    }
  }),
  warning: (theme) => ({
    bgcolor: theme.palette.warning.main,
    '& .MuiTooltip-arrow': {
      color: theme.palette.warning.main
    }
  }),
  info: (theme) => ({
    bgcolor: theme.palette.info.main,
    '& .MuiTooltip-arrow': {
      color: theme.palette.info.main
    }
  })
};

// Kullanım örnekleri:
/*
// Basit kullanım
<Tooltip title="Tooltip metni">
  <Button>Hover Me</Button>
</Tooltip>

// Açıklama ile
<Tooltip
  title="Başlık"
  description="Detaylı açıklama metni buraya gelecek..."
>
  <IconButton>
    <InfoIcon />
  </IconButton>
</Tooltip>

// Özel yerleşim
<Tooltip
  title="Sağda göster"
  placement="right"
>
  <Button>Hover Me</Button>
</Tooltip>

// İnteraktif tooltip
<Tooltip
  title="İnteraktif tooltip"
  interactive
>
  <Button>Hover Me</Button>
</Tooltip>

// İmleç takibi
<Tooltip
  title="İmleci takip et"
  followCursor
>
  <Box sx={{ width: 200, height: 100, border: '1px dashed grey' }}>
    Hover anywhere
  </Box>
</Tooltip>

// Özel stil
<Tooltip
  title="Özel stilli tooltip"
  sx={tooltipClasses.light(theme)}
>
  <Button>Hover Me</Button>
</Tooltip>

// Gecikmeli gösterim
<Tooltip
  title="Gecikmeli tooltip"
  enterDelay={500}
  leaveDelay={200}
>
  <Button>Hover Me</Button>
</Tooltip>
*/

export default Tooltip; 