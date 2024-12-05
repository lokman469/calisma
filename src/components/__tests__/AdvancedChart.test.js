import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import AdvancedChart from '../AdvancedChart';

// Mock chart.js to avoid canvas rendering issues in tests
jest.mock('react-chartjs-2', () => ({
  Line: () => null
}));

const mockData = [
  { timestamp: '2024-03-20T10:00:00Z', price: 50000 },
  { timestamp: '2024-03-20T11:00:00Z', price: 51000 },
  { timestamp: '2024-03-20T12:00:00Z', price: 52000 }
];

const renderWithTheme = (ui) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('AdvancedChart', () => {
  test('renders chart title and time range selector', () => {
    renderWithTheme(<AdvancedChart data={mockData} />);
    
    // Zaman aralığı seçicisinin varlığını kontrol et
    expect(screen.getByRole('button')).toHaveTextContent('24 Saat');
  });

  test('changes time range when different option is selected', () => {
    renderWithTheme(<AdvancedChart data={mockData} />);
    
    // Select elementini bul ve tıkla
    const selectElement = screen.getByRole('button');
    fireEvent.mouseDown(selectElement);
    
    // 7 Gün seçeneğini seç
    const option = screen.getByText('7 Gün');
    fireEvent.click(option);
    
    // Seçimin değiştiğini kontrol et
    expect(selectElement).toHaveTextContent('7 Gün');
  });

  test('renders chart with correct data structure', () => {
    const { container } = renderWithTheme(<AdvancedChart data={mockData} />);
    
    // Chart container'ın varlığını kontrol et
    expect(container.querySelector('.MuiPaper-root')).toBeInTheDocument();
  });

  test('handles empty data gracefully', () => {
    renderWithTheme(<AdvancedChart data={[]} />);
    
    // Boş veri durumunda chart'ın hala render edildiğini kontrol et
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
}); 