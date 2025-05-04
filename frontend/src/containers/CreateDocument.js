import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  uploadDocument, 
  generateSOP, 
  createDocument, 
  improveSOP, 
  summarizeSOP,
  clearSummary,
  clearImprovedContent,
  clearDocumentError
} from '../actions/googledrive';
import { fetchTeams } from '../actions/team';
import { FaArrowLeft, FaCalendarAlt } from 'react-icons/fa';
import { redirectToGoogleDriveLogin } from '../utils/driveAuthUtils';
import '../globalStyles.css';

/**
 * CreateDocument Component - A form for creating new SOPs with various input methods
 * Provides document editing with AI assistance and team assignment capabilities
 */
const CreateDocument = ({ 
  isAuthenticated, 
  user, 
  teams,
  uploadDocument, 
  generateSOP, 
  createDocument,
  improveSOP,
  summarizeSOP,
  clearSummary,
  clearImprovedContent,
  clearDocumentError,
  driveLoggedIn,
  fetchTeams,
  improvingSOP,
  summarizingSOP,
  summary,
  originalContent,
  improvedContent,
  error: reduxError
}) => {
  // Document information state
  const [title, setTitle] = useState('');
  const [teamId, setTeamId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [inputType, setInputType] = useState('');
  const [textContent, setTextContent] = useState('');
  const [error, setError] = useState('');
  
  // UI state management
  const [generating, setGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showingPreview, setShowingPreview] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Review reminder settings
  const [reviewDate, setReviewDate] = useState('');
  const [setReviewReminder, setSetReviewReminder] = useState(false);

  // References to DOM elements
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  /**
   * Redirects to Google Drive authentication when the user needs to connect
   */
  const handleGDriveAuth = () => {
    redirectToGoogleDriveLogin('/create-document');
  };

  /**
   * Load teams when component mounts and clear data when unmounting
   */
  useEffect(() => {
    // This will run when the component mounts
    fetchTeams();

    // Clear any existing document errors when component mounts
    clearDocumentError();

    // This will run when the component unmounts
    return () => {
      // Clear any improvement data when navigating away
      clearImprovedContent();
      clearSummary();
      clearDocumentError();
    };
  }, [fetchTeams, clearImprovedContent, clearSummary, clearDocumentError]);

  /**
   * Display any errors from Redux state
   */
  useEffect(() => {
    if (reduxError) {
      setError(reduxError);
    }
  }, [reduxError]);

  /**
   * Show preview when improved content becomes available
   */
  useEffect(() => {
    if (improvedContent && originalContent) {
      setShowingPreview(true);
    }
  }, [improvedContent, originalContent]);

  /**
   * Handle document submission and creation
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Input validation
    if (!title) {
      setError('Title is required.');
      return;
    }
    
    if (!textContent) {
      setError('Please enter or upload some content.');
      return;
    }

    // Show loading state during creation
    setCreating(true);

    try {
      // Call Redux action to create the document
      const result = await createDocument({
        title,
        textContent,
        teamId: teamId || '',
        reviewDate,
        setReviewReminder
      });

      // Handle response from server
      if (result.success) {
        // Clear improved content when document is created successfully
        clearImprovedContent();
        
        // Navigate to the document or team page
        if (teamId) {
          navigate(`/team/${teamId}`);
        } else {
          navigate('/view/documents');
        }
      } else {
        setError(result.error || 'Failed to create document. Please try again.');
      }
    } catch (error) {
      // Handle error
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  /**
   * Handles file upload functionality
   * Sends file to server for processing and updates editor with content
   */
  const handleFileUpload = (e) => {
    // Reset preview states when a new file is uploaded
    setShowingPreview(false);
    
    const file = e.target.files[0];
    if (!file) return;

    // Clear file input after selection to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setSelectedFile(file);
    // Process file and update text content
    uploadDocument(file, title, setTextContent, setError, setInputType);
  };

  /**
   * Generates an SOP using OpenAI based on user prompt
   * Updates the editor with the generated content
   */
  const handleGenerateSOP = () => {
    // Reset preview when generating new content
    setShowingPreview(false);
    
    // Call Redux action to generate an SOP
    generateSOP(prompt, quillRef, setTextContent, setInputType, setGenerating, setError);
  };

  /**
   * Sends current SOP content to AI for improvement
   */
  const handleImproveSOP = async () => {
    improveSOP(textContent);
  };

  /**
   * Applies the AI-improved content to the editor
   */
  const acceptImprovedSOP = () => {
    // Update editor with improved content
    const quill = quillRef.current.getEditor();
    quill.setText('');
    quill.clipboard.dangerouslyPasteHTML(0, improvedContent);
    setTextContent(improvedContent);
    
    // Hide preview after accepting changes
    setShowingPreview(false);
  };

  /**
   * Discards AI improvements and keeps original content
   */
  const discardImprovedSOP = () => {
    setShowingPreview(false);
  };

  /**
   * Sends current SOP to AI for summarization
   */
  const handleSummariseSOP = async () => {
    setShowingPreview(false);
    
    summarizeSOP(textContent);
  };

  /**
   * Navigates back to previous page
   */
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="container mt-5 entry-container">
      {/* Back button for navigation */}
      <FaArrowLeft
        className="back-arrow"
        onClick={handleGoBack}
        style={{ cursor: 'pointer' }}
        title="Go back to previous page"
      />

      {/* Main document creation card */}
      <div className="card create-document-card p-4 w-100" style={{ maxWidth: '1200px' }}>
        <h4 className="mb-4">Create Document</h4>

        {/* Error display area */}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Document title input */}
        <div className="mb-4">
          <input
            type="text"
            className="form-control"
            placeholder="Untitled"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Team selection dropdown */}
        <div className="mb-4">
          <select
            id="teamSelect"
            className="form-select"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
          >
            <option value="">Personal Document (No Team)</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {/* Review reminder section */}
        <div className="mb-4 border rounded p-3 bg-light-subtle" style={{ padding: '1rem' }}>
          <div className="form-check mb-2">
            <input
              type="checkbox"
              className="form-check-input"
              id="setReviewReminder"
              checked={setReviewReminder}
              onChange={(e) => setSetReviewReminder(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="setReviewReminder">
              <FaCalendarAlt className="me-1" /> Set Review Reminder
            </label>
          </div>

          {/* Conditional review date picker */}
          {setReviewReminder && (
            <div className="mt-2">
              <label htmlFor="reviewDate" className="form-label">Review Date</label>
              <input
                type="date"
                className="form-control"
                id="reviewDate"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}  // Ensures dates in the past can't be selected
              />
              <div className="form-text text-muted">
                A reminder will be sent 14 days before the review date.
              </div>
            </div>
          )}
        </div>

        {/* AI-powered SOP creation section */}
        <div className="border rounded p-3 mb-4 bg-light-subtle" style={{ padding: '1.5rem' }}>
          <p className="fw-semibold mb-2">
            <span role="img" aria-label="spark">✨</span> Create an SOP with AI
          </p>
          
          {/* AI prompt input */}
          <textarea
            className="form-control mb-2"
            rows="2"
            placeholder="Include any specific details or prompts you want the AI to consider"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          {/* File upload and AI action buttons */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* File upload button */}
            <label htmlFor="fileUpload" className="btn btn-outline-primary btn-sm flex-grow-0">
              Choose File
            </label>
            <input
              type="file"
              id="fileUpload"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".docx,.txt"
              style={{ display: 'none' }}
            />
            
            {/* Display selected file information */}
            {selectedFile && (
              <div className="d-flex align-items-center gap-2 mt-2">
                <span className="text-muted">Selected File: {selectedFile.name}</span>
                <button
                  className="btn btn-outline-danger btn-sm flex-grow-0"
                  onClick={() => {
                    setSelectedFile(null);
                    setTextContent('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            )}
            
            {/* AI action buttons */}
            <div className="ms-auto d-flex gap-2">
              {/* Generate SOP button */}
              <button className="btn btn-primary btn-sm flex-grow-0" onClick={handleGenerateSOP} disabled={generating}>
                {generating ? 'Generating...' : 'Generate SOP'}
              </button>
              
              {/* AI actions dropdown menu */}
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary btn-sm dropdown-toggle flex-grow-0"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  AI Actions
                </button>
                <ul className="dropdown-menu">
                  <li>
                    <button className="dropdown-item" onClick={handleImproveSOP}>
                      ✨ Improve SOP
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item" onClick={handleSummariseSOP}>
                      📄 Summarise SOP
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Loading indicators for AI operations */}
          {improvingSOP && (
            <div className="mt-3 text-muted d-flex align-items-center gap-2">
              <div className="spinner-border spinner-border-sm text-secondary" role="status" />
              <span>Improving SOP...</span>
            </div>
          )}
          {summarizingSOP && (
            <div className="mt-3 text-muted d-flex align-items-center gap-2">
              <div className="spinner-border spinner-border-sm text-secondary" role="status" />
              <span>Summarising SOP...</span>
            </div>
          )}

          {/* Summary display and insertion controls */}
          {summary && (
            <div className="alert alert-info mt-4">
              <h6>📄 Summary</h6>
              <p style={{ whiteSpace: 'pre-wrap' }}>{summary}</p>
              <div className="d-flex gap-2 mt-2">
                {/* Button to insert summary at top of document */}
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => {
                    // Insert the summary
                    const quill = quillRef.current.getEditor();
                    const summaryDelta = quill.clipboard.convert(`<h2>Summary:</h2><p>${summary}</p><br/><br/>`);
                    const current = quill.getContents();
                    quill.setContents([...summaryDelta.ops, ...current.ops]);
                    
                    // Use the dedicated clear action instead
                    clearSummary();
                  }}
                >
                  Insert at Top
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    // Use the dedicated clear action
                    clearSummary();
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Improved SOP preview section */}
        {showingPreview && improvedContent && (
          <div className="mt-4 mb-4">
            <div className="alert alert-info">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">✨ Improved SOP Preview</h6>
                <div className="d-flex gap-2">
                  {/* Accept improved content button */}
                  <button
                    className="btn btn-success btn-sm"
                    onClick={acceptImprovedSOP}
                  >
                    Accept Changes
                  </button>
                  {/* Discard improved content button */}
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={discardImprovedSOP}
                  >
                    Discard
                  </button>
                </div>
              </div>

              {/* Preview content display */}
              <div className="border rounded p-3 bg-white" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <div dangerouslySetInnerHTML={{ __html: improvedContent }} />
              </div>
            </div>
          </div>
        )}

        {/* Google Drive authentication prompt */}
        {!driveLoggedIn && (
          <button 
            className="btn btn-primary" 
            onClick={handleGDriveAuth}
          >
            Connect to Google Drive to Continue
          </button>
        )}

        {/* Rich text editor for document content */}
        <div className="mb-4" style={{ marginBottom: '2rem' }}>
          <ReactQuill
            ref={quillRef}
            value={textContent}
            onChange={(content) => {
              setTextContent(content);
            }}
            theme="snow"
            style={{
              minHeight: '300px',
              backgroundColor: '#fff',
              marginBottom: '2rem',
              transition: 'height 0.2s ease',
              maxHeight: '600px',
              overflowY: 'auto',
            }}
            modules={{
              toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link'],
                ['clean'],
              ],
            }}
            formats={['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link']}
          />
        </div>

        {/* Form submission button */}
        <div className="text-end mt-5 mb-2">
          <button
            className="btn btn-success px-4"
            onClick={handleSubmit}
            disabled={creating}
          >
            {creating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating...
              </>
            ) : (
              'Create Document'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Map Redux state to component props
 */
const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
  user: state.auth.user,
  teams: state.team.teams,
  driveLoggedIn: state.googledrive.driveLoggedIn,
  improvingSOP: state.googledrive.improvingSOP,
  summarizingSOP: state.googledrive.summarizingSOP,
  summary: state.googledrive.summary,
  originalContent: state.googledrive.originalContent,
  improvedContent: state.googledrive.improvedContent,
  error: state.googledrive.error
});

/**
 * Connect component to Redux store with actions and state
 */
export default connect(
  mapStateToProps, 
  { uploadDocument, generateSOP, createDocument, improveSOP, summarizeSOP, fetchTeams, clearSummary, clearImprovedContent, clearDocumentError }
)(CreateDocument);