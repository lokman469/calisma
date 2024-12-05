import { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Divider
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import { useTheme } from '../context/ThemeContext';

function ThemeSelector() {
  const [anchorEl, setAnchorEl] = useState(null);
  const { mode, primaryColor, setPrimaryColor, toggleMode } = useTheme();

  const colors = [
    { name: 'Mavi', value: '#1976d2' },
    { name: 'Yeşil', value: '#2e7d32' },
    { name: 'Mor', value: '#7b1fa2' },
    { name: 'Turuncu', value: '#ed6c02' },
    { name: 'Kırmızı', value: '#d32f2f' }
  ];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <PaletteIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem>
          <ListItemIcon>
            <DarkModeIcon />
          </ListItemIcon>
          <ListItemText primary="Karanlık Mod" />
          <Switch
            edge="end"
            checked={mode === 'dark'}
            onChange={toggleMode}
          />
        </MenuItem>
        <Divider />
        {colors.map((color) => (
          <MenuItem
            key={color.value}
            onClick={() => {
              setPrimaryColor(color.value);
              handleClose();
            }}
            selected={primaryColor === color.value}
          >
            <ListItemIcon>
              <ColorLensIcon sx={{ color: color.value }} />
            </ListItemIcon>
            <ListItemText primary={color.name} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default ThemeSelector; 