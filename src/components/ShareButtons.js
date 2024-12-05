import {
  TwitterShareButton,
  TelegramShareButton,
  WhatsappShareButton,
  TwitterIcon,
  TelegramIcon,
  WhatsappIcon
} from 'react-share';
import { Box, Typography } from '@mui/material';

function ShareButtons({ coin }) {
  const shareUrl = window.location.href;
  const title = `${coin.name} şu anda $${coin.current_price} değerinde!`;

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Typography variant="body2">Paylaş:</Typography>
      <TwitterShareButton url={shareUrl} title={title}>
        <TwitterIcon size={32} round />
      </TwitterShareButton>
      <TelegramShareButton url={shareUrl} title={title}>
        <TelegramIcon size={32} round />
      </TelegramShareButton>
      <WhatsappShareButton url={shareUrl} title={title}>
        <WhatsappIcon size={32} round />
      </WhatsappShareButton>
    </Box>
  );
}

export default ShareButtons; 