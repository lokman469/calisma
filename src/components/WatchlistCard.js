import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardHeader,
  CardContent,
  IconButton,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  Collapse,
  Alert,
  useTheme,
  Divider,
  Button,
  Fade
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  TrendingUp,
  TrendingDown,
  Notifications as AlertIcon,
  Share as ShareIcon,
  Sort as SortIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { formatCurrency, formatPercentage } from '../utils/formatters';

const SORT_OPTIONS = [
  { value: 'name', label: 'İsim' },
  { value: 'price', label: 'Fiyat' },
  { value: 'change', label: 'Değişim' },
  { value: 'marketCap', label: 'Piyasa Değeri' }
];

const WatchlistCard = ({
  title,
  coins = [],
  onDelete,
  onEdit,
  onCoinSelect,
  onSetAlert,
  onShare,
  loading = false,
  error = null,
  favorite = false,
  onToggleFavorite
}) => {
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [expanded, setExpanded] = useState(true);

  // Sıralama menüsü
  const handleSortMenuClick = useCallback((event) => {
    setMenuAnchor(event.currentTarget);
  }, []);

  const handleSortMenuClose = useCallback(() => {
    setMenuAnchor(null);
  }, []);

  // Sıralama değiştir
  const handleSortChange = useCallback((value) => {
    if (sortBy === value) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(value);
      setSortDirection('asc');
    }
    handleSortMenuClose();
  }, [sortBy]);

  // Coinleri sırala
  const sortedCoins = useMemo(() => {
    if (!coins.length) return [];
    
    return [...coins].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price':
          comparison = a.current_price - b.current_price;
          break;
        case 'change':
          comparison = a.price_change_percentage_24h - b.price_change_percentage_24h;
          break;
        case 'marketCap':
          comparison = a.market_cap - b.market_cap;
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [coins, sortBy, sortDirection]);

  // Değişim yüzdesi rengi
  const getPriceChangeColor = useCallback((change) => {
    if (change > 0) return theme.palette.success.main;
    if (change < 0) return theme.palette.error.main;
    return theme.palette.text.secondary;
  }, [theme]);

  return (
    <Card 
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)'
        }
      }}
    >
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">{title}</Typography>
            {favorite && (
              <StarIcon fontSize="small" color="primary" />
            )}
          </Box>
        }
        action={
          <Box>
            <Tooltip title="Sırala">
              <IconButton onClick={handleSortMenuClick} size="small">
                <SortIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Paylaş">
              <IconButton onClick={onShare} size="small">
                <ShareIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={favorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}>
              <IconButton 
                onClick={onToggleFavorite}
                size="small"
                color={favorite ? "primary" : "default"}
              >
                {favorite ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Düzenle">
              <IconButton onClick={onEdit} size="small">
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sil">
              <IconButton onClick={onDelete} size="small" color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />

      <Divider />

      <CardContent sx={{ flex: 1, p: 0 }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {coins.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 3,
              opacity: 0.5
            }}
          >
            <Typography color="textSecondary" align="center">
              Bu listede henüz coin bulunmuyor
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 2 }}
              onClick={onEdit}
            >
              Coin Ekle
            </Button>
          </Box>
        ) : (
          <List disablePadding>
            {sortedCoins.map((coin) => (
              <ListItem
                key={coin.id}
                button
                onClick={() => onCoinSelect(coin)}
                sx={{
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <img 
                    src={coin.image} 
                    alt={coin.name}
                    style={{ width: 24, height: 24 }}
                    loading="lazy"
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1">
                        {coin.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="textSecondary"
                        sx={{ textTransform: 'uppercase' }}
                      >
                        {coin.symbol}
                      </Typography>
                    </Box>
                  }
                  secondary={formatCurrency(coin.current_price)}
                />
                <ListItemSecondaryAction>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      icon={coin.price_change_percentage_24h > 0 ? <TrendingUp /> : <TrendingDown />}
                      label={formatPercentage(coin.price_change_percentage_24h)}
                      size="small"
                      sx={{
                        backgroundColor: `${getPriceChangeColor(coin.price_change_percentage_24h)}20`,
                        color: getPriceChangeColor(coin.price_change_percentage_24h)
                      }}
                    />
                    <Tooltip title="Fiyat Alarmı Oluştur">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetAlert(coin);
                        }}
                      >
                        <AlertIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleSortMenuClose}
        TransitionComponent={Fade}
      >
        {SORT_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleSortChange(option.value)}
            selected={sortBy === option.value}
          >
            <ListItemText>
              {option.label}
              {sortBy === option.value && (
                <Typography variant="caption" sx={{ ml: 1 }}>
                  ({sortDirection === 'asc' ? 'A-Z' : 'Z-A'})
                </Typography>
              )}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Card>
  );
};

WatchlistCard.propTypes = {
  title: PropTypes.string.isRequired,
  coins: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      symbol: PropTypes.string.isRequired,
      image: PropTypes.string.isRequired,
      current_price: PropTypes.number.isRequired,
      price_change_percentage_24h: PropTypes.number,
      market_cap: PropTypes.number
    })
  ),
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onCoinSelect: PropTypes.func.isRequired,
  onSetAlert: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  favorite: PropTypes.bool,
  onToggleFavorite: PropTypes.func.isRequired
};

export default React.memo(WatchlistCard); 