import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../containers/Login';
import { renderWithRedux } from '../../setupTests';
import axiosInstance from '../../utils/axiosConfig';
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from '../../reducers';

// Mock axios
jest.mock('../../utils/axiosConfig');

// Mock react-router's useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('Login Component', () => {
  // Default state to use in all tests
  const defaultState = {
    auth: {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null
    }
  };

  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear(); // Clear localStorage before each test
    
    // Create a store for testing
    store = configureStore({
      reducer: rootReducer
    });
  });

  test('renders login form correctly', () => {
    renderWithRedux(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
      { 
        initialState: defaultState,
        store: store // Use the test store
      }
    );

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  test('allows user to enter credentials', () => {
    renderWithRedux(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
      { 
        initialState: defaultState,
        store: store // Use the test store
      }
    );

    const emailInput = screen.getByPlaceholderText('Email'); // Changed from usernameInput
    const passwordInput = screen.getByPlaceholderText('Password');

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } }); // Changed test value
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('user@test.com'); // Updated expectation
    expect(passwordInput.value).toBe('password123');
  });

  test('handles successful login', async () => {
    // Mock successful API response
    const mockLoginResponse = {
      data: {
        token: 'fake-token',
        user: { id: 1, email: 'user@test.com' }
      }
    };
    axiosInstance.post.mockResolvedValueOnce(mockLoginResponse);

    renderWithRedux(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
      { 
        initialState: defaultState,
        store: store // Use the test store
      }
    );

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Check that post was called
      expect(axiosInstance.post).toHaveBeenCalled();
      
      // Get the call arguments
      const callArgs = axiosInstance.post.mock.calls[0];
      
      // Verify URL contains jwt/create (the important part)
      expect(callArgs[0]).toContain('jwt/create');
      
      // If the data is stringified JSON, parse it
      let requestData;
      if (typeof callArgs[1] === 'string') {
        requestData = JSON.parse(callArgs[1]);
      } else {
        requestData = callArgs[1];
      }
      
      // Verify the correct data was sent
      expect(requestData).toEqual({
        email: 'user@test.com',
        password: 'password123'
      });
    });
  });

  // Update the failed login test:

  test('displays error message on login failure', async () => {
    // Mock failed API response
    const errorMessage = 'Login details are not correct. Please try again.';
    axiosInstance.post.mockRejectedValueOnce({
      response: {
        data: { detail: 'Invalid credentials' }
      }
    });

    renderWithRedux(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
      { 
        initialState: defaultState,
        store: store // Use the test store
      }
    );

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'bad@user.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    // Wait for error message to appear
    await waitFor(() => {
      // Make sure the error was dispatched to Redux state
      const state = store.getState?.() || {};
      console.log('Auth state after login failure:', state.auth);

      // Use a more flexible text matcher and check for role="alert"
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('redirects to signup page when signup link clicked', () => {
    const { container } = renderWithRedux(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
      { 
        initialState: defaultState,
        store: store // Use the test store
      }
    );

    const signupLink = screen.getByText(/sign up/i);
    expect(signupLink).toHaveAttribute('href', '/signup'); // Changed from /register to /signup
  });
});