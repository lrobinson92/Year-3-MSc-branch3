// ViewSOP.js
import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import GoogleDriveAuthCheck from '../components/GoogleDriveAuthCheck';
import '../globalStyles.css';
import { FaArrowLeft } from 'react-icons/fa';
import { googleDriveLogin } from '../actions/googledrive';

const ViewSOP = ({ isAuthenticated, driveLoggedIn, googleDriveLogin }) => {
  const { id } = useParams(); // Document ID
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're authenticated with Google Drive before fetching
    if (!driveLoggedIn) {
      setLoading(false);
      return; // Don't try to fetch content if not authenticated
    }

    const fetchDocumentContent = async () => {
      try {
        const res = await axiosInstance.get(
          `${process.env.REACT_APP_API_URL}/api/google-drive/file-content/${id}/`, 
          { withCredentials: true }
        );
        setTitle(res.data.title);
        setContent(res.data.content);
        setFileUrl(res.data.file_url);
        setError(null);
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 401) {
          setError('Google Drive authentication required.');
        } else {
          setError('Failed to fetch document content.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocumentContent();
  }, [id, driveLoggedIn]);

  // Store the document ID when the component mounts
  useEffect(() => {
    if (!driveLoggedIn) {
      sessionStorage.setItem('pendingDocumentView', id);
    }
  }, [id, driveLoggedIn]);

  if (!isAuthenticated) return <Navigate to="/login" />;
  
  const handleGoBack = () => {
    navigate(-1); // This navigates back one step in history
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="main-content">
        <FaArrowLeft 
          className="back-arrow" 
          onClick={handleGoBack} 
          style={{ cursor: 'pointer', margin: '20px 0 0 20px' }}
          title="Go back to previous page" 
        />
        
        <div className="recent-items-card">
          {!driveLoggedIn ? (
            <GoogleDriveAuthCheck />
          ) : loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading document...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>{title}</h2>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Edit Document
                </a>
              </div>
              <div className="sop-detail-card">
                <div className="document-content" dangerouslySetInnerHTML={{ __html: content }}></div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
  driveLoggedIn: state.googledrive.driveLoggedIn
});

export default connect(mapStateToProps, { googleDriveLogin })(ViewSOP);
