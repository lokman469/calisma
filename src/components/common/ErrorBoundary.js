import React, { Component } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Collapse,
  useTheme
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import * as Sentry from "@sentry/react";

class ErrorBoundary extends Component {
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
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Sentry'ye hata gönder
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack
      }
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleNavigateHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    // Hata raporlama mantığı
    const errorReport = {
      error: this.state.error?.toString(),
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    // Hata raporunu gönder
    console.log('Hata raporu:', errorReport);
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorUI
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          showDetails={this.state.showDetails}
          onReload={this.handleReload}
          onNavigateHome={this.handleNavigateHome}
          onReportError={this.handleReportError}
          onToggleDetails={this.toggleDetails}
        />
      );
    }

    return this.props.children;
  }
}

// Hata UI bileşeni
const ErrorUI = ({
  error,
  errorInfo,
  showDetails,
  onReload,
  onNavigateHome,
  onReportError,
  onToggleDetails
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        backgroundColor: theme.palette.background.default
      }}
    >
      <Paper
        elevation={3}
        sx={{
          maxWidth: 600,
          width: '100%',
          p: 4,
          textAlign: 'center'
        }}
      >
        <ErrorIcon
          sx={{
            fontSize: 64,
            color: theme.palette.error.main,
            mb: 2
          }}
        />

        <Typography variant="h5" gutterBottom>
          Üzgünüz, bir hata oluştu
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          Uygulama beklenmeyen bir hatayla karşılaştı. Lütfen sayfayı yenileyin veya ana sayfaya dönün.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={onReload}
          >
            Sayfayı Yenile
          </Button>

          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={onNavigateHome}
          >
            Ana Sayfa
          </Button>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="text"
            startIcon={<BugReportIcon />}
            onClick={onReportError}
            color="error"
          >
            Hatayı Bildir
          </Button>

          <Button
            variant="text"
            endIcon={
              <IconButton
                size="small"
                onClick={onToggleDetails}
                sx={{
                  transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: theme.transitions.create('transform')
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            }
            onClick={onToggleDetails}
          >
            Hata Detayları
          </Button>
        </Box>

        <Collapse in={showDetails}>
          <Paper
            variant="outlined"
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: theme.palette.background.default,
              textAlign: 'left',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflow: 'auto',
              maxHeight: 300
            }}
          >
            <Typography variant="body2" component="pre" sx={{ m: 0 }}>
              {error?.toString()}
              {'\n\n'}
              {errorInfo?.componentStack}
            </Typography>
          </Paper>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default ErrorBoundary; 