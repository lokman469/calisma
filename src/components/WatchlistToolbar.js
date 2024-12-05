import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Badge,
  useTheme,
  InputAdornment,
  Fade,
  Paper,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Search as SearchIcon,
  ImportExport as ImportIcon,
  CloudUpload as ExportIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const SORT_OPTIONS = [
  { value: 'name', label: 'İsim', icon: SortIcon },
  { value: 'date', label: 'Tarih', icon: SortIcon },
  { value: 'coins', label: 'Coin Sayısı', icon: SortIcon },
  { value: 'value', label: 'Toplam Değer', icon: SortIcon },
  { value: 'change', label: 'Değişim', icon: SortIcon }
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'favorites', label: 'Favoriler' },
  { value: 'public', label: 'Herkese Açık' },
  { value: 'private', label: 'Özel' }
];

const WatchlistToolbar = ({
  onCreateList,
  onImport,
  onExport,
  onViewModeChange,
  onSortChange,
  onFilterChange,
  onSearch,
  onRefresh,
  viewMode = 'grid',
  sortBy = 'name',
  filterBy = 'all',
  searchTerm = '',
  loading = false,
  activeFiltersCount = 0
}) => {
  const theme = useTheme();
  const [sortAnchor, setSortAnchor] = useState(null);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [moreAnchor, setMoreAnchor] = useState(null);

  // Sıralama menüsü
  const handleSortClick = useCallback((event) => {
    setSortAnchor(event.currentTarget);
  }, []);

  const handleSortClose = useCallback(() => {
    setSortAnchor(null);
  }, []);

  // Filtreleme menüsü
  const handleFilterClick = useCallback((event) => {
    setFilterAnchor(event.currentTarget);
  }, []);

  const handleFilterClose = useCallback(() => {
    setFilterAnchor(null);
  }, []);

  // Diğer işlemler menüsü
  const handleMoreClick = useCallback((event) => {
    setMoreAnchor(event.currentTarget);
  }, []);

  const handleMoreClose = useCallback(() => {
    setMoreAnchor(null);
  }, []);

  // Arama
  const handleSearchChange = useCallback((event) => {
    onSearch(event.target.value);
  }, [onSearch]);

  const handleSearchClear = useCallback(() => {
    onSearch('');
  }, [onSearch]);

  return (
    <Paper 
      elevation={2}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 2,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        alignItems: 'center'
      }}
    >
      {/* Ana Butonlar */}
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreateList}
        disabled={loading}
      >
        Yeni Liste
      </Button>

      <Button
        variant="outlined"
        startIcon={<ImportIcon />}
        onClick={onImport}
        disabled={loading}
      >
        İçe Aktar
      </Button>

      {/* Arama */}
      <TextField
        placeholder="Liste Ara..."
        size="small"
        value={searchTerm}
        onChange={handleSearchChange}
        disabled={loading}
        sx={{ flex: 1, minWidth: 200 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleSearchClear}
                disabled={loading}
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
      />

      {/* Görünüm Değiştirme */}
      <Tooltip title={viewMode === 'grid' ? 'Liste Görünümü' : 'Grid Görünümü'}>
        <IconButton
          onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
          disabled={loading}
          color={viewMode === 'grid' ? 'primary' : 'default'}
        >
          {viewMode === 'grid' ? <ListViewIcon /> : <GridViewIcon />}
        </IconButton>
      </Tooltip>

      {/* Filtreleme */}
      <Tooltip title="Filtrele">
        <IconButton
          onClick={handleFilterClick}
          disabled={loading}
          color={activeFiltersCount > 0 ? 'primary' : 'default'}
        >
          <Badge badgeContent={activeFiltersCount} color="primary">
            <FilterIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Sıralama */}
      <Tooltip title="Sırala">
        <IconButton
          onClick={handleSortClick}
          disabled={loading}
        >
          <SortIcon />
        </IconButton>
      </Tooltip>

      {/* Yenile */}
      <Tooltip title="Yenile">
        <IconButton
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshIcon />
        </IconButton>
      </Tooltip>

      {/* Sıralama Menüsü */}
      <Menu
        anchorEl={sortAnchor}
        open={Boolean(sortAnchor)}
        onClose={handleSortClose}
        TransitionComponent={Fade}
      >
        {SORT_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => {
              onSortChange(option.value);
              handleSortClose();
            }}
            selected={sortBy === option.value}
          >
            <ListItemIcon>
              <option.icon 
                color={sortBy === option.value ? 'primary' : 'inherit'}
              />
            </ListItemIcon>
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Menu>

      {/* Filtreleme Menüsü */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={handleFilterClose}
        TransitionComponent={Fade}
      >
        {FILTER_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => {
              onFilterChange(option.value);
              handleFilterClose();
            }}
            selected={filterBy === option.value}
          >
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
};

WatchlistToolbar.propTypes = {
  onCreateList: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onViewModeChange: PropTypes.func.isRequired,
  onSortChange: PropTypes.func.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  viewMode: PropTypes.oneOf(['grid', 'list']),
  sortBy: PropTypes.string,
  filterBy: PropTypes.string,
  searchTerm: PropTypes.string,
  loading: PropTypes.bool,
  activeFiltersCount: PropTypes.number
};

export default React.memo(WatchlistToolbar); 