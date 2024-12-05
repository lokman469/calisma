import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
import ResponsiveDrawer from './ResponsiveDrawer';
import Header from './Header';

function Layout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <ResponsiveDrawer />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - 240px)` },
          marginTop: '64px'
        }}
      >
        <Container maxWidth="xl">
          {children}
        </Container>
      </Box>
    </Box>
  );
}

export default Layout; 