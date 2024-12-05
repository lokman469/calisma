import React, { useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
  useTheme,
  Fade,
  Collapse,
  Grid,
  Divider,
  Badge,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const SORT_OPTIONS = [
  { value: 'name', label: 'İsim' },
  { value: 'date', label: 'Tarih' },
  { value: 'status', label: 'Durum' },
  { value: 'priority', label: 'Öncelik' }
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktif', color: 'success' },
  { value: 'pending', label: 'Beklemede', color: 'warning' },
  { value: 'inactive', label: 'Pasif', color: 'error' }
];

const PRIORITY_LEVELS = [
  { value: 'high', label: 'Yüksek', color: 'error' },
  { value: 'medium', label: 'Orta', color: 'warning' },
  { value: 'low', label: 'Düşük', color: 'info' }
];

const YourComponent = ({
  data,
  onSave,
  onDelete,
  onRefresh,
  loading = false,
  error = null,
  settings = {},
  onSettingsChange
}) => {
  const theme = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    priority: 'medium',
    tags: [],
    settings: {}
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form verilerini yükle
  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  // Form değişikliklerini yönet
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Filtrelenmiş ve sıralanmış veri
  const filteredData = useMemo(() => {
    if (!data) return [];

    let result = [...data];

    // Arama filtresi
    if (searchTerm) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Durum filtresi
    if (filterStatus !== 'all') {
      result = result.filter(item => item.status === filterStatus);
    }

    // Sıralama
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date) - new Date(a.date);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'priority':
          return PRIORITY_LEVELS.findIndex(p => p.value === a.priority) -
                 PRIORITY_LEVELS.findIndex(p => p.value === b.priority);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [data, searchTerm, filterStatus, sortBy]);

  // Form gönderimi
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      await onSave(formData);
      setEditMode(false);
    } catch (err) {
      console.error('Kayıt hatası:', err);
    }
  }, [formData, onSave]);

  return (
    <Box>
      {/* Toolbar */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}
      >
        <TextField
          placeholder="Ara..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading}
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            endAdornment: searchTerm && (
              <IconButton
                size="small"
                onClick={() => setSearchTerm('')}
              >
                <CloseIcon />
              </IconButton>
            )
          }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Durum</InputLabel>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            label="Durum"
            disabled={loading}
          >
            <MenuItem value="all">Tümü</MenuItem>
            {STATUS_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    size="small"
                    label={option.label}
                    color={option.color}
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sırala</InputLabel>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            label="Sırala"
            disabled={loading}
          >
            {SORT_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Gelişmiş Ayarlar">
          <IconButton
            onClick={() => setShowAdvanced(!showAdvanced)}
            color={showAdvanced ? 'primary' : 'default'}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Yenile">
          <IconButton
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Ana İçerik */}
      <Grid container spacing={3}>
        {/* Form */}
        <Grid item xs={12} md={showAdvanced ? 8 : 12}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 2
            }}
          >
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 3 }}
                action={
                  <IconButton
                    color="inherit"
                    size="small"
                    onClick={onRefresh}
                  >
                    <RefreshIcon />
                  </IconButton>
                }
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="İsim"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={!editMode || loading}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Açıklama"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    disabled={!editMode || loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Durum</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      label="Durum"
                      disabled={!editMode || loading}
                    >
                      {STATUS_OPTIONS.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          <Chip
                            size="small"
                            label={option.label}
                            color={option.color}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Öncelik</InputLabel>
                    <Select
                      value={formData.priority}
                      onChange={(e) => handleChange('priority', e.target.value)}
                      label="Öncelik"
                      disabled={!editMode || loading}
                    >
                      {PRIORITY_LEVELS.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          <Chip
                            size="small"
                            label={option.label}
                            color={option.color}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                {!editMode ? (
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => setEditMode(true)}
                    disabled={loading}
                  >
                    Düzenle
                  </Button>
                ) : (
                  <>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={loading}
                    >
                      Kaydet
                    </Button>
                    <Button
                      startIcon={<CancelIcon />}
                      onClick={() => {
                        setEditMode(false);
                        setFormData(data);
                      }}
                      disabled={loading}
                    >
                      İptal
                    </Button>
                  </>
                )}

                {onDelete && (
                  <Button
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={onDelete}
                    disabled={loading}
                  >
                    Sil
                  </Button>
                )}
              </Box>
            </form>
          </Paper>
        </Grid>

        {/* Ayarlar Paneli */}
        <Collapse in={showAdvanced} orientation="horizontal">
          <Grid item xs={12} md={4}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 2,
                height: '100%'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Gelişmiş Ayarlar
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              {Object.entries(settings).map(([key, value]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Switch
                      checked={value}
                      onChange={(e) => onSettingsChange(key, e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label={key}
                  sx={{ display: 'block', mb: 2 }}
                />
              ))}
            </Paper>
          </Grid>
        </Collapse>
      </Grid>

      {/* Loading Overlay */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 1000
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

YourComponent.propTypes = {
  data: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.oneOf(['active', 'pending', 'inactive']),
    priority: PropTypes.oneOf(['high', 'medium', 'low']),
    tags: PropTypes.arrayOf(PropTypes.string),
    settings: PropTypes.object
  }),
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onRefresh: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  settings: PropTypes.object,
  onSettingsChange: PropTypes.func
};

export default React.memo(YourComponent); 