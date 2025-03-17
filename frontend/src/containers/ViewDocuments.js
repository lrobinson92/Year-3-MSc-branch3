// ViewDocuments.js
import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import axiosInstance from '../utils/axiosConfig';
import { googleDriveLogin, uploadDocument, setDocuments, setDriveLoggedIn } from '../actions/googledrive'; 

const ViewDocuments = ({ isAuthenticated, googleDriveLogin, user, driveLoggedIn, documents, setDocuments, setDriveLoggedIn }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await axiosInstance.get(
          `${process.env.REACT_APP_API_URL}/api/google-drive/files/`,
          { withCredentials: true }
        );
        setDocuments(res.data.files);
        // If fetching files succeeds, set driveLoggedIn to true.
        setDriveLoggedIn(true);
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 401) {
          setDriveLoggedIn(false);
        }
        setError('Failed to fetch documents from Google Drive.');
      } finally {
        setLoading(false);
      }
    };
  
    /// Only fetch if we know the user is logged into Google Drive.
    if (driveLoggedIn) {
      fetchDocuments();
    } else {
      // No drive login yet; simply stop loading.
      setLoading(false);
    }
  }, [driveLoggedIn, setDocuments, setDriveLoggedIn]);

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
              <Link to="/create-document" className="btn btn-primary create-new-link">
                + Create New Document
              </Link>
            </div>

            {!driveLoggedIn && (
              <div className="mb-3">
                <button onClick={handleLogin} className="btn btn-primary">
                  Login to Google Drive
                </button>
              </div>
            )}

            {error && <div className="alert alert-danger">{error}</div>}

            {driveLoggedIn && (
              <div className="row">
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <div className="col-md-4 mb-3" key={doc.id}>
                      <div className="card p-3 view">
                        <h4>{doc.title}</h4>
                        {doc.createdTime && <p>Created: {new Date(doc.createdTime).toLocaleDateString()}</p>}
                        {doc.ownerName && <p>Owner: {doc.ownerName}</p>}
                        <a href={doc.webViewLink} target="_blank" rel="noopener noreferrer">
                          View Document
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No documents available.</p>
                )}
              </div>
            )}
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
