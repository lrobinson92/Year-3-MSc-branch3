// ViewSOP.js
import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import '../globalStyles.css';
import { FaArrowLeft } from 'react-icons/fa';

const ViewSOP = ({ isAuthenticated }) => {
  const { id } = useParams(); // Document ID
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState(''); // Define the fileUrl state variable
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocumentContent = async () => {
      try {
        const res = await axiosInstance.get(
          `${process.env.REACT_APP_API_URL}/api/google-drive/file-content/${id}/`, 
          { withCredentials: true }
        );
        //setTitle(res.data.title); // Set the document title
        setContent(res.data.content); // Set the document content
        setFileUrl(res.data.file_url); // Set the Google Doc URL
      } catch (err) {
        console.error(err);
        setError('Failed to fetch document content.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocumentContent();
  }, [id]);

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const handleGoBack = () => {
    navigate(-1); // This navigates back one step in history
  };

  return (
    <div className="d-flex">
      <FaArrowLeft 
        className="back-arrow" 
        onClick={handleGoBack} 
        style={{ cursor: 'pointer' }}
        title="Go back to previous page" 
      />
      <div className="container mt-5 entry-container">
        <div className="recent-items-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary create-new-link">
              Edit Document
            </a>
          </div>
          <div className="sop-detail-card">
          <div className="document-content" dangerouslySetInnerHTML={{ __html: content }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStateToProps)(ViewSOP);
