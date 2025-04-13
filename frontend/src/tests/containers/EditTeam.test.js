// EditTeam.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import EditTeam from '../../containers/EditTeam';
import rootReducer from '../../reducers';
import axiosInstance from '../../utils/axiosConfig';
import * as teamActions from '../../actions/team';

process.env.REACT_APP_API_URL = 'http://localhost:8000';

// Mock axios
jest.mock('../../utils/axiosConfig');

// Mock the router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' })
}));

// Update your mock implementation to return a function (thunk)
jest.mock('../../actions/team', () => {
    const originalModule = jest.requireActual('../../actions/team');
    
    return {
        editTeam: jest.fn((teamId, name, description) => dispatch => {
            dispatch({ type: 'EDIT_TEAM_SUCCESS' });
            return Promise.resolve();
        }),
        updateMemberRole: jest.fn((teamId, userId, role) => dispatch => {
            dispatch({ type: 'UPDATE_MEMBER_ROLE_SUCCESS' });
            return Promise.resolve();
        }),
        removeMember: jest.fn((teamId, userId) => dispatch => {
            dispatch({ type: 'REMOVE_MEMBER_SUCCESS' });
            return Promise.resolve();
        }),
        fetchTeams: jest.fn(() => dispatch => Promise.resolve())
    };
});

