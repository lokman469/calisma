import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Button,
  useTheme,
  useMediaQuery,
  Slide,
  Fade
} from '@mui/material';
import {
  Close as CloseIcon,
  Fullscreen,
  FullscreenExit
} from '@mui/icons-material';

// Slide transition
const SlideTransition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

const Modal = ({
  open,
  onClose,
  title,
  content,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  fullScreen = false,
  fullScreenBreakpoint = 'sm',
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  showCloseButton = true,
  titleProps = {},
  contentProps = {},
  actionsProps = {},
  transition = 'fade',
  loading = false,
  sx = {}
}) => {
  const theme = useTheme();
  const fullScreenDefault = useMediaQuery(theme.breakpoints.down(fullScreenBreakpoint));
  const [isFullScreen, setIsFullScreen] = React.useState(fullScreen);

  // Backdrop tıklama işleyicisi
  const handleBackdropClick = (event) => {
    if (disableBackdropClick) {
      event.stopPropagation();
    }
  };

  // Tam ekran geçiş işleyicisi
  const handleFullScreenToggle = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Transition bileşeni seçimi
  const TransitionComponent = transition === 'slide' ? SlideTransition : Fade;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreen || isFullScreen || fullScreenDefault}
      TransitionComponent={TransitionComponent}
      onBackdropClick={handleBackdropClick}
      disableEscapeKeyDown={disableEscapeKeyDown}
      sx={{
        '& .MuiDialog-paper': {
          m: fullScreen || isFullScreen ? 0 : 2,
          ...sx
        }
      }}
    >
      {/* Başlık */}
      {title && (
        <DialogTitle
          {...titleProps}
          sx={{
            m: 0,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            ...titleProps.sx
          }}
        >
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!fullScreen && (
              <IconButton
                size="small"
                onClick={handleFullScreenToggle}
                sx={{ color: 'text.secondary' }}
              >
                {isFullScreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            )}
            {showCloseButton && (
              <IconButton
                size="small"
                onClick={onClose}
                sx={{ color: 'text.secondary' }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
      )}

      {/* İçerik */}
      <DialogContent
        {...contentProps}
        sx={{
          p: 2,
          ...contentProps.sx
        }}
      >
        {typeof content === 'string' ? (
          <Typography>{content}</Typography>
        ) : (
          content
        )}
      </DialogContent>

      {/* Aksiyonlar */}
      {actions && (
        <DialogActions
          {...actionsProps}
          sx={{
            p: 2,
            ...actionsProps.sx
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

// Kullanım örnekleri:
/*
// Basit kullanım
<Modal
  open={open}
  onClose={handleClose}
  title="Modal Başlığı"
  content="Modal içeriği buraya gelecek..."
  actions={
    <>
      <Button onClick={handleClose}>İptal</Button>
      <Button variant="contained" onClick={handleSave}>
        Kaydet
      </Button>
    </>
  }
/>

// Tam ekran
<Modal
  open={open}
  onClose={handleClose}
  title="Tam Ekran Modal"
  content={<CustomContent />}
  fullScreen
/>

// Özel geçiş efekti
<Modal
  open={open}
  onClose={handleClose}
  title="Slide Modal"
  content="Slide geçiş efekti ile modal"
  transition="slide"
/>

// Backdrop tıklama devre dışı
<Modal
  open={open}
  onClose={handleClose}
  title="Güvenli Modal"
  content="Bu modal backdrop tıklaması ile kapanmaz"
  disableBackdropClick
  disableEscapeKeyDown
/>

// Özel stil
<Modal
  open={open}
  onClose={handleClose}
  title="Özel Stilli Modal"
  content="İçerik..."
  sx={{
    '& .MuiDialog-paper': {
      borderRadius: 2,
      boxShadow: 24
    }
  }}
/>
*/

export default Modal; 