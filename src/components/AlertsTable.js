import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  Box,
  Typography,
  TablePagination,
  useTheme,
  TableSortLabel,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';
import { formatDate, sanitizeText } from '../utils/formatters';

// Sabitler
const TABLE_HEADERS = [
  { id: 'exchange', label: 'Borsa', sortable: true },
  { id: 'symbol', label: 'Sembol', sortable: true },
  { id: 'targetPrice', label: 'Hedef Fiyat', sortable: true },
  { id: 'condition', label: 'Koşul', sortable: false },
  { id: 'status', label: 'Durum', sortable: true },
  { id: 'createdAt', label: 'Oluşturulma', sortable: true },
  { id: 'notifications', label: 'Bildirimler', sortable: false },
  { id: 'note', label: 'Not', sortable: false },
  { id: 'actions', label: 'İşlemler', sortable: false }
];

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

function AlertsTable({ 
  alerts = [], 
  onDelete, 
  onEdit, 
  onToggle,
  loading = false,
  error = null 
}) {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // Sıralama ve sayfalama ile filtrelenmiş verileri memoize et
  const sortedAndPaginatedAlerts = useMemo(() => {
    const sortedAlerts = [...alerts].sort((a, b) => {
      if (orderBy === 'targetPrice') {
        return order === 'asc' ? a[orderBy] - b[orderBy] : b[orderBy] - a[orderBy];
      }
      return order === 'asc'
        ? String(a[orderBy]).localeCompare(String(b[orderBy]))
        : String(b[orderBy]).localeCompare(String(a[orderBy]));
    });

    return sortedAlerts.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [alerts, order, orderBy, page, rowsPerPage]);

  // Event handlers
  const handleChangePage = useCallback((_, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleSort = useCallback((property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  }, [order, orderBy]);

  // Durum rengini belirle
  const getStatusColor = useCallback((alert) => {
    if (!alert.isActive) return 'default';
    if (alert.type === 'stop_loss') return 'error';
    if (alert.type === 'take_profit') return 'success';
    return 'primary';
  }, []);

  // Loading skeletons
  const renderSkeletons = () => (
    Array(rowsPerPage).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        {TABLE_HEADERS.map((header, cellIndex) => (
          <TableCell key={`cell-${cellIndex}`}>
            <Skeleton animation="wave" />
          </TableCell>
        ))}
      </TableRow>
    ))
  );

  if (error) {
    return (
      <Alert 
        severity="error"
        icon={<ErrorIcon />}
        sx={{ mb: 2 }}
      >
        {error}
      </Alert>
    );
  }

  return (
    <>
      <TableContainer 
        component={Paper} 
        sx={{ 
          maxWidth: '100%',
          overflowX: 'auto',
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.shadows[3]
        }}
      >
        <Table aria-label="Fiyat alarmları tablosu">
          <TableHead>
            <TableRow>
              {TABLE_HEADERS.map((header) => (
                <TableCell
                  key={header.id}
                  sortDirection={orderBy === header.id ? order : false}
                >
                  {header.sortable ? (
                    <TableSortLabel
                      active={orderBy === header.id}
                      direction={orderBy === header.id ? order : 'asc'}
                      onClick={() => handleSort(header.id)}
                    >
                      {header.label}
                    </TableSortLabel>
                  ) : (
                    header.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              renderSkeletons()
            ) : sortedAndPaginatedAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={TABLE_HEADERS.length} align="center">
                  <Typography color="textSecondary">
                    Alarm bulunamadı
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedAndPaginatedAlerts.map((alert) => (
                <TableRow 
                  key={alert.id}
                  hover
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    backgroundColor: !alert.isActive ? 'action.hover' : 'inherit'
                  }}
                >
                  <TableCell>{alert.exchange}</TableCell>
                  <TableCell>{alert.symbol}</TableCell>
                  <TableCell>${alert.targetPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={alert.condition === 'above' ? 'Üstünde' : 'Altında'}
                      size="small"
                      color={alert.condition === 'above' ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={alert.isActive ? 'Aktif' : 'Pasif'}
                      color={getStatusColor(alert)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(alert.createdAt)}</TableCell>
                  <TableCell>
                    <Box sx={styles.notificationIcons}>
                      {alert.notifications.desktop && (
                        <Tooltip title="Masaüstü bildirimleri aktif">
                          <NotificationsIcon color="primary" fontSize="small" />
                        </Tooltip>
                      )}
                      {!alert.notifications.desktop && !alert.notifications.sound && (
                        <Tooltip title="Bildirimler kapalı">
                          <NotificationsOffIcon color="disabled" fontSize="small" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{sanitizeText(alert.note)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Düzenle">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(alert)}
                          disabled={!alert.isActive}
                          aria-label={`${alert.symbol} alarmını düzenle`}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton
                          size="small"
                          onClick={() => onDelete(alert.id)}
                          color="error"
                          aria-label={`${alert.symbol} alarmını sil`}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        component="div"
        count={alerts.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Sayfa başına satır:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} / ${count}`}
      />
    </>
  );
}

AlertsTable.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      exchange: PropTypes.string.isRequired,
      symbol: PropTypes.string.isRequired,
      targetPrice: PropTypes.number.isRequired,
      condition: PropTypes.oneOf(['above', 'below']).isRequired,
      isActive: PropTypes.bool.isRequired,
      type: PropTypes.oneOf(['stop_loss', 'take_profit', 'price_alert']),
      notifications: PropTypes.shape({
        desktop: PropTypes.bool.isRequired,
        sound: PropTypes.bool.isRequired,
      }).isRequired,
      note: PropTypes.string,
      createdAt: PropTypes.string.isRequired,
    })
  ).isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string
};

const styles = {
  notificationIcons: {
    display: 'flex',
    gap: 1
  }
};

export default React.memo(AlertsTable); 