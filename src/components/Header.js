import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ThemeSelector from './ThemeSelector';
import { useUser } from '../context/UserContext';
import ResponsiveDrawer from './ResponsiveDrawer';

function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useUser();

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - 240px)` },
        ml: { md: '240px' },
        zIndex: theme.zIndex.drawer + 1
      }}
    >
      <Toolbar>
        {isMobile && <ResponsiveDrawer />}
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          Kripto Takip
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ThemeSelector />
          {user && (
            <Typography variant="body2">
              {user.name}
            </Typography>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header; 