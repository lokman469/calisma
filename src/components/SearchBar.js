import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  InputBase,
  IconButton,
  Box,
  Popper,
  Fade,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Chip,
  Divider,
  CircularProgress,
  useTheme,
  Tooltip,
  ClickAwayListener
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  TrendingUp,
  History as HistoryIcon,
  Star as StarIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { debounce } from 'lodash';
import { formatCurrency, formatPercentage } from '../utils/formatters';

const SearchBar = ({
  onSearch,
  onFilterClick,
  recentSearches = [],
  favoriteCoins = [],
  trendingCoins = [],
  loading = false,
  error = null,
  placeholder = 'Kripto para ara...'
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [isPopperOpen, setIsPopperOpen] = useState(false);
  const anchorRef = useRef(null);

  // Debounced arama fonksiyonu
  const debouncedSearch = useCallback(
    debounce((term) => {
      onSearch(term);
    }, 300),
    [onSearch]
  );

  // Input değişikliği
  const handleInputChange = useCallback((event) => {
    const value = event.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Aramayı temizle
  const handleClear = useCallback(() => {
    setSearchTerm('');
    onSearch('');
    setIsPopperOpen(false);
  }, [onSearch]);

  // Popper'ı aç/kapat
  useEffect(() => {
    if (searchTerm || loading) {
      setIsPopperOpen(true);
    }
  }, [searchTerm, loading]);

  // Coin seçimi
  const handleCoinSelect = useCallback((coin) => {
    setSearchTerm(coin.name);
    onSearch(coin.name);
    setIsPopperOpen(false);
  }, [onSearch]);

  return (
    <ClickAwayListener onClickAway={() => setIsPopperOpen(false)}>
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 600, margin: '0 auto' }}>
        <Paper
          ref={anchorRef}
          elevation={3}
          sx={{
            p: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            borderRadius: 2,
            transition: 'box-shadow 0.3s',
            '&:hover': {
              boxShadow: theme.shadows[6]
            }
          }}
        >
          <IconButton sx={{ p: '10px' }} aria-label="arama">
            <SearchIcon />
          </IconButton>
          
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setIsPopperOpen(true)}
            inputProps={{ 'aria-label': 'kripto para ara' }}
          />

          {loading && (
            <CircularProgress size={24} sx={{ mx: 1 }} />
          )}

          {searchTerm && (
            <IconButton size="small" onClick={handleClear} aria-label="temizle">
              <CloseIcon />
            </IconButton>
          )}

          <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />

          <Tooltip title="Filtreler">
            <IconButton 
              color="primary" 
              sx={{ p: '10px' }} 
              onClick={onFilterClick}
              aria-label="filtreler"
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
        </Paper>

        <Popper
          open={isPopperOpen}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          transition
          style={{ width: anchorRef.current?.offsetWidth, zIndex: theme.zIndex.modal }}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={350}>
              <Paper 
                elevation={8}
                sx={{
                  mt: 1,
                  maxHeight: 400,
                  overflow: 'auto',
                  borderRadius: 2
                }}
              >
                {error ? (
                  <Box p={2}>
                    <Typography color="error">{error}</Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {/* Trend Coinler */}
                    {!searchTerm && trendingCoins.length > 0 && (
                      <>
                        <ListItem sx={{ py: 1 }}>
                          <ListItemIcon>
                            <TrendingUp color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Trend Coinler"
                            primaryTypographyProps={{ variant: 'subtitle2', color: 'textSecondary' }}
                          />
                        </ListItem>
                        {trendingCoins.map(coin => (
                          <ListItem
                            key={coin.id}
                            button
                            onClick={() => handleCoinSelect(coin)}
                            sx={{
                              py: 1,
                              px: 2,
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
                              primary={coin.name}
                              secondary={
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" component="span">
                                    {formatCurrency(coin.current_price)}
                                  </Typography>
                                  <Chip
                                    label={formatPercentage(coin.price_change_24h)}
                                    size="small"
                                    color={coin.price_change_24h > 0 ? 'success' : 'error'}
                                    sx={{ height: 20 }}
                                  />
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                        <Divider />
                      </>
                    )}

                    {/* Favori Coinler */}
                    {!searchTerm && favoriteCoins.length > 0 && (
                      <>
                        <ListItem sx={{ py: 1 }}>
                          <ListItemIcon>
                            <StarIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Favoriler"
                            primaryTypographyProps={{ variant: 'subtitle2', color: 'textSecondary' }}
                          />
                        </ListItem>
                        {favoriteCoins.map(coin => (
                          <ListItem
                            key={coin.id}
                            button
                            onClick={() => handleCoinSelect(coin)}
                            sx={{
                              py: 1,
                              px: 2,
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
                              primary={coin.name}
                              secondary={formatCurrency(coin.current_price)}
                            />
                          </ListItem>
                        ))}
                        <Divider />
                      </>
                    )}

                    {/* Son Aramalar */}
                    {!searchTerm && recentSearches.length > 0 && (
                      <>
                        <ListItem sx={{ py: 1 }}>
                          <ListItemIcon>
                            <HistoryIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Son Aramalar"
                            primaryTypographyProps={{ variant: 'subtitle2', color: 'textSecondary' }}
                          />
                        </ListItem>
                        {recentSearches.map(search => (
                          <ListItem
                            key={search.id}
                            button
                            onClick={() => handleCoinSelect(search)}
                            sx={{
                              py: 1,
                              px: 2,
                              '&:hover': {
                                backgroundColor: theme.palette.action.hover
                              }
                            }}
                          >
                            <ListItemIcon>
                              <HistoryIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={search.term} />
                          </ListItem>
                        ))}
                      </>
                    )}
                  </List>
                )}
              </Paper>
            </Fade>
          )}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  onFilterClick: PropTypes.func.isRequired,
  recentSearches: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      term: PropTypes.string.isRequired
    })
  ),
  favoriteCoins: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      image: PropTypes.string.isRequired,
      current_price: PropTypes.number.isRequired
    })
  ),
  trendingCoins: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      image: PropTypes.string.isRequired,
      current_price: PropTypes.number.isRequired,
      price_change_24h: PropTypes.number.isRequired
    })
  ),
  loading: PropTypes.bool,
  error: PropTypes.string,
  placeholder: PropTypes.string
};

export default React.memo(SearchBar); 