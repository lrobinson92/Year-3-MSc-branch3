import teamReducer from '../../reducers/team';
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

describe('Team Reducer', () => {
    const initialState = {
        teams: [],
        loading: true,
        error: null
    };

    test('should return the initial state', () => {
        const newState = teamReducer(undefined, {});
        expect(newState).toEqual(initialState);
    });

    test('handles FETCH_TEAMS_SUCCESS', () => {
        const teams = [
            { id: 1, name: 'Team 1', description: 'Description 1', members: [] },
            { id: 2, name: 'Team 2', description: 'Description 2', members: [] }
        ];

        const action = {
            type: FETCH_TEAMS_SUCCESS,
            payload: teams
        };

        const newState = teamReducer(initialState, action);
        expect(newState.teams).toEqual(teams);
        expect(newState.loading).toBe(false);
        expect(newState.error).toBeNull();
    });

    test('handles FETCH_TEAMS_FAIL', () => {
        const action = {
            type: FETCH_TEAMS_FAIL
        };

        const newState = teamReducer(initialState, action);
        expect(newState.teams).toEqual([]);
        expect(newState.loading).toBe(false);
        expect(newState.error).toBe('Failed to fetch teams');
    });

    test('handles CREATE_TEAM_SUCCESS', () => {
        const existingState = {
            ...initialState,
            teams: [{ id: 1, name: 'Team 1', description: 'Description 1' }]
        };

        const newTeam = { id: 2, name: 'New Team', description: 'New Description' };
        const action = {
            type: CREATE_TEAM_SUCCESS,
            payload: newTeam
        };

        const newState = teamReducer(existingState, action);
        expect(newState.teams).toHaveLength(2);
        expect(newState.teams[1]).toEqual(newTeam);
        expect(newState.error).toBeNull();
    });

    test('handles CREATE_TEAM_FAIL', () => {
        const action = {
            type: CREATE_TEAM_FAIL
        };

        const newState = teamReducer(initialState, action);
        expect(newState.error).toBe('Failed to create team');
    });

    test('handles DELETE_TEAM_SUCCESS', () => {
        const existingState = {
            ...initialState,
            teams: [
                { id: 1, name: 'Team 1' },
                { id: 2, name: 'Team 2' }
            ]
        };

        const action = {
            type: DELETE_TEAM_SUCCESS,
            payload: 1 // team id to delete
        };

        const newState = teamReducer(existingState, action);
        expect(newState.teams).toHaveLength(1);
        expect(newState.teams[0].id).toBe(2);
        expect(newState.error).toBeNull();
    });

    test('handles DELETE_TEAM_FAIL', () => {
        const action = {
            type: DELETE_TEAM_FAIL
        };

        const newState = teamReducer(initialState, action);
        expect(newState.error).toBe('Failed to delete team');
    });

    test('handles EDIT_TEAM_SUCCESS', () => {
        const existingState = {
            ...initialState,
            teams: [
                { id: 1, name: 'Team 1', description: 'Old description' },
                { id: 2, name: 'Team 2', description: 'Description 2' }
            ]
        };

        const updatedTeam = { id: 1, name: 'Updated Team 1', description: 'New description' };
        const action = {
            type: EDIT_TEAM_SUCCESS,
            payload: updatedTeam
        };

        const newState = teamReducer(existingState, action);
        expect(newState.teams).toHaveLength(2);
        expect(newState.teams[0]).toEqual(updatedTeam);
        expect(newState.teams[1].name).toBe('Team 2');
        expect(newState.error).toBeNull();
    });

    test('handles UPDATE_MEMBER_ROLE_SUCCESS', () => {
        const existingState = {
            ...initialState,
            teams: [
                { 
                    id: 1, 
                    name: 'Team 1',
                    members: [
                        { id: 1, user: 101, user_name: 'User A', role: 'member' },
                        { id: 2, user: 102, user_name: 'User B', role: 'member' }
                    ]
                }
            ]
        };

        const action = {
            type: UPDATE_MEMBER_ROLE_SUCCESS,
            payload: {
                team_id: 1,
                user_id: 101,
                role: 'owner'
            }
        };

        const newState = teamReducer(existingState, action);
        expect(newState.teams[0].members[0].role).toBe('owner');
        expect(newState.teams[0].members[1].role).toBe('member');
    });

    test('handles REMOVE_MEMBER_SUCCESS', () => {
        const existingState = {
            ...initialState,
            teams: [
                { 
                    id: 1, 
                    name: 'Team 1',
                    members: [
                        { id: 1, user: 101, user_name: 'User A', role: 'owner' },
                        { id: 2, user: 102, user_name: 'User B', role: 'member' }
                    ]
                }
            ]
        };

        const action = {
            type: REMOVE_MEMBER_SUCCESS,
            payload: {
                team_id: 1,
                user_id: 102
            }
        };

        const newState = teamReducer(existingState, action);
        expect(newState.teams[0].members).toHaveLength(1);
        expect(newState.teams[0].members[0].user).toBe(101);
    });
});