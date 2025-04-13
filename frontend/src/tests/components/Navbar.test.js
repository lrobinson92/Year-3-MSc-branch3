import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithRedux } from '../../setupTests';
import Navbar from '../../components/Navbar';

// Mock the logout action
const mockLogout = jest.fn();
jest.mock('../../actions/auth', () => ({
  logout: () => mockLogout
}));

// Mock the useNavigate hook from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders navbar with logo and brand when not authenticated', () => {
    const { container } = renderWithRedux(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
      { 
        initialState: {
          auth: {
            isAuthenticated: false,
            user: null
          }
        }
      }
    );

    // Check for logo/brand using querySelector
    const brandElement = container.querySelector('.navbar-brand');
    expect(brandElement).toBeInTheDocument();
    expect(brandElement.textContent).toBe('SOPify');
    
    // Check for logo image
    const logoImage = container.querySelector('.navbar-brand img');
    expect(logoImage).toBeInTheDocument();
    expect(logoImage.alt).toBe('Logo');
  });

  test('renders sign in and get started buttons when not authenticated', () => {
    renderWithRedux(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
      { 
        initialState: {
          auth: {
            isAuthenticated: false,
            user: null
          }
        }
      }
    );
    
    // When not authenticated, should show Sign In and Get Started
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  test('renders logout button when authenticated', () => {
    renderWithRedux(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
      { 
        initialState: {
          auth: {
            isAuthenticated: true,
            user: { id: 1, name: 'Test User' }
          }
        }
      }
    );
    
    // When authenticated, should show Logout but not Sign In or Get Started
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('calls logout action when logout button is clicked', () => {
    renderWithRedux(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
      { 
        initialState: {
          auth: {
            isAuthenticated: true,
            user: { id: 1, name: 'Test User' }
          }
        }
      }
    );
    
    // Find and click logout button
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    // Check if logout action was called
    expect(mockLogout).toHaveBeenCalled();
    
    // Check if navigate was called with the homepage path
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('navigates to login page when Sign In button is clicked', () => {
    const { container } = renderWithRedux(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
      { 
        initialState: {
          auth: {
            isAuthenticated: false,
            user: null
          }
        }
      }
    );

    // Find the Sign In button
    const signInButton = screen.getByText('Sign In');
    
    // Check that it links to /login
    expect(signInButton.getAttribute('href')).toBe('/login');
  });

  test('navigates to signup page when Get Started button is clicked', () => {
    renderWithRedux(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
      { 
        initialState: {
          auth: {
            isAuthenticated: false,
            user: null
          }
        }
      }
    );
    
    // Find the Get Started button using exact text
    const getStartedButton = screen.getByText('Get Started');
    
    // Check that it links to /signup
    expect(getStartedButton.getAttribute('href')).toBe('/signup');
  });
  
});