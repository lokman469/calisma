import { renderHook, act } from '@testing-library/react-hooks';
import useAuth from '../../hooks/useAuth';
import { isAuthenticated, getUserData } from '../../utils/auth';

// Mock auth utilities
jest.mock('../../utils/auth', () => ({
  isAuthenticated: jest.fn(),
  getUserData: jest.fn(),
  logout: jest.fn()
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns initial auth state correctly', () => {
    isAuthenticated.mockReturnValue(true);
    getUserData.mockReturnValue({ id: 1, name: 'Test User' });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuth).toBe(true);
    expect(result.current.user).toEqual({ id: 1, name: 'Test User' });
  });

  it('handles logout correctly', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuth).toBe(false);
    expect(result.current.user).toBeNull();
  });
}); 