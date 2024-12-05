import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Fade,
  useTheme,
  Paper
} from '@mui/material';

const LoadingIndicator = ({ 
  type = 'circular',
  size = 40,
  thickness = 4,
  message = 'Yükleniyor...',
  progress = 0,
  overlay = false,
  delay = 500,
  color = 'primary'
}) => {
  const theme = useTheme();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const renderLoader = () => {
    switch (type) {
      case 'linear':
        return (
          <LinearProgress
            variant={progress > 0 ? "determinate" : "indeterminate"}
            value={progress}
            color={color}
            sx={{
              width: '100%',
              borderRadius: 1,
              height: thickness
            }}
          />
        );

      case 'circular':
      default:
        return (
          <CircularProgress
            size={size}
            thickness={thickness}
            variant={progress > 0 ? "determinate" : "indeterminate"}
            value={progress}
            color={color}
          />
        );
    }
  };

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
        ...(overlay && {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: theme.zIndex.modal,
          backdropFilter: 'blur(4px)'
        })
      }}
    >
      {renderLoader()}
      {message && (
        <Typography
          variant="body2"
          color="textSecondary"
          align="center"
          sx={{ mt: 1 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  return (
    <Fade in={visible} timeout={300}>
      {overlay ? (
        content
      ) : (
        <Paper 
          elevation={0}
          sx={{ 
            position: 'relative',
            backgroundColor: 'transparent'
          }}
        >
          {content}
        </Paper>
      )}
    </Fade>
  );
};

LoadingIndicator.propTypes = {
  type: PropTypes.oneOf(['circular', 'linear']),
  size: PropTypes.number,
  thickness: PropTypes.number,
  message: PropTypes.string,
  progress: PropTypes.number,
  overlay: PropTypes.bool,
  delay: PropTypes.number,
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'info', 'success', 'warning'])
};

export default React.memo(LoadingIndicator); 