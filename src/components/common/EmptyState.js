import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import {
  SearchOff,
  ErrorOutline,
  AddCircleOutline,
  CloudOff,
  WifiOff,
  Block,
  FilterAlt,
  Inbox,
  FolderOff
} from '@mui/icons-material';

// Boş durum tipleri
const EMPTY_TYPES = {
  NO_DATA: 'no-data',
  NO_RESULTS: 'no-results',
  NO_CONNECTION: 'no-connection',
  NO_ACCESS: 'no-access',
  FILTERED: 'filtered',
  ERROR: 'error'
};

// Tip bazlı ikonlar
const EMPTY_ICONS = {
  [EMPTY_TYPES.NO_DATA]: FolderOff,
  [EMPTY_TYPES.NO_RESULTS]: SearchOff,
  [EMPTY_TYPES.NO_CONNECTION]: WifiOff,
  [EMPTY_TYPES.NO_ACCESS]: Block,
  [EMPTY_TYPES.FILTERED]: FilterAlt,
  [EMPTY_TYPES.ERROR]: ErrorOutline
};

// Tip bazlı varsayılan mesajlar
const DEFAULT_MESSAGES = {
  [EMPTY_TYPES.NO_DATA]: 'Henüz veri bulunmuyor',
  [EMPTY_TYPES.NO_RESULTS]: 'Sonuç bulunamadı',
  [EMPTY_TYPES.NO_CONNECTION]: 'İnternet bağlantısı yok',
  [EMPTY_TYPES.NO_ACCESS]: 'Erişim izniniz yok',
  [EMPTY_TYPES.FILTERED]: 'Filtrelenen sonuç yok',
  [EMPTY_TYPES.ERROR]: 'Bir hata oluştu'
};

const EmptyState = ({
  type = EMPTY_TYPES.NO_DATA,
  title,
  message,
  icon: CustomIcon,
  action,
  actionText = 'Ekle',
  compact = false,
  elevation = 0,
  imageUrl,
  children
}) => {
  const theme = useTheme();
  const Icon = CustomIcon || EMPTY_ICONS[type];
  
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: compact ? 3 : 5,
        minHeight: compact ? 'auto' : 400,
        color: 'text.secondary'
      }}
    >
      {/* İkon veya Resim */}
      {imageUrl ? (
        <Box
          component="img"
          src={imageUrl}
          alt={title}
          sx={{
            width: compact ? 120 : 200,
            height: compact ? 120 : 200,
            mb: 3,
            objectFit: 'contain'
          }}
        />
      ) : (
        <Icon
          sx={{
            fontSize: compact ? 64 : 96,
            mb: 3,
            color: alpha(theme.palette.text.secondary, 0.2)
          }}
        />
      )}

      {/* Başlık */}
      <Typography
        variant={compact ? 'h6' : 'h5'}
        color="text.primary"
        gutterBottom
      >
        {title || DEFAULT_MESSAGES[type]}
      </Typography>

      {/* Mesaj */}
      {message && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: action ? 3 : 0, maxWidth: 500 }}
        >
          {message}
        </Typography>
      )}

      {/* Aksiyon Butonu */}
      {action && (
        <Button
          variant="contained"
          startIcon={<AddCircleOutline />}
          onClick={action}
          sx={{ mt: 2 }}
        >
          {actionText}
        </Button>
      )}

      {/* Özel İçerik */}
      {children}
    </Box>
  );

  return elevation > 0 ? (
    <Paper elevation={elevation}>{content}</Paper>
  ) : (
    content
  );
};

// Kullanım örnekleri:
/*
// Basit kullanım
<EmptyState type="no-data" />

// Özelleştirilmiş mesaj
<EmptyState
  type="no-results"
  title="Sonuç Bulunamadı"
  message="Arama kriterlerinize uygun sonuç bulunamadı. Lütfen farklı anahtar kelimeler deneyin."
/>

// Aksiyon butonu ile
<EmptyState
  type="no-data"
  title="Henüz İşlem Yok"
  message="İşlem yapmak için yeni bir işlem ekleyin."
  action={handleAddTransaction}
  actionText="İşlem Ekle"
/>

// Kompakt mod
<EmptyState
  type="filtered"
  title="Filtre Sonucu"
  message="Seçili filtrelere uygun sonuç bulunamadı."
  compact
/>

// Özel ikon
<EmptyState
  title="Bakiyeniz Yetersiz"
  message="İşlem yapmak için bakiye yüklemeniz gerekiyor."
  icon={AccountBalanceWalletOutlined}
  action={handleAddBalance}
  actionText="Bakiye Yükle"
/>
*/

export default EmptyState; 