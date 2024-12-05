import React, { createContext, useContext, useState, useEffect } from 'react';
import { isAuthenticated, getUserData, login, logout } from '../utils/auth';

// AuthContext oluştur
const AuthContext = createContext();

// AuthProvider bileşeni
export const AuthProvider = ({ children }) => {
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const [user, setUser] = useState(getUserData());

  useEffect(() => {
    setIsAuth(isAuthenticated());
    setUser(getUserData());
  }, []);

  const handleLogin = (token, refreshToken, userData) => {
    login(token, refreshToken, userData);
    setIsAuth(true);
    setUser(userData);
  };

  const handleLogout = () => {
    logout();
    setIsAuth(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuth, user, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

// AuthContext kullanımı için hook
export const useAuth = () => {
  return useContext(AuthContext);
}; 