import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Sayfa değiştiğinde en üste kaydır
const ScrollToTop = ({ children }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return children || null;
};

export default ScrollToTop; 