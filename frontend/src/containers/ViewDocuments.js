// ViewDocuments.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import DocumentGrid from '../components/DocumentGrid';
import GoogleDriveAuthCheck from '../components/GoogleDriveAuthCheck';
import axiosInstance from '../utils/axiosConfig';
import { googleDriveLogin, uploadDocument, setDocuments, setDriveLoggedIn } from '../actions/googledrive';

const ViewDocuments = ({ isAuthenticated, googleDriveLogin, user, driveLoggedIn, documents, setDocuments, setDriveLoggedIn }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if we should redirect to view a document after authentication
  useEffect(() => {
    if (driveLoggedIn) {
      const pendingDocId = sessionStorage.getItem('pendingDocumentView');
      if (pendingDocId) {
        sessionStorage.removeItem('pendingDocumentView');
        window.location.href = `/view/sop/${pendingDocId}`;
      }
    }
  }, [driveLoggedIn]);

  // Fetch documents once authenticated with Drive
  useEffect(() => {
    if (!driveLoggedIn) return;

    const fetchDocuments = async () => {
      try {
        const res = await axiosInstance.get(
          `${process.env.REACT_APP_API_URL}/api/documents/`,
          { withCredentials: true }
        );
        setDocuments(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch documents.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [driveLoggedIn, setDocuments]);



  return (
    <div className="d-flex">
      <Sidebar />
      <div className="main-content">
        <div className="recent-items-card">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>All Documents</h2>
          </div>

          <GoogleDriveAuthCheck showPrompt={true}>
            {loading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading documents...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : (
              <DocumentGrid
                documents={documents}
                emptyMessage="No documents available"
                showCreateButton={true}
                showTeamName={true}
                cardClass="view"
              />
            )}
          </GoogleDriveAuthCheck>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
  user: state.auth.user,
  driveLoggedIn: state.googledrive.driveLoggedIn,
  documents: state.googledrive.documents,
});

export default connect(mapStateToProps, {
  googleDriveLogin,
  uploadDocument,
  setDocuments,
  setDriveLoggedIn,
})(ViewDocuments);