describe('EditTeam Component', () => {
    let store;
    
    beforeEach(() => {
        store = configureStore({
            reducer: rootReducer,
            preloadedState: {
                auth: {
                    isAuthenticated: true,
                    user: { id: 101, name: 'Test User' }
                }
            }
        });
        
        // Update API mocks:
        axiosInstance.get.mockImplementation((url) => {
            // For team details: now include a members array
            if (url === `${process.env.REACT_APP_API_URL}/api/teams/1/`) {
                return Promise.resolve({ 
                    data: { 
                        id: 1, 
                        name: 'Team Alpha', 
                        description: 'Test description',
                        // Include the members array
                        members: [
                            { id: 1, user: 101, user_name: 'Test User', role: 'owner' },
                            { id: 2, user: 102, user_name: 'Team Member', role: 'member' }
                        ]
                    }
                });
            } 
            // For team members via users-in-same-team endpoint
            else if (url === `${process.env.REACT_APP_API_URL}/api/teams/1/users-in-same-team/`) {
                return Promise.resolve({ 
                    data: [
                        { id: 1, user: 101, user_name: 'Test User', role: 'owner' },
                        { id: 2, user: 102, user_name: 'Team Member', role: 'member' }
                    ]
                });
            }
            return Promise.resolve({ data: [] });
        });
        
        jest.clearAllMocks();
        // Mock window.confirm
        window.confirm = jest.fn(() => true);
    });
    
    test('renders the edit team form with team data', async () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <EditTeam />
                </BrowserRouter>
            </Provider>
        );
        
        // Wait for the team name input to appear by searching for an input 
        // with placeholder "Team Name*"
        const nameInput = await waitFor(() => 
            screen.getByPlaceholderText('Team Name*')
        );
        expect(nameInput.value).toBe('Team Alpha');
        
        // Similarly, check description input or textarea by its placeholder
        const descInput = screen.getByPlaceholderText('Description');
        expect(descInput.value).toBe('Test description');
        
        // Check for team members heading
        expect(screen.getByText(/Team Members/i)).toBeInTheDocument();
    });
    
    test('handles team update submission', async () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <EditTeam />
                </BrowserRouter>
            </Provider>
        );
        
        // Wait for inputs to load
        const nameInput = await waitFor(() => 
            screen.getByPlaceholderText('Team Name*')
        );
        const descInput = screen.getByPlaceholderText('Description');
        
        // Ensure pre-filled values are present
        expect(nameInput.value).toBe('Team Alpha');
        expect(descInput.value).toBe('Test description');
        
        // Change form values
        fireEvent.change(nameInput, { target: { value: 'Updated Team Name' } });
        fireEvent.change(descInput, { target: { value: 'Updated description' } });
        
        // Find and click the submit button (button with text "Update Team")
        const submitButton = screen.getByRole('button', { name: /update team/i });
        fireEvent.click(submitButton);
        
        // Check if editTeam was called with new values
        await waitFor(() => {
            expect(teamActions.editTeam).toHaveBeenCalledWith(
                '1', 
                'Updated Team Name', 
                'Updated description'
            );
        });
    });
    
    test('allows changing member roles', async () => {
        // Mock the API calls with the exact URL your component is using
        axiosInstance.get.mockImplementation((url) => {
            if (url === `${process.env.REACT_APP_API_URL}/api/teams/1/`) {
                return Promise.resolve({ 
                    data: { 
                        id: 1, 
                        name: 'Team Alpha', 
                        description: 'Test description',
                        members: [
                            { id: 1, user: 101, user_name: 'Test User', role: 'owner' },
                            { id: 2, user: 102, user_name: 'Team Member', role: 'member' }
                        ]
                    }
                });
            } 
            else if (url === `${process.env.REACT_APP_API_URL}/api/teams/1/users-in-same-team/`) {
                return Promise.resolve({ 
                    data: [
                        { id: 1, user: 101, user_name: 'Test User', role: 'owner' },
                        { id: 2, user: 102, user_name: 'Team Member', role: 'member' }
                    ]
                });
            }
            return Promise.resolve({ data: [] });
        });
        
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <EditTeam />
                </BrowserRouter>
            </Provider>
        );
        
        // Wait for the team name input
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Team Name*')).toBeInTheDocument();
        });
        
        // Now wait for the members to appear by looking for the team member name text
        await waitFor(() => {
            expect(screen.getByText('Team Member')).toBeInTheDocument();
        });
        
        // Instead of relying on getAllByRole('listitem'), we can query all <li> elements within the members list.
        const memberList = screen.getByRole('list'); // The <ul> should have role "list"
        const listItems = within(memberList).getAllByRole('listitem');
        expect(listItems.length).toBeGreaterThan(0);
        
        // Find the list item that contains "Team Member"
        const teamMemberItem = listItems.find(item => item.textContent.includes('Team Member'));
        expect(teamMemberItem).toBeDefined();
        
        // Within that list item, find the role select (role "combobox")
        const roleSelect = within(teamMemberItem).getByRole('combobox');
        fireEvent.change(roleSelect, { target: { value: 'admin' } });
        
        // Check if updateMemberRole was called with the right parameters.
        await waitFor(() => {
            expect(teamActions.updateMemberRole).toHaveBeenCalledWith('1', 102, 'admin');
        });
    });
    
    test('allows removing team members', async () => {
        // Ensure members are loaded; update mocks if needed.
        axiosInstance.get.mockImplementation((url) => {
            if (url === `${process.env.REACT_APP_API_URL}/api/teams/1/`) {
                return Promise.resolve({ 
                    data: { 
                        id: 1, 
                        name: 'Team Alpha', 
                        description: 'Test description',
                        members: [
                            { id: 1, user: 101, user_name: 'Test User', role: 'owner' },
                            { id: 2, user: 102, user_name: 'Team Member', role: 'member' }
                        ]
                    }
                });
            } 
            else if (
                url === `${process.env.REACT_APP_API_URL}/api/teams/1/users-in-same-team/`
            ) {
                return Promise.resolve({ 
                    data: [
                        { id: 1, user: 101, user_name: 'Test User', role: 'owner' },
                        { id: 2, user: 102, user_name: 'Team Member', role: 'member' }
                    ]
                });
            }
            return Promise.resolve({ data: [] });
        });
        
        const { container } = render(
            <Provider store={store}>
                <BrowserRouter>
                    <EditTeam />
                </BrowserRouter>
            </Provider>
        );
        
        // Wait for the team members to load by waiting for the "Team Member" text
        await waitFor(() => {
            expect(screen.getByText('Team Member')).toBeInTheDocument();
        });
        
        // Find the list item containing "Team Member"
        const liElements = container.querySelectorAll('li');
        expect(liElements.length).toBeGreaterThan(0);
        const teamMemberItem = Array.from(liElements).find(item => item.textContent.includes('Team Member'));
        expect(teamMemberItem).toBeDefined();
        
        // The SVG trash icon is not a button element but an SVG with class "text-danger"
        // We need to target it directly since it doesn't have a role
        const trashIcon = teamMemberItem.querySelector('svg.text-danger');
        expect(trashIcon).toBeTruthy();
        
        // Fire click event on the trash icon
        fireEvent.click(trashIcon);
        
        // Verify that window.confirm was called
        expect(window.confirm).toHaveBeenCalled();
        
        // Verify that removeMember was called with team id '1' and user id 102
        await waitFor(() => {
            expect(teamActions.removeMember).toHaveBeenCalledWith('1', 102);
        });
    });
});
