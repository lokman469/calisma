import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';

// Dialog tipleri
const DIALOG_TYPES = {
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
  SUCCESS: 'success'
};

// Tip bazlı ikonlar
const DIALOG_ICONS = {
  [DIALOG_TYPES.WARNING]: WarningIcon,
  [DIALOG_TYPES.ERROR]: ErrorIcon,
  [DIALOG_TYPES.INFO]: InfoIcon,
  [DIALOG_TYPES.SUCCESS]: SuccessIcon
};

// Tip bazlı renkler
const DIALOG_COLORS = {
  [DIALOG_TYPES.WARNING]: 'warning',
  [DIALOG_TYPES.ERROR]: 'error',
  [DIALOG_TYPES.INFO]: 'info',
  [DIALOG_TYPES.SUCCESS]: 'success'
};

const ConfirmDialog = ({
  open,
  title,
  message,
  type = DIALOG_TYPES.WARNING,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  onConfirm,
  onCancel,
  loading = false,
  maxWidth = 'sm',
  showCancel = true,
  closeOnClickAway = false,
  fullWidth = true,
  confirmButtonProps = {},
  cancelButtonProps = {}
}) => {
  const theme = useTheme();
  const Icon = DIALOG_ICONS[type];
  const color = DIALOG_COLORS[type];

  // Dialog kapatma işleyicisi
  const handleClose = (event, reason) => {
    if (reason === 'backdropClick' && !closeOnClickAway) {
      return;
    }
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      {/* Başlık */}
      <DialogTitle
        id="confirm-dialog-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pr: 6
        }}
      >
        <Icon
          color={color}
          sx={{
            fontSize: 28
          }}
        />
        <Typography variant="h6" component="span">
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onCancel}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme.palette.grey[500]
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* İçerik */}
      <DialogContent>
        <DialogContentText
          id="confirm-dialog-description"
          sx={{
            color: 'text.primary',
            '& strong': {
              fontWeight: 600
            }
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>

      {/* Aksiyonlar */}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {showCancel && (
          <Button
            onClick={onCancel}
            color="inherit"
            disabled={loading}
            {...cancelButtonProps}
          >
            {cancelText}
          </Button>
        )}
        <Button
          onClick={onConfirm}
          variant="contained"
          color={color}
          disabled={loading}
          startIcon={loading && (
            <CircularProgress size={20} color="inherit" />
          )}
          {...confirmButtonProps}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Kullanım örneği:
/*
<ConfirmDialog
  open={open}
  title="İşlemi Onayla"
  message="Bu işlemi gerçekleştirmek istediğinizden emin misiniz?"
  type="warning"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
  loading={loading}
/>
*/

export default ConfirmDialog; 