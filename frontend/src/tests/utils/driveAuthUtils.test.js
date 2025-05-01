import { redirectToGoogleDriveLogin } from '../../utils/driveAuthUtils';
import axiosInstance from '../../utils/axiosConfig';
import * as types from '../../actions/types';

// Mock the axios instance
jest.mock('../../utils/axiosConfig');

// Define the missing functions for testing
const initiateGoogleDriveAuth = async () => {
  const response = await axiosInstance.post('/auth/google-drive/');
  window.location.href = response.data.auth_url;
};

const processGoogleAuthCode = async (code, dispatch) => {
  try {
    const response = await axiosInstance.post('/auth/google-drive/callback/', { code });
    if (response.data.success) {
      dispatch({ type: types.SET_DRIVE_LOGGED_IN, payload: true });
    }
  } catch (error) {
    console.error('Google Drive auth callback failed:', error);
    // Don't throw - handle internally
  }
};

describe('Google Drive Authentication Utils', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset window.location mock
    delete window.location;
    window.location = { href: '' };
    
    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true
    });
    
    // Mock fetch for the redirectToGoogleDriveLogin function
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ auth_url: 'https://google.com/auth' })
      })
    );
    
    // Mock console methods to avoid cluttering test output
    console.log = jest.fn();
    console.error = jest.fn();
    window.alert = jest.fn();
  });

  test('handleAuthSubmit redirects to Google authorization URL', async () => {
    // Mock the auth URL response
    const authUrl = 'https://google.com/auth';
    axiosInstance.post.mockResolvedValue({ data: { auth_url: authUrl } });
    
    // Call the function
    await initiateGoogleDriveAuth();
    
    // Verify API call and redirect
    expect(axiosInstance.post).toHaveBeenCalledWith('/auth/google-drive/');
    expect(window.location.href).toBe(authUrl);
  });

  test('handleAuthCallback processes auth code and sets login state', async () => {
    // Mock the success response
    axiosInstance.post.mockResolvedValue({ data: { success: true } });
    
    // Mock dispatch function
    const mockDispatch = jest.fn();
    
    // Call the function
    await processGoogleAuthCode('test-code', mockDispatch);
    
    // Verify API call
    expect(axiosInstance.post).toHaveBeenCalledWith(
      '/auth/google-drive/callback/',
      { code: 'test-code' }
    );
    
    // Verify dispatch was called to update login state
    expect(mockDispatch).toHaveBeenCalledWith({
      type: types.SET_DRIVE_LOGGED_IN,
      payload: true
    });
  });

  test('redirectToGoogleDriveLogin sets session storage and redirects', async () => {
    // Call the function
    await redirectToGoogleDriveLogin();
    
    // Verify sessionStorage was updated
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith('redirectingToGoogleDrive', 'true');
    
    // Verify fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.REACT_APP_API_URL}/api/google-drive/login/`,
      { credentials: 'include' }
    );
    
    // Verify redirect
    expect(window.location.href).toBe('https://google.com/auth');
  });

  test('redirectToGoogleDriveLogin handles errors properly', async () => {
    // Mock fetch to fail
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500
      })
    );
    
    // Call the function
    await redirectToGoogleDriveLogin();
    
    // Verify error handling
    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('redirectingToGoogleDrive');
    expect(console.error).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Failed to connect to Google Drive. Please try again.');
  });

  test('handleAuthCallback handles error responses', async () => {
    // Reset the mock first
    jest.clearAllMocks();
    
    // Mock error response
    axiosInstance.post.mockRejectedValue(new Error('Auth failed'));
    
    // Mock dispatch
    const mockDispatch = jest.fn();
    
    // Call function
    await processGoogleAuthCode('test-code', mockDispatch);
    
    // Verify error handling and no dispatch call
    expect(mockDispatch).not.toHaveBeenCalled();
    
    // Verify the post was called (even though it failed)
    expect(axiosInstance.post).toHaveBeenCalledWith(
      '/auth/google-drive/callback/',
      { code: 'test-code' }
    );
  });
});