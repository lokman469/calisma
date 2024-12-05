import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

function Navbar() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" style={{ textDecoration: 'none', color: 'white', flexGrow: 1 }}>
          Kripto Takipçi
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button color="inherit" component={Link} to="/alerts">
            Uyarılar
          </Button>
          <Button color="inherit" component={Link} to="/news">
            Haberler
          </Button>
          <Button color="inherit" component={Link} to="/stats">
            İstatistikler
          </Button>
          <Button color="inherit" component={Link} to="/portfolio-optimization">
            Portföy Optimizasyonu
          </Button>
          <Button color="inherit" component={Link} to="/news-analysis">
            Haber Analizi
          </Button>
          <IconButton color="inherit" onClick={toggleDarkMode}>
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 