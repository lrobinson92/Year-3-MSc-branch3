import React from 'react';
import { connect } from 'react-redux';
import { googleDriveLogin } from '../actions/googledrive';

const GoogleDriveAuthCheck = ({ driveLoggedIn, googleDriveLogin, children, showPrompt = true }) => {
  if (!driveLoggedIn && showPrompt) {
    return (
      <div className="google-auth-prompt card p-4 mb-4">
        <h4>Google Drive Authentication Required</h4>
        <p>
          To view, create or edit documents, you need to connect your Google Drive account.
          This allows SOPify to securely store and manage your documents.
        </p>
        <button onClick={googleDriveLogin} className="btn btn-primary">
          Connect Google Drive
        </button>
      </div>
    );
  }
  
  return <>{children}</>;
};

const mapStateToProps = (state) => ({
  driveLoggedIn: state.googledrive.driveLoggedIn
});

export default connect(mapStateToProps, { googleDriveLogin })(GoogleDriveAuthCheck);