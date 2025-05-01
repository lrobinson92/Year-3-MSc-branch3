// ViewSOP.test.js
import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithRedux } from '../../setupTests';
import ViewSOP from '../../containers/ViewSOP';
import axiosInstance from '../../utils/axiosConfig';

// Mock the axios instance so we can control API responses
jest.mock('../../utils/axiosConfig');

// Mock the React Router useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('ViewSOP Component', () => {
  const user = { id: 1, name: "Test User" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders document view with Edit Document button when user is document owner', async () => {
    // Mock calls:
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/google-drive/file-content/14/') {
        return Promise.resolve({
          data: {
            title: 'Test Document',
            content: '<p>Test Content</p>',
            file_url: 'http://google.com/document?id=14'
          }
        });
      }
      if (url === '/api/documents/14/') {
        // The document is owned by the user (id: 1)
        return Promise.resolve({
          data: { owner: 1, team: null }
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    renderWithRedux(
      <MemoryRouter initialEntries={['/view/sop/14']}>
        <Routes>
          <Route path="/view/sop/:id" element={<ViewSOP />} />
        </Routes>
      </MemoryRouter>,
      {
        initialState: {
          auth: {
            isAuthenticated: true,
            user: user
          },
          googledrive: {
            driveLoggedIn: true
          }
        }
      }
    );

    // Wait until the document title appears.
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Document');
    });

    // The "Edit Document" button should be displayed.
    const editButton = screen.getByRole('link', { name: /Edit Document/i });
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveAttribute('href', 'http://google.com/document?id=14');

    // Verify that the document content is rendered.
    expect(screen.getByText(/Test Content/i)).toBeInTheDocument();
  });

  test('renders read-only badge when user is not document owner', async () => {
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/google-drive/file-content/14/') {
        return Promise.resolve({
          data: {
            title: 'Read-Only Doc',
            content: '<p>Content here</p>',
            file_url: 'http://google.com/document?id=14'
          }
        });
      }
      if (url === '/api/documents/14/') {
        // The document is not owned by the logged in user.
        return Promise.resolve({
          data: { owner: 2, team: null }
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    renderWithRedux(
      <MemoryRouter initialEntries={['/view/sop/14']}>
        <Routes>
          <Route path="/view/sop/:id" element={<ViewSOP />} />
        </Routes>
      </MemoryRouter>,
      {
        initialState: {
          auth: {
            isAuthenticated: true,
            user: user
          },
          googledrive: {
            driveLoggedIn: true
          }
        }
      }
    );

    // Wait until the document title appears.
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Read-Only Doc');
    });

    // The "Edit Document" button should NOT be rendered, and a "Read Only" badge appears.
    expect(screen.queryByRole('link', { name: /Edit Document/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Read Only/i)).toBeInTheDocument();
  });

  test('renders loading state initially', () => {
    axiosInstance.get.mockImplementation(() => new Promise(resolve => {})); // Never resolves
    
    renderWithRedux(
      <MemoryRouter initialEntries={['/view/sop/14']}>
        <Routes>
          <Route path="/view/sop/:id" element={<ViewSOP />} />
        </Routes>
      </MemoryRouter>,
      {
        initialState: {
          auth: {
            isAuthenticated: true,
            user: { id: 1, name: "Test User" }
          },
          googledrive: {
            driveLoggedIn: true
          }
        }
      }
    );
    
    expect(screen.getByText('Loading document...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Spinner
  });

  test('renders error message when document loading fails', async () => {
    axiosInstance.get.mockRejectedValue(new Error('API error'));
    
    renderWithRedux(
      <MemoryRouter initialEntries={['/view/sop/14']}>
        <Routes>
          <Route path="/view/sop/:id" element={<ViewSOP />} />
        </Routes>
      </MemoryRouter>,
      {
        initialState: {
          auth: {
            isAuthenticated: true,
            user: { id: 1, name: "Test User" }
          },
          googledrive: {
            driveLoggedIn: true
          }
        }
      }
    );
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load file content.')).toBeInTheDocument();
    });
  });
  
  test('renders edit button for team members', async () => {
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/google-drive/file-content/14/') {
        return Promise.resolve({
          data: {
            title: 'Team Document',
            content: '<p>Team Content</p>',
            file_url: 'http://google.com/document?id=14'
          }
        });
      }
      if (url === '/api/documents/14/') {
        return Promise.resolve({
          data: { owner: 2, team: 5 } // Different owner, team document
        });
      }
      if (url === '/api/teams/5/') {
        return Promise.resolve({
          data: {
            name: 'Test Team',
            members: [
              { user: 1, role: 'member' } // Current user is a member
            ]
          }
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  
    renderWithRedux(
      <MemoryRouter initialEntries={['/view/sop/14']}>
        <Routes>
          <Route path="/view/sop/:id" element={<ViewSOP />} />
        </Routes>
      </MemoryRouter>,
      {
        initialState: {
          auth: {
            isAuthenticated: true,
            user: { id: 1, name: "Test User" }
          },
          googledrive: {
            driveLoggedIn: true
          }
        }
      }
    );
  
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Team Document');
    });
  
    // The edit button should be visible since user is a team member
    expect(screen.getByRole('link', { name: /Edit Document/i })).toBeInTheDocument();
  });

  test('renders read-only for team admins', async () => {
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/google-drive/file-content/14/') {
        return Promise.resolve({
          data: {
            title: 'Admin Access Doc',
            content: '<p>Admin Content</p>',
            file_url: 'http://google.com/document?id=14'
          }
        });
      }
      if (url === '/api/documents/14/') {
        return Promise.resolve({
          data: { owner: 2, team: 5 } // Different owner, team document
        });
      }
      if (url === '/api/teams/5/') {
        return Promise.resolve({
          data: {
            name: 'Test Team',
            members: [
              { user: 1, role: 'admin' } // Current user is an admin
            ]
          }
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  
    renderWithRedux(
      <MemoryRouter initialEntries={['/view/sop/14']}>
        <Routes>
          <Route path="/view/sop/:id" element={<ViewSOP />} />
        </Routes>
      </MemoryRouter>,
      {
        initialState: {
          auth: {
            isAuthenticated: true,
            user: { id: 1, name: "Test User" }
          },
          googledrive: {
            driveLoggedIn: true
          }
        }
      }
    );
  
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Admin Access Doc');
    });
  
    // Should show read-only badge
    expect(screen.getByText(/Read Only/i)).toBeInTheDocument();
    
    // Should show the info alert about admin access
    expect(screen.getByText(/You have read-only access to this document as an admin of this team./i)).toBeInTheDocument();
  });

  test('renders GoogleDriveAuthCheck when Drive not logged in', async () => {
    renderWithRedux(
      <MemoryRouter initialEntries={['/view/sop/14']}>
        <Routes>
          <Route path="/view/sop/:id" element={<ViewSOP />} />
        </Routes>
      </MemoryRouter>,
      {
        initialState: {
          auth: {
            isAuthenticated: true,
            user: { id: 1, name: "Test User" }
          },
          googledrive: {
            driveLoggedIn: false // Not logged into Drive
          }
        }
      }
    );
  
    // Should show the Google Drive authentication prompt
    expect(screen.getByText('Connecting to Google Drive...')).toBeInTheDocument();
    
    // The document content should not be loaded
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  test('handles null user gracefully', async () => {
    // Mock implementation without any API calls
    axiosInstance.get.mockImplementation(() => new Promise(resolve => {}));
    
    renderWithRedux(
      <MemoryRouter initialEntries={['/view/sop/14']}>
        <Routes>
          <Route path="/view/sop/:id" element={<ViewSOP />} />
        </Routes>
      </MemoryRouter>,
      {
        initialState: {
          auth: {
            isAuthenticated: true,
            user: null // User data not loaded yet
          },
          googledrive: {
            driveLoggedIn: true
          }
        }
      }
    );
    
    // Should not crash and should not make API calls
    expect(axiosInstance.get).not.toHaveBeenCalled();
  });

  test('navigates back when back arrow is clicked', async () => {
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/google-drive/file-content/14/') {
        return Promise.resolve({
          data: {
            title: 'Test Document',
            content: '<p>Test Content</p>',
            file_url: 'http://google.com/document?id=14'
          }
        });
      }
      if (url === '/api/documents/14/') {
        return Promise.resolve({
          data: { owner: 1, team: null }
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
    
    const { getByTitle } = renderWithRedux(
      <MemoryRouter initialEntries={['/view/sop/14']}>
        <Routes>
          <Route path="/view/sop/:id" element={<ViewSOP />} />
        </Routes>
      </MemoryRouter>,
      {
        initialState: {
          auth: {
            isAuthenticated: true,
            user: { id: 1 }
          },
          googledrive: {
            driveLoggedIn: true
          }
        }
      }
    );
    
    await waitFor(() => {
      expect(screen.getByTitle('Go back to previous page')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByTitle('Go back to previous page'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

});
