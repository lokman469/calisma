import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  Box,
  Typography,
  IconButton,
  Divider,
  useTheme,
  Tooltip
} from '@mui/material';
import {
  Dashboard,
  TrendingUp,
  AccountBalance,
  SwapHoriz,
  History,
  Assessment,
  Settings,
  ExpandLess,
  ExpandMore,
  Wallet,
  CurrencyBitcoin,
  ShowChart,
  Favorite,
  Star,
  BarChart,
  ChevronLeft
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWatchlist } from '../../hooks/useWatchlist';
import MiniChart from '../chart/MiniChart';

const DRAWER_WIDTH = 260;

const Sidebar = ({ open, onClose, variant = 'permanent' }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { watchlist } = useWatchlist();

  // State
  const [menuOpen, setMenuOpen] = useState({
    markets: true,
    trading: false,
    portfolio: false
  });

  // Menü öğeleri
  const menuItems = [
    {
      title: 'Ana Sayfa',
      icon: <Dashboard />,
      path: '/'
    },
    {
      title: 'Piyasalar',
      icon: <TrendingUp />,
      items: [
        { title: 'Spot Piyasalar', icon: <CurrencyBitcoin />, path: '/markets/spot' },
        { title: 'Vadeli İşlemler', icon: <ShowChart />, path: '/markets/futures' },
        { title: 'İzleme Listesi', icon: <Star />, path: '/markets/watchlist' },
        { title: 'Piyasa Analizi', icon: <BarChart />, path: '/markets/analysis' }
      ]
    },
    {
      title: 'İşlemler',
      icon: <SwapHoriz />,
      items: [
        { title: 'Spot İşlemler', icon: <SwapHoriz />, path: '/trade/spot' },
        { title: 'Vadeli İşlemler', icon: <SwapHoriz />, path: '/trade/futures' },
        { title: 'İşlem Geçmişi', icon: <History />, path: '/trade/history' }
      ]
    },
    {
      title: 'Portföy',
      icon: <AccountBalance />,
      items: [
        { title: 'Varlıklarım', icon: <Wallet />, path: '/portfolio/assets' },
        { title: 'Performans', icon: <Assessment />, path: '/portfolio/performance' }
      ]
    }
  ];

  // Alt menü öğeleri
  const bottomMenuItems = [
    { title: 'Ayarlar', icon: <Settings />, path: '/settings' }
  ];

  // Menü açma/kapama
  const handleMenuToggle = (menu) => {
    setMenuOpen(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  // Aktif menü kontrolü
  const isActive = (path) => {
    return location.pathname === path;
  };

  const drawerContent = (
    <>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2
      }}>
        <Typography variant="h6" noWrap>
          Kripto Borsa
        </Typography>
        {variant === 'temporary' && (
          <IconButton onClick={onClose}>
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      <Divider />

      <List component="nav">
        {menuItems.map((item) => (
          item.items ? (
            <React.Fragment key={item.title}>
              <ListItemButton onClick={() => handleMenuToggle(item.title.toLowerCase())}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.title} />
                {menuOpen[item.title.toLowerCase()] ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={menuOpen[item.title.toLowerCase()]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.items.map((subItem) => (
                    <ListItemButton
                      key={subItem.title}
                      sx={{ pl: 4 }}
                      selected={isActive(subItem.path)}
                      onClick={() => navigate(subItem.path)}
                    >
                      <ListItemIcon>{subItem.icon}</ListItemIcon>
                      <ListItemText primary={subItem.title} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ) : (
            <ListItemButton
              key={item.title}
              selected={isActive(item.path)}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} />
            </ListItemButton>
          )
        ))}
      </List>

      <Divider />

      {/* İzleme Listesi */}
      {watchlist.length > 0 && (
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            İzleme Listesi
          </Typography>
          <List dense>
            {watchlist.slice(0, 5).map((coin) => (
              <ListItem
                key={coin.symbol}
                disablePadding
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    size="small"
                    onClick={() => {/* Favorilerden kaldır */}}
                  >
                    <Favorite fontSize="small" color="error" />
                  </IconButton>
                }
              >
                <ListItemButton onClick={() => navigate(`/markets/${coin.symbol}`)}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{coin.symbol}</Typography>
                      <Typography 
                        variant="body2" 
                        color={coin.priceChange >= 0 ? 'success.main' : 'error.main'}
                      >
                        ${coin.price.toLocaleString()}
                      </Typography>
                    </Box>
                    <MiniChart data={coin.chartData} height={30} showPrice={false} showChange={false} />
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Box sx={{ mt: 'auto' }}>
        <Divider />
        <List>
          {bottomMenuItems.map((item) => (
            <ListItemButton
              key={item.title}
              selected={isActive(item.path)}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar; 