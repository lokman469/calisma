import { useState } from 'react';

// Form verilerini ve hatalarını yöneten hook
const useForm = (initialValues = {}, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value
    });

    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
    }
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
  };

  return { values, errors, handleChange, resetForm };
};

export default useForm; 