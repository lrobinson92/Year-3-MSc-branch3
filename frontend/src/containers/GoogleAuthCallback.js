import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { setDriveLoggedIn } from '../actions/googledrive';
import axiosInstance from '../utils/axiosConfig';

const GoogleAuthCallback = ({ setDriveLoggedIn }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          setError('No authorization code received');
          setLoading(false);
          return;
        }

        // Send code to backend
        await axiosInstance.post(
          `${process.env.REACT_APP_API_URL}/api/google-drive/auth-callback/`,
          { code },
          { withCredentials: true }
        );

        // Update Redux state
        setDriveLoggedIn(true);

        // Get stored return URL
        let returnUrl = sessionStorage.getItem('googleDriveRedirect');
        sessionStorage.removeItem('googleDriveRedirect');
       

        // Get pending document view if any
        const pendingDocId = sessionStorage.getItem('pendingDocumentView');
        if (pendingDocId) {
          returnUrl = `/view/sop/${pendingDocId}`;
          sessionStorage.removeItem('pendingDocumentView');
        }
        sessionStorage.removeItem('redirectingToGoogleDrive');

        // Navigate back to original page or default to documents
        navigate(returnUrl || '/view/documents');
      } catch (err) {
        console.error('Error completing Google Drive auth:', err);
        setError('Failed to complete Google Drive authentication');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate, setDriveLoggedIn]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Completing Google Drive authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return null;
};

export default connect(null, { setDriveLoggedIn })(GoogleAuthCallback);