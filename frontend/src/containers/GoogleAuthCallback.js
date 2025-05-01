import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { setDriveLoggedIn } from '../actions/googledrive';

/**
 * GoogleAuthCallback Component
 * 
 * Handles the callback from Google Drive OAuth authentication.
 * This component acts as a middleware between the Google OAuth flow
 * and the application by processing the authentication response
 * and updating the application state.
 */
const GoogleAuthCallback = ({ setDriveLoggedIn }) => {
  // State to track loading status while processing authentication
  const [loading, setLoading] = useState(true);
  
  // State to store potential error messages
  const [error, setError] = useState(null);
  
  // Hook for programmatically navigating to other routes
  const navigate = useNavigate();

  /**
   * Process Google Drive authentication callback when component mounts
   * Parses URL parameters to determine auth success, updates Redux state,
   * and redirects to the original destination
   */
  useEffect(() => {
    // Extract the drive_auth parameter from the URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const driveAuth = urlParams.get('drive_auth');
    
    if (driveAuth === 'success') {
      // Authentication was successful
      
      // Update Redux state to reflect that user is logged into Google Drive
      setDriveLoggedIn(true);
      
      // Clean up session storage items used during the auth flow
      sessionStorage.removeItem('redirectingToGoogleDrive');
      
      // Get the original destination the user was trying to access
      // Default to documents page if no specific destination was saved
      const destination = sessionStorage.getItem('googleDriveRedirect') || '/view/documents';
      sessionStorage.removeItem('googleDriveRedirect');
      
      // Add a small delay before navigation to ensure Redux state updates are processed
      setTimeout(() => {
        navigate(destination);
      }, 100);
    } else {
      // Authentication failed or was cancelled by the user
      setError('Authentication failed or was cancelled');
      setLoading(false);
    }
  }, [navigate, setDriveLoggedIn]);

  /**
   * Loading screen while authentication is being processed
   */
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

  /**
   * Error screen if authentication failed
   */
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

  // This component shouldn't render anything if processing was successful
  // since it will immediately redirect to another page
  return null;
};

/**
 * Connect component to Redux store
 * Provides access to the setDriveLoggedIn action
 */
export default connect(null, { setDriveLoggedIn })(GoogleAuthCallback);