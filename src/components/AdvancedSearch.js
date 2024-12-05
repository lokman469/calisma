import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import {
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Slider,
  Typography,
  Button,
  Box,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { debounce } from 'lodash';

// Sabitler
const FILTER_DEFAULTS = {
  searchTerm: '',
  priceRange: [0, 100000],
  marketCap: 'all',
  volume24h: 'all',
  priceChange24h: 'all'
};

const MARKET_CAP_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'high', label: 'Yüksek (>$10B)' },
  { value: 'medium', label: 'Orta ($1B-$10B)' },
  { value: 'low', label: 'Düşük (<$1B)' }
];

const VOLUME_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'high', label: '>$1B' },
  { value: 'medium', label: '$100M-$1B' },
  { value: 'low', label: '<$100M' }
];

const PRICE_CHANGE_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'positive', label: 'Yükselenler' },
  { value: 'negative', label: 'Düşenler' }
];

function AdvancedSearch({ onSearch, initialFilters = {}, loading = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [filters, setFilters] = useState({ ...FILTER_DEFAULTS, ...initialFilters });
  const [error, setError] = useState(null);

  // Input sanitization
  const sanitizeInput = (value) => {
    if (typeof value === 'string') {
      return DOMPurify.sanitize(value.trim());
    }
    return value;
  };

  // Memoized handlers
  const debouncedSearch = useMemo(
    () => debounce((filters) => {
      try {
        onSearch(filters);
        setError(null);
      } catch (err) {
        setError('Arama sırasında bir hata oluştu. Lütfen tekrar deneyin.');
        console.error('Search error:', err);
      }
    }, 500),
    [onSearch]
  );

  const handleInputChange = (field, value) => {
    const sanitizedValue = sanitizeInput(value);
    setFilters(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));
    debouncedSearch({ ...filters, [field]: sanitizedValue });
  };

  const handleReset = () => {
    setFilters(FILTER_DEFAULTS);
    onSearch(FILTER_DEFAULTS);
    setError(null);
  };

  // Responsive grid columns
  const getGridColumns = (size) => ({
    xs: 12,
    sm: size === 'full' ? 12 : 6,
    md: size === 'full' ? 12 : size === 'half' ? 6 : 4
  });

  return (
    <Paper 
      sx={{ 
        p: { xs: 2, sm: 3 },
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[3]
      }}
      elevation={3}
      role="search"
      aria-label="Gelişmiş kripto para arama formu"
    >
      <Grid container spacing={3}>
        {error && (
          <Grid item {...getGridColumns('full')}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        <Grid item {...getGridColumns('full')}>
          <TextField
            fullWidth
            label="Kripto Para Ara"
            value={filters.searchTerm}
            onChange={(e) => handleInputChange('searchTerm', e.target.value)}
            disabled={loading}
            InputProps={{
              startAdornment: <SearchIcon color="action" />,
              'aria-label': 'Kripto para ara'
            }}
          />
        </Grid>

        <Grid item {...getGridColumns('full')}>
          <Typography gutterBottom id="price-range-slider">
            Fiyat Aralığı ($)
          </Typography>
          <Slider
            value={filters.priceRange}
            onChange={(e, newValue) => handleInputChange('priceRange', newValue)}
            valueLabelDisplay="auto"
            min={0}
            max={100000}
            disabled={loading}
            aria-labelledby="price-range-slider"
            sx={{
              '& .MuiSlider-valueLabel': {
                backgroundColor: theme.palette.primary.main
              }
            }}
          />
        </Grid>

        <Grid item {...getGridColumns('third')}>
          <FormControl fullWidth disabled={loading}>
            <InputLabel id="market-cap-label">Market Değeri</InputLabel>
            <Select
              labelId="market-cap-label"
              value={filters.marketCap}
              onChange={(e) => handleInputChange('marketCap', e.target.value)}
              label="Market Değeri"
            >
              {MARKET_CAP_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item {...getGridColumns('third')}>
          <FormControl fullWidth disabled={loading}>
            <InputLabel id="volume-label">24s Hacim</InputLabel>
            <Select
              labelId="volume-label"
              value={filters.volume24h}
              onChange={(e) => handleInputChange('volume24h', e.target.value)}
              label="24s Hacim"
            >
              {VOLUME_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item {...getGridColumns('third')}>
          <FormControl fullWidth disabled={loading}>
            <InputLabel id="price-change-label">Fiyat Değişimi</InputLabel>
            <Select
              labelId="price-change-label"
              value={filters.priceChange24h}
              onChange={(e) => handleInputChange('priceChange24h', e.target.value)}
              label="Fiyat Değişimi"
            >
              {PRICE_CHANGE_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item {...getGridColumns('full')}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={loading}
              fullWidth={isMobile}
              aria-label="Filtreleri sıfırla"
            >
              Sıfırla
            </Button>
            <Button
              variant="contained"
              onClick={() => debouncedSearch(filters)}
              disabled={loading}
              fullWidth={isMobile}
              startIcon={<SearchIcon />}
              aria-label="Arama yap"
            >
              {loading ? 'Aranıyor...' : 'Ara'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

AdvancedSearch.propTypes = {
  onSearch: PropTypes.func.isRequired,
  initialFilters: PropTypes.shape({
    searchTerm: PropTypes.string,
    priceRange: PropTypes.arrayOf(PropTypes.number),
    marketCap: PropTypes.oneOf(['all', 'high', 'medium', 'low']),
    volume24h: PropTypes.oneOf(['all', 'high', 'medium', 'low']),
    priceChange24h: PropTypes.oneOf(['all', 'positive', 'negative'])
  }),
  loading: PropTypes.bool
};

export default AdvancedSearch; 