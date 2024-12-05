import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';
import CryptoCard from '../CryptoCard';
import theme from '../../theme';
import cryptoReducer from '../../store/cryptoSlice';

const store = configureStore({
  reducer: {
    crypto: cryptoReducer
  }
});

const AllTheProviders = ({ children }) => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </Provider>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

describe('CryptoCard', () => {
  const mockCrypto = {
    name: 'Bitcoin',
    current_price: 50000,
    price_change_percentage_24h: 5.5,
    market_cap: 1000000000,
    image: 'test-image-url'
  };

  test('renders crypto information correctly', () => {
    customRender(<CryptoCard crypto={mockCrypto} />);
    
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText(/\$50,000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/5\.5%/)).toBeInTheDocument();
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'test-image-url');
    expect(image).toHaveAttribute('alt', 'Bitcoin');
  });

  test('displays correct color for price change', () => {
    customRender(<CryptoCard crypto={mockCrypto} />);
    
    const priceChange = screen.getByText(/5\.5%/);
    expect(priceChange).toHaveStyle({ color: 'rgb(46, 174, 52)' });
  });
}); 