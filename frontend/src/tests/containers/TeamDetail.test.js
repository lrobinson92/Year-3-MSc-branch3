// TeamDetail.test.js
import React from 'react';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithRedux } from '../../setupTests';
import TeamDetail from '../../containers/TeamDetail';
import axiosInstance from '../../utils/axiosConfig';

// Mock axios
jest.mock('../../utils/axiosConfig');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

// Mock Google Drive auth utils
jest.mock('../../utils/driveAuthUtils', () => ({
    redirectToGoogleDriveLogin: jest.fn()
}));

describe('TeamDetail Container', () => {
    const mockTeam = {
        id: 1,
        name: 'Test Team',
        description: 'Test Description',
        members: [
            { id: 1, user: 101, user_name: 'John Doe', role: 'owner' },
            { id: 2, user: 102, user_name: 'Jane Smith', role: 'member' }
        ]
    };

    const mockTasks = [
        { 
            id: 1, 
            description: 'Task 1', 
            team: 1, 
            status: 'not_started', 
            assigned_to: 101, 
            assigned_to_name: 'John Doe',
            due_date: '2023-12-01'
        },
        { 
            id: 2, 
            description: 'Task 2', 
            team: 1, 
            status: 'in_progress', 
            assigned_to: 102, 
            assigned_to_name: 'Jane Smith',
            due_date: '2023-12-15'
        }
    ];

    const mockDocuments = [
        { id: 1, title: 'Document 1', owner: 101, team: 1, created_at: '2023-11-01T12:00:00Z' },
        { id: 2, title: 'Document 2', owner: 102, team: 1, created_at: '2023-11-10T15:30:00Z' }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock API responses
        axiosInstance.get.mockImplementation((url) => {
            if (url.includes('/api/teams/1/')) {
                return Promise.resolve({ data: mockTeam });
            } else if (url.includes('/api/tasks/')) {
                return Promise.resolve({ data: mockTasks });
            } else if (url.includes('/api/documents/team/1/')) {
                return Promise.resolve({ data: mockDocuments });
            }
            return Promise.reject(new Error('Not found'));
        });
    });

    test('renders team details when authenticated', async () => {
        renderWithRedux(
            <MemoryRouter initialEntries={['/team/1']}>
                <Routes>
                    <Route path="/team/:teamId" element={<TeamDetail />} />
                </Routes>
            </MemoryRouter>,
            {
                initialState: {
                    auth: {
                        isAuthenticated: true,
                        user: { id: 101, name: 'John Doe' }
                    },
                    googledrive: {
                        driveLoggedIn: true
                    }
                }
            }
        );

        // Wait for team details to load
        await waitFor(() => {
            expect(screen.getByText('Test Team')).toBeInTheDocument();
        });

        // Check for team description
        expect(screen.getByText('Description: Test Description')).toBeInTheDocument();

        // Check for member initials (using title attribute that includes either "(Owner)" or "(Member)")
        const memberInitials = screen.getAllByTitle((content) =>
            content.includes('(Owner)') || content.includes('(Member)')
        );
        expect(memberInitials).toHaveLength(2);

        // Check that tasks are rendered
        // Use a more flexible approach to find task text which might be split across elements
        await waitFor(() => {
            // Option 1: Look for exact text
            expect(screen.getByText('Task 1', { exact: false })).toBeInTheDocument();
            expect(screen.getByText('Task 2', { exact: false })).toBeInTheDocument();
            
            // OR Option 2: Use a function matcher instead of regex
            // expect(screen.getByText((content, element) => {
            //    return content.includes('Task 1');
            // })).toBeInTheDocument();
        });

        // Check for documents by their titles
        expect(screen.getByText('Document 1')).toBeInTheDocument();
        expect(screen.getByText('Document 2')).toBeInTheDocument();
    });

    test('allows document deletion for owners', async () => {
        axiosInstance.delete.mockResolvedValue({});
    
        renderWithRedux(
            <MemoryRouter initialEntries={['/team/1']}>
                <Routes>
                    <Route path="/team/:teamId" element={<TeamDetail />} />
                </Routes>
            </MemoryRouter>,
            {
                initialState: {
                    auth: {
                        isAuthenticated: true,
                        user: { id: 101, name: 'John Doe' } // This user is the team owner
                    },
                    googledrive: {
                        driveLoggedIn: true
                    }
                }
            }
        );
    
        // Wait for documents to load
        await waitFor(() => {
            expect(screen.getByText('Document 1')).toBeInTheDocument();
        });
    
        // Locate a document card by its title and then find its container.
        const documentTitle = screen.getByText('Document 1');
        // Adjust this selector if your DocumentGrid uses a different container class.
        const documentCard = documentTitle.closest('.card');
        expect(documentCard).toBeInTheDocument();
    
        // Within the document card, find the dropdown toggle using its aria-label.
        const menuToggle = within(documentCard).getByRole('button', { name: /document options/i });
        fireEvent.click(menuToggle);
    
        // Click the delete option in THIS document's dropdown menu
        const deleteOption = within(documentCard).getByRole('button', { name: /delete/i });
        fireEvent.click(deleteOption);
    
        // Confirmation modal should appear.
        await waitFor(() => {
            // Look for modal dialog with "Delete Document" text
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
    
        // Find the actual "Delete" or "Confirm" button in the modal
        // This is more reliable than using getAllByText
        const modal = screen.getByRole('dialog');
        const confirmButton = within(modal).getByText(/delete/i, { 
            selector: 'button, [role="button"]'
        });
        
        fireEvent.click(confirmButton);
    
        // Check if the delete API was called.
        await waitFor(() => {
            expect(axiosInstance.delete).toHaveBeenCalled();
        });
    });

    test('redirects to Google Drive login when not authenticated with Drive', async () => {
        const { redirectToGoogleDriveLogin } = require('../../utils/driveAuthUtils');

        renderWithRedux(
            <MemoryRouter initialEntries={['/team/1']}>
                <Routes>
                    <Route path="/team/:teamId" element={<TeamDetail />} />
                </Routes>
            </MemoryRouter>,
            {
                initialState: {
                    auth: {
                        isAuthenticated: true,
                        user: { id: 101, name: 'John Doe' }
                    },
                    googledrive: {
                        driveLoggedIn: false // Not logged into Drive
                    }
                }
            }
        );

        // Wait for team details to load
        await waitFor(() => {
            expect(screen.getByText('Test Team')).toBeInTheDocument();
        });

        // Should show connect to Google Drive button
        const connectButton = screen.getByText(/Connect Google Drive/i);
        expect(connectButton).toBeInTheDocument();

        // Click on a document (simulate a click on "Document 1" title)
        const document = await screen.findByText('Document 1');
        fireEvent.click(document);

        // Should redirect to Google Drive auth (i.e. the redirect utility should be called)
        expect(redirectToGoogleDriveLogin).toHaveBeenCalled();
    });

    test('allows creating new tasks', async () => {
        renderWithRedux(
            <MemoryRouter initialEntries={['/team/1']}>
                <Routes>
                    <Route path="/team/:teamId" element={<TeamDetail />} />
                </Routes>
            </MemoryRouter>,
            {
                initialState: {
                    auth: {
                        isAuthenticated: true,
                        user: { id: 101, name: 'John Doe' }
                    },
                    googledrive: {
                        driveLoggedIn: true
                    }
                }
            }
        );

        // Wait for team details to load
        await waitFor(() => {
            expect(screen.getByText('Test Team')).toBeInTheDocument();
        });

        // Find and click the Create Task link - it's an anchor tag, not a button
        const createTaskButton = screen.getByText('Create Task');
        fireEvent.click(createTaskButton);

        // Check if navigation occurred - no need to check navigation with mockNavigate
        // for anchor tags since they use the href attribute for navigation
        expect(createTaskButton.getAttribute('href')).toBe('/create-task?teamId=1');
    });

    test('allows team owners to invite new members', async () => {
        renderWithRedux(
            <MemoryRouter initialEntries={['/team/1']}>
                <Routes>
                    <Route path="/team/:teamId" element={<TeamDetail />} />
                </Routes>
            </MemoryRouter>,
            {
                initialState: {
                    auth: {
                        isAuthenticated: true,
                        user: { id: 101, name: 'John Doe' } // This user is a team owner
                    },
                    googledrive: {
                        driveLoggedIn: true
                    }
                }
            }
        );

        // Wait for team details to load
        await waitFor(() => {
            expect(screen.getByText('Test Team')).toBeInTheDocument();
        });

        // Find and verify the Invite Member link
        const inviteButton = screen.getByText(/Invite Member/i);
        expect(inviteButton).toBeInTheDocument();
        
        // Check the href attribute instead of using mockNavigate
        expect(inviteButton.getAttribute('href')).toBe('/invite-member/1');
        
        // Optionally: Click the link
        fireEvent.click(inviteButton);
    });

    test('allows adding new documents', async () => {
        renderWithRedux(
            <MemoryRouter initialEntries={['/team/1']}>
                <Routes>
                    <Route path="/team/:teamId" element={<TeamDetail />} />
                </Routes>
            </MemoryRouter>,
            {
                initialState: {
                    auth: {
                        isAuthenticated: true,
                        user: { id: 101, name: 'John Doe' }
                    },
                    googledrive: {
                        driveLoggedIn: true
                    }
                }
            }
        );

        // Wait for team details to load
        await waitFor(() => {
            expect(screen.getByText('Test Team')).toBeInTheDocument();
        });

        // Find and verify the Add Document link
        const addDocumentButton = screen.getByText(/Add Document/i);
        expect(addDocumentButton).toBeInTheDocument();
        
        // Check the href attribute instead of using mockNavigate
        expect(addDocumentButton.getAttribute('href')).toBe('/create-document?teamId=1');
        
        // Optionally: Click the link
        fireEvent.click(addDocumentButton);
    });

    test('handles error when loading team data', async () => {
        // Mock error for team data fetch
        axiosInstance.get.mockImplementation((url) => {
            if (url.includes('/api/teams/1/')) {
                return Promise.reject(new Error('Failed to load team'));
            }
            return Promise.resolve({ data: [] });
        });

        renderWithRedux(
            <MemoryRouter initialEntries={['/team/1']}>
                <Routes>
                    <Route path="/team/:teamId" element={<TeamDetail />} />
                </Routes>
            </MemoryRouter>,
            {
                initialState: {
                    auth: {
                        isAuthenticated: true,
                        user: { id: 101, name: 'John Doe' }
                    },
                    googledrive: {
                        driveLoggedIn: true
                    }
                }
            }
        );

        // Should show error message
        await waitFor(() => {
            expect(screen.getByText(/Failed to load team data/i)).toBeInTheDocument();
        });
    });

    test('navigates to document viewer when logged into Drive', async () => {
        renderWithRedux(
            <MemoryRouter initialEntries={['/team/1']}>
                <Routes>
                    <Route path="/team/:teamId" element={<TeamDetail />} />
                </Routes>
            </MemoryRouter>,
            {
                initialState: {
                    auth: {
                        isAuthenticated: true,
                        user: { id: 101, name: 'John Doe' }
                    },
                    googledrive: {
                        driveLoggedIn: true // Already logged into Drive
                    }
                }
            }
        );

        // Wait for documents to load
        await waitFor(() => {
            expect(screen.getByText('Document 1')).toBeInTheDocument();
        });

        // Click on a document
        const document = screen.getByText('Document 1');
        fireEvent.click(document);

        // Should navigate to document viewer
        expect(mockNavigate).toHaveBeenCalledWith('/view/sop/1');
    });

    test('shows correct member initials and roles', async () => {
        renderWithRedux(
            <MemoryRouter initialEntries={['/team/1']}>
                <Routes>
                    <Route path="/team/:teamId" element={<TeamDetail />} />
                </Routes>
            </MemoryRouter>,
            {
                initialState: {
                    auth: {
                        isAuthenticated: true,
                        user: { id: 101, name: 'John Doe' }
                    },
                    googledrive: {
                        driveLoggedIn: true
                    }
                }
            }
        );

        // Wait for team details to load
        await waitFor(() => {
            expect(screen.getByText('Test Team')).toBeInTheDocument();
        });

        // Check for specific members
        const johnInitial = screen.getByTitle("John Doe (Owner)");
        expect(johnInitial).toBeInTheDocument();
        expect(johnInitial.textContent).toBe("J");

        const janeInitial = screen.getByTitle("Jane Smith (Member)");
        expect(janeInitial).toBeInTheDocument();
        expect(janeInitial.textContent).toBe("J");
    });
});
