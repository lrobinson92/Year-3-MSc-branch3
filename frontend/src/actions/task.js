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
import React from 'react';
import { FaSpinner, FaCircle, FaCheckCircle } from 'react-icons/fa';
import { LuCircleDashed } from 'react-icons/lu';
import { toTitleCase } from '../utils/utils';

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

export const getStatusIconWithTooltip = (status) => {
    let icon;
    let iconColor;

    switch (status.toLowerCase()) {
        case 'in_progress':
            icon = <FaSpinner className="fa-spin" />;
            iconColor = '#d35400'; // orange for in progress
            break;
        case 'not_started':
            icon = <LuCircleDashed />;
            iconColor = '#717186'; // grey for not started
            break;
        case 'complete':
            icon = <FaCheckCircle />;
            iconColor = '#0FA312'; // Green for completed
            break;
        default:
            icon = <FaCircle />;
            iconColor = '#95a5a6'; // default for unknown status
    }

    return (
        <div className="status-icon" style={{ color: iconColor }}>
            {icon}
            <span className="tooltip">{toTitleCase(status)}</span>
        </div>
    );
};

export const handleTaskDelete = (taskId, errorCallback) => async dispatch => {
    try {
        // First show the confirmation dialog
        const confirmDelete = window.confirm("Are you sure you want to delete this task?");
        
        // If canceled, return early
        if (!confirmDelete) {
            return;
        }
        
        // If confirmed, delete the task
        await axiosInstance.delete(`${process.env.REACT_APP_API_URL}/api/tasks/${taskId}/`);
        
        // Dispatch success action
        dispatch({
            type: DELETE_TASK_SUCCESS,
            payload: taskId
        });
        
        // Refresh tasks after deletion (optional)
        dispatch(fetchTasks());
        
    } catch (err) {
        console.error('Failed to delete task:', err);
        
        // Dispatch failure action
        dispatch({
            type: DELETE_TASK_FAIL
        });
        
        // Call the error callback if provided
        if (errorCallback) {
            errorCallback('Failed to delete task');
        }
    }
};
