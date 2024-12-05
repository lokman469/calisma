import React from 'react';
import {
  FormControl,
  Select as MuiSelect,
  MenuItem,
  Typography,
  Box
} from '@mui/material';

const Select = ({
  label,
  value,
  onChange,
  options = [],
  error,
  helperText,
  required,
  disabled,
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
      <FormControl
        fullWidth={fullWidth}
        error={error}
        disabled={disabled}
        size={size}
        variant={variant}
        margin={margin}
        sx={sx}
      >
        <MuiSelect value={value} onChange={onChange} {...props}>
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </MuiSelect>
        {helperText && (
          <Typography
            variant="caption"
            color={error ? 'error' : 'textSecondary'}
            sx={{ mt: 0.5 }}
          >
            {helperText}
          </Typography>
        )}
      </FormControl>
    </Box>
  );
};

export default Select; 