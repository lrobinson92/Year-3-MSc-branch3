import axiosInstance from '../utils/axiosConfig';
import { marked } from 'marked';
import mammoth from 'mammoth';
import { combineShortParagraphs, formatMarkdownToHTML } from '../utils/utils';
import { 
  UPLOAD_DOCUMENT_SUCCESS, 
  UPLOAD_DOCUMENT_FAIL, 
  SET_DOCUMENTS, 
  SET_DRIVE_LOGGED_IN, 
  GENERATE_SOP_SUCCESS, 
  GENERATE_SOP_FAIL,
  CHECK_DRIVE_AUTH_SUCCESS,
  CHECK_DRIVE_AUTH_FAIL,
  GOOGLE_DRIVE_AUTH_FAIL
} from './types';

// New action to check Google Drive authentication status
export const checkDriveAuthStatus = () => async dispatch => {
  try {
    await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/google-drive/files/`, {
      withCredentials: true
    });
    
    dispatch({
      type: CHECK_DRIVE_AUTH_SUCCESS
    });
    
    return true;
  } catch (err) {
    dispatch({
      type: CHECK_DRIVE_AUTH_FAIL
    });
    
    return false;
  }
};

// Action to initiate Google Drive login
export const googleDriveLogin = (redirectPath = null) => dispatch => {
  // Store the current URL to redirect back to after login
  if (redirectPath) {
    sessionStorage.setItem('googleDriveRedirect', redirectPath);
  } else {
    sessionStorage.setItem('googleDriveRedirect', window.location.pathname);
  }
  
  try {
    // Request auth URL from backend with consistent redirect URI
    const res = axiosInstance.get(
      `${process.env.REACT_APP_API_URL}/api/google-drive/login/`,
      { withCredentials: true }
    );
    
    // Store current page URL for redirect back after auth
    const currentUrl = window.location.href;
    sessionStorage.setItem('googleDriveRedirectUrl', currentUrl);
    
    // Redirect to Google auth
    window.location.href = res.data.auth_url;
    
  } catch (error) {
    console.error('Error initiating Google Drive login:', error);
    dispatch({
      type: GOOGLE_DRIVE_AUTH_FAIL,
      payload: error.response?.data || 'Failed to authenticate with Google Drive'
    });
  }
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

            dispatch({ type: UPLOAD_DOCUMENT_SUCCESS, payload: result.value });
        } catch (err) {
            console.error('Error reading .docx file:', err);
            setError('Unable to read DOCX file.');
            dispatch({ type: UPLOAD_DOCUMENT_FAIL });
        }
    } else if (fileExt === 'txt') {
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const plainText = e.target.result;
                const html = plainText
                    .split('\n')
                    .map((line) => `<p>${line.trim()}</p>`)
                    .join('');
                setTextContent(html);

                dispatch({ type: UPLOAD_DOCUMENT_SUCCESS, payload: html });
            };
            reader.readAsText(file);
        } catch (err) {
            console.error('Error reading .txt file:', err);
            setError('Unable to read TXT file.');
            dispatch({ type: UPLOAD_DOCUMENT_FAIL });
        }
    } else {
        setError('Unsupported file type. Only .docx and .txt are supported.');
        dispatch({ type: UPLOAD_DOCUMENT_FAIL });
    }
};

// Action to generate SOP
export const generateSOP = (prompt, quillRef, setTextContent, setInputType, setGenerating, setError) => async dispatch => {
    setGenerating(true);

    try {
        const res = await axiosInstance.post(
            '/api/generate-sop/',
            { prompt },
            { withCredentials: true }
        );
        const html = formatMarkdownToHTML(res.data.sop);
        const quill = quillRef.current.getEditor();
        const delta = quill.clipboard.convert(html);
        quill.setContents(delta);

        setTextContent(delta); // Set the text content
        setInputType('text'); // Ensure the text input mode is selected

        dispatch({
            type: GENERATE_SOP_SUCCESS,
            payload: html
        });
    } catch (err) {
        console.error(err);
        setError('Failed to generate SOP.');
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


