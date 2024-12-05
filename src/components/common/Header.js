import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Box,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  ListItemIcon,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Settings,
  Logout,
  DarkMode,
  LightMode,
  Wallet,
  Security
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useThemeToggle } from '../../hooks/useThemeToggle';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationList from './NotificationList';
import SearchBar from './SearchBar';

const Header = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { toggleTheme, mode } = useThemeToggle();
  const { notifications, markAsRead } = useNotifications();
  
  // State
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  // Menü durumları
  const isMenuOpen = Boolean(anchorEl);
  const isNotificationsOpen = Boolean(notificationAnchor);

  // Okunmamış bildirim sayısı
  const unreadCount = notifications.filter(n => !n.read).length;

  // Menü işleyicileri
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
    markAsRead();
  };

  const handleNotificationsClose = () => {
    setNotificationAnchor(null);
  };

  // Çıkış işlemi
  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/auth/login');
  };

  return (
    <AppBar position="fixed" color="inherit" elevation={1}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component="div"
          sx={{ 
            display: { xs: 'none', sm: 'block' },
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >
          Kripto Borsa
        </Typography>

        <SearchBar />

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={`${mode === 'dark' ? 'Açık' : 'Koyu'} tema`}>
            <IconButton onClick={toggleTheme} color="inherit">
              {mode === 'dark' ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Bildirimler">
            <IconButton
              color="inherit"
              onClick={handleNotificationsOpen}
            >
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Hesap">
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleProfileMenuOpen}
            >
              {user?.avatar ? (
                <Avatar
                  src={user.avatar}
                  alt={user.name}
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <AccountCircle />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Profil Menüsü */}
        <Menu
          anchorEl={anchorEl}
          open={isMenuOpen}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => navigate('/profile')}>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            Profil
          </MenuItem>
          <MenuItem onClick={() => navigate('/wallet')}>
            <ListItemIcon>
              <Wallet fontSize="small" />
            </ListItemIcon>
            Cüzdan
          </MenuItem>
          <MenuItem onClick={() => navigate('/settings')}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            Ayarlar
          </MenuItem>
          <MenuItem onClick={() => navigate('/security')}>
            <ListItemIcon>
              <Security fontSize="small" />
            </ListItemIcon>
            Güvenlik
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Çıkış Yap
          </MenuItem>
        </Menu>

        {/* Bildirimler Menüsü */}
        <Menu
          anchorEl={notificationAnchor}
          open={isNotificationsOpen}
          onClose={handleNotificationsClose}
          onClick={handleNotificationsClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: { width: 360, maxHeight: 480 }
          }}
        >
          <NotificationList notifications={notifications} />
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;