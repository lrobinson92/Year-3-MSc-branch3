import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithRedux } from '../../setupTests';
import GoogleDriveAuthCheck from '../../components/GoogleDriveAuthCheck';

// Mock the redirectToGoogleDriveLogin function
jest.mock('../../utils/driveAuthUtils', () => ({
  redirectToGoogleDriveLogin: jest.fn()
}));

// Import the mocked function for assertions
import { redirectToGoogleDriveLogin } from '../../utils/driveAuthUtils';

describe('GoogleDriveAuthCheck', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  test('renders loading UI when not logged in', () => {
    renderWithRedux(
      <MemoryRouter>
        <GoogleDriveAuthCheck showPrompt={true}>
          <div data-testid="children-content">Protected Content</div>
        </GoogleDriveAuthCheck>
      </MemoryRouter>,
      {
        initialState: {
          googledrive: {
            driveLoggedIn: false
          }
        }
      }
    );

    // Should show the loading/connecting state
    expect(screen.getByText('Connecting to Google Drive...')).toBeInTheDocument();
    expect(screen.getByText(/If you are not redirected automatically/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /click here/i })).toBeInTheDocument();
    
    // Should not show the children
    expect(screen.queryByTestId('children-content')).not.toBeInTheDocument();
  });

  test('does not render loading UI when logged in', () => {
    renderWithRedux(
      <MemoryRouter>
        <GoogleDriveAuthCheck>
          <div data-testid="children-content">Protected Content</div>
        </GoogleDriveAuthCheck>
      </MemoryRouter>,
      {
        initialState: {
          googledrive: {
            driveLoggedIn: true
          }
        }
      }
    );

    // Should not show the loading UI
    expect(screen.queryByText('Connecting to Google Drive...')).not.toBeInTheDocument();
    
    // Should show the children
    expect(screen.getByTestId('children-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('clicking the "click here" button triggers redirect', () => {
    renderWithRedux(
      <MemoryRouter>
        <GoogleDriveAuthCheck showPrompt={true}>
          <div>Test Content</div>
        </GoogleDriveAuthCheck>
      </MemoryRouter>,
      {
        initialState: {
          googledrive: {
            driveLoggedIn: false
          }
        }
      }
    );

    // Click the "click here" button
    fireEvent.click(screen.getByRole('button', { name: /click here/i }));
    
    // Check that the redirect function was called
    expect(redirectToGoogleDriveLogin).toHaveBeenCalledTimes(1);
  });

  test('does not show loading UI when showPrompt is false', () => {
    renderWithRedux(
      <MemoryRouter>
        <GoogleDriveAuthCheck showPrompt={false}>
          <div data-testid="children-content">Protected Content</div>
        </GoogleDriveAuthCheck>
      </MemoryRouter>,
      {
        initialState: {
          googledrive: {
            driveLoggedIn: false
          }
        }
      }
    );

    // Should not show the loading UI
    expect(screen.queryByText('Connecting to Google Drive...')).not.toBeInTheDocument();
    
    // Should render children even though not logged in (because showPrompt is false)
    expect(screen.getByTestId('children-content')).toBeInTheDocument();
  });

  test('renders loading UI when not logged in and no children', () => {
    const { container } = renderWithRedux(
      <MemoryRouter>
        <GoogleDriveAuthCheck showPrompt={true}/>
      </MemoryRouter>,
      {
        initialState: {
          googledrive: {
            driveLoggedIn: false
          }
        }
      }
    );

    // Should show the loading UI
    expect(screen.getByText('Connecting to Google Drive...')).toBeInTheDocument();
  });

  test('connected component works with Redux store (logged in)', () => {
    // Use the actual component import with Redux connection
    const ConnectedComponent = require('../../components/GoogleDriveAuthCheck').default;
    
    renderWithRedux(
      <MemoryRouter>
        <ConnectedComponent>
          <div data-testid="children-content">Connected Content</div>
        </ConnectedComponent>
      </MemoryRouter>,
      {
        initialState: {
          googledrive: {
            driveLoggedIn: true
          }
        }
      }
    );

    // Should show children when logged in
    expect(screen.getByTestId('children-content')).toBeInTheDocument();
    expect(screen.getByText('Connected Content')).toBeInTheDocument();
  });

  test('connected component shows loading UI when not logged in', () => {
    // Use the actual component import with Redux connection
    const ConnectedComponent = require('../../components/GoogleDriveAuthCheck').default;
    
    renderWithRedux(
      <MemoryRouter>
        <ConnectedComponent showPrompt={true}>
          <div data-testid="children-content">Connected Content</div>
        </ConnectedComponent>
      </MemoryRouter>,
      {
        initialState: {
          googledrive: {
            driveLoggedIn: false
          }
        }
      }
    );

    // Should show loading UI
    expect(screen.getByText('Connecting to Google Drive...')).toBeInTheDocument();
  });

  test('handles undefined children gracefully', () => {
    renderWithRedux(
      <MemoryRouter>
        <GoogleDriveAuthCheck driveLoggedIn={true} />
      </MemoryRouter>,
      {
        initialState: {
          googledrive: {
            driveLoggedIn: true
          }
        }
      }
    );

    // Should not crash and should not show loading UI
    expect(screen.queryByText('Connecting to Google Drive...')).not.toBeInTheDocument();
  });

  test('handles multiple children correctly when logged in', () => {
    renderWithRedux(
      <MemoryRouter>
        <GoogleDriveAuthCheck>
          <div data-testid="first-child">First Child</div>
          <div data-testid="second-child">Second Child</div>
        </GoogleDriveAuthCheck>
      </MemoryRouter>,
      {
        initialState: {
          googledrive: {
            driveLoggedIn: true
          }
        }
      }
    );

    // Should render both children
    expect(screen.getByTestId('first-child')).toBeInTheDocument();
    expect(screen.getByTestId('second-child')).toBeInTheDocument();
  });

  test('updates Redux state to logged in when URL contains drive_auth=success', async () => {
    renderWithRedux(
      <MemoryRouter initialEntries={['/somepath?drive_auth=success']}>
        <GoogleDriveAuthCheck>
          <div data-testid="children-content">Protected Content after OAuth</div>
        </GoogleDriveAuthCheck>
      </MemoryRouter>,
      {
        initialState: {
          googledrive: {
            driveLoggedIn: false
          }
        }
      }
    );
    
    // Wait for the effect in GoogleDriveAuthCheck to run and update the state.
    // The children should eventually appear when driveLoggedIn becomes true.
    await waitFor(() => {
      expect(screen.getByTestId('children-content')).toBeInTheDocument();
    });
    expect(screen.queryByText('Google Drive Authentication Required')).not.toBeInTheDocument();
  });
});
