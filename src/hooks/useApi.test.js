import { renderHook } from '@testing-library/react-hooks';
import { useApi } from './useApi';

describe('useApi', () => {
  const mockApiFunc = jest.fn();

  beforeEach(() => {
    mockApiFunc.mockReset();
  });

  it('handles successful API call', async () => {
    const mockData = { success: true };
    mockApiFunc.mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useApi(mockApiFunc));
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    
    const response = await result.current.execute();
    
    expect(response).toEqual(mockData);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
  });

  it('handles API error', async () => {
    const mockError = new Error('API Error');
    mockApiFunc.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useApi(mockApiFunc));
    
    try {
      await result.current.execute();
    } catch (error) {
      expect(error).toBe(mockError);
      expect(result.current.error).toBe(mockError.message);
      expect(result.current.loading).toBe(false);
    }
  });
}); 