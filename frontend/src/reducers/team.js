import { 
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
} from '../actions/types';

const initialState = {
    teams: [],
    error: null
};

function teamReducer(state = initialState, action) {
    const { type, payload } = action;

    switch (type) {
        case CREATE_TEAM_SUCCESS:
            return {
                ...state,
                teams: [...state.teams, payload],
                error: null
            };
        case CREATE_TEAM_FAIL:
            return {
                ...state,
                error: 'Failed to create team'
            };
        case DELETE_TEAM_SUCCESS:
            return {
                ...state,
                teams: state.teams.filter(team => team.id !== payload),
                error: null
            };
        case DELETE_TEAM_FAIL:
            return {
                ...state,
                error: 'Failed to delete team'
            };
        case EDIT_TEAM_SUCCESS:
            return {
                ...state,
                teams: state.teams.map(team => team.id === payload.id ? payload : team),
                error: null
            };
        case EDIT_TEAM_FAIL:
            return {
                ...state,
                error: 'Failed to edit team'
            };
        case UPDATE_MEMBER_ROLE_SUCCESS:
            return {
                ...state,
                teams: state.teams.map(team => {
                    if (team.id === payload.team_id) {
                        return {
                            ...team,
                            members: team.members.map(member => member.user === payload.user_id ? { ...member, role: payload.role } : member)
                        };
                    }
                    return team;
                }),
                error: null
            };
        case UPDATE_MEMBER_ROLE_FAIL:
            return {
                ...state,
                error: 'Failed to update member role'
            };
        case REMOVE_MEMBER_SUCCESS:
            return {
                ...state,
                teams: state.teams.map(team => {
                    if (team.id === payload.team_id) {
                        return {
                            ...team,
                            members: team.members.filter(member => member.user !== payload.user_id)
                        };
                    }
                    return team;
                }),
                error: null
            };
        case REMOVE_MEMBER_FAIL:
            return {
                ...state,
                error: 'Failed to remove member'
            };
        default:
            return state;
    }
};

export default teamReducer;