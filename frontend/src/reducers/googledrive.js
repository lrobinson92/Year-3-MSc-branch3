import { 
    GOOGLE_DRIVE_LOGIN_SUCCESS, 
    GOOGLE_DRIVE_LOGIN_FAIL, 
    UPLOAD_DOCUMENT_SUCCESS, 
    UPLOAD_DOCUMENT_FAIL 
} from '../actions/types';

const initialState = {
    driveLoggedIn: false,
    documents: [],
    error: null
};

export default function(state = initialState, action) {
    const { type, payload } = action;

    switch (type) {
        case GOOGLE_DRIVE_LOGIN_SUCCESS:
            return {
                ...state,
                driveLoggedIn: true,
                error: null
            };
        case GOOGLE_DRIVE_LOGIN_FAIL:
            return {
                ...state,
                driveLoggedIn: false,
                error: 'Failed to login to Google Drive'
            };
        case UPLOAD_DOCUMENT_SUCCESS:
            return {
                ...state,
                documents: [...state.documents, payload],
                error: null
            };
        case UPLOAD_DOCUMENT_FAIL:
            return {
                ...state,
                error: 'Failed to upload document'
            };
        default:
            return state;
    }
}