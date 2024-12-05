import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  useTheme,
  Fade,
  Zoom,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Search as SearchIcon,
  PlaylistAdd as ImportIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import WatchlistCard from './WatchlistCard';

const SORT_OPTIONS = [
  { value: 'name', label: 'İsim' },
  { value: 'coinsCount', label: 'Coin Sayısı' },
  { value: 'lastModified', label: 'Son Güncelleme' },
  { value: 'favorite', label: 'Favoriler' }
];

const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list'
};

const WatchlistGrid = ({
  watchlists = [],
  onCreateList,
  onEditList,
  onDeleteList,
  onCoinSelect,
  onSetAlert,
  onShare,
  onToggleFavorite,
  onImport,
  loading = false,
  error = null,
  emptyMessage = 'Henüz izleme listesi oluşturmadınız'
}) => {
  const theme = useTheme();
  const [viewMode, setViewMode] = React.useState(VIEW_MODES.GRID);
  const [sortBy, setSortBy] = React.useState('name');
  const [sortDirection, setSortDirection] = React.useState('asc');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);

  // Listeleri sırala ve filtrele
  const filteredAndSortedWatchlists = useMemo(() => {
    let result = [...watchlists];

    // Arama filtresi
    if (searchTerm) {
      result = result.filter(list => 
        list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        list.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sıralama
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'coinsCount':
          comparison = a.coins.length - b.coins.length;
          break;
        case 'lastModified':
          comparison = new Date(b.lastModified) - new Date(a.lastModified);
          break;
        case 'favorite':
          comparison = (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [watchlists, searchTerm, sortBy, sortDirection]);

  // Sıralama değiştir
  const handleSortChange = useCallback((value) => {
    if (sortBy === value) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(value);
      setSortDirection('asc');
    }
  }, [sortBy]);

  // Sürükle & Bırak
  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const items = Array.from(watchlists);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Yeni sıralamayı kaydet
    // onReorder(items);
  }, [watchlists]);

  return (
    <Box>
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap'
        }}
      >
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

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Görünüm Değiştir">
          <IconButton
            onClick={() => setViewMode(prev => 
              prev === VIEW_MODES.GRID ? VIEW_MODES.LIST : VIEW_MODES.GRID
            )}
            disabled={loading}
          >
            {viewMode === VIEW_MODES.GRID ? <ListViewIcon /> : <GridViewIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Filtrele">
          <IconButton
            onClick={() => setShowFilters(prev => !prev)}
            disabled={loading}
          >
            <FilterIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Sırala">
          <IconButton
            onClick={() => handleSortChange(sortBy)}
            disabled={loading}
          >
            <SortIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!loading && watchlists.length === 0 && (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: theme.palette.background.default
          }}
        >
          <Typography color="textSecondary" gutterBottom>
            {emptyMessage}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateList}
            sx={{ mt: 2 }}
          >
            İlk Listeni Oluştur
          </Button>
        </Paper>
      )}

      {/* Watchlist Grid */}
      {!loading && watchlists.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="watchlists" direction={viewMode === VIEW_MODES.GRID ? 'horizontal' : 'vertical'}>
            {(provided) => (
              <Grid
                container
                spacing={3}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {filteredAndSortedWatchlists.map((watchlist, index) => (
                  <Draggable
                    key={watchlist.id}
                    draggableId={watchlist.id}
                    index={index}
                  >
                    {(provided) => (
                      <Grid
                        item
                        xs={12}
                        md={viewMode === VIEW_MODES.GRID ? 6 : 12}
                        lg={viewMode === VIEW_MODES.GRID ? 4 : 12}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <Zoom in timeout={300} style={{ transitionDelay: `${index * 100}ms` }}>
                          <div>
                            <WatchlistCard
                              title={watchlist.name}
                              coins={watchlist.coins}
                              onDelete={() => onDeleteList(watchlist.id)}
                              onEdit={() => onEditList(watchlist)}
                              onCoinSelect={onCoinSelect}
                              onSetAlert={onSetAlert}
                              onShare={() => onShare(watchlist)}
                              favorite={watchlist.favorite}
                              onToggleFavorite={() => onToggleFavorite(watchlist.id)}
                            />
                          </div>
                        </Zoom>
                      </Grid>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Grid>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </Box>
  );
};

WatchlistGrid.propTypes = {
  watchlists: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      coins: PropTypes.array.isRequired,
      favorite: PropTypes.bool,
      lastModified: PropTypes.string
    })
  ),
  onCreateList: PropTypes.func.isRequired,
  onEditList: PropTypes.func.isRequired,
  onDeleteList: PropTypes.func.isRequired,
  onCoinSelect: PropTypes.func.isRequired,
  onSetAlert: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  emptyMessage: PropTypes.string
};

export default React.memo(WatchlistGrid); 