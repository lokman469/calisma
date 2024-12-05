import { useState, useEffect } from 'react';
import { isAuthenticated, getUserData, logout } from '../utils/auth';

// Kimlik doğrulama durumu ve kullanıcı verilerini yöneten hook
const useAuth = () => {
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const [user, setUser] = useState(getUserData());

  useEffect(() => {
    setIsAuth(isAuthenticated());
    setUser(getUserData());
  }, []);

  const handleLogout = () => {
    logout();
    setIsAuth(false);
    setUser(null);
  };

  return { isAuth, user, logout: handleLogout };
};

export default useAuth; 