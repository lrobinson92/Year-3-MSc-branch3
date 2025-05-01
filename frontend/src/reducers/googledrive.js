import { 
    GOOGLE_DRIVE_LOGIN_SUCCESS, 
    GOOGLE_DRIVE_LOGIN_FAIL, 
    UPLOAD_DOCUMENT_SUCCESS, 
    UPLOAD_DOCUMENT_FAIL,
    SET_DOCUMENTS,
    SET_DRIVE_LOGGED_IN,
    CHECK_DRIVE_AUTH_SUCCESS,
    CHECK_DRIVE_AUTH_FAIL,
    DELETE_DOCUMENT_SUCCESS,
    CREATE_DOCUMENT_SUCCESS,
    CREATE_DOCUMENT_FAIL,
    IMPROVE_SOP_START,
    IMPROVE_SOP_SUCCESS,
    IMPROVE_SOP_FAIL,
    SUMMARIZE_SOP_START,
    SUMMARIZE_SOP_SUCCESS,
    SUMMARIZE_SOP_FAIL
} from '../actions/types';

const initialState = {
    driveLoggedIn: false,
    documents: [],
    error: null,
    loading: false,
    
    // New state for SOP improvements
    improvingSOP: false,
    originalContent: '',
    improvedContent: '',
    
    // New state for SOP summarization
    summarizingSOP: false,
    summary: '',
};

export default function(state = initialState, action) {
    const { type, payload } = action;
    switch (type) {
        case SET_DOCUMENTS:
            return {
                ...state,
                documents: payload
            };
        case SET_DRIVE_LOGGED_IN:
            console.log("Updating driveLoggedIn in reducer to:", payload);
            return {
                ...state,
                driveLoggedIn: payload
            };
        case GOOGLE_DRIVE_LOGIN_SUCCESS:
            console.log("Updating driveLoggedIn in reducer to: true in google drive logic reducer");
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
        case CHECK_DRIVE_AUTH_SUCCESS:
            return {
                ...state,
                driveLoggedIn: true
            };
        case CHECK_DRIVE_AUTH_FAIL:
            return {
                ...state,
                driveLoggedIn: false
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
        case DELETE_DOCUMENT_SUCCESS:
            return {
                ...state,
                documents: state.documents.filter(doc => doc.id !== payload)
            };
        case CREATE_DOCUMENT_SUCCESS:
            return {
                ...state,
                loading: false,
                error: null
            };
        case CREATE_DOCUMENT_FAIL:
            return {
                ...state,
                loading: false,
                error: payload
            };
        case IMPROVE_SOP_START:
            return {
                ...state,
                improvingSOP: true,
                error: null
            };
        case IMPROVE_SOP_SUCCESS:
            return {
                ...state,
                improvingSOP: false,
                originalContent: payload.originalContent,
                improvedContent: payload.improvedContent
            };
        case IMPROVE_SOP_FAIL:
            return {
                ...state,
                improvingSOP: false,
                error: payload
            };
        case SUMMARIZE_SOP_START:
            return {
                ...state,
                summarizingSOP: true,
                error: null
            };
        case SUMMARIZE_SOP_SUCCESS:
            return {
                ...state,
                summarizingSOP: false,
                summary: payload
            };
        case SUMMARIZE_SOP_FAIL:
            return {
                ...state,
                summarizingSOP: false,
                error: payload
            };
        default:
            return state;
    }
}