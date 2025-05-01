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
  GOOGLE_DRIVE_AUTH_FAIL,
  DELETE_DOCUMENT_SUCCESS,
  DELETE_DOCUMENT_FAIL,
  CREATE_DOCUMENT_SUCCESS,
  CREATE_DOCUMENT_FAIL,
  IMPROVE_SOP_START,
  IMPROVE_SOP_SUCCESS,
  IMPROVE_SOP_FAIL,
  SUMMARIZE_SOP_START,
  SUMMARIZE_SOP_SUCCESS,
  SUMMARIZE_SOP_FAIL
} from './types';

/**
 * Check if the user is authenticated with Google Drive
 * Makes a test request to a protected endpoint to verify authentication
 * 
 * @returns {boolean} Authentication status
 */
export const checkDriveAuthStatus = () => async dispatch => {
  try {
    // Test request to files endpoint that requires authentication
    await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/google-drive/files/`, {
      withCredentials: true
    });
    
    // Authentication is valid
    dispatch({
      type: CHECK_DRIVE_AUTH_SUCCESS
    });
    
    return true;
  } catch (err) {
    // Authentication failed or expired
    dispatch({
      type: CHECK_DRIVE_AUTH_FAIL
    });
    
    return false;
  }
};

/**
 * Initiate Google Drive OAuth login flow
 * Saves current path for redirect after authentication
 * 
 * @param {string} redirectPath - Optional custom path to redirect to after auth
 */
export const googleDriveLogin = (redirectPath = null) => async dispatch => {
  // Save the current location to return after authentication
  if (redirectPath) {
    sessionStorage.setItem('googleDriveRedirect', redirectPath);
  } else {
    sessionStorage.setItem('googleDriveRedirect', window.location.pathname);
  }
  
  try {
    // Request authentication URL from backend
    const res = await axiosInstance.get(
      `${process.env.REACT_APP_API_URL}/api/google-drive/login/`,
      { withCredentials: true }
    );
    
    // Store full current URL for redirect back after auth
    sessionStorage.setItem('googleDriveRedirectUrl', window.location.href);
    
    // Redirect user to Google's OAuth consent screen
    window.location.href = res.data.auth_url;
  } catch (error) {
    console.error('Error initiating Google Drive login:', error);
    dispatch({
      type: GOOGLE_DRIVE_AUTH_FAIL,
      payload: error.response?.data || 'Failed to authenticate with Google Drive'
    });
  }
};

/**
 * Process an uploaded file and convert to HTML content for the editor
 * Supports .docx and .txt files with different processing logic
 * 
 * @param {File} file - The file object from file input
 * @param {string} title - Document title (fallback to filename if empty)
 * @param {Function} setTextContent - State setter for document content
 * @param {Function} setError - State setter for error messages
 * @param {Function} setInputType - State setter for input type (file/text)
 */
export const uploadDocument = (file, title, setTextContent, setError, setInputType) => async dispatch => {
    const fileName = file.name;
    const fileExt = fileName.split('.').pop().toLowerCase();

    // Switch to text editor mode for all uploads
    setInputType('text');
    
    // Use filename as default title if none provided
    title = title || fileName.split('.')[0]; 

    // Process .docx files using mammoth.js
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
    } 
    // Process .txt files by wrapping lines in paragraph tags
    else if (fileExt === 'txt') {
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
    } 
    // Reject unsupported file types
    else {
        setError('Unsupported file type. Only .docx and .txt are supported.');
        dispatch({ type: UPLOAD_DOCUMENT_FAIL });
    }
};

/**
 * Generate an SOP document using AI based on user prompt
 * Updates editor with AI-generated content
 * 
 * @param {string} prompt - User instructions for AI generation
 * @param {Object} quillRef - Reference to Quill editor
 * @param {Function} setTextContent - State setter for document content
 * @param {Function} setInputType - State setter for input type
 * @param {Function} setGenerating - State setter for generation status
 * @param {Function} setError - State setter for error messages
 */
export const generateSOP = (prompt, quillRef, setTextContent, setInputType, setGenerating, setError) => async dispatch => {
    // Show generation in progress indicator
    setGenerating(true);

    try {
        // Request AI-generated SOP from backend
        const res = await axiosInstance.post(
            '/api/generate-sop/',
            { prompt },
            { withCredentials: true }
        );
        
        // Convert markdown response to HTML for editor
        const html = formatMarkdownToHTML(res.data.sop);
        
        // Insert HTML into Quill editor using clipboard API
        const quill = quillRef.current.getEditor();
        const delta = quill.clipboard.convert(html);
        quill.setContents(delta);

        // Update component state
        setTextContent(delta);
        setInputType('text');

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
        // Always reset the generating state
        setGenerating(false);
    }
};

/**
 * Update the document list in the Redux store
 * Used after fetching documents from the API
 * 
 * @param {Array} documents - List of document objects
 */
export const setDocuments = (documents) => dispatch => {
    dispatch({
        type: SET_DOCUMENTS,
        payload: documents
    });
};

/**
 * Update the Google Drive authentication status in the Redux store
 * 
 * @param {boolean} status - Authentication status
 */
export const setDriveLoggedIn = (status) => dispatch => {
    dispatch({
        type: SET_DRIVE_LOGGED_IN,
        payload: status
    });
};

/**
 * Delete a document from Google Drive and the database
 * Shows confirmation dialog before proceeding
 * 
 * @param {string} documentId - ID of document to delete
 * @returns {boolean} Success status of deletion
 */
export const deleteDocument = (documentId) => async dispatch => {
  try {
    // User confirmation before deletion
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return false;
    }
    
    // Delete document via API
    await axiosInstance.delete(
      `${process.env.REACT_APP_API_URL}/api/documents/${documentId}/`, 
      { withCredentials: true }
    );
    
    // Update Redux state
    dispatch({
      type: DELETE_DOCUMENT_SUCCESS,
      payload: documentId
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    
    dispatch({
      type: DELETE_DOCUMENT_FAIL,
      payload: error.response?.data || 'Failed to delete document'
    });
    
    return false;
  }
};

/**
 * Create a new document in Google Drive and store metadata in database
 * Supports team association and review date settings
 * 
 * @param {Object} documentData - Document data including content and metadata
 * @param {string} documentData.title - Document title
 * @param {string} documentData.textContent - Document HTML content
 * @param {string} documentData.teamId - Optional team ID to associate document with
 * @param {string} documentData.reviewDate - Optional date for document review
 * @param {boolean} documentData.setReviewReminder - Whether to set review reminder
 * @returns {Object} Result object with success status and data or error
 */
export const createDocument = (documentData) => async (dispatch) => {
  const { title, textContent, teamId, reviewDate, setReviewReminder } = documentData;
  
  // Prepare form data for multipart request
  const formData = new FormData();
  formData.append('title', title);
  formData.append('text_content', textContent);
  formData.append('content_type', 'html');
  
  // Add optional team association
  if (teamId) {
    formData.append('team_id', teamId);
  }
  
  // Add optional review date
  if (setReviewReminder && reviewDate) {
    formData.append('review_date', reviewDate);
  }
  
  try {
    // Upload document to Google Drive via backend
    const response = await axiosInstance.post(
      `${process.env.REACT_APP_API_URL}/api/google-drive/upload/`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      }
    );
    
    dispatch({
      type: CREATE_DOCUMENT_SUCCESS,
      payload: response.data
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    dispatch({
      type: CREATE_DOCUMENT_FAIL,
      payload: error.response?.data || 'Failed to create document'
    });
    
    return { success: false, error: error.response?.data || 'Failed to create document' };
  }
};

/**
 * Use AI to improve an existing SOP document
 * Enhances formatting, clarity, and professionalism
 * 
 * @param {string} content - Current document HTML content
 * @returns {Object} Result with original and improved content or error
 */
export const improveSOP = (content) => async (dispatch) => {
  // Signal processing start
  dispatch({ type: IMPROVE_SOP_START });
  
  try {
    // Send content to backend AI endpoint
    const response = await axiosInstance.post(
      '/api/improve-sop/',
      { content },
      { withCredentials: true }
    );
    
    // Format the returned markdown as HTML
    const improvedHtml = formatMarkdownToHTML(response.data.improved);
    
    dispatch({
      type: IMPROVE_SOP_SUCCESS,
      payload: {
        originalContent: content,
        improvedContent: improvedHtml
      }
    });
    
    return { success: true, originalContent: content, improvedContent: improvedHtml };
  } catch (error) {
    dispatch({
      type: IMPROVE_SOP_FAIL,
      payload: error.response?.data || 'Could not improve SOP'
    });
    
    return { success: false, error: error.response?.data || 'Could not improve SOP' };
  }
};

/**
 * Use AI to create a concise summary of an SOP document
 * Generates a brief overview highlighting key points
 * 
 * @param {string} content - Document HTML content to summarize
 * @returns {Object} Result with summary or error message
 */
export const summarizeSOP = (content) => async (dispatch) => {
  // Signal processing start
  dispatch({ type: SUMMARIZE_SOP_START });
  
  try {
    // Send content to backend AI endpoint
    const response = await axiosInstance.post(
      '/api/summarise-sop/',
      { content },
      { withCredentials: true }
    );
    
    dispatch({
      type: SUMMARIZE_SOP_SUCCESS,
      payload: response.data.summary
    });
    
    return { success: true, summary: response.data.summary };
  } catch (error) {
    dispatch({
      type: SUMMARIZE_SOP_FAIL,
      payload: error.response?.data || 'Could not summarize SOP'
    });
    
    return { success: false, error: error.response?.data || 'Could not summarize SOP' };
  }
};


