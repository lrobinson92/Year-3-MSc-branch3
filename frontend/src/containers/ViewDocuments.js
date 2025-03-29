// ViewDocuments.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import DocumentGrid from '../components/DocumentGrid'; // Import the new component
import axiosInstance from '../utils/axiosConfig';
import { googleDriveLogin, uploadDocument, setDocuments, setDriveLoggedIn } from '../actions/googledrive';

const ViewDocuments = ({ isAuthenticated, googleDriveLogin, user, driveLoggedIn, documents, setDocuments, setDriveLoggedIn }) => {
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleLogin = () => {
    googleDriveLogin();
  };

  return (
    <div>
      <div className="d-flex">
        <Sidebar />
        <div className="main-content">
          <div className="recent-items-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>All Documents</h2>
            </div>

            {!driveLoggedIn && (
              <div className="mb-3">
                <button onClick={handleLogin} className="btn btn-primary">
                  Login to Google Drive
                </button>
              </div>
            )}

            {error && <div className="alert alert-danger">{error}</div>}
            
            {/* Use the new DocumentGrid component */}
            <DocumentGrid 
              documents={documents}
              emptyMessage="No documents available"
              showCreateButton={true}
              showTeamName={true}
              cardClass="view"
              // You can add a custom handler if needed, but the default should work
              // onDocumentClick={(doc) => navigate(`/document/${doc.id}`)}
            />
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
