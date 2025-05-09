// ViewSOP.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import axiosInstance from '../utils/axiosConfig';
import { FaArrowLeft } from 'react-icons/fa';
import GoogleDriveAuthCheck from '../components/GoogleDriveAuthCheck';

/**
 * ViewSOP Component
 * 
 * Displays a single SOP (Standard Operating Procedure) document.
 * Fetches document content and metadata from Google Drive via backend API.
 * Determines user permissions for editing based on ownership and team roles.
 * Provides edit link for authorized users or read-only view for others.
 */
const ViewSOP = ({ isAuthenticated, driveLoggedIn, user }) => {
  // Extract document ID from URL params
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Document content state
  const [title, setTitle] = useState('');               // Document title
  const [content, setContent] = useState('');           // HTML content of document
  const [fileUrl, setFileUrl] = useState('');           // Google Drive URL for editing
  
  // UI state
  const [loading, setLoading] = useState(true);         // Loading indicator
  const [error, setError] = useState('');               // Error message
  
  // Document metadata and permissions
  const [documentDetails, setDocumentDetails] = useState(null);  // Full document object from API
  const [canEdit, setCanEdit] = useState(false);        // Whether current user can edit document

  /**
   * Fetch document content and check user permissions
   * Determines if user can edit based on ownership and team role
   */
  useEffect(() => {
    if (!user) return;

    const fetchDocument = async () => {
      try {
        // Get document content
        const contentRes = await axiosInstance.get(`/api/google-drive/file-content/${id}/`);
        setTitle(contentRes.data.title || 'Untitled');
        setContent(contentRes.data.content);
        setFileUrl(contentRes.data.file_url);

        // Get document details to check permissions
        const detailsRes = await axiosInstance.get(`/api/documents/${id}/`);
        setDocumentDetails(detailsRes.data);
        
        // Determine if user can edit the document
        const doc = detailsRes.data;
        
        // Case 1: User is the document owner (can always edit)
        if (doc.owner === user.id) {
          setCanEdit(true);
        } 
        // Case 2: Document belongs to a team
        else if (doc.team) {
          // Fetch user's role in the team
          const teamRes = await axiosInstance.get(`/api/teams/${doc.team}/`);
          const membership = teamRes.data.members.find(member => member.user === user.id);
          
          // Can edit if user is owner or member (not admin)
          if (membership && (membership.role === 'owner' || membership.role === 'member')) {
            setCanEdit(true);
          } else {
            setCanEdit(false);
          }
        } else {
          // It's not the user's document and not in their team
          setCanEdit(false);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load file content.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, driveLoggedIn, user]);

  return (
    <GoogleDriveAuthCheck showPrompt={true}>
      <div className="d-flex">
        {/* Sidebar navigation */}
        <Sidebar />
        
        {/* Main content area */}
        <div className="main-content">
          {/* Back button */}
          <FaArrowLeft
            className="back-arrow"
            onClick={() => navigate(-1)}
            style={{ cursor: 'pointer', margin: '20px 0 0 20px' }}
            title="Go back to previous page"
          />

          <div className="recent-items-card">
            {/* Loading state */}
            {loading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading document...</p>
              </div>
            ) : error ? (
              /* Error state */
              <div className="alert alert-danger">{error}</div>
            ) : (
              /* Document content */
              <>
                {/* Document header with title and edit button */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2>{title}</h2>
                  {canEdit ? (
                    /* Edit button for users with permission */
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      Edit Document
                    </a>
                  ) : (
                    /* Read-only badge for users without edit permission */
                    <span className="badge bg-secondary py-2 px-3">Read Only</span>
                  )}
                </div>
                
                {/* Admin info message - only shown for team admins */}
                {documentDetails && documentDetails.team && !canEdit && (
                  <div className="alert alert-info mb-3">
                    <i className="fas fa-info-circle me-2"></i>
                    You have read-only access to this document as an admin of this team.
                  </div>
                )}
                
                {/* Document content display */}
                <div className="sop-detail-card">
                  <div
                    className="document-content"
                    dangerouslySetInnerHTML={{ __html: content }}
                    style={{ lineHeight: '1.6', fontSize: '16px' }}
                  ></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </GoogleDriveAuthCheck>
  );
};

/**
 * Maps Redux state to component props
 * Provides authentication status, Google Drive login status, and user details
 */
const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
  driveLoggedIn: state.googledrive.driveLoggedIn,
  user: state.auth.user
});

/**
 * Connect component to Redux store
 */
export default connect(mapStateToProps)(ViewSOP);
