import { describe, it, expect } from 'vitest';
import userReducer, { clearError, loginUser, logoutUser } from '../userSlice';
import type { UserState, User } from '../types';

describe('userSlice Redux Unit Tests', () => {
  const initialTestState: UserState = {
    currentUser: null,
    isLoading: false,
    isInitialLoading: false,
    error: null,
  };

  it('should return the initial state on unknown action', () => {
    expect(userReducer(undefined, { type: 'unknown' })).toEqual({
      currentUser: null,
      isLoading: false,
      isInitialLoading: false,
      error: null,
    });
  });

  it('should handle clearError action', () => {
    const stateWithError: UserState = {
      ...initialTestState,
      error: 'Invalid email or password',
    };

    const nextState = userReducer(stateWithError, clearError());
    expect(nextState.error).toBeNull();
  });

  it('should handle loginUser.fulfilled', () => {
    const mockUser: User = {
      id: 1,
      name: 'HR Manager',
      email: 'hr@paydesk.com',
      role: 'hr_manager',
    };

    const action = {
      type: loginUser.fulfilled.type,
      payload: mockUser,
    };

    const nextState = userReducer(initialTestState, action);
    expect(nextState.currentUser).toEqual(mockUser);
    expect(nextState.isLoading).toBe(false);
    expect(nextState.error).toBeNull();
  });

  it('should handle loginUser.rejected', () => {
    const action = {
      type: loginUser.rejected.type,
      payload: 'Invalid email or password.',
    };

    const nextState = userReducer(initialTestState, action);
    expect(nextState.isLoading).toBe(false);
    expect(nextState.error).toBe('Invalid email or password.');
    expect(nextState.currentUser).toBeNull();
  });

  it('should handle logoutUser.fulfilled', () => {
    const loggedInState: UserState = {
      ...initialTestState,
      currentUser: { id: 1, name: 'HR', email: 'hr@paydesk.com', role: 'hr_manager' },
    };

    const action = { type: logoutUser.fulfilled.type };
    const nextState = userReducer(loggedInState, action);

    expect(nextState.currentUser).toBeNull();
    expect(nextState.isLoading).toBe(false);
  });
});
