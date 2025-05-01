import axiosInstance from '../utils/axiosConfig';
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
    REMOVE_MEMBER_FAIL,
    FETCH_TEAMS_SUCCESS,
    FETCH_TEAMS_FAIL
} from './types';

/**
 * Create a new team
 * 
 * @param {string} name - Team name
 * @param {string} description - Team description
 * @returns {Promise<Object>} The created team data
 * @throws {Error} If team creation fails
 */
export const createTeam = (name, description) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true
    };

    const body = JSON.stringify({ name, description });

    try {
        // Send API request to create team
        const res = await axiosInstance.post(`${process.env.REACT_APP_API_URL}/api/teams/`, body, config);

        // Update Redux store with new team
        dispatch({
            type: CREATE_TEAM_SUCCESS,
            payload: res.data
        });
        
        return res.data;
    } catch (err) {
        // Handle error and update store
        dispatch({
            type: CREATE_TEAM_FAIL,
            payload: err.response?.data || 'Failed to create team'
        });
        throw err;
    }
};

/**
 * Delete an existing team
 * 
 * @param {string|number} teamId - ID of the team to delete
 * @returns {Promise<boolean>} True if deletion was successful
 * @throws {Error} If team deletion fails
 */
export const deleteTeam = (teamId) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true
    };

    try {
        // Send API request to delete team
        await axiosInstance.delete(`${process.env.REACT_APP_API_URL}/api/teams/${teamId}/`, config);

        // Update Redux store by removing deleted team
        dispatch({
            type: DELETE_TEAM_SUCCESS,
            payload: teamId
        });
        
        return true;
    } catch (err) {
        // Extract error message or use default
        const errorMessage = err.response?.data?.error || 'Failed to delete team';
        
        // Update store with error information
        dispatch({
            type: DELETE_TEAM_FAIL,
            payload: errorMessage
        });
        
        throw err;
    }
};

/**
 * Edit an existing team's details
 * 
 * @param {string|number} teamId - ID of the team to edit
 * @param {string} name - New team name
 * @param {string} description - New team description
 * @returns {Promise<Object>} The updated team data
 * @throws {Error} If team update fails
 */
export const editTeam = (teamId, name, description) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true
    };

    const body = JSON.stringify({ name, description });

    try {
        // Send API request to update team
        const res = await axiosInstance.put(`${process.env.REACT_APP_API_URL}/api/teams/${teamId}/`, body, config);

        // Update Redux store with modified team
        dispatch({
            type: EDIT_TEAM_SUCCESS,
            payload: res.data
        });
        
        return res.data;
    } catch (err) {
        // Handle error and update store
        dispatch({
            type: EDIT_TEAM_FAIL,
            payload: err.response?.data || 'Failed to update team'
        });
        throw err;
    }
};

/**
 * Update a team member's role
 * Changes user permissions within a team (owner, admin, member)
 * 
 * @param {string|number} teamId - ID of the team
 * @param {string|number} userId - ID of the user whose role is being updated
 * @param {string} newRole - New role to assign ('owner', 'admin', or 'member')
 * @returns {Promise<Object>} The updated membership data
 * @throws {Error} If role update fails
 */
export const updateMemberRole = (teamId, userId, newRole) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true
    };

    const body = JSON.stringify({ user_id: userId, role: newRole });

    try {
        // Send API request to update member role
        const res = await axiosInstance.patch(
            `${process.env.REACT_APP_API_URL}/api/teams/${teamId}/update_member_role/`, 
            body, 
            config
        );

        // Update Redux store with new role info
        dispatch({
            type: UPDATE_MEMBER_ROLE_SUCCESS,
            payload: res.data
        });
        
        return res.data;
    } catch (err) {
        // Handle error and update store
        dispatch({
            type: UPDATE_MEMBER_ROLE_FAIL,
            payload: err.response?.data || 'Failed to update member role'
        });
        throw err;
    }
};

/**
 * Remove a member from a team
 * 
 * @param {string|number} teamId - ID of the team
 * @param {string|number} userId - ID of the user to remove
 * @returns {Promise<boolean>} True if removal was successful
 * @throws {Error} If member removal fails
 */
export const removeMember = (teamId, userId) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true,
        // For DELETE requests with a body, the data must be included in config
        data: { user_id: userId }
    };

    try {
        // Send API request to remove team member
        await axiosInstance.delete(
            `${process.env.REACT_APP_API_URL}/api/teams/${teamId}/remove_member/`, 
            config
        );

        // Update Redux store by removing the member
        dispatch({
            type: REMOVE_MEMBER_SUCCESS,
            payload: userId
        });
        
        return true;
    } catch (err) {
        // Handle error and update store
        dispatch({
            type: REMOVE_MEMBER_FAIL,
            payload: err.response?.data || 'Failed to remove team member'
        });
        throw err;
    }
};

/**
 * Fetch all teams for the current user
 * Retrieves teams the user is a member of or has access to
 * 
 * @returns {Promise<Array>} List of team objects
 */
export const fetchTeams = () => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true
    };

    try {
        // Send API request to get user's teams
        const res = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/teams/`, config);
        
        // Update Redux store with team list
        dispatch({
            type: FETCH_TEAMS_SUCCESS,
            payload: res.data
        });
        
        return res.data;
    } catch (err) {
        // Handle error and update store
        dispatch({
            type: FETCH_TEAMS_FAIL,
            payload: err.response?.data || 'Failed to fetch teams'
        });
        
        return [];
    }
};

/**
 * Invite a user to join a team
 * Sends an email invitation with a link to accept
 * 
 * @param {string|number} teamId - ID of the team
 * @param {string} email - Email address of the user to invite
 * @param {string} role - Role to assign upon acceptance ('admin' or 'member')
 * @returns {Promise<Object>} The invitation data
 * @throws {Error} If invitation fails
 */
export const inviteTeamMember = (teamId, email, role) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true
    };

    const body = JSON.stringify({ email, role });

    try {
        // Send API request to invite user
        const res = await axiosInstance.post(
            `${process.env.REACT_APP_API_URL}/api/teams/${teamId}/invite_member/`,
            body,
            config
        );
        
        return { success: true, data: res.data };
    } catch (err) {
        return { 
            success: false, 
            error: err.response?.data?.detail || 'Failed to send invitation'
        };
    }
};

/**
 * Get detailed information about a specific team
 * 
 * @param {string|number} teamId - ID of the team to fetch
 * @returns {Promise<Object>} Team details including members list
 * @throws {Error} If team retrieval fails
 */
export const getTeamDetails = (teamId) => async () => {
    try {
        // Send API request to get team details
        const res = await axiosInstance.get(
            `${process.env.REACT_APP_API_URL}/api/teams/${teamId}/`,
            { withCredentials: true }
        );
        
        return res.data;
    } catch (err) {
        throw new Error(err.response?.data?.detail || 'Failed to fetch team details');
    }
};