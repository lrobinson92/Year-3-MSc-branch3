import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Signup from '../../containers/Signup';
import { renderWithRedux } from '../../setupTests';
import axiosInstance from '../../utils/axiosConfig';

// Mock axios and react-router's useNavigate
jest.mock('../../utils/axiosConfig');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('Signup Component', () => {
  const defaultState = {
    auth: {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null
    }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear(); // Clear localStorage before each test
  });

  test('renders signup form correctly', () => {
    renderWithRedux(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>,
      { initialState: defaultState }
    );

    expect(screen.getByPlaceholderText('Name*')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email*')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password*')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm Password*')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument();
    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  test('allows user to enter registration details', () => {
    renderWithRedux(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>,
      { initialState: defaultState }
    );

    const nameInput = screen.getByPlaceholderText('Name*');
    const emailInput = screen.getByPlaceholderText('Email*');
    const passwordInput = screen.getByPlaceholderText('Password*');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password*');

    fireEvent.change(nameInput, { target: { value: 'New User' } });
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    expect(nameInput.value).toBe('New User');
    expect(emailInput.value).toBe('newuser@example.com');
    expect(passwordInput.value).toBe('password123');
    expect(confirmPasswordInput.value).toBe('password123');
  });

  test('validates password matching', async () => {
    renderWithRedux(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>,
      { initialState: defaultState }
    );

    const nameInput = screen.getByPlaceholderText('Name*');
    const emailInput = screen.getByPlaceholderText('Email*');
    const passwordInput = screen.getByPlaceholderText('Password*');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password*');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(nameInput, { target: { value: 'New User' } });
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
    fireEvent.click(submitButton);

    // The component uses a window.alert for the error message
    // Jest can't easily test window.alert - consider updating component to use state for error messages
    // We'll test that axios wasn't called, which indirectly confirms validation happened
    expect(axiosInstance.post).not.toHaveBeenCalled();
  });

  test('handles successful registration', async () => {
    // Mock successful API response
    axiosInstance.post.mockResolvedValueOnce({
      data: {
        user: { id: 1, name: 'New User', email: 'newuser@example.com' }
      }
    });

    renderWithRedux(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>,
      { initialState: defaultState }
    );

    const nameInput = screen.getByPlaceholderText('Name*');
    const emailInput = screen.getByPlaceholderText('Email*');
    const passwordInput = screen.getByPlaceholderText('Password*');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password*');
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(nameInput, { target: { value: 'New User' } });
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Verify axios was called with correct params
    await waitFor(() => {
      // Check that post was called
      expect(axiosInstance.post).toHaveBeenCalled();
      
      // Get the call arguments
      const callArgs = axiosInstance.post.mock.calls[0];
      
      // Verify URL contains users endpoint
      expect(callArgs[0]).toContain('auth/users/');
      
      // Parse the stringified JSON body
      const bodyData = JSON.parse(callArgs[1]);
      
      // Verify the correct data was sent
      expect(bodyData).toEqual({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        re_password: 'password123'
      });
      
      // Verify headers contain content-type
      expect(callArgs[2].headers['Content-Type']).toBe('application/json');
    });
  });

  test('redirects to login page when login link clicked', () => {
    const { container } = renderWithRedux(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>,
      { initialState: defaultState }
    );

    const loginLink = screen.getByText(/login/i);
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});