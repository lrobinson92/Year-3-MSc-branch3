import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithRedux } from '../../setupTests';
import ViewTeams from '../../containers/ViewTeams';
import axiosInstance from '../../utils/axiosConfig';

// Mock axios
jest.mock('../../utils/axiosConfig');

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

describe('ViewTeams Container', () => {
    const mockTeams = [
        {
            id: 1,
            name: 'Team Alpha',
            description: 'This is Team Alpha',
            members: [
                { id: 1, user: 101, user_name: 'John Doe', role: 'owner' }
            ]
        },
        {
            id: 2,
            name: 'Team Beta',
            description: 'This is Team Beta',
            members: [
                { id: 2, user: 101, user_name: 'John Doe', role: 'member' }
            ]
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock successful API response
        axiosInstance.get.mockResolvedValue({
            data: mockTeams
        });
    });

    test('redirects to login when not authenticated', () => {
        renderWithRedux(
            <MemoryRouter>
                <ViewTeams />
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

        // Should navigate to login
        expect(screen.queryByText('All Teams')).not.toBeInTheDocument();
    });

    test('renders teams when authenticated', async () => {
        renderWithRedux(
            <MemoryRouter>
                <ViewTeams />
            </MemoryRouter>,
            {
                initialState: {
                    auth: {
                        isAuthenticated: true,
                        user: { id: 101, name: 'John Doe' },
                        firstLogin: false
                    }
                }
            }
        );

        // Initially shows loading state
        expect(screen.getByText('Loading...')).toBeInTheDocument();

        // Wait for teams to load
        await waitFor(() => {
            expect(screen.getByText('All Teams')).toBeInTheDocument();
        });

        // Team names should be displayed
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
        expect(screen.getByText('Team Beta')).toBeInTheDocument();

        // Create New Team button should be visible
        expect(screen.getByText('+ Create New Team')).toBeInTheDocument();
    });

    test('handles API errors gracefully', async () => {
        // Mock API failure
        axiosInstance.get.mockRejectedValue(new Error('API Error'));

        renderWithRedux(
            <MemoryRouter>
                <ViewTeams />
            </MemoryRouter>,
            {
                initialState: {
                    auth: {
                        isAuthenticated: true,
                        user: { id: 101 },
                        firstLogin: false
                    }
                }
            }
        );

        // Wait for error state
        await waitFor(() => {
            expect(screen.getByText('Failed to fetch teams')).toBeInTheDocument();
        });
    });

    test('navigates to edit team page when edit is clicked', async () => {
        renderWithRedux(
            <MemoryRouter>
                <ViewTeams />
            </MemoryRouter>,
            {
                initialState: {
                    auth: {
                        isAuthenticated: true,
                        user: { id: 101, name: 'John Doe' },
                        firstLogin: false
                    }
                }
            }
        );

        await waitFor(() => {
            expect(screen.getByText('Team Alpha')).toBeInTheDocument();
        });

        // Find and click the dropdown menu for Team Alpha
        const dropdownToggle = screen.getAllByText('...')[0];
        fireEvent.click(dropdownToggle);

        // Click Edit option
        const editOption = screen.getByText('Edit');
        fireEvent.click(editOption);

        // Check if navigation occurred
        expect(mockNavigate).toHaveBeenCalledWith('/edit-team/1');
    });

    test('confirms before deleting a team', async () => {
        // Mock the window.confirm
        const originalConfirm = window.confirm;
        window.confirm = jest.fn(() => true); // User clicks "OK"
        
        // Mock successful delete
        axiosInstance.delete.mockResolvedValue({});

        renderWithRedux(
            <MemoryRouter>
                <ViewTeams />
            </MemoryRouter>,
            {
                initialState: {
                    auth: {
                        isAuthenticated: true,
                        user: { id: 101, name: 'John Doe' },
                        firstLogin: false
                    }
                }
            }
        );

        await waitFor(() => {
            expect(screen.getByText('Team Alpha')).toBeInTheDocument();
        });

        // Find and click the dropdown menu for Team Alpha
        const dropdownToggle = screen.getAllByText('...')[0];
        fireEvent.click(dropdownToggle);

        // Click Delete option
        const deleteOption = screen.getByText('Delete');
        fireEvent.click(deleteOption);

        // Check if confirm was called
        expect(window.confirm).toHaveBeenCalled();

        // Check if delete API was called
        await waitFor(() => {
            expect(axiosInstance.delete).toHaveBeenCalled();
        });

        // Restore original confirm
        window.confirm = originalConfirm;
    });
});