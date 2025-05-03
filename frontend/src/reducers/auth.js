// Disclaimer: Portions of this code were modified from Django and React tutorials to fit the requirements of the project (see requirements tutorials section).
import {
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    RESET_FIRST_LOGIN,
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
    PASSWORD_RESET_CONFIRM_FAIL,
} from '../actions/types';

const initialState = {
    access: localStorage.getItem('access'),
    refresh: localStorage.getItem('accessrefresh'),
    isAuthenticated: null,
    user: null,
    firstLogin: false,
    error: null
};

 function authReducer(state = initialState, action) {
    const { type, payload } = action;

    switch(type){
        case AUTHENTICATED_SUCCESS:
            return {
                ...state,
                isAuthenticated: true
            };
        case LOGIN_SUCCESS:
            localStorage.setItem('access', payload.access);
            return {
                ...state,
                isAuthenticated: true,
                firstLogin: true,
                user: payload.user,
                access: payload.access,
                refresh: payload.refresh,
                error: null
            };
        case RESET_FIRST_LOGIN:
            return {
                ...state,
                firstLogin: false
            };
        case SIGNUP_SUCCESS:
            return {
                ...state,
                isAuthenticated: false
            };
        case USER_LOADED_SUCCESS:
            return {
                ...state,
                user: payload
            };
        case AUTHENTICATED_FAIL:
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            return {
                ...state,
                access: null,
                refresh: null,
                isAuthenticated: false
            };
        case USER_LOADED_FAIL:
            return {
                ...state,
                user: null
            };
        case LOGIN_FAIL:
            localStorage.removeItem('access');
            localStorage.removeItem('refresh'); 
            return {
                ...state,
                access: null,
                refresh: null,
                isAuthenticated: false,
                user: null,
                error: payload // Keep the error message from the action payload
            };
        case SIGNUP_FAIL:
            localStorage.removeItem('access');
            localStorage.removeItem('refresh'); 
            return {
                ...state,
                access: null,
                refresh: null,
                isAuthenticated: false,
                user: null,
                error: payload // Keep the error message
            };
        case LOGOUT:
            localStorage.removeItem('access');
            localStorage.removeItem('refresh'); 
            return {
                ...state,
                access: null,
                refresh: null,
                isAuthenticated: false,
                user: null,
                firstLogin: false, // Reset this flag on logout
                error: null // This should remain null for logout
            };
        case PASSWORD_RESET_SUCCESS:
        case PASSWORD_RESET_FAIL:
        case PASSWORD_RESET_CONFIRM_SUCCESS:
        case PASSWORD_RESET_CONFIRM_FAIL:
        case ACTIVATION_SUCCESS:
        case ACTIVATION_FAIL:
            return {
                ...state
            }
        default:
            return state;
    }
};

export default authReducer;