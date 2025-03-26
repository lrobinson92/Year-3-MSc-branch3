import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import axiosInstance from '../utils/axiosConfig';
import { formatMarkdownToHTML } from '../utils/utils';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { uploadDocument, generateSOP } from '../actions/googledrive';
import { FaArrowLeft } from 'react-icons/fa';
import '../globalStyles.css'; // Ensure the global styles are imported

const CreateDocument = ({ isAuthenticated, user, uploadDocument, generateSOP }) => {
  const [title, setTitle] = useState('');
  const [teamId, setTeamId] = useState('');
  const [teams, setTeams] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [inputType, setInputType] = useState('');
  const [textContent, setTextContent] = useState('');
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [summarising, setSummarising] = useState(false);
  const [improving, setImproving] = useState(false);
  const [originalContent, setOriginalContent] = useState('');
  const [improvedContent, setImprovedContent] = useState('');
  const [showingPreview, setShowingPreview] = useState(false);

  const quillRef = useRef(null);
  const fileInputRef = useRef(null);


  const navigate = useNavigate();
  

  // Optionally fetch teams that the user belongs to so they can choose which team this document is for.
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/teams/`, {
          withCredentials: true,
        });
        setTeams(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch teams.');
      }
    };
    fetchTeams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      setError('Title is required.');
      return;
    }
    if (!textContent) {
      setError('Please enter or upload some content.');
      return;
    }
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('team_id', teamId);
    formData.append('text_content', textContent);

    try {
      const res = await axiosInstance.post(
        `${process.env.REACT_APP_API_URL}/api/google-drive/upload/`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );
      // On success, redirect to view documents
      navigate('/view/documents');
    } catch (err) {
      console.error(err);
      setError('Failed to create document.');
    }
  };

  const handleFileUpload = (e) => {
      // Hide any existing preview
    setShowingPreview(false);
    setOriginalContent('');
    setImprovedContent('');
    
    // Reset summary as well
    setSummary('');

    const file = e.target.files[0];
    if (!file) return;

    // reset the file input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setSelectedFile(file);
    uploadDocument(file, title, setTextContent, setError, setInputType);
  };

  const handleGenerateSOP = () => {

    // Hide any existing preview
    setShowingPreview(false);
    setOriginalContent('');
    setImprovedContent('');
    
    // Reset summary as well
    setSummary('');

    generateSOP(prompt, quillRef, setTextContent, setInputType, setGenerating, setError);
  };

  const handleImproveSOP = async () => {
      // Hide any existing summary
    setSummary('');
    
    // Reset existing preview (if any)
    setShowingPreview(false);
    setOriginalContent('');
    setImprovedContent('');
  
    setImproving(true);
    try {
      // Store the original content before improving
      setOriginalContent(textContent);
      
      const res = await axiosInstance.post(
        '/api/improve-sop/',
        { content: textContent },
        { withCredentials: true }
      );
      
      // Store the improved content
      const improvedHtml = formatMarkdownToHTML(res.data.improved);
      setImprovedContent(improvedHtml);
      
      // Show the preview instead of directly applying changes
      setShowingPreview(true);
    } catch (err) {
      console.error(err);
      setError('Could not improve SOP.');
    } finally {
      setImproving(false);
    }
  };

  const acceptImprovedSOP = () => {
    // Apply the improved content
    const quill = quillRef.current.getEditor();
    const delta = quill.clipboard.convert(improvedContent);
    quill.setContents(delta);
    setTextContent(improvedContent);
    
    // Reset the preview state
    setShowingPreview(false);
    setOriginalContent('');
    setImprovedContent('');
  };
  
  const discardImprovedSOP = () => {
    // Keep the original content
    // No need to update the editor since we never changed it
    
    // Reset the preview state
    setShowingPreview(false);
    setOriginalContent('');
    setImprovedContent('');
  };


  
  const handleSummariseSOP = async () => {
  // Hide any existing preview
    setShowingPreview(false);
    setOriginalContent('');
    setImprovedContent('');

    setSummarising(true);
    try {
      const res = await axiosInstance.post(
        '/api/summarise-sop/',
        { content: textContent },
        { withCredentials: true }
      );
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
      setError('Could not summarise SOP.');
    } finally {
      setSummarising(false);
    }
  };
  
  

  return (
    <div className="container mt-5 entry-container">
      <FaArrowLeft className="back-arrow" onClick={() => navigate('/view/documents')} />
      <div className="card create-document-card p-4 w-100" style={{ maxWidth: '1200px' }}>
        <h4 className="mb-4">Create Document</h4>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mb-4">
          <input
            type="text"
            className="form-control"
            placeholder="Untitled"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <select
            className="form-select"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
          >
            <option value="">Select a team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div className="border rounded p-3 mb-4 bg-light-subtle" style={{ padding: '1.5rem' }}>
          <p className="fw-semibold mb-2">
            <span role="img" aria-label="spark">✨</span> Create an SOP with AI
          </p>
          <textarea
            className="form-control mb-2"
            rows="2"
            placeholder="Include any specific details or prompts you want the AI to consider"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="d-flex align-items-center gap-2 flex-wrap">
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
            <div className="ms-auto d-flex gap-2">
              <button className="btn btn-primary btn-sm flex-grow-0" onClick={handleGenerateSOP} disabled={generating}>
                {generating ? 'Generating...' : 'Generate SOP'}
              </button>
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


          {/* Spinner for Improving SOP */}
          {improving && (
            <div className="mt-3 text-muted d-flex align-items-center gap-2">
              <div className="spinner-border spinner-border-sm text-secondary" role="status" />
              <span>Improving SOP...</span>
            </div>
          )}
          {summarising && (
            <div className="mt-3 text-muted d-flex align-items-center gap-2">
              <div className="spinner-border spinner-border-sm text-secondary" role="status" />
              <span>Summarising SOP...</span>
            </div>
          )}

          {/* Summary Alert Section */}
          {summary && (
            <div className="alert alert-info mt-4">
              <h6>📄 Summary</h6>
              <p style={{ whiteSpace: 'pre-wrap' }}>{summary}</p>
              <div className="d-flex gap-2 mt-2">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => {
                    const quill = quillRef.current.getEditor();
                    const summaryDelta = quill.clipboard.convert(`<h2>Summary:</h2><p>${summary}</p><br/><br/>`);
                    const current = quill.getContents();
                    quill.setContents([...summaryDelta.ops, ...current.ops]);
                    setSummary('');
                  }}
                >
                  Insert at Top
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setSummary('')}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Improved SOP Preview - MOVED HERE */}
        {showingPreview && improvedContent && (
          <div className="mt-4 mb-4">
            <div className="alert alert-info">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">✨ Improved SOP Preview</h6>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={acceptImprovedSOP}
                  >
                    Accept Changes
                  </button>
                  <button 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={discardImprovedSOP}
                  >
                    Discard
                  </button>
                </div>
              </div>
              
              <div className="border rounded p-3 bg-white" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <div dangerouslySetInnerHTML={{ __html: improvedContent }} />
              </div>
            </div>
          </div>
        )}

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

          <div className="text-end mt-5 mb-2">
            <button className="btn btn-success px-4" onClick={handleSubmit}>
              Create Document
            </button>
          </div>
        </div>
      </div>
    );
  };

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
  user: state.auth.user,
});

export default connect(mapStateToProps, { uploadDocument, generateSOP })(CreateDocument);