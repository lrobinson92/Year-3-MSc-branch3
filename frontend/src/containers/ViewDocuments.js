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

  // Check authentication status when component mounts
  useEffect(() => {
    const checkDriveAuth = async () => {
      try {
        // Try to access Google Drive - this will fail if not authenticated
        await axiosInstance.get(
          `${process.env.REACT_APP_API_URL}/api/google-drive/files/`,
          { withCredentials: true }
        );
        setDriveLoggedIn(true);
      } catch (err) {
        // If we get a 401, we're not authenticated
        if (err.response && err.response.status === 401) {
          setDriveLoggedIn(false);
        }
      }
    };

    checkDriveAuth();
  }, [setDriveLoggedIn]);

  // Fetch documents once we know authentication status
  useEffect(() => {
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
  }, [setDocuments]);

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

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (loading && !driveLoggedIn) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="d-flex">
        <Sidebar />
        <div className="main-content">
          <div className="recent-items-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>All Documents</h2>
            </div>

            <GoogleDriveAuthCheck>
              {/* This content only shows when user is authenticated with Google Drive */}
              {error && <div className="alert alert-danger">{error}</div>}
              
              <DocumentGrid 
                documents={documents}
                emptyMessage="No documents available"
                showCreateButton={true}
                showTeamName={true}
                cardClass="view"
              />
            </GoogleDriveAuthCheck>
          </div>
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

export default connect(mapStateToProps, { googleDriveLogin, uploadDocument, setDocuments, setDriveLoggedIn })(ViewDocuments);
