import axiosInstance from '../utils/axiosConfig';
import { 
    ONEDRIVE_LOGIN_SUCCESS, 
    ONEDRIVE_LOGIN_FAIL, 
    UPLOAD_DOCUMENT_SUCCESS, 
    UPLOAD_DOCUMENT_FAIL 
} from './types';

const API_URL = process.env.REACT_APP_API_URL;

export const onedriveLogin = () => async dispatch => {
    try {
        const res = await axiosInstance.get(`${API_URL}/api/onedrive/login/`,
            { withCredentials: true }
        );
        console.log("✅ Received auth URL:", res.data.auth_url); // Debugging line
        if (res.data.auth_url) {
            window.location.href = res.data.auth_url;
        } else {
            console.error("❌ No auth URL received from backend.");
        }
        dispatch({ type: ONEDRIVE_LOGIN_SUCCESS });
    } catch (err) {
        console.error("❌ OneDrive login failed:", err);
        dispatch({ type: ONEDRIVE_LOGIN_FAIL });
    }
};

export const uploadDocument = (file) => async dispatch => {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await axiosInstance.post(`${process.env.REACT_APP_API_URL}/api/onedrive/upload`, formData, {
            withCredentials: true,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
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