import React, { useState } from 'react';
import {
  Tabs as MuiTabs,
  Tab,
  Box,
  Typography,
  useTheme
} from '@mui/material';

const Tabs = ({
  tabs,
  initialTab = 0,
  onChange,
  variant = 'standard',
  indicatorColor = 'primary',
  textColor = 'primary',
  centered = false,
  sx = {}
}) => {
  const theme = useTheme();
  const [value, setValue] = useState(initialTab);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <Box sx={{ width: '100%', ...sx }}>
      <MuiTabs
        value={value}
        onChange={handleChange}
        variant={variant}
        indicatorColor={indicatorColor}
        textColor={textColor}
        centered={centered}
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          mb: 2
        }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            icon={tab.icon}
            iconPosition={tab.icon ? 'start' : undefined}
            sx={{
              textTransform: 'none',
              minWidth: 72,
              '&:hover': {
                color: theme.palette.primary.main,
                opacity: 1
              },
              '&.Mui-selected': {
                color: theme.palette.primary.main
              },
              '&.Mui-focusVisible': {
                backgroundColor: theme.palette.action.focus
              }
            }}
          />
        ))}
      </MuiTabs>
      <Box>
        {tabs.map((tab, index) => (
          <Box
            key={index}
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            sx={{ p: 3 }}
          >
            {value === index && (
              <Typography component="div">{tab.content}</Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// Kullanım örnekleri:
/*
// Basit kullanım
<Tabs
  tabs={[
    { label: 'Tab 1', content: 'Tab 1 içeriği' },
    { label: 'Tab 2', content: 'Tab 2 içeriği' }
  ]}
/>

// İkonlar ile
<Tabs
  tabs={[
    { label: 'Tab 1', icon: <HomeIcon />, content: 'Tab 1 içeriği' },
    { label: 'Tab 2', icon: <SettingsIcon />, content: 'Tab 2 içeriği' }
  ]}
/>

// Başlangıç sekmesi
<Tabs
  initialTab={1}
  tabs={[
    { label: 'Tab 1', content: 'Tab 1 içeriği' },
    { label: 'Tab 2', content: 'Tab 2 içeriği' }
  ]}
/>

// Değişim olayı
<Tabs
  onChange={(index) => console.log('Seçilen sekme:', index)}
  tabs={[
    { label: 'Tab 1', content: 'Tab 1 içeriği' },
    { label: 'Tab 2', content: 'Tab 2 içeriği' }
  ]}
/>

// Farklı varyantlar
<Tabs
  variant="scrollable"
  tabs={[
    { label: 'Tab 1', content: 'Tab 1 içeriği' },
    { label: 'Tab 2', content: 'Tab 2 içeriği' },
    { label: 'Tab 3', content: 'Tab 3 içeriği' },
    { label: 'Tab 4', content: 'Tab 4 içeriği' },
    { label: 'Tab 5', content: 'Tab 5 içeriği' }
  ]}
/>
*/

export default Tabs; 