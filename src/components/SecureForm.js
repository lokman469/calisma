import React, { useState } from 'react';
import { TextField, Button, Alert } from '@mui/material';
import { securityService } from '../services/security';

function SecureForm({ onSubmit, fields, submitText = 'Gönder' }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    if (name === 'password') {
      const { score, feedback } = securityService.checkPasswordStrength(value);
      if (score < 3) {
        return feedback.join(', ');
      }
    }
    if (name === 'email' && !/\S+@\S+\.\S+/.test(value)) {
      return 'Geçerli bir e-posta adresi giriniz';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = securityService.sanitizeInput(value);
    const error = validateField(name, sanitizedValue);

    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form verilerini şifrele
    const encryptedData = securityService.encrypt(formData);

    try {
      await onSubmit(encryptedData);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: error.message
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {fields.map(field => (
        <TextField
          key={field.name}
          fullWidth
          margin="normal"
          {...field}
          value={formData[field.name] || ''}
          onChange={handleChange}
          error={!!errors[field.name]}
          helperText={errors[field.name]}
        />
      ))}

      {errors.submit && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors.submit}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{ mt: 3 }}
      >
        {submitText}
      </Button>
    </form>
  );
}

export default SecureForm; 