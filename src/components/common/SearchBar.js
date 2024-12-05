import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Popper,
  Fade,
  CircularProgress,
  Chip,
  useTheme
} from '@mui/material';
import {
  Search,
  Close,
  TrendingUp,
  Star,
  History,
  CurrencyBitcoin
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../../hooks/useSearch';
import { useRecentSearches } from '../../hooks/useRecentSearches';
import MiniChart from '../chart/MiniChart';

const SearchBar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const { search, loading, results } = useSearch();
  const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches();
  
  // State
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Popüler aramalar
  const popularSearches = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'BNB', name: 'Binance Coin' },
    { symbol: 'SOL', name: 'Solana' }
  ];

  // Arama sonuçlarını filtrele ve sırala
  useEffect(() => {
    if (query.length >= 2) {
      search(query);
    }
  }, [query, search]);

  // Klavye navigasyonu
  const handleKeyDown = (event) => {
    if (!open) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < (results.length + recentSearches.length - 1) ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length + recentSearches.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0) {
          const item = selectedIndex < results.length
            ? results[selectedIndex]
            : recentSearches[selectedIndex - results.length];
          handleSelect(item);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        break;
      default:
        break;
    }
  };

  // Seçim işlemi
  const handleSelect = (item) => {
    addRecentSearch(item);
    navigate(`/markets/${item.symbol.toLowerCase()}`);
    setQuery('');
    setOpen(false);
  };

  return (
    <Box sx={{ position: 'relative', width: { xs: '100%', sm: 300, md: 400 } }}>
      <TextField
        ref={searchRef}
        fullWidth
        placeholder="Coin veya market ara..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search color="action" />
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <IconButton size="small" onClick={() => setQuery('')}>
                  <Close fontSize="small" />
                </IconButton>
              )}
            </InputAdornment>
          )
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.background.paper,
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            }
          }
        }}
      />

      <Popper
        open={open}
        anchorEl={searchRef.current}
        placement="bottom-start"
        transition
        style={{ width: searchRef.current?.offsetWidth, zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper 
              elevation={3}
              sx={{ 
                mt: 1,
                maxHeight: 400,
                overflow: 'auto'
              }}
            >
              {/* Sonuç yok */}
              {query.length >= 2 && !loading && results.length === 0 && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    Sonuç bulunamadı
                  </Typography>
                </Box>
              )}

              {/* Arama sonuçları */}
              {query.length >= 2 && results.length > 0 && (
                <List dense>
                  {results.map((item, index) => (
                    <ListItem
                      key={item.symbol}
                      button
                      selected={index === selectedIndex}
                      onClick={() => handleSelect(item)}
                    >
                      <ListItemIcon>
                        <CurrencyBitcoin />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">
                              {item.symbol}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.name}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <MiniChart 
                              data={item.chartData}
                              height={30}
                              showPrice={false}
                              showChange={false}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}

              {/* Son aramalar */}
              {!query && recentSearches.length > 0 && (
                <>
                  <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Son Aramalar
                    </Typography>
                    <Typography
                      variant="body2"
                      color="primary"
                      sx={{ cursor: 'pointer' }}
                      onClick={clearRecentSearches}
                    >
                      Temizle
                    </Typography>
                  </Box>
                  <List dense>
                    {recentSearches.map((item, index) => (
                      <ListItem
                        key={item.symbol}
                        button
                        selected={index + results.length === selectedIndex}
                        onClick={() => handleSelect(item)}
                      >
                        <ListItemIcon>
                          <History />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.symbol}
                          secondary={item.name}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {/* Popüler aramalar */}
              {!query && (
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Popüler Aramalar
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {popularSearches.map((item) => (
                      <Chip
                        key={item.symbol}
                        icon={<TrendingUp />}
                        label={item.symbol}
                        onClick={() => handleSelect(item)}
                        sx={{ '&:hover': { backgroundColor: theme.palette.action.hover } }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </Fade>
        )}
      </Popper>
    </Box>
  );
};

export default SearchBar; 