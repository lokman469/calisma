import React from 'react';
import {
  TextField as MuiTextField,
  InputAdornment,
  Typography,
  Box
} from '@mui/material';

const TextField = ({
  label,
  value,
  onChange,
  error,
  helperText,
  startIcon,
  endIcon,
  required,
  disabled,
  type = 'text',
  fullWidth = true,
  size = 'medium',
  variant = 'outlined',
  margin = 'normal',
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
      <MuiTextField
        value={value}
        onChange={onChange}
        error={error}
        helperText={helperText}
        required={required}
        disabled={disabled}
        type={type}
        fullWidth={fullWidth}
        size={size}
        variant={variant}
        margin={margin}
        InputProps={{
          startAdornment: startIcon && (
            <InputAdornment position="start">{startIcon}</InputAdornment>
          ),
          endAdornment: endIcon && (
            <InputAdornment position="end">{endIcon}</InputAdornment>
          )
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: error ? 'error.main' : 'primary.main'
            }
          },
          ...sx
        }}
        {...props}
      />
    </Box>
  );
};

export default TextField; 