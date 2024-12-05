import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { UserProvider } from '../context/UserContext';
import { NotificationProvider } from '../context/NotificationContext';

export function renderWithProviders(ui, options = {}) {
  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <UserProvider>
        <ThemeProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </ThemeProvider>
      </UserProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react'; 