import { configureStore } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosConfig';
import teamReducer from '../../reducers/team';
import { 
    fetchTeams, 
    createTeam, 
    deleteTeam,
    editTeam,
    updateMemberRole,
    removeMember
} from '../../actions/team';
import {
    FETCH_TEAMS_SUCCESS,
    FETCH_TEAMS_FAIL,
    CREATE_TEAM_SUCCESS,
    CREATE_TEAM_FAIL,
    DELETE_TEAM_SUCCESS,
    DELETE_TEAM_FAIL,
    EDIT_TEAM_SUCCESS,
    EDIT_TEAM_FAIL,
    UPDATE_MEMBER_ROLE_SUCCESS,
    UPDATE_MEMBER_ROLE_FAIL,
    REMOVE_MEMBER_SUCCESS,
    REMOVE_MEMBER_FAIL
} from '../../actions/types';

// Mock axios with all methods we need
jest.mock('../../utils/axiosConfig', () => ({
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(), // Added patch method here
    put: jest.fn()
}));

describe('Team Actions', () => {
    let store;
    
    beforeEach(() => {
        // Create a store with our reducer
        store = configureStore({
            reducer: {
                team: teamReducer
            }
        });
        
        jest.clearAllMocks();
    });

    test('fetchTeams dispatches correct actions on success', async () => {
        const mockTeams = [
            { id: 1, name: 'Team 1', description: 'Description 1' },
            { id: 2, name: 'Team 2', description: 'Description 2' }
        ];

        // Set up the mock response
        axiosInstance.get.mockResolvedValue({ data: mockTeams });

        // Instead of spying on dispatch, we'll check the store state after action
        await store.dispatch(fetchTeams());
        
        // Check that the state was updated as expected
        const finalState = store.getState().team;
        expect(finalState.teams).toEqual(mockTeams);
        expect(finalState.loading).toBe(false);
        expect(finalState.error).toBeNull();
        
        // Check that axios was called correctly - with fixed expectations
        expect(axiosInstance.get).toHaveBeenCalledWith(
            "http://localhost:8000/api/teams/",
            expect.objectContaining({
                headers: expect.objectContaining({"Content-Type": "application/json"}),
                withCredentials: true
            })
        );
    });

    test('fetchTeams dispatches correct actions on failure', async () => {
        // Set up the mock error response
        axiosInstance.get.mockRejectedValue(new Error('API Error'));

        // Dispatch and catch any errors
        try {
            await store.dispatch(fetchTeams());
        } catch (error) {
            // Errors might be caught in the action
        }
        
        // Check the state after the action
        const finalState = store.getState().team;
        expect(finalState.loading).toBe(false);
        expect(finalState.error).not.toBeNull();
        
        // Check that axios was called correctly - with fixed expectations
        expect(axiosInstance.get).toHaveBeenCalledWith(
            "http://localhost:8000/api/teams/",
            expect.objectContaining({
                headers: expect.objectContaining({"Content-Type": "application/json"}),
                withCredentials: true
            })
        );
    });

    test('createTeam dispatches correct actions on success', async () => {
        const newTeam = { id: 3, name: 'New Team', description: 'New Description' };
        axiosInstance.post.mockResolvedValue({ data: newTeam });

        await store.dispatch(createTeam('New Team', 'New Description'));
        
        // Check that the state was updated correctly
        const finalState = store.getState().team;
        expect(finalState.teams).toContainEqual(newTeam);
        expect(finalState.error).toBeNull();
        
        // Check that axios was called with the right arguments - with fixed expectations
        expect(axiosInstance.post).toHaveBeenCalledWith(
            "http://localhost:8000/api/teams/",
            JSON.stringify({ name: 'New Team', description: 'New Description' }),
            expect.objectContaining({
                headers: expect.objectContaining({"Content-Type": "application/json"}),
                withCredentials: true
            })
        );
    });

    test('createTeam dispatches correct actions on failure', async () => {
        axiosInstance.post.mockRejectedValue(new Error('API Error'));

        try {
            await store.dispatch(createTeam('New Team', 'New Description'));
        } catch (error) {
            // We expect this might throw
        }

        // Check that the state was updated correctly
        const finalState = store.getState().team;
        expect(finalState.error).not.toBeNull();
    });

    test('deleteTeam dispatches correct actions on success', async () => {
        // Set up the initial state with teams
        const initialTeams = [
            { id: 1, name: 'Team 1', description: 'Description 1' },
            { id: 2, name: 'Team 2', description: 'Description 2' }
        ];
        
        // First add the teams to the state
        axiosInstance.get.mockResolvedValue({ data: initialTeams });
        await store.dispatch(fetchTeams());
        
        // Then test the delete
        axiosInstance.delete.mockResolvedValue({});
        await store.dispatch(deleteTeam(1));
        
        // Check that the team was removed from state
        const finalState = store.getState().team;
        expect(finalState.teams).toHaveLength(1);
        expect(finalState.teams[0].id).toBe(2);
        
        // Check that axios was called correctly - with fixed expectations
        expect(axiosInstance.delete).toHaveBeenCalledWith(
            "http://localhost:8000/api/teams/1/",
            expect.objectContaining({
                headers: expect.objectContaining({"Content-Type": "application/json"}),
                withCredentials: true
            })
        );
    });

    test('updateMemberRole dispatches correct actions on success', async () => {
        const response = { team_id: 1, user_id: 101, role: 'owner' };
        
        // Set up the mock response
        axiosInstance.patch.mockResolvedValue({ data: response });

        // Set up initial state with a team that has members
        const initialTeams = [
            { 
                id: 1, 
                name: 'Team 1',
                members: [
                    { id: 1, user: 101, user_name: 'User A', role: 'member' }
                ] 
            }
        ];
        
        axiosInstance.get.mockResolvedValue({ data: initialTeams });
        await store.dispatch(fetchTeams());

        // Test updating the member role
        await store.dispatch(updateMemberRole(1, 101, 'owner'));
        
        // Check that the state was updated correctly
        const finalState = store.getState().team;
        const updatedTeam = finalState.teams.find(team => team.id === 1);
        const updatedMember = updatedTeam.members.find(member => member.user === 101);
        
        expect(updatedMember.role).toBe('owner');
        
        // Check that axios was called correctly - with fixed expectations for endpoint name
        expect(axiosInstance.patch).toHaveBeenCalledWith(
            "http://localhost:8000/api/teams/1/update_member_role/", // Note underscore instead of dash
            JSON.stringify({ user_id: 101, role: 'owner' }),
            expect.objectContaining({
                headers: expect.objectContaining({"Content-Type": "application/json"}),
                withCredentials: true
            })
        );
    });
});