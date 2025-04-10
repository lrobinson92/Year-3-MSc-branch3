import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { setDriveLoggedIn } from '../actions/googledrive';

const GoogleAuthCallback = ({ setDriveLoggedIn }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('GoogleAuthCallback mounted - processing Google Drive authentication');
    
    // Check if we have drive_auth=success in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const driveAuth = urlParams.get('drive_auth');
    
    if (driveAuth === 'success') {
      console.log('Google Drive auth successful, updating Redux state');
      
      // Update Redux state
      setDriveLoggedIn(true);
      
      // Clear any remaining flags from sessionStorage
      sessionStorage.removeItem('redirectingToGoogleDrive');
      sessionStorage.removeItem('googleDriveRedirect');
      
      // Get the original destination or default to documents page
      const destination = sessionStorage.getItem('googleDriveRedirect') || '/view/documents';
      
      console.log(`Redirecting to original destination: ${destination}`);
      
      // Short delay to ensure state updates are processed
      setTimeout(() => {
        navigate(destination);
      }, 100);
    } else {
      console.error('No drive_auth=success parameter found in URL');
      setError('Authentication failed or was cancelled');
      setLoading(false);
    }
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
        <div className="alert alert-danger">
          {error}
          <div className="mt-3">
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/view/documents')}
            >
              Return to Documents
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default connect(null, { setDriveLoggedIn })(GoogleAuthCallback);