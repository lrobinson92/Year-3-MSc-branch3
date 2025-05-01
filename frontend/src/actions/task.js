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
    FETCH_TASKS_SUCCESS,
    FETCH_TASKS_FAIL,
    CREATE_TASK_SUCCESS,
    CREATE_TASK_FAIL,
    EDIT_TASK_SUCCESS,
    EDIT_TASK_FAIL,
    FETCH_TEAM_MEMBERS_SUCCESS,
    FETCH_TEAM_MEMBERS_FAIL
} from './types';

/**
 * Provides status icon details for different task statuses
 * Returns icon name, tooltip text, and CSS class for styling
 * 
 * @param {string} status - Task status (not_started, in_progress, complete)
 * @returns {Object} Icon configuration object with icon, tooltip and className
 */
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

/**
 * Fetch user and team tasks with optional filters
 * Gets both personal tasks assigned to the user and team tasks they have access to
 * 
 * @param {Object} filters - Optional query parameters for filtering tasks
 * @returns {Object} Task data including user_tasks and team_tasks arrays
 */
export const fetchTasks = (filters = {}) => async dispatch => {
    // Set loading state
    dispatch({ type: SET_TASK_LOADING });

    try {
        const url = `${process.env.REACT_APP_API_URL}/api/tasks/user-and-team-tasks/`;

        // Build query string from filter parameters
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                queryParams.append(key, value);
            }
        });

        // Fetch tasks with appropriate filters
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const response = await axiosInstance.get(`${url}${queryString}`);

        const userTasks = response.data.user_tasks || [];
        const teamTasks = response.data.team_tasks || [];

        // Update task lists in store
        dispatch({
            type: TASK_LIST_SUCCESS,
            payload: { userTasks, teamTasks }
        });

        // Also update combined tasks list (for backward compatibility)
        dispatch({
            type: FETCH_TASKS_SUCCESS,
            payload: [...userTasks, ...teamTasks]
        });

        return response.data;
    } catch (err) {
        console.error('Error fetching tasks:', err);

        // Update error state
        dispatch({ type: TASK_LIST_FAIL, payload: err.response?.data || 'Failed to fetch tasks' });
        dispatch({ type: FETCH_TASKS_FAIL, payload: err.response?.data || 'Failed to fetch tasks' });

        throw err;
    }
};

/**
 * Get detailed information for a specific task
 * 
 * @param {string|number} taskId - ID of the task to retrieve
 * @returns {Object} Task details object
 */
export const getTaskDetails = (taskId) => async dispatch => {
    // Set loading state
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

/**
 * Create a new task 
 * 
 * @param {Object} taskData - Task data object with title, description, status, etc.
 * @returns {Object} Created task object
 */
export const createTask = (taskData) => async dispatch => {
    // Set loading state
    dispatch({ type: SET_TASK_LOADING });
    
    try {
        const response = await axiosInstance.post(`${process.env.REACT_APP_API_URL}/api/tasks/`, taskData);
        
        // Dispatch newer action type
        dispatch({
            type: TASK_CREATE_SUCCESS,
            payload: response.data
        });
        
        // Also dispatch legacy action type for backward compatibility
        dispatch({
            type: CREATE_TASK_SUCCESS,
            payload: response.data
        });
        
        return response.data;
    } catch (err) {
        console.error('Error creating task:', err.response || err);
        
        // Update error state with both action types
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

/**
 * Update an existing task
 * 
 * @param {string|number} taskId - ID of the task to update
 * @param {Object} taskData - Updated task data
 * @returns {Object} Updated task object
 */
export const updateTask = (taskId, taskData) => async dispatch => {
    // Set loading state
    dispatch({ type: SET_TASK_LOADING });
    
    try {
        const response = await axiosInstance.put(`${process.env.REACT_APP_API_URL}/api/tasks/${taskId}/`, taskData);
        
        // Dispatch newer action type
        dispatch({
            type: TASK_UPDATE_SUCCESS,
            payload: response.data
        });
        
        // Also dispatch legacy action type for backward compatibility
        dispatch({
            type: EDIT_TASK_SUCCESS,
            payload: response.data
        });
        
        return response.data;
    } catch (err) {
        console.error('Error updating task:', err.response || err);
        
        // Update error state with both action types
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

/**
 * Update just the status field of a task (convenience method)
 * First gets current task data, then updates only the status field
 * 
 * @param {string|number} taskId - ID of the task to update
 * @param {string} status - New status (not_started, in_progress, complete)
 * @returns {Object} Updated task object
 */
export const updateTaskStatus = (taskId, status) => async dispatch => {
    try {
        // First, get the current task data to preserve other fields
        const currentTaskResponse = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/tasks/${taskId}/`);
        
        // Then update just the status field
        const updatedData = {
            ...currentTaskResponse.data,
            status
        };
        
        // Use the main update method to save changes
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

/**
 * Delete a task
 * 
 * @param {string|number} taskId - ID of the task to delete
 * @returns {boolean} Success indicator
 */
export const deleteTask = (taskId) => async dispatch => {
    // Set loading state
    dispatch({ type: SET_TASK_LOADING });
    
    try {
        await axiosInstance.delete(`${process.env.REACT_APP_API_URL}/api/tasks/${taskId}/`);
        
        // Dispatch newer action type
        dispatch({
            type: TASK_DELETE_SUCCESS,
            payload: taskId
        });
        
        // Also dispatch legacy action type for backward compatibility
        dispatch({
            type: DELETE_TASK_SUCCESS,
            payload: taskId
        });
        
        return true;
    } catch (err) {
        console.error('Error deleting task:', err.response || err);
        
        // Update error state with both action types
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

/**
 * Fetch team members for task assignment
 * Returns different results based on user role in the team
 * 
 * @param {string|number} teamId - ID of the team to get members from (null for personal tasks)
 * @param {string|number} userId - Current user ID
 * @returns {Array} List of team members the user can assign tasks to
 */
export const fetchTeamMembers = (teamId, userId) => async dispatch => {
    try {
        if (!teamId) {
            // For personal tasks, just return empty list since no team is involved
            dispatch({
                type: FETCH_TEAM_MEMBERS_SUCCESS,
                payload: { teamMembers: [], isOwner: false }
            });
            return [];
        }
        
        // Get all members in the team
        const response = await axiosInstance.get(
            `${process.env.REACT_APP_API_URL}/api/teams/${teamId}/users-in-same-team/`, 
            { withCredentials: true }
        );
        
        const members = Array.isArray(response.data) ? response.data : [];
        
        // Determine if current user is team owner (affects permissions)
        const isOwner = members.some(member => member.user === userId && member.role === 'owner');
        
        // Team owners can see all members, regular users can only see themselves
        // This controls who tasks can be assigned to
        const visibleMembers = isOwner ? members : members.filter(member => member.user === userId);
        
        dispatch({
            type: FETCH_TEAM_MEMBERS_SUCCESS,
            payload: { 
                teamMembers: visibleMembers,
                isOwner
            }
        });
        
        return visibleMembers;
    } catch (err) {
        console.error('Failed to fetch team members:', err);
        
        dispatch({
            type: FETCH_TEAM_MEMBERS_FAIL,
            payload: err.response?.data || 'Failed to fetch team members'
        });
        
        return [];
    }
};

