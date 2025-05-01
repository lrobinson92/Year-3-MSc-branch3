import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { redirectToGoogleDriveLogin } from '../utils/driveAuthUtils';

/**
 * GoogleDriveAuthCheck Component
 * 
 * Handles Google Drive authentication flow by checking login status
 * and redirecting to OAuth when necessary. 
 * 
 * @param {boolean} driveLoggedIn - Whether user is authenticated with Google Drive
 * @param {React.ReactNode} children - Child components to render when authenticated
 * @param {boolean} showPrompt - Whether to show authentication prompt and handle redirects
 */
const GoogleDriveAuthCheck = ({ driveLoggedIn, children, showPrompt = false }) => {
  // Track if a redirect has been attempted to prevent redirect loops
  const [hasAttemptedRedirect, setHasAttemptedRedirect] = useState(false);

  // Handle authentication check and redirect logic
  useEffect(() => {
    // Only redirect if all conditions are met:
    // 1. Not already logged in
    // 2. Component is configured to show prompt
    // 3. Haven't already attempted a redirect in this component lifecycle
    // 4. Not currently in the middle of a redirect (checked via session storage)
    if (!driveLoggedIn && 
        !hasAttemptedRedirect && 
        showPrompt && 
        !sessionStorage.getItem('redirectingToGoogleDrive')) {
      
      // Mark attempted redirect to prevent loops
      setHasAttemptedRedirect(true);
      
      // Store current path to return after authentication
      sessionStorage.setItem('googleDriveRedirect', window.location.pathname);
      
      // Small delay to ensure state updates before redirect
      setTimeout(() => {
        redirectToGoogleDriveLogin();
      }, 100);
    }
  }, [driveLoggedIn, showPrompt, hasAttemptedRedirect]);

  // Show loading UI while authentication is pending
  if (showPrompt && !driveLoggedIn) {
    return (
      <div className="text-center p-5">
        {/* Loading spinner */}
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        
        {/* Status message */}
        <p className="mt-3">Connecting to Google Drive...</p>
        
        {/* Manual redirect option in case automatic redirect fails */}
        <p className="text-muted small">
          If you are not redirected automatically, 
          <button 
            className="btn btn-link btn-sm p-0 ms-1" 
            onClick={() => {
              // Reset redirect flags to force a new redirect attempt
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

  // When authenticated or when prompt isn't shown, render children
  return <>{children}</>;
};

/**
 * Map Redux state to component props
 * 
 * @param {Object} state - Redux state
 * @returns {Object} Props for component
 */
const mapStateToProps = (state) => ({
  driveLoggedIn: state.googledrive.driveLoggedIn
});

export default connect(mapStateToProps)(GoogleDriveAuthCheck);
