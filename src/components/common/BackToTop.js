import React, { useState, useEffect } from 'react';
import {
  Fab,
  Zoom,
  useScrollTrigger,
  useTheme,
  Tooltip
} from '@mui/material';
import { KeyboardArrowUp } from '@mui/icons-material';

const BackToTop = ({
  threshold = 100,
  position = {
    position: 'fixed',
    bottom: 16,
    right: 16
  },
  size = 'medium',
  color = 'primary',
  smooth = true,
  tooltip = 'Yukarı çık',
  children
}) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  // Scroll pozisyonunu takip et
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: threshold
  });

  useEffect(() => {
    setVisible(trigger);
  }, [trigger]);

  // Yukarı kaydırma işlemi
  const handleClick = () => {
    if (smooth) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo(0, 0);
    }
  };

  // Özel içerik veya varsayılan buton
  const content = children || (
    <Fab
      size={size}
      color={color}
      aria-label="back to top"
      onClick={handleClick}
      sx={{
        boxShadow: theme.shadows[4],
        '&:hover': {
          boxShadow: theme.shadows[6]
        }
      }}
    >
      <KeyboardArrowUp />
    </Fab>
  );

  return (
    <Zoom in={visible}>
      <Tooltip 
        title={tooltip}
        placement="left"
        sx={{
          ...position,
          zIndex: theme.zIndex.speedDial
        }}
      >
        {content}
      </Tooltip>
    </Zoom>
  );
};

// Kullanım örnekleri:
/*
// Basit kullanım
<BackToTop />

// Özelleştirilmiş eşik değeri
<BackToTop threshold={200} />

// Özelleştirilmiş pozisyon
<BackToTop position={{ position: 'fixed', bottom: 32, right: 32 }} />

// Farklı boyut ve renk
<BackToTop size="large" color="secondary" />

// Smooth scroll kapalı
<BackToTop smooth={false} />

// Özel tooltip
<BackToTop tooltip="Başa dön" />

// Özel içerik
<BackToTop>
  <CustomButton />
</BackToTop>
*/

export default BackToTop; 