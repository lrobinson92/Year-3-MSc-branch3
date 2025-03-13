import axiosInstance from '../utils/axiosConfig';
import { 
    CREATE_TASK_SUCCESS, 
    CREATE_TASK_FAIL, 
    DELETE_TASK_SUCCESS, 
    DELETE_TASK_FAIL,
    EDIT_TASK_SUCCESS,
    EDIT_TASK_FAIL,
    FETCH_TASKS_SUCCESS,
    FETCH_TASKS_FAIL
} from './types';

export const createTask = (description, assigned_to, team, due_date, status) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true
    };


    const body = JSON.stringify({ description, assigned_to, team, due_date, status });

    try {
        const res = await axiosInstance.post(`${process.env.REACT_APP_API_URL}/api/tasks/`, body, config);

        dispatch({
            type: CREATE_TASK_SUCCESS,
            payload: res.data
        });
    } catch (err) {
        dispatch({
            type: CREATE_TASK_FAIL
        });
        throw err;
    }
};

export const deleteTask = (taskId) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true
    };

    try {
        await axiosInstance.delete(`${process.env.REACT_APP_API_URL}/api/tasks/${taskId}/`, config);

        dispatch({
            type: DELETE_TASK_SUCCESS,
            payload: taskId
        });
    } catch (err) {
        dispatch({
            type: DELETE_TASK_FAIL
        });
        throw err;
    }
};

export const editTask = (taskId, description, assigned_to, team, due_date, status) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true
    };

    const body = JSON.stringify({ description, assigned_to, team, due_date, status });

    try {
        const res = await axiosInstance.put(`${process.env.REACT_APP_API_URL}/api/tasks/${taskId}/`, body, config);

        dispatch({
            type: EDIT_TASK_SUCCESS,
            payload: res.data
        });
    } catch (err) {
        dispatch({
            type: EDIT_TASK_FAIL
        });
        throw err;
    }
};

export const fetchTasks = () => async dispatch => {

    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true,  // Make sure cookies are sent with the request
    };


    try {
        const res = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/tasks/user-and-team-tasks/`, config);

        dispatch({
            type: FETCH_TASKS_SUCCESS,
            payload: res.data
        });
    } catch (err) {
        dispatch({
            type: FETCH_TASKS_FAIL
        });
        throw err;
    }
};
