import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
  Box,
  useTheme,
  alpha,
  Fade
} from '@mui/material';
import {
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  BrightnessAuto as AutoIcon,
  Check as CheckIcon
} from '@mui/icons-material';

const THEME_OPTIONS = [
  { value: 'light', label: 'Açık Tema', icon: LightIcon },
  { value: 'dark', label: 'Koyu Tema', icon: DarkIcon },
  { value: 'system', label: 'Sistem Teması', icon: AutoIcon }
];

const ThemeToggle = ({
  currentTheme = 'system',
  onChange,
  size = 'medium',
  showTooltip = true,
  position = 'bottom'
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState(null);

  // Menüyü aç/kapat
  const handleClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  // Tema değiştir
  const handleThemeChange = useCallback((newTheme) => {
    onChange(newTheme);
    handleClose();
  }, [onChange, handleClose]);

  // Aktif tema ikonunu belirle
  const ActiveThemeIcon = useMemo(() => {
    const option = THEME_OPTIONS.find(opt => opt.value === currentTheme);
    return option ? option.icon : AutoIcon;
  }, [currentTheme]);

  // Tema rengini belirle
  const getIconColor = useCallback((themeValue) => {
    if (themeValue === currentTheme) {
      return theme.palette.primary.main;
    }
    return theme.palette.text.primary;
  }, [currentTheme, theme]);

  const button = (
    <IconButton
      onClick={handleClick}
      size={size}
      sx={{
        transition: 'all 0.2s',
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          transform: 'scale(1.1)'
        }
      }}
    >
      <ActiveThemeIcon 
        color="primary"
        sx={{
          transition: 'transform 0.3s ease-in-out',
          transform: Boolean(anchorEl) ? 'rotate(180deg)' : 'rotate(0deg)'
        }}
      />
    </IconButton>
  );

  return (
    <>
      {showTooltip ? (
        <Tooltip 
          title="Tema Değiştir"
          placement={position}
          arrow
        >
          {button}
        </Tooltip>
      ) : button}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        TransitionComponent={Fade}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2,
            minWidth: 180,
            mt: 1
          }
        }}
      >
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <MenuItem
              key={option.value}
              onClick={() => handleThemeChange(option.value)}
              selected={currentTheme === option.value}
              sx={{
                py: 1,
                px: 2,
                borderRadius: 1,
                mx: 0.5,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              <ListItemIcon>
                <Icon sx={{ color: getIconColor(option.value) }} />
              </ListItemIcon>
              <ListItemText>
                <Typography 
                  variant="body2"
                  color={currentTheme === option.value ? 'primary' : 'textPrimary'}
                >
                  {option.label}
                </Typography>
              </ListItemText>
              {currentTheme === option.value && (
                <Box 
                  component={CheckIcon} 
                  sx={{ 
                    ml: 1,
                    color: theme.palette.primary.main,
                    fontSize: 18
                  }} 
                />
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

ThemeToggle.propTypes = {
  currentTheme: PropTypes.oneOf(['light', 'dark', 'system']),
  onChange: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  showTooltip: PropTypes.bool,
  position: PropTypes.oneOf([
    'top', 'top-start', 'top-end',
    'bottom', 'bottom-start', 'bottom-end',
    'left', 'left-start', 'left-end',
    'right', 'right-start', 'right-end'
  ])
};

export default React.memo(ThemeToggle); 