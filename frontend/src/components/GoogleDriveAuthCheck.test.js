import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithRedux } from '../setupTests';
import GoogleDriveAuthCheck from './GoogleDriveAuthCheck';
import { googleDriveLogin } from '../actions/googledrive';

// Mock the googleDriveLogin action
jest.mock('../actions/googledrive', () => ({
  googleDriveLogin: jest.fn(() => ({ type: 'GOOGLE_DRIVE_LOGIN' }))
}));

describe('GoogleDriveAuthCheck', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test('renders auth prompt when not logged in', () => {
    renderWithRedux(
      <GoogleDriveAuthCheck>
        <div data-testid="children-content">Protected Content</div>
      </GoogleDriveAuthCheck>,
      {
        initialState: {
          googledrive: {
            driveLoggedIn: false
          }
        }
      }
    );

    // Should show the auth prompt
    expect(screen.getByText('Google Drive Authentication Required')).toBeInTheDocument();
    expect(screen.getByText(/To view, create or edit documents/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Connect Google Drive/i })).toBeInTheDocument();
    
    // Should not show the children
    expect(screen.queryByTestId('children-content')).not.toBeInTheDocument();
  });

  test('does not render auth prompt when logged in', () => {
    renderWithRedux(
      <GoogleDriveAuthCheck>
        <div data-testid="children-content">Protected Content</div>
      </GoogleDriveAuthCheck>,
      {
        initialState: {
          googledrive: {
            driveLoggedIn: true
          }
        }
      }
    );

    // Should not show the auth prompt
    expect(screen.queryByText('Google Drive Authentication Required')).not.toBeInTheDocument();
    
    // Should show the children
    expect(screen.getByTestId('children-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('clicking the connect button calls googleDriveLogin', () => {
    renderWithRedux(
      <GoogleDriveAuthCheck />,
      {
        initialState: {
          googledrive: {
            driveLoggedIn: false
          }
        }
      }
    );

    // Click the connect button
    fireEvent.click(screen.getByRole('button', { name: /Connect Google Drive/i }));
    
    // Check that the action creator was called
    expect(googleDriveLogin).toHaveBeenCalledTimes(1);
  });

  test('does not show prompt when showPrompt is false', () => {
    renderWithRedux(
      <GoogleDriveAuthCheck 
        showPrompt={false}
      >
        <div data-testid="children-content">Protected Content</div>
      </GoogleDriveAuthCheck>,
      {
        initialState: {
          googledrive: {
            driveLoggedIn: false
          }
        }
      }
    );

    // Should not show the auth prompt
    expect(screen.queryByText('Google Drive Authentication Required')).not.toBeInTheDocument();
    
    // Should render children even though not logged in (because showPrompt is false)
    expect(screen.getByTestId('children-content')).toBeInTheDocument();
  });

  test('renders nothing when not logged in and no children', () => {
    const { container } = renderWithRedux(
      <GoogleDriveAuthCheck />,
      {
        initialState: {
          googledrive: {
            driveLoggedIn: false
          }
        }
      }
    );

    // Should show the auth prompt
    expect(screen.getByText('Google Drive Authentication Required')).toBeInTheDocument();
    
    // Container should only have the auth prompt
    expect(container.firstChild).toHaveClass('google-auth-prompt');
  });

  test('connected component works with Redux store', () => {
    // Use the actual component import with Redux connection
    const ConnectedComponent = require('./GoogleDriveAuthCheck').default;
    
    renderWithRedux(
      <ConnectedComponent>
        <div data-testid="children-content">Connected Content</div>
      </ConnectedComponent>,
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

  test('connected component shows auth prompt when not logged in', () => {
    // Use the actual component import with Redux connection
    const ConnectedComponent = require('./GoogleDriveAuthCheck').default;
    
    renderWithRedux(
      <ConnectedComponent>
        <div data-testid="children-content">Connected Content</div>
      </ConnectedComponent>,
      {
        initialState: {
          googledrive: {
            driveLoggedIn: false
          }
        }
      }
    );

    // Should show auth prompt
    expect(screen.getByText('Google Drive Authentication Required')).toBeInTheDocument();
  });

  test('handles undefined children gracefully', () => {
    const { container } = renderWithRedux(
      <GoogleDriveAuthCheck />,
      {
        initialState: {
          googledrive: {
            driveLoggedIn: true
          }
        }
      }
    );

    // Should render an empty fragment
    expect(container.firstChild).toBeNull();
  });

  test('handles multiple children correctly when logged in', () => {
    renderWithRedux(
      <GoogleDriveAuthCheck>
        <div data-testid="first-child">First Child</div>
        <div data-testid="second-child">Second Child</div>
      </GoogleDriveAuthCheck>,
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
});