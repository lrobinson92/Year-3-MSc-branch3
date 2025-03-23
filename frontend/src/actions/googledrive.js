import axiosInstance from '../utils/axiosConfig';
import { marked } from 'marked';
import mammoth from 'mammoth';
import { combineShortParagraphs } from '../utils/utils';
import { UPLOAD_DOCUMENT_SUCCESS, UPLOAD_DOCUMENT_FAIL, SET_DOCUMENTS, SET_DRIVE_LOGGED_IN, GENERATE_SOP_SUCCESS, GENERATE_SOP_FAIL } from './types';

// Action to initiate Google Drive login
export const googleDriveLogin = () => dispatch => {
    // Directly redirect the browser to the login endpoint.
    window.location.href = `${process.env.REACT_APP_API_URL}/api/google-drive/login/`;
};

// Action to upload a document to Google Drive
export const uploadDocument = (file, title, setTextContent, setError, setInputType) => async dispatch => {
    const fileName = file.name;
    const fileExt = fileName.split('.').pop().toLowerCase();

    setInputType('text'); // switch to text editor mode
    title = title || fileName; // auto-fill title from file name

    if (fileExt === 'docx') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });

            const cleaned = combineShortParagraphs(result.value);
            setTextContent(cleaned);

            dispatch({
                type: UPLOAD_DOCUMENT_SUCCESS,
                payload: result.value
            });
        } catch (err) {
            console.error('Error reading .docx file:', err);
            setError('Unable to read DOCX file.');
            dispatch({
                type: UPLOAD_DOCUMENT_FAIL
            });
        }
    }
};

// Action to generate SOP
export const generateSOP = (prompt, setTextContent, setInputType, setGenerating, setError) => async dispatch => {
    setGenerating(true);
    try {
        const res = await axiosInstance.post(
            `${process.env.REACT_APP_API_URL}/api/generate-sop/`,
            { prompt },
            { withCredentials: true }
        );
        const markdown = res.data.sop;
        const html = marked(markdown); // Convert markdown → HTML

        setTextContent(html);      // Quill editor can now render it properly
        setInputType('text');      // Ensure the text input mode is selected

        dispatch({
            type: GENERATE_SOP_SUCCESS,
            payload: html
        });
    } catch (err) {
        console.error(err);
        setError("Failed to generate SOP from OpenAI.");
        dispatch({
            type: GENERATE_SOP_FAIL
        });
    } finally {
        setGenerating(false);
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


  