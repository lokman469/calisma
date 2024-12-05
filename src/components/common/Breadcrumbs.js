import React, { useMemo } from 'react';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  Box,
  Skeleton,
  IconButton,
  Menu,
  MenuItem,
  useTheme
} from '@mui/material';
import {
  NavigateNext,
  Home,
  MoreHoriz,
  KeyboardArrowDown
} from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const Breadcrumbs = ({
  items,
  loading = false,
  maxItems = 4,
  showHome = true,
  separator = <NavigateNext fontSize="small" />,
  onItemClick,
  sx = {}
}) => {
  const theme = useTheme();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);

  // Menü durumu
  const open = Boolean(anchorEl);
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // Breadcrumb öğelerini hazırla
  const breadcrumbItems = useMemo(() => {
    let allItems = [];

    // Ana sayfa öğesi
    if (showHome) {
      allItems.push({
        title: 'Ana Sayfa',
        path: '/',
        icon: <Home fontSize="small" />
      });
    }

    // Özel öğeler
    if (items) {
      allItems = [...allItems, ...items];
    }
    // Veya mevcut yoldan otomatik oluştur
    else {
      const paths = location.pathname.split('/').filter(Boolean);
      allItems = [
        ...allItems,
        ...paths.map((path, index) => ({
          title: path.charAt(0).toUpperCase() + path.slice(1),
          path: '/' + paths.slice(0, index + 1).join('/')
        }))
      ];
    }

    return allItems;
  }, [items, location.pathname, showHome]);

  // Görünür ve gizli öğeleri ayır
  const visibleItems = breadcrumbItems.slice(-maxItems);
  const hiddenItems = breadcrumbItems.slice(0, -maxItems);

  // Loading durumu
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
        {[...Array(3)].map((_, index) => (
          <React.Fragment key={index}>
            <Skeleton width={100} height={24} />
            {index < 2 && (
              <Box sx={{ mx: 1 }}>
                <NavigateNext fontSize="small" color="disabled" />
              </Box>
            )}
          </React.Fragment>
        ))}
      </Box>
    );
  }

  return (
    <MuiBreadcrumbs
      separator={separator}
      sx={{
        '& .MuiBreadcrumbs-separator': {
          mx: 1
        },
        ...sx
      }}
    >
      {/* Gizli öğeler için menü */}
      {hiddenItems.length > 0 && (
        <>
          <IconButton
            size="small"
            onClick={handleClick}
            sx={{
              '&:hover': {
                backgroundColor: theme.palette.action.hover
              }
            }}
          >
            <MoreHoriz fontSize="small" />
            <KeyboardArrowDown fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              dense: true
            }}
          >
            {hiddenItems.map((item, index) => (
              <MenuItem
                key={index}
                component={RouterLink}
                to={item.path}
                onClick={() => {
                  handleClose();
                  onItemClick?.(item);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {item.icon}
                <Typography variant="body2">
                  {item.title}
                </Typography>
              </MenuItem>
            ))}
          </Menu>
        </>
      )}

      {/* Görünür öğeler */}
      {visibleItems.map((item, index) => {
        const isLast = index === visibleItems.length - 1;

        return isLast ? (
          <Typography
            key={index}
            color="text.primary"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontWeight: 500
            }}
          >
            {item.icon}
            {item.title}
          </Typography>
        ) : (
          <Link
            key={index}
            component={RouterLink}
            to={item.path}
            color="inherit"
            onClick={() => onItemClick?.(item)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            {item.icon}
            {item.title}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
};

// Kullanım örnekleri:
/*
// Otomatik yol tabanlı
<Breadcrumbs />

// Özel öğeler ile
<Breadcrumbs
  items={[
    { title: 'Piyasalar', path: '/markets' },
    { title: 'BTC/USDT', path: '/markets/btc-usdt' }
  ]}
/>

// Loading durumu
<Breadcrumbs loading />

// Maksimum öğe sayısı
<Breadcrumbs maxItems={3} />

// Ana sayfa olmadan
<Breadcrumbs showHome={false} />

// Özel ayırıcı
<Breadcrumbs separator="/" />

// Tıklama olayı
<Breadcrumbs onItemClick={(item) => console.log(item)} />
*/

export default Breadcrumbs; 