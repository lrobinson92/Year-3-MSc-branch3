import axiosInstance from '../utils/axiosConfig'; 
import {
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    SIGNUP_SUCCESS,
    SIGNUP_FAIL,
    ACTIVATION_SUCCESS,
    ACTIVATION_FAIL,
    USER_LOADED_SUCCESS,
    USER_LOADED_FAIL,
    AUTHENTICATED_SUCCESS,
    AUTHENTICATED_FAIL,
    LOGOUT,
    PASSWORD_RESET_SUCCESS,
    PASSWORD_RESET_FAIL,
    PASSWORD_RESET_CONFIRM_SUCCESS,
    PASSWORD_RESET_CONFIRM_FAIL
} from './types';

/**
 * Check if the user is authenticated with valid credentials
 * Verifies authentication status with the backend
 */
export const checkAuthenticated = () => async dispatch => {
    try {
        // Attempt to get user data to verify authentication
        const res = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/auth/users/me/`, {
            withCredentials: true, // Include cookies for JWT authentication
        });

        dispatch({
            type: AUTHENTICATED_SUCCESS,
            payload: res.data
        });
    } catch (err) {
        // If request fails, user is not authenticated
        dispatch({
            type: AUTHENTICATED_FAIL
        });
    }
};

/**
 * Load user data from the backend
 * Requires an access token in localStorage
 */
export const load_user = () => async dispatch => {
    if (localStorage.getItem('access')) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true
        };

        try {
            // Fetch current user details
            const res = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/auth/users/me/`, config);

            dispatch({
                type: USER_LOADED_SUCCESS,
                payload: res.data
            });
        } catch (err) {
            dispatch({
                type: USER_LOADED_FAIL
            });
        }
    } else {
        // No access token available
        dispatch({
            type: USER_LOADED_FAIL
        });
    }
};

/**
 * Register a new user account
 * 
 * @param {string} name - User's full name
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {string} re_password - Password confirmation
 * @returns {string} Success message or throws error
 */
export const signup = (name, email, password, re_password) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true,
    };

    const body = JSON.stringify({ name, email, password, re_password });

    try {
        const res = await axiosInstance.post(`${process.env.REACT_APP_API_URL}/auth/users/`, body, config);

        dispatch({
            type: SIGNUP_SUCCESS,
            payload: res.data,
        });

        return "success"; // Indicate successful registration
    } catch (err) {
        dispatch({
            type: SIGNUP_FAIL,
        });

        // Extract error message or provide a default
        throw err.response?.data?.email || "Signup failed. Please try again.";
    }
};

/**
 * Activate a user account with verification token
 * 
 * @param {string} uid - User ID from activation email
 * @param {string} token - Verification token from activation email
 */
export const verify = (uid, token) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true,
    };

    const body = JSON.stringify({ uid, token });

    try {
        const res = await axiosInstance.post(`${process.env.REACT_APP_API_URL}/auth/users/activation/`, body, config);

        dispatch({
            type: ACTIVATION_SUCCESS,
            payload: res.data,
        });
    } catch (err) {
        dispatch({
            type: ACTIVATION_FAIL            
        });
    }
};

/**
 * Authenticate user with email and password
 * 
 * @param {string} email - User's email address
 * @param {string} password - User's password
 */
export const login = (email, password) => async dispatch => {
    const body = JSON.stringify({ email, password });

    try {
        // Exchange credentials for JWT tokens
        const res = await axiosInstance.post(`${process.env.REACT_APP_API_URL}/auth/jwt/create/`, body);

        dispatch({
            type: LOGIN_SUCCESS,
            payload: {
                access: res.data.access_token,
                refresh: res.data.refresh_token,
                user: res.data.user
            }
        });

        // Fetch additional user data after login
        dispatch(load_user());
    } catch (err) {
        dispatch({
            type: LOGIN_FAIL,
            payload: "Login details are not correct. Please try again."
        });
    }
};

/**
 * Reset the firstLogin flag in state
 * Called after user completes onboarding flow
 */
export const resetFirstLogin = () => (dispatch) => {
    dispatch({
        type: 'RESET_FIRST_LOGIN'
    });
};

/**
 * Initiate password reset process
 * Sends a password reset email to the user
 * 
 * @param {string} email - User's email address
 */
export const reset_password = (email) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true,
    };

    const body = JSON.stringify({ email });

    try {
        await axiosInstance.post(`${process.env.REACT_APP_API_URL}/auth/users/reset_password/`, body, config);

        dispatch({
            type: PASSWORD_RESET_SUCCESS            
        });
    } catch (err) {
        dispatch({
            type: PASSWORD_RESET_FAIL            
        });
    }
};

/**
 * Complete password reset with confirmation token
 * 
 * @param {string} uid - User ID from reset email
 * @param {string} token - Reset token from email
 * @param {string} new_password - New password
 * @param {string} re_new_password - New password confirmation
 */
export const reset_password_confirm = (uid, token, new_password, re_new_password) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true,
    };

    const body = JSON.stringify({ uid, token, new_password, re_new_password });

    try {
        await axiosInstance.post(`${process.env.REACT_APP_API_URL}/auth/users/reset_password_confirm/`, body, config);

        dispatch({
            type: PASSWORD_RESET_CONFIRM_SUCCESS,           
        });
    } catch (err) {
        dispatch({
            type: PASSWORD_RESET_CONFIRM_FAIL,            
        });
    }
};

/**
 * Log out the current user
 * Clears tokens from localStorage and notifies the backend
 */
export const logout = () => async dispatch => {
    try {
        // Tell the backend to invalidate the session
        const config = {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true,
        };
        
        await axiosInstance.post(`${process.env.REACT_APP_API_URL}/auth/logout/`, {}, config);
        
        // Clear authentication tokens
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        
        // Update Redux state
        dispatch({
            type: LOGOUT
        });
    } catch (err) {
        console.error("Logout failed", err);
        
        // Even if API call fails, still clear local storage and update state
        // This ensures the user is logged out locally even if server request fails
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        
        dispatch({
            type: LOGOUT
        });
    }
};