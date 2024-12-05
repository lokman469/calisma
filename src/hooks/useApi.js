import { useState, useEffect } from 'react';
import api from '../config/api';

// API çağrılarını yöneten hook
const useApi = (endpoint, method = 'GET', body = null, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api({
          method,
          url: endpoint,
          data: body
        });
        setData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error };
};

export default useApi; 