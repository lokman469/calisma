import React, { useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress,
  useTheme,
  Fade,
  Backdrop,
  Snackbar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  List as ListIcon,
  Timeline as ChartIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

import WatchlistGrid from './WatchlistGrid';
import WatchlistStats from './WatchlistStats';
import WatchlistToolbar from './WatchlistToolbar';
import WatchlistDialog from './WatchlistDialog';
import WatchlistSkeleton from './WatchlistSkeleton';
import { useWatchlistData } from '../hooks/useWatchlistData';
import { useMarketData } from '../hooks/useMarketData';

const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list'
};

const TAB_VIEWS = {
  DASHBOARD: 0,
  LIST: 1,
  CHARTS: 2,
  SETTINGS: 3
};

const WatchlistView = ({
  userId,
  onError,
  initialView = TAB_VIEWS.DASHBOARD
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(initialView);
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWatchlist, setSelectedWatchlist] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Custom hooks
  const {
    watchlists,
    loading: watchlistsLoading,
    error: watchlistsError,
    refresh: refreshWatchlists,
    createWatchlist,
    updateWatchlist,
    deleteWatchlist
  } = useWatchlistData(userId);

  const {
    marketData,
    loading: marketDataLoading,
    error: marketDataError,
    refresh: refreshMarketData
  } = useMarketData();

  // Hataları yönet
  useEffect(() => {
    const error = watchlistsError || marketDataError;
    if (error) {
      onError?.(error);
      showSnackbar(error, 'error');
    }
  }, [watchlistsError, marketDataError, onError]);

  // Filtrelenmiş ve sıralanmış watchlist'ler
  const filteredWatchlists = useMemo(() => {
    if (!watchlists) return [];

    let result = [...watchlists];

    // Arama filtresi
    if (searchTerm) {
      result = result.filter(list =>
        list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        list.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Kategori filtresi
    switch (filterBy) {
      case 'favorites':
        result = result.filter(list => list.favorite);
        break;
      case 'public':
        result = result.filter(list => list.isPublic);
        break;
      case 'private':
        result = result.filter(list => !list.isPublic);
        break;
    }

    // Sıralama
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.lastModified) - new Date(a.lastModified);
        case 'coins':
          return b.coins.length - a.coins.length;
        case 'value':
          return calculateTotalValue(b) - calculateTotalValue(a);
        case 'change':
          return calculateTotalChange(b) - calculateTotalChange(a);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [watchlists, searchTerm, filterBy, sortBy, marketData]);

  // Toplam değer hesaplama
  const calculateTotalValue = useCallback((watchlist) => {
    if (!marketData) return 0;
    return watchlist.coins.reduce((total, coin) => {
      const price = marketData[coin.id]?.current_price || 0;
      return total + (coin.amount * price);
    }, 0);
  }, [marketData]);

  // Toplam değişim hesaplama
  const calculateTotalChange = useCallback((watchlist) => {
    if (!marketData) return 0;
    return watchlist.coins.reduce((total, coin) => {
      const change = marketData[coin.id]?.price_change_percentage_24h || 0;
      return total + change;
    }, 0) / watchlist.coins.length;
  }, [marketData]);

  // Snackbar göster
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Dialog işlemleri
  const handleCreateList = useCallback(() => {
    setSelectedWatchlist(null);
    setDialogOpen(true);
  }, []);

  const handleEditList = useCallback((watchlist) => {
    setSelectedWatchlist(watchlist);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setSelectedWatchlist(null);
  }, []);

  const handleDialogSave = useCallback(async (data) => {
    try {
      if (selectedWatchlist) {
        await updateWatchlist(selectedWatchlist.id, data);
        showSnackbar('İzleme listesi güncellendi');
      } else {
        await createWatchlist(data);
        showSnackbar('İzleme listesi oluşturuldu');
      }
      handleDialogClose();
      refreshWatchlists();
    } catch (error) {
      showSnackbar(error.message, 'error');
    }
  }, [selectedWatchlist, updateWatchlist, createWatchlist, refreshWatchlists]);

  // Yenileme işlemi
  const handleRefresh = useCallback(() => {
    refreshWatchlists();
    refreshMarketData();
  }, [refreshWatchlists, refreshMarketData]);

  const loading = watchlistsLoading || marketDataLoading;

  return (
    <Container maxWidth="xl">
      {/* Tabs */}
      <Paper 
        sx={{ 
          mb: 3,
          borderRadius: 2,
          overflow: 'hidden'
        }}
        elevation={2}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<DashboardIcon />} label="Dashboard" />
          <Tab icon={<ListIcon />} label="Listeler" />
          <Tab icon={<ChartIcon />} label="Grafikler" />
          <Tab icon={<SettingsIcon />} label="Ayarlar" />
        </Tabs>
      </Paper>

      {/* Toolbar */}
      <WatchlistToolbar
        onCreateList={handleCreateList}
        onViewModeChange={setViewMode}
        onSortChange={setSortBy}
        onFilterChange={setFilterBy}
        onSearch={setSearchTerm}
        onRefresh={handleRefresh}
        viewMode={viewMode}
        sortBy={sortBy}
        filterBy={filterBy}
        searchTerm={searchTerm}
        loading={loading}
        activeFiltersCount={filterBy !== 'all' ? 1 : 0}
      />

      {/* Content */}
      <Fade in={!loading} timeout={300}>
        <Box>
          {activeTab === TAB_VIEWS.DASHBOARD && (
            <WatchlistStats
              watchlist={selectedWatchlist}
              marketData={marketData}
              onRefresh={handleRefresh}
              loading={loading}
              error={watchlistsError || marketDataError}
            />
          )}

          {activeTab === TAB_VIEWS.LIST && (
            loading ? (
              <WatchlistSkeleton
                count={6}
                viewMode={viewMode}
                spacing={3}
              />
            ) : (
              <WatchlistGrid
                watchlists={filteredWatchlists}
                onCreateList={handleCreateList}
                onEditList={handleEditList}
                onDeleteList={deleteWatchlist}
                loading={loading}
                error={watchlistsError || marketDataError}
                viewMode={viewMode}
              />
            )
          )}
        </Box>
      </Fade>

      {/* Dialog */}
      <WatchlistDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSave={handleDialogSave}
        initialData={selectedWatchlist}
        loading={loading}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ 
          color: '#fff',
          zIndex: theme.zIndex.drawer + 1
        }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Container>
  );
};

WatchlistView.propTypes = {
  userId: PropTypes.string.isRequired,
  onError: PropTypes.func,
  initialView: PropTypes.number
};

export default React.memo(WatchlistView); 