// GoogleDriveAuthCheck.js
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { redirectToGoogleDriveLogin } from '../utils/driveAuthUtils';

const GoogleDriveAuthCheck = ({ driveLoggedIn, children, showPrompt = false }) => {
  useEffect(() => {
    const alreadyRedirecting = sessionStorage.getItem('redirectingToGoogleDrive');
    if (showPrompt && !driveLoggedIn && !alreadyRedirecting) {
      sessionStorage.setItem('redirectingToGoogleDrive', 'true');
        redirectToGoogleDriveLogin();
      }
  }, [driveLoggedIn, showPrompt]);

  if (!driveLoggedIn && showPrompt) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Redirecting to Google Drive login...</p>
      </div>
    );
  }

  return <>{children}</>;
};

const mapStateToProps = (state) => ({
  driveLoggedIn: state.googledrive.driveLoggedIn,
});

export default connect(mapStateToProps)(GoogleDriveAuthCheck);
