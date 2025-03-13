import { 
    ONEDRIVE_LOGIN_SUCCESS, 
    ONEDRIVE_LOGIN_FAIL, 
    UPLOAD_DOCUMENT_SUCCESS, 
    UPLOAD_DOCUMENT_FAIL 
} from '../actions/types';

const initialState = {
    isAuthenticated: false,
    documents: [],
    error: null
};

function onedriveReducer(state = initialState, action) {
    const { type, payload } = action;

    switch (type) {
        case ONEDRIVE_LOGIN_SUCCESS:
            return {
                ...state,
                isAuthenticated: true,
                error: null
            };
        case ONEDRIVE_LOGIN_FAIL:
            return {
                ...state,
                isAuthenticated: false,
                error: 'Failed to authenticate with OneDrive'
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

export default onedriveReducer;