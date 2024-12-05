import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Avatar,
  Typography,
  Box,
  IconButton,
  Divider,
  Badge,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  NotificationsActive,
  AccountBalance,
  Security,
  SwapHoriz,
  TrendingUp,
  Warning,
  Check,
  Delete,
  Circle
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNotifications } from '../../hooks/useNotifications';

// Bildirim tipleri
const NOTIFICATION_TYPES = {
  TRANSACTION: 'transaction',
  SECURITY: 'security',
  ACCOUNT: 'account',
  MARKET: 'market',
  SYSTEM: 'system'
};

// Bildirim ikonları
const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPES.TRANSACTION]: <SwapHoriz />,
  [NOTIFICATION_TYPES.SECURITY]: <Security />,
  [NOTIFICATION_TYPES.ACCOUNT]: <AccountBalance />,
  [NOTIFICATION_TYPES.MARKET]: <TrendingUp />,
  [NOTIFICATION_TYPES.SYSTEM]: <NotificationsActive />
};

// Bildirim renkleri
const NOTIFICATION_COLORS = {
  [NOTIFICATION_TYPES.TRANSACTION]: 'primary',
  [NOTIFICATION_TYPES.SECURITY]: 'error',
  [NOTIFICATION_TYPES.ACCOUNT]: 'success',
  [NOTIFICATION_TYPES.MARKET]: 'warning',
  [NOTIFICATION_TYPES.SYSTEM]: 'info'
};

const NotificationList = () => {
  const theme = useTheme();
  const { 
    notifications,
    markAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotifications();

  // Bildirimi okundu olarak işaretle
  const handleMarkAsRead = (id) => {
    markAsRead(id);
  };

  // Bildirimi sil
  const handleDelete = (id, event) => {
    event.stopPropagation();
    deleteNotification(id);
  };

  // Tüm bildirimleri temizle
  const handleClearAll = () => {
    clearAllNotifications();
  };

  if (!notifications.length) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <NotificationsActive 
          sx={{ 
            fontSize: 48, 
            color: 'text.secondary',
            mb: 2
          }} 
        />
        <Typography color="text.secondary">
          Bildiriminiz bulunmuyor
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant="h6">
          Bildirimler
        </Typography>
        <Tooltip title="Tümünü temizle">
          <IconButton onClick={handleClearAll} size="small">
            <Delete />
          </IconButton>
        </Tooltip>
      </Box>

      <List sx={{ p: 0 }}>
        {notifications.map((notification, index) => (
          <React.Fragment key={notification.id}>
            <ListItemButton
              onClick={() => handleMarkAsRead(notification.id)}
              sx={{
                backgroundColor: notification.read ? 'transparent' : 'action.hover',
                '&:hover': {
                  backgroundColor: 'action.selected'
                }
              }}
            >
              <ListItemAvatar>
                <Badge
                  variant="dot"
                  color={NOTIFICATION_COLORS[notification.type]}
                  invisible={notification.read}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: `${NOTIFICATION_COLORS[notification.type]}.light`
                    }}
                  >
                    {NOTIFICATION_ICONS[notification.type]}
                  </Avatar>
                </Badge>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Box sx={{ pr: 6 }}>
                    <Typography
                      variant="subtitle2"
                      component="span"
                      color={notification.read ? 'text.primary' : 'text.primary'}
                      sx={{ fontWeight: notification.read ? 400 : 500 }}
                    >
                      {notification.title}
                    </Typography>
                  </Box>
                }
                secondary={
                  <>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ my: 0.5 }}
                    >
                      {notification.message}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="span"
                    >
                      {formatDistanceToNow(new Date(notification.timestamp), {
                        addSuffix: true,
                        locale: tr
                      })}
                    </Typography>
                  </>
                }
              />

              <Box sx={{ ml: 2 }}>
                <Tooltip title="Sil">
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => handleDelete(notification.id, e)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItemButton>
            {index < notifications.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>

      {notifications.length > 0 && (
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'center',
            borderTop: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer' }}
            onClick={() => {/* Tüm bildirimleri görüntüle */}}
          >
            Tüm bildirimleri görüntüle
          </Typography>
        </Box>
      )}
    </>
  );
};

export default NotificationList; 