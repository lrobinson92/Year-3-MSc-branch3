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

export const checkAuthenticated = () => async dispatch => {
    
        try {
            const res = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/auth/users/me/`, {
                withCredentials: true, // This ensures cookies are sent along with the request
            });

            dispatch({
                type: AUTHENTICATED_SUCCESS,
                payload: res.data
            });
        } catch (err) {
            dispatch({
                type: AUTHENTICATED_FAIL
            });
        }
};


export const load_user = () => async dispatch => {
    if (localStorage.getItem('access')) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true
        };

        try {
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
        dispatch({
            type: USER_LOADED_FAIL
        });
    }
};

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

        return "success"; // Indicate success
    } catch (err) {
        dispatch({
            type: SIGNUP_FAIL,
        });

        // Pass the error response to the caller
        throw err.response?.data?.email || "Signup failed. Please try again.";
    }
};

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


export const login = (email, password) => async dispatch => {
    
    const body = JSON.stringify({ email, password });

    console.log("Sending login request:", body);  // Debugging line

    try {
        const res = await axiosInstance.post(`${process.env.REACT_APP_API_URL}/auth/jwt/create/`, body);

        dispatch({
            type: LOGIN_SUCCESS,
            payload: {
                access: res.data.access_token,
                refresh: res.data.refresh_token,
                user: res.data.user
            }
        });

        dispatch(load_user());
    } catch (err) {
        dispatch({
            type: LOGIN_FAIL,
            payload: "Login details are not correct. Please try again."
        });
    }
};

export const resetFirstLogin = () => (dispatch) => {
    dispatch({
        type: 'RESET_FIRST_LOGIN'
    });
};


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

export const logout = () => async dispatch => {
    
    const config = {
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true,
    };
    
    try {
        await axiosInstance.post(`${process.env.REACT_APP_API_URL}/auth/logout/`, {}, config);

        dispatch({
            type: LOGOUT
        });
    } catch (err) {
        console.error("Logout failed", err);
    }
};