import authReducer from '../../reducers/auth';
import {
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  USER_LOADED_SUCCESS,
  USER_LOADED_FAIL,
  AUTHENTICATED_SUCCESS,
  AUTHENTICATED_FAIL,
  LOGOUT,
  RESET_FIRST_LOGIN
} from '../../actions/types';

describe('Auth Reducer', () => {
  const initialState = {
    access: null,
    refresh: null,
    isAuthenticated: null,
    user: null,
    error: null,
    firstLogin: false
  };

  test('returns default state', () => {
    const newState = authReducer(undefined, {});
    expect(newState).toEqual(initialState);
  });

  test('handles LOGIN_SUCCESS', () => {
    const action = {
      type: LOGIN_SUCCESS,
      payload: { 
        access: 'fake-access-token',
        refresh: 'fake-refresh-token',
        user: { id: 1, name: 'Test User' } 
      }
    };
    
    const newState = authReducer(initialState, action);
    
    expect(newState.isAuthenticated).toBe(true);
    expect(newState.access).toBe('fake-access-token');
    expect(newState.refresh).toBe('fake-refresh-token');
    expect(newState.user).toEqual({ id: 1, name: 'Test User' });
    expect(newState.firstLogin).toBe(true);
    expect(newState.error).toBeNull();
  });

  test('handles RESET_FIRST_LOGIN', () => {
    const startState = {
      ...initialState,
      firstLogin: true
    };
    
    const action = { type: RESET_FIRST_LOGIN };
    const newState = authReducer(startState, action);
    
    expect(newState.firstLogin).toBe(false);
  });

  test('handles USER_LOADED_SUCCESS', () => {
    const action = {
      type: USER_LOADED_SUCCESS,
      payload: { id: 1, name: 'Test User' }
    };
    
    const newState = authReducer(initialState, action);
    
    // Only sets user data, doesn't change authentication state
    expect(newState.user).toEqual({ id: 1, name: 'Test User' });
    expect(newState.isAuthenticated).toBeNull(); // Unchanged
  });

  test('handles AUTHENTICATED_SUCCESS', () => {
    const action = { type: AUTHENTICATED_SUCCESS };
    
    const newState = authReducer(initialState, action);
    
    expect(newState.isAuthenticated).toBe(true);
  });

  test('handles AUTHENTICATED_FAIL', () => {
    const startState = {
      ...initialState,
      isAuthenticated: true
    };
    
    const action = { type: AUTHENTICATED_FAIL };
    const newState = authReducer(startState, action);
    
    expect(newState.isAuthenticated).toBe(false);
    // Note: Your current implementation doesn't clear tokens on auth fail
    // If you update the reducer as suggested, update this test too
  });

  test('handles USER_LOADED_FAIL', () => {
    const startState = {
      ...initialState,
      user: { id: 1, name: 'Test User' }
    };
    
    const action = { type: USER_LOADED_FAIL };
    const newState = authReducer(startState, action);
    
    expect(newState.user).toBeNull();
  });

  test('handles LOGIN_FAIL', () => {
    const action = { 
      type: LOGIN_FAIL,
      payload: 'Invalid credentials'
    };
    
    const newState = authReducer(initialState, action);
    
    expect(newState.access).toBeNull();
    expect(newState.refresh).toBeNull();
    expect(newState.isAuthenticated).toBe(false);
    expect(newState.user).toBeNull();
    expect(newState.error).toBe('Invalid credentials');
  });

  test('handles LOGOUT', () => {
    const startState = {
      access: 'fake-access-token',
      refresh: 'fake-refresh-token',
      isAuthenticated: true,
      user: { id: 1 },
      error: 'Some previous error',
      firstLogin: true
    };
    
    const action = { type: LOGOUT };
    const newState = authReducer(startState, action);
    
    expect(newState.access).toBeNull();
    expect(newState.refresh).toBeNull();
    expect(newState.isAuthenticated).toBe(false);
    expect(newState.user).toBeNull();
    expect(newState.error).toBeNull(); // Error is cleared
    expect(newState.firstLogin).toBe(false); // FirstLogin is reset
  });
});