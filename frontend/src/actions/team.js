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
    REMOVE_MEMBER_FAIL
} from './types';

export const createTeam = (name, description) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true
    };

    const body = JSON.stringify({ name, description });

    try {
        const res = await axiosInstance.post(`${process.env.REACT_APP_API_URL}/api/teams/`, body, config);

        dispatch({
            type: CREATE_TEAM_SUCCESS,
            payload: res.data
        });
    } catch (err) {
        dispatch({
            type: CREATE_TEAM_FAIL
        });
        throw err;
    }
};

export const deleteTeam = (teamId) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true
    };

    try {
        await axiosInstance.delete(`${process.env.REACT_APP_API_URL}/api/teams/${teamId}/`, config);

        dispatch({
            type: DELETE_TEAM_SUCCESS,
            payload: teamId
        });
    } catch (err) {
        dispatch({
            type: DELETE_TEAM_FAIL
        });
        throw err;
    }
};

export const editTeam = (teamId, name, description) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true
    };

    const body = JSON.stringify({ name, description });

    try {
        const res = await axiosInstance.put(`${process.env.REACT_APP_API_URL}/api/teams/${teamId}/`, body, config);

        dispatch({
            type: EDIT_TEAM_SUCCESS,
            payload: res.data
        });
    } catch (err) {
        dispatch({
            type: EDIT_TEAM_FAIL
        });
        throw err;
    }
};

export const updateMemberRole = (teamId, userId, newRole) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true
    };

    const body = JSON.stringify({ user_id: userId, role: newRole });

    try {
        const res = await axiosInstance.patch(`${process.env.REACT_APP_API_URL}/api/teams/${teamId}/update_member_role/`, body, config);

        dispatch({
            type: UPDATE_MEMBER_ROLE_SUCCESS,
            payload: res.data
        });
    } catch (err) {
        dispatch({
            type: UPDATE_MEMBER_ROLE_FAIL
        });
        throw err;
    }
};

export const removeMember = (teamId, userId) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true,
        data: { user_id: userId }
    };

    try {
        await axiosInstance.delete(`${process.env.REACT_APP_API_URL}/api/teams/${teamId}/remove_member/`, config);

        dispatch({
            type: REMOVE_MEMBER_SUCCESS,
            payload: userId
        });
    } catch (err) {
        dispatch({
            type: REMOVE_MEMBER_FAIL
        });
        throw err;
    }
};