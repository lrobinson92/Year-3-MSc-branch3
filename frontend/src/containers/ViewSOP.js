// ViewSOP.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import axiosInstance from '../utils/axiosConfig';
import { FaArrowLeft } from 'react-icons/fa';
import { redirectToGoogleDriveLogin } from '../utils/driveAuthUtils';

const ViewSOP = ({ isAuthenticated, driveLoggedIn }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleDriveLogin = () => {
    redirectToGoogleDriveLogin(window.location.pathname);
  };

  useEffect(() => {
    if (!driveLoggedIn) return;

    const fetchDocument = async () => {
      try {
        const res = await axiosInstance.get(`/api/google-drive/file-content/${id}/`);
        setTitle(res.data.title || 'Untitled');
        setContent(res.data.content);
        setFileUrl(res.data.file_url);
      } catch (err) {
        console.error(err);
        setError('Failed to load file content.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, driveLoggedIn]);

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="main-content">
        <FaArrowLeft
          className="back-arrow"
          onClick={() => navigate(-1)}
          style={{ cursor: 'pointer', margin: '20px 0 0 20px' }}
          title="Go back to previous page"
        />

        <div className="recent-items-card">
          {!driveLoggedIn ? (
            <div className="text-center p-5">
              <h3>Google Drive Authentication Required</h3>
              <p>You need to authenticate with Google Drive to view this document.</p>
              <button
                className="btn btn-primary mt-3"
                onClick={handleDriveLogin}
              >
                Connect to Google Drive
              </button>
            </div>
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
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Edit Document
                </a>
              </div>
              <div className="sop-detail-card">
                <div
                  className="document-content"
                  dangerouslySetInnerHTML={{ __html: content }}
                  style={{ lineHeight: '1.6', fontSize: '16px' }}
                ></div>
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
  driveLoggedIn: state.googledrive.driveLoggedIn,
});

export default connect(mapStateToProps)(ViewSOP);
