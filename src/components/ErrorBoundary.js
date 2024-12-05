import React from 'react';
import PropTypes from 'prop-types';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  Stack,
  useTheme,
  Collapse
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  BugReport as BugReportIcon,
  Home as HomeIcon,
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { logError } from '../utils/errorLogger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Hata loglama servisi
    logError({
      error,
      errorInfo,
      location: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleReportError = () => {
    const { error, errorInfo } = this.state;
    const errorReport = {
      error: error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      location: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    // Hata raporlama API'sine gönder
    console.log('Hata raporu:', errorReport);
    // TODO: Implement error reporting API
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  render() {
    const { hasError, error, errorInfo, showDetails } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            backgroundColor: theme => theme.palette.background.paper
          }}
        >
          <ErrorIcon 
            color="error" 
            sx={{ 
              fontSize: 64,
              mb: 2
            }} 
          />

          <Typography variant="h4" gutterBottom color="error">
            Bir Hata Oluştu
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin veya
            ana sayfaya dönün.
          </Typography>

          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            justifyContent="center"
            sx={{ mb: 4 }}
          >
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleRefresh}
            >
              Sayfayı Yenile
            </Button>
            
            <Button
              variant="outlined"
              component={Link}
              to="/"
              startIcon={<HomeIcon />}
            >
              Ana Sayfa
            </Button>

            <Button
              variant="outlined"
              color="error"
              startIcon={<BugReportIcon />}
              onClick={this.handleReportError}
            >
              Hatayı Bildir
            </Button>
          </Stack>

          <Box sx={{ mt: 4 }}>
            <Button
              variant="text"
              onClick={this.toggleDetails}
              endIcon={
                <ExpandMoreIcon 
                  sx={{ 
                    transform: showDetails ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.3s'
                  }}
                />
              }
            >
              Teknik Detaylar
            </Button>

            <Collapse in={showDetails}>
              <Stack spacing={2} sx={{ mt: 2, textAlign: 'left' }}>
                {error && (
                  <Alert severity="error" variant="outlined">
                    <Typography variant="subtitle2">Hata Mesajı:</Typography>
                    <Typography variant="body2" component="pre" sx={{ mt: 1 }}>
                      {error.toString()}
                    </Typography>
                  </Alert>
                )}

                {errorInfo && (
                  <Alert severity="info" variant="outlined">
                    <Typography variant="subtitle2">Bileşen Yığını:</Typography>
                    <Typography 
                      variant="body2" 
                      component="pre" 
                      sx={{ 
                        mt: 1,
                        maxHeight: 200,
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {errorInfo.componentStack}
                    </Typography>
                  </Alert>
                )}
              </Stack>
            </Collapse>
          </Box>
        </Paper>
      </Container>
    );
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  onError: PropTypes.func
};

export default ErrorBoundary; 