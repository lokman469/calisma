import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Chip,
  Autocomplete,
  Alert,
  CircularProgress,
  useTheme,
  Tooltip,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  DragIndicator as DragIcon,
  Star as StarIcon,
  Notifications as AlertIcon,
  ColorLens as ColorIcon,
  Public as PublicIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { formatCurrency } from '../utils/formatters';

const WatchlistDialog = ({
  open,
  onClose,
  onSave,
  initialData,
  availableCoins = [],
  loading = false,
  error = null
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    coins: [],
    isPublic: false,
    color: theme.palette.primary.main,
    notifications: {
      priceAlerts: true,
      newsAlerts: false
    }
  });

  // Form verilerini yükle
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        id: '',
        name: '',
        description: '',
        coins: [],
        isPublic: false,
        color: theme.palette.primary.main,
        notifications: {
          priceAlerts: true,
          newsAlerts: false
        }
      });
    }
  }, [initialData, theme.palette.primary.main]);

  // Form validasyonu
  const isValid = useCallback(() => {
    return formData.name.length >= 3 && formData.coins.length > 0;
  }, [formData]);

  // Coin ekle
  const handleAddCoin = useCallback((coin) => {
    if (!formData.coins.find(c => c.id === coin.id)) {
      setFormData(prev => ({
        ...prev,
        coins: [...prev.coins, coin]
      }));
    }
  }, [formData.coins]);

  // Coin sil
  const handleRemoveCoin = useCallback((coinId) => {
    setFormData(prev => ({
      ...prev,
      coins: prev.coins.filter(c => c.id !== coinId)
    }));
  }, []);

  // Coin sırasını değiştir
  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const items = Array.from(formData.coins);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFormData(prev => ({
      ...prev,
      coins: items
    }));
  }, [formData.coins]);

  // Form gönder
  const handleSubmit = useCallback(() => {
    if (isValid()) {
      onSave(formData);
    }
  }, [formData, isValid, onSave]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        elevation: 3,
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {initialData ? 'İzleme Listesi Düzenle' : 'Yeni İzleme Listesi'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Temel Bilgiler */}
          <TextField
            label="Liste Adı"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={formData.name.length > 0 && formData.name.length < 3}
            helperText={formData.name.length > 0 && formData.name.length < 3 ? 'En az 3 karakter giriniz' : ''}
            disabled={loading}
            fullWidth
          />

          <TextField
            label="Açıklama"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            multiline
            rows={2}
            disabled={loading}
            fullWidth
          />

          {/* Ayarlar */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  disabled={loading}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PublicIcon fontSize="small" />
                  <Typography>Herkese Açık</Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.notifications.priceAlerts}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      priceAlerts: e.target.checked
                    }
                  }))}
                  disabled={loading}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AlertIcon fontSize="small" />
                  <Typography>Fiyat Alarmları</Typography>
                </Box>
              }
            />
          </Box>

          <Divider />

          {/* Coin Seçici */}
          <Autocomplete
            options={availableCoins.filter(coin => !formData.coins.find(c => c.id === coin.id))}
            getOptionLabel={(option) => `${option.name} (${option.symbol.toUpperCase()})`}
            renderOption={(props, option) => (
              <ListItem {...props}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <img 
                    src={option.image} 
                    alt={option.name}
                    style={{ width: 24, height: 24 }}
                    loading="lazy"
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={option.name}
                  secondary={formatCurrency(option.current_price)}
                />
              </ListItem>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Coin Ekle"
                disabled={loading}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading && <CircularProgress size={20} />}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
            onChange={(_, value) => value && handleAddCoin(value)}
            disabled={loading}
          />

          {/* Seçili Coinler */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="coins">
              {(provided) => (
                <List
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`
                  }}
                >
                  {formData.coins.map((coin, index) => (
                    <Draggable key={coin.id} draggableId={coin.id} index={index}>
                      {(provided) => (
                        <ListItem
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          divider
                        >
                          <ListItemIcon {...provided.dragHandleProps}>
                            <DragIcon />
                          </ListItemIcon>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <img 
                              src={coin.image} 
                              alt={coin.name}
                              style={{ width: 24, height: 24 }}
                              loading="lazy"
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={coin.name}
                            secondary={formatCurrency(coin.current_price)}
                          />
                          <ListItemSecondaryAction>
                            <Tooltip title="Sil">
                              <IconButton
                                edge="end"
                                onClick={() => handleRemoveCoin(coin.id)}
                                disabled={loading}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </List>
              )}
            </Droppable>
          </DragDropContext>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          İptal
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!isValid() || loading}
          startIcon={<SaveIcon />}
        >
          {initialData ? 'Güncelle' : 'Oluştur'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

WatchlistDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    coins: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        symbol: PropTypes.string.isRequired,
        image: PropTypes.string.isRequired,
        current_price: PropTypes.number.isRequired
      })
    ),
    isPublic: PropTypes.bool,
    color: PropTypes.string,
    notifications: PropTypes.shape({
      priceAlerts: PropTypes.bool,
      newsAlerts: PropTypes.bool
    })
  }),
  availableCoins: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      symbol: PropTypes.string.isRequired,
      image: PropTypes.string.isRequired,
      current_price: PropTypes.number.isRequired
    })
  ),
  loading: PropTypes.bool,
  error: PropTypes.string
};

export default React.memo(WatchlistDialog); 