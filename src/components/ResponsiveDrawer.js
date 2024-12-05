import { useState } from 'react';
import {
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Box,
  Divider
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';

const menuItems = [
  { text: 'Ana Sayfa', icon: <HomeIcon />, path: '/' },
  { text: 'Portfolyo', icon: <AccountBalanceWalletIcon />, path: '/portfolio' },
  { text: 'Fiyat Alarmları', icon: <NotificationsIcon />, path: '/alerts' },
  { text: 'Teknik Analiz', icon: <ShowChartIcon />, path: '/technical' },
  { text: 'Arbitraj', icon: <CompareArrowsIcon />, path: '/arbitrage' },
  { text: 'Sosyal', icon: <PeopleIcon />, path: '/social' },
  { text: 'Market Derinliği', icon: <BarChartIcon />, path: '/depth' },
  { text: 'İşlem Geçmişi', icon: <HistoryIcon />, path: '/history' },
  { text: 'Raporlar', icon: <AssessmentIcon />, path: '/reports' }
];

const bottomMenuItems = [
  { text: 'Profil', icon: <PersonIcon />, path: '/profile' },
  { text: 'Ayarlar', icon: <SettingsIcon />, path: '/settings' }
];

function ResponsiveDrawer() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <List>
        {bottomMenuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
      )}
      <Box
        component="nav"
        sx={{ width: { md: 240 }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true // Mobil performansı için
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: 240,
              boxSizing: 'border-box',
              border: 'none',
              backgroundColor: theme.palette.background.default
            }
          }}
        >
          {drawer}
        </Drawer>
      </Box>
    </>
  );
}

export default ResponsiveDrawer; 