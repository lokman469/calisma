import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Typography, Box } from '@mui/material';
import trLocale from 'date-fns/locale/tr';

const DatePicker = ({
  label,
  value,
  onChange,
  error,
  helperText,
  required,
  disabled,
  fullWidth = true,
  size = 'medium',
  format = 'dd.MM.yyyy',
  sx = {},
  ...props
}) => {
  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <Typography
          variant="subtitle2"
          sx={{
            mb: 1,
            color: error ? 'error.main' : 'text.primary'
          }}
        >
          {label}
          {required && (
            <Typography component="span" color="error.main">
              *
            </Typography>
          )}
        </Typography>
      )}
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
        <MuiDatePicker
          value={value}
          onChange={onChange}
          disabled={disabled}
          format={format}
          slotProps={{
            textField: {
              fullWidth,
              size,
              error,
              helperText,
              sx: {
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: error ? 'error.main' : 'primary.main'
                  }
                },
                ...sx
              }
            }
          }}
          {...props}
        />
      </LocalizationProvider>
    </Box>
  );
};

export default DatePicker; 