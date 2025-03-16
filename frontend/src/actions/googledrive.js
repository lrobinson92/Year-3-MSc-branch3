import axiosInstance from '../utils/axiosConfig';
import { GOOGLE_DRIVE_LOGIN_SUCCESS, GOOGLE_DRIVE_LOGIN_FAIL, UPLOAD_DOCUMENT_SUCCESS, UPLOAD_DOCUMENT_FAIL, SET_DOCUMENTS, SET_DRIVE_LOGGED_IN } from './types';

// Action to initiate Google Drive login
export const googleDriveLogin = () => dispatch => {
    // Directly redirect the browser to the login endpoint.
    window.location.href = `${process.env.REACT_APP_API_URL}/api/google-drive/login/`;
};

// Action to upload a document to Google Drive
export const uploadDocument = (file) => async dispatch => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await axiosInstance.post(`${process.env.REACT_APP_API_URL}/api/google-drive/upload/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            withCredentials: true
        });
        dispatch({
            type: UPLOAD_DOCUMENT_SUCCESS,
            payload: res.data
        });
    } catch (err) {
        dispatch({
            type: UPLOAD_DOCUMENT_FAIL
        });
        throw err;
    }
};

// Action to set documents
export const setDocuments = (documents) => dispatch => {
    dispatch({
        type: SET_DOCUMENTS,
        payload: documents
    });
};

// Action to set drive logged in status
export const setDriveLoggedIn = (status) => dispatch => {
    dispatch({
        type: SET_DRIVE_LOGGED_IN,
        payload: status
    });
};