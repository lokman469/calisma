import React from 'react';
import {
  FormControlLabel,
  Checkbox as MuiCheckbox,
  Typography,
  Box
} from '@mui/material';

const Checkbox = ({
  label,
  checked,
  onChange,
  error,
  helperText,
  disabled,
  size = 'medium',
  color = 'primary',
  sx = {},
  ...props
}) => {
  return (
    <Box>
      <FormControlLabel
        control={
          <MuiCheckbox
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            size={size}
            color={color}
            sx={{
              '&.Mui-checked': {
                color: error ? 'error.main' : `${color}.main`
              },
              ...sx
            }}
            {...props}
          />
        }
        label={
          <Typography
            variant="body2"
            sx={{
              color: error ? 'error.main' : 'text.primary'
            }}
          >
            {label}
          </Typography>
        }
      />
      {helperText && (
        <Typography
          variant="caption"
          color={error ? 'error' : 'textSecondary'}
          sx={{ ml: 2 }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default Checkbox; 