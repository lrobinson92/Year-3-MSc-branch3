import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { redirectToGoogleDriveLogin } from '../utils/driveAuthUtils';

const GoogleDriveAuthCheck = ({ driveLoggedIn, children, showPrompt = false }) => {
  const [hasAttemptedRedirect, setHasAttemptedRedirect] = useState(false);

  // Handle redirect logic
  useEffect(() => {
    console.log('GoogleDriveAuthCheck state:', { 
      driveLoggedIn, 
      showPrompt, 
      hasAttemptedRedirect,
      redirectFlag: sessionStorage.getItem('redirectingToGoogleDrive')
    });

    // Only redirect if not logged in, showing prompt, and haven't attempted yet
    if (!driveLoggedIn && 
        !hasAttemptedRedirect && 
        showPrompt && 
        !sessionStorage.getItem('redirectingToGoogleDrive')) {
      
      console.log('Starting Google Drive auth flow');
      setHasAttemptedRedirect(true);
      
      // Store current path before redirect
      sessionStorage.setItem('googleDriveRedirect', window.location.pathname);
      
      // Set a timeout to prevent redirect loops
      setTimeout(() => {
        redirectToGoogleDriveLogin();
      }, 100);
    }
  }, [driveLoggedIn, showPrompt, hasAttemptedRedirect]);

  // If showing prompt and not logged in, show loading UI
  if (showPrompt && !driveLoggedIn) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Connecting to Google Drive...</p>
        <p className="text-muted small">
          If you are not redirected automatically, 
          <button 
            className="btn btn-link btn-sm p-0 ms-1" 
            onClick={() => {
              console.log('Manual redirect triggered');
              sessionStorage.removeItem('redirectingToGoogleDrive');
              setHasAttemptedRedirect(false);
              redirectToGoogleDriveLogin();
            }}
          >
            click here
          </button>
        </p>
      </div>
    );
  }

  // If logged in or not showing prompt, render children
  return <>{children}</>;
};

const mapStateToProps = (state) => ({
  driveLoggedIn: state.googledrive.driveLoggedIn
});

export default connect(mapStateToProps)(GoogleDriveAuthCheck);
