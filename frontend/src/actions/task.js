import axiosInstance from '../utils/axiosConfig';
import {
    SET_TASK_LOADING,
    TASK_LIST_SUCCESS,
    TASK_LIST_FAIL,
    TASK_DETAILS_SUCCESS,
    TASK_DETAILS_FAIL,
    TASK_CREATE_SUCCESS,
    TASK_CREATE_FAIL,
    TASK_UPDATE_SUCCESS,
    TASK_UPDATE_FAIL,
    TASK_DELETE_SUCCESS,
    TASK_DELETE_FAIL,
    // Map to existing action types for compatibility
    FETCH_TASKS_SUCCESS,
    FETCH_TASKS_FAIL,
    CREATE_TASK_SUCCESS,
    CREATE_TASK_FAIL,
    EDIT_TASK_SUCCESS,
    EDIT_TASK_FAIL,
    DELETE_TASK_SUCCESS,
    DELETE_TASK_FAIL
} from './types';
import React from 'react';
import { FaSpinner, FaCircle, FaCheckCircle } from 'react-icons/fa';
import { LuCircleDashed } from 'react-icons/lu';
import { toTitleCase } from '../utils/utils';

// Function to get appropriate status icon with tooltip
export const getStatusIconWithTooltip = (status) => {
    switch (status) {
        case 'not_started':
            return { icon: 'circle', tooltip: 'Not Started', className: 'text-secondary' };
        case 'in_progress':
            return { icon: 'clock', tooltip: 'In Progress', className: 'text-primary' };
        case 'complete':
            return { icon: 'check-circle', tooltip: 'Complete', className: 'text-success' };
        default:
            return { icon: 'question-circle', tooltip: 'Unknown Status', className: 'text-muted' };
    }
};

// Get all tasks with proper filtering
export const fetchTasks = (filters = {}) => async dispatch => {
    dispatch({ type: SET_TASK_LOADING });

    try {
        const url = `${process.env.REACT_APP_API_URL}/api/tasks/user-and-team-tasks/`;

        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                queryParams.append(key, value);
            }
        });

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const response = await axiosInstance.get(`${url}${queryString}`);

        const userTasks = response.data.user_tasks || [];
        const teamTasks = response.data.team_tasks || [];

        dispatch({
            type: TASK_LIST_SUCCESS,
            payload: { userTasks, teamTasks }
        });

        dispatch({
            type: FETCH_TASKS_SUCCESS,
            payload: [...userTasks, ...teamTasks]
        });

        return response.data;
    } catch (err) {
        console.error('Error fetching tasks:', err);

        dispatch({ type: TASK_LIST_FAIL, payload: err.response?.data || 'Failed to fetch tasks' });
        dispatch({ type: FETCH_TASKS_FAIL, payload: err.response?.data || 'Failed to fetch tasks' });

        throw err;
    }
};

// Get task details
export const getTaskDetails = (taskId) => async dispatch => {
    dispatch({ type: SET_TASK_LOADING });
    
    try {
        const response = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/tasks/${taskId}/`);
        
        dispatch({
            type: TASK_DETAILS_SUCCESS,
            payload: response.data
        });
        
        return response.data;
    } catch (err) {
        console.error('Error fetching task details:', err.response || err);
        
        dispatch({
            type: TASK_DETAILS_FAIL,
            payload: err.response?.data || 'Failed to fetch task details'
        });
        
        throw err;
    }
};

// Create a new task
export const createTask = (taskData) => async dispatch => {
    dispatch({ type: SET_TASK_LOADING });
    
    try {
        const response = await axiosInstance.post(`${process.env.REACT_APP_API_URL}/api/tasks/`, taskData);
        
        dispatch({
            type: TASK_CREATE_SUCCESS,
            payload: response.data
        });
        
        // Also dispatch the existing action type for backward compatibility
        dispatch({
            type: CREATE_TASK_SUCCESS,
            payload: response.data
        });
        
        return response.data;
    } catch (err) {
        console.error('Error creating task:', err.response || err);
        
        dispatch({
            type: TASK_CREATE_FAIL,
            payload: err.response?.data || 'Failed to create task'
        });
        
        dispatch({
            type: CREATE_TASK_FAIL,
            payload: err.response?.data || 'Failed to create task'
        });
        
        throw err;
    }
};

// Update a task
export const updateTask = (taskId, taskData) => async dispatch => {
    dispatch({ type: SET_TASK_LOADING });
    
    try {
        const response = await axiosInstance.put(`${process.env.REACT_APP_API_URL}/api/tasks/${taskId}/`, taskData);
        
        dispatch({
            type: TASK_UPDATE_SUCCESS,
            payload: response.data
        });
        
        // Also dispatch the existing action type for backward compatibility
        dispatch({
            type: EDIT_TASK_SUCCESS,
            payload: response.data
        });
        
        return response.data;
    } catch (err) {
        console.error('Error updating task:', err.response || err);
        
        dispatch({
            type: TASK_UPDATE_FAIL,
            payload: err.response?.data || 'Failed to update task'
        });
        
        dispatch({
            type: EDIT_TASK_FAIL,
            payload: err.response?.data || 'Failed to update task'
        });
        
        throw err;
    }
};

// For backward compatibility with existing components
export const editTask = updateTask;

// Update task status (shortcut for common operation)
export const updateTaskStatus = (taskId, status) => async dispatch => {
    try {
        // First, get the current task data
        const currentTaskResponse = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/tasks/${taskId}/`);
        
        // Then update just the status
        const updatedData = {
            ...currentTaskResponse.data,
            status
        };
        
        return dispatch(updateTask(taskId, updatedData));
    } catch (err) {
        console.error('Error updating task status:', err.response || err);
        
        dispatch({
            type: TASK_UPDATE_FAIL,
            payload: err.response?.data || 'Failed to update task status'
        });
        
        throw err;
    }
};

// Delete a task
export const deleteTask = (taskId) => async dispatch => {
    dispatch({ type: SET_TASK_LOADING });
    
    try {
        await axiosInstance.delete(`${process.env.REACT_APP_API_URL}/api/tasks/${taskId}/`);
        
        dispatch({
            type: TASK_DELETE_SUCCESS,
            payload: taskId
        });
        
        // Also dispatch the existing action type for backward compatibility
        dispatch({
            type: DELETE_TASK_SUCCESS,
            payload: taskId
        });
        
        return true;
    } catch (err) {
        console.error('Error deleting task:', err.response || err);
        
        dispatch({
            type: TASK_DELETE_FAIL,
            payload: err.response?.data || 'Failed to delete task'
        });
        
        dispatch({
            type: DELETE_TASK_FAIL,
            payload: err.response?.data || 'Failed to delete task'
        });
        
        throw err;
    }
};

