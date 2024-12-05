import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../utils/test-utils';
import CoinList from '../CoinList';

describe('CoinList', () => {
  const mockCoins = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 50000 },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3000 }
  ];

  it('renders coin list correctly', () => {
    renderWithProviders(<CoinList coins={mockCoins} />);
    
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
  });

  it('handles coin selection', () => {
    const onSelect = jest.fn();
    renderWithProviders(<CoinList coins={mockCoins} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByText('Bitcoin'));
    expect(onSelect).toHaveBeenCalledWith(mockCoins[0]);
  });

  it('filters coins by search', () => {
    renderWithProviders(<CoinList coins={mockCoins} />);
    
    const searchInput = screen.getByPlaceholderText('Coin ara...');
    fireEvent.change(searchInput, { target: { value: 'bitcoin' } });
    
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.queryByText('Ethereum')).not.toBeInTheDocument();
  });

  it('sorts coins by market cap', async () => {
    renderWithProviders(<CoinList coins={mockCoins} />);
    
    const sortButton = screen.getByText('Market Cap');
    fireEvent.click(sortButton);
    
    const coins = screen.getAllByTestId('coin-item');
    expect(coins[0]).toHaveTextContent('Bitcoin');
  });
});

describe('CoinList Integration', () => {
  it('handles API errors gracefully', async () => {
    const mockError = new Error('API Error');
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(mockError);
    
    renderWithProviders(<CoinList />);
    
    await waitFor(() => {
      expect(screen.getByText(/bir hata oluştu/i)).toBeInTheDocument();
    });
  });
}); 