import React, { createContext, useContext, useState } from 'react';

// NotificationContext oluştur
const NotificationContext = createContext();

// NotificationProvider bileşeni
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    setNotifications((prevNotifications) => [...prevNotifications, notification]);
  };

  const removeNotification = (id) => {
    setNotifications((prevNotifications) => prevNotifications.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

// NotificationContext kullanımı için hook
export const useNotification = () => {
  return useContext(NotificationContext);
}; 