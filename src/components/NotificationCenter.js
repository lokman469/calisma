import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Badge,
  Tooltip,
  Divider,
  Chip,
  Button,
  useTheme,
  Alert,
  Collapse,
  Fade
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  DeleteSweep as ClearAllIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const NotificationCenter = ({
  notifications = [],
  onClose,
  onDelete,
  onClearAll,
  onSettingsClick,
  open = false,
  loading = false,
  error = null
}) => {
  const theme = useTheme();
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showOlder, setShowOlder] = useState(false);

  // Bildirimleri gruplara ayır
  const groupedNotifications = useMemo(() => {
    const today = new Date();
    return notifications.reduce((acc, notification) => {
      const notifDate = new Date(notification.timestamp);
      const isToday = notifDate.toDateString() === today.toDateString();
      const key = isToday ? 'today' : 'older';
      
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(notification);
      return acc;
    }, {});
  }, [notifications]);

  // Bildirim ikonu seç
  const getNotificationIcon = useCallback((type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  }, []);

  // Bildirim zamanını formatla
  const formatTime = useCallback((timestamp) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: tr
    });
  }, []);

  // Bildirim seç
  const handleNotificationClick = useCallback((notification) => {
    setSelectedNotification(
      selectedNotification?.id === notification.id ? null : notification
    );
  }, [selectedNotification]);

  // Bildirim sil
  const handleDelete = useCallback((id, event) => {
    event.stopPropagation();
    if (selectedNotification?.id === id) {
      setSelectedNotification(null);
    }
    onDelete(id);
  }, [onDelete, selectedNotification]);

  // Tüm bildirimleri temizle
  const handleClearAll = useCallback(() => {
    setSelectedNotification(null);
    onClearAll();
  }, [onClearAll]);

  // Bildirim listesini render et
  const renderNotificationList = (notificationGroup) => (
    <List>
      {notificationGroup.map((notification) => (
        <ListItem
          key={notification.id}
          button
          onClick={() => handleNotificationClick(notification)}
          selected={selectedNotification?.id === notification.id}
          sx={{
            borderRadius: 1,
            mb: 1,
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            }
          }}
        >
          <ListItemIcon>
            {getNotificationIcon(notification.type)}
          </ListItemIcon>
          <ListItemText
            primary={notification.title}
            secondary={
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  {formatTime(notification.timestamp)}
                </Typography>
                {notification.category && (
                  <Chip
                    label={notification.category}
                    size="small"
                    sx={{ height: 20 }}
                  />
                )}
              </Box>
            }
          />
          <ListItemSecondaryAction>
            <Tooltip title="Bildirimi Sil">
              <IconButton
                edge="end"
                size="small"
                onClick={(e) => handleDelete(notification.id, e)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: {
            xs: '100%',
            sm: 400
          },
          p: 2
        }
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="div">
          Bildirimler
        </Typography>
        <Box>
          <Tooltip title="Bildirim Ayarları">
            <IconButton onClick={onSettingsClick} size="small" sx={{ mr: 1 }}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Tümünü Temizle">
            <IconButton
              onClick={handleClearAll}
              size="small"
              disabled={notifications.length === 0}
              sx={{ mr: 1 }}
            >
              <ClearAllIcon />
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Empty state */}
      {notifications.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            opacity: 0.5
          }}
        >
          <NotificationsIcon sx={{ fontSize: 48, mb: 2 }} />
          <Typography>Bildirim bulunmuyor</Typography>
        </Box>
      ) : (
        <>
          {/* Today's notifications */}
          {groupedNotifications.today?.length > 0 && (
            <>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Bugün
              </Typography>
              {renderNotificationList(groupedNotifications.today)}
            </>
          )}

          {/* Older notifications */}
          {groupedNotifications.older?.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Button
                onClick={() => setShowOlder(!showOlder)}
                fullWidth
                sx={{ mb: 1 }}
              >
                {showOlder ? 'Önceki Bildirimleri Gizle' : 'Önceki Bildirimleri Göster'}
              </Button>
              <Collapse in={showOlder}>
                {renderNotificationList(groupedNotifications.older)}
              </Collapse>
            </>
          )}
        </>
      )}
    </Drawer>
  );
};

NotificationCenter.propTypes = {
  notifications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      message: PropTypes.string,
      type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
      timestamp: PropTypes.string.isRequired,
      category: PropTypes.string,
      read: PropTypes.bool
    })
  ),
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onClearAll: PropTypes.func.isRequired,
  onSettingsClick: PropTypes.func.isRequired,
  open: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.string
};

export default React.memo(NotificationCenter); 