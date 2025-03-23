import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import axiosInstance from '../utils/axiosConfig';

const CreateDocument = ({ isAuthenticated, user }) => {
    const [title, setTitle] = useState('');
    const [teamId, setTeamId] = useState('');
    const [inputType, setInputType] = useState('file'); // 'file' or 'text'
    const [file, setFile] = useState(null);
    const [textContent, setTextContent] = useState('');
    const [teams, setTeams] = useState([]);
    const [error, setError] = useState('');
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
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
    if (inputType === 'file' && !file) {
      setError('Please select a file.');
      return;
    }
    if (inputType === 'text' && !textContent) {
      setError('Please enter some text.');
      return;
    }

    

    const formData = new FormData();
    formData.append('title', title);
    formData.append('team_id', teamId);
    
    // Append either the file or the text content.
    if (inputType === 'file') {
        formData.append('file', file);
      } else {
        formData.append('text_content', textContent);
      }

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

  const handleGenerateSOP = async () => {
    setGenerating(true);
    try {
      const res = await axiosInstance.post(
        `${process.env.REACT_APP_API_URL}/api/generate-sop/`,
        { prompt },
        { withCredentials: true }
      );
      setTextContent(res.data.sop); // set the generated content as editable text
    } catch (err) {
      console.error(err);
      alert("Failed to generate SOP from OpenAI.");
    } finally {
      setGenerating(false);
    }
  };


  return (
    <div className="container mt-5 entry-container">
      <h2>Create New Document</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group mb-3">
          <label>Title</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group mb-3">
          <label>Team</label>
          <select
            className="form-control"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            required
          >
            <option value="">Select Team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div className="card p-3 mb-4">
          <h5>Need Help Starting Your SOP?</h5>
          <textarea
            className="form-control mb-2"
            rows="3"
            placeholder="Describe the SOP you want to create..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            className="btn btn-outline-primary"
            onClick={handleGenerateSOP}
            disabled={generating || !prompt.trim()}
          >
            {generating ? "Generating..." : "Generate SOP with AI"}
          </button>
        </div>


        <div className="form-group mb-3">
          <label>Document Type</label>
          <div>
            <label className="me-3">
              <input
                type="radio"
                name="inputType"
                value="file"
                checked={inputType === 'file'}
                onChange={() => setInputType('file')}
              />{' '}
              Upload File
            </label>
            <label>
              <input
                type="radio"
                name="inputType"
                value="text"
                checked={inputType === 'text'}
                onChange={() => setInputType('text')}
              />{' '}
              Enter Text
            </label>
          </div>
        </div>
        {inputType === 'file' ? (
          <div className="form-group mb-3">
            <label>File</label>
            <input
              type="file"
              className="form-control"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
          </div>
        ) : (
          <div className="form-group mb-3">
            <label>Text Content</label>
            <textarea
              className="form-control"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows="10" // Set initial size to 10 rows
              style={{ resize: 'vertical' }} // Allow vertical resizing
              required
            />
          </div>
        )}
        <button type="submit" className="btn btn-primary">
          Create Document
        </button>
      </form>
    </div>
  );
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
  user: state.auth.user,
});

export default connect(mapStateToProps)(CreateDocument);