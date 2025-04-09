import authReducer from '../../reducers/auth';
import {
  USER_LOADED_SUCCESS,  // Changed from USER_LOADED
  LOGIN_SUCCESS,
  SIGNUP_SUCCESS,       // Changed from REGISTER_SUCCESS
  USER_LOADED_FAIL,     // Changed from AUTH_ERROR
  LOGIN_FAIL,
  SIGNUP_FAIL,          // Changed from REGISTER_FAIL
  LOGOUT,
  RESET_FIRST_LOGIN,    // Added to match your implementation
  AUTHENTICATED_SUCCESS,
  AUTHENTICATED_FAIL
} from '../../actions/types';

describe('Auth Reducer', () => {
  // Updated to match your actual implementation
  const initialState = {
    access: localStorage.getItem('access'),
    refresh: localStorage.getItem('accessrefresh'),
    isAuthenticated: null,
    user: null,
    firstLogin: false,
    error: null
  };

  test('returns default state', () => {
    const newState = authReducer(undefined, {});
    expect(newState).toEqual(initialState);
  });

  test('handles AUTHENTICATED_SUCCESS', () => {
    const action = { type: AUTHENTICATED_SUCCESS };
    const newState = authReducer(initialState, action);
    
    expect(newState.isAuthenticated).toBe(true);
  });

  test('handles AUTHENTICATED_FAIL', () => {
    const action = { type: AUTHENTICATED_FAIL };
    const newState = authReducer(initialState, action);
    
    expect(newState.isAuthenticated).toBe(false);
  });

  test('handles USER_LOADED_SUCCESS', () => {
    const user = { id: 1, email: 'user@test.com', name: 'Test User' };
    const action = {
      type: USER_LOADED_SUCCESS,
      payload: user
    };
    
    const newState = authReducer(initialState, action);
    expect(newState.user).toEqual(user);
  });

  test('handles USER_LOADED_FAIL', () => {
    const action = { type: USER_LOADED_FAIL };
    const newState = authReducer(initialState, action);
    
    expect(newState.user).toBeNull();
  });

  test('handles LOGIN_SUCCESS', () => {
    const payload = {
      access: 'fake-access-token',
      refresh: 'fake-refresh-token',
      user: { id: 1, email: 'user@test.com' }
    };
    const action = {
      type: LOGIN_SUCCESS,
      payload
    };
    const newState = authReducer(initialState, action);

    expect(newState.access).toBe(payload.access);
    expect(newState.refresh).toBe(payload.refresh);
    expect(newState.user).toEqual(payload.user);
    expect(newState.isAuthenticated).toBe(true);
    expect(newState.firstLogin).toBe(true);
    expect(newState.error).toBeNull();
    
    // Verify localStorage was updated
    expect(localStorage.getItem('access')).toBe(payload.access);
  });

  test('handles SIGNUP_SUCCESS', () => {
    const action = { type: SIGNUP_SUCCESS };
    const newState = authReducer(initialState, action);
    
    expect(newState.isAuthenticated).toBe(false);
  });

  test('handles LOGIN_FAIL', () => {
    const errorMsg = 'Login details are not correct. Please try again.';
    const action = {
      type: LOGIN_FAIL,
      payload: errorMsg
    };
    const newState = authReducer(initialState, action);

    expect(newState.error).toBe(errorMsg);
    expect(newState.isAuthenticated).toBe(false);
    expect(newState.access).toBeNull();
    expect(newState.refresh).toBeNull();
    expect(newState.user).toBeNull();
  });

  test('handles SIGNUP_FAIL', () => {
    const errorMsg = 'Signup failed';
    const action = {
      type: SIGNUP_FAIL,
      payload: errorMsg
    };
    const newState = authReducer(initialState, action);
    
    expect(newState.isAuthenticated).toBe(false);
    expect(newState.access).toBeNull();
    expect(newState.refresh).toBeNull();
    expect(newState.user).toBeNull();
    expect(newState.error).toBe(errorMsg);
  });

  test('handles LOGOUT', () => {
    const action = { type: LOGOUT };
    const stateBeforeLogout = {
      access: 'fake-access-token',
      refresh: 'fake-refresh-token',
      isAuthenticated: true,
      user: { id: 1, email: 'user@test.com' },
      firstLogin: false,
      error: null
    };
    const newState = authReducer(stateBeforeLogout, action);

    expect(newState.access).toBeNull();
    expect(newState.refresh).toBeNull();
    expect(newState.isAuthenticated).toBe(false);
    expect(newState.user).toBeNull();
  });

  test('handles RESET_FIRST_LOGIN', () => {
    const action = { type: RESET_FIRST_LOGIN };
    const stateWithFirstLogin = {
      ...initialState,
      firstLogin: true
    };
    const newState = authReducer(stateWithFirstLogin, action);
    
    expect(newState.firstLogin).toBe(false);
  });
});