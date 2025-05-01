// ViewDocuments.js
import React, { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import DocumentGrid from '../components/DocumentGrid';
import GoogleDriveAuthCheck from '../components/GoogleDriveAuthCheck';
import axiosInstance from '../utils/axiosConfig';
import { setDocuments, setDriveLoggedIn } from '../actions/googledrive';
import { FaTrash } from 'react-icons/fa';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

/**
 * ViewDocuments Component
 * 
 * Displays all documents available to the current user, organized by:
 * - Personal documents (owned by the current user)
 * - Team documents (grouped by team)
 * 
 * Requires Google Drive authentication to view and manage documents.
 * Provides document deletion functionality with permission checks.
 */
const ViewDocuments = ({ isAuthenticated, user, driveLoggedIn, documents, setDocuments }) => {
  // UI state
  const [loading, setLoading] = useState(true);          // Loading indicator
  const [error, setError] = useState(null);              // Error message
  
  // Document organization state
  const [sortedDocuments, setSortedDocuments] = useState({
    personal: [],
    teams: {}                                            // Object with team IDs as keys and document arrays as values
  });
  
  // Document deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  /**
   * Handle pending document view after Google Drive authentication
   * If user was trying to view a document before authenticating, redirect them afterward
   */
  useEffect(() => {
    if (driveLoggedIn) {
      const pendingDocId = sessionStorage.getItem('pendingDocumentView');
      if (pendingDocId) {
        sessionStorage.removeItem('pendingDocumentView');
        window.location.href = `/view/sop/${pendingDocId}`;
      }
    }
  }, [driveLoggedIn]);

  /**
   * Fetch all documents once authenticated with Google Drive
   * Updates the documents state in Redux store
   */
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
        console.error('Error fetching documents:', err);
        setError('Failed to fetch documents.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [driveLoggedIn, setDocuments]);

  /**
   * Sort and organize documents by personal and team ownership
   * Documents are sorted by last updated date (newest first)
   */
  useEffect(() => {
    if (!documents) return;

    const personal = [];
    const teams = {};

    // Categorize documents
    documents.forEach(doc => {
      if (doc.team) {
        // Team document
        if (!teams[doc.team]) {
          teams[doc.team] = {
            name: doc.team_name,
            documents: []
          };
        }
        teams[doc.team].documents.push(doc);
      } else {
        // Personal document
        personal.push(doc);
      }
    });

    // Sort personal documents by newest first
    personal.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
    
    // Sort team documents by newest first
    Object.keys(teams).forEach(teamId => {
      teams[teamId].documents.sort((a, b) => 
        new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
      );
    });

    setSortedDocuments({ personal, teams });
  }, [documents]);

  /**
   * Check if current user has permission to delete a document
   * Returns true if user is document owner or team owner
   * 
   * @param {object} document - The document to check permissions for
   * @returns {boolean} Whether the user can delete the document
   */
  const canDeleteDocument = (document) => {
    if (!user) return false;
    
    // User is document owner
    if (document.owner === user.id) return true;
    
    // User is team owner
    if (document.team && user.teams) {
      const userTeam = user.teams.find(team => team.id === document.team);
      if (userTeam && userTeam.role === 'owner') return true;
    }
    
    return false;
  };

  /**
   * Handle delete button click
   * Sets up the document deletion modal
   * 
   * @param {object} document - The document to be deleted
   */
  const handleDeleteClick = (document) => {
    setDocumentToDelete(document);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  /**
   * Handle document deletion confirmation
   * Sends delete request to API and updates UI on success
   */
  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await axiosInstance.delete(
        `${process.env.REACT_APP_API_URL}/api/documents/${documentToDelete.id}/delete/`,
        { withCredentials: true }
      );
      
      // Update documents after deletion
      setDocuments(documents.filter(doc => doc.id !== documentToDelete.id));
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting document:', err);
      setDeleteError('Failed to delete document. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Document action handlers passed to DocumentGrid component
  const documentActions = {
    onDelete: handleDeleteClick,
    canDelete: canDeleteDocument
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="d-flex">
      {/* Sidebar navigation */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="main-content">
        <div className="recent-items-card">
          {/* Header with create button */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 data-testid="documents-heading">All Documents</h2>
            {driveLoggedIn && (
              <Link 
                to="/create-document" 
                className="btn btn-primary d-flex align-items-center"
                data-testid="create-document-button"
              >
                <span className="me-1">+</span> Create Document
              </Link>
            )}
          </div>

          {/* Google Drive authentication check wrapper */}
          <GoogleDriveAuthCheck showPrompt={!driveLoggedIn}>
            {loading ? (
              /* Loading indicator */
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading documents...</p>
              </div>
            ) : error ? (
              /* Error message */
              <div className="alert alert-danger">{error}</div>
            ) : (
              <>
                {/* Personal Documents Section */}
                <div className="mb-5">
                  <h3 className="mb-3" data-testid="personal-documents-heading">Personal Documents</h3>
                  <DocumentGrid
                    documents={sortedDocuments.personal}
                    emptyMessage="No personal documents available"
                    showCreateButton={false}
                    showTeamName={false}
                    cardClass="view"
                    actions={documentActions}
                  />
                </div>
                
                {/* Team Documents Sections - One section per team */}
                {Object.keys(sortedDocuments.teams).length > 0 ? (
                  Object.keys(sortedDocuments.teams).map(teamId => (
                    <div className="mb-5" key={teamId}>
                      <h3 className="mb-3">{sortedDocuments.teams[teamId].name} Documents</h3>
                      <DocumentGrid
                        documents={sortedDocuments.teams[teamId].documents}
                        emptyMessage={`No documents available for ${sortedDocuments.teams[teamId].name}`}
                        showCreateButton={false}
                        showTeamName={false}
                        teamId={teamId}
                        cardClass="view"
                        actions={documentActions}
                      />
                    </div>
                  ))
                ) : (
                  /* Shown when user has no team documents */
                  <div className="mb-5">
                    <h3 className="mb-3">Team Documents</h3>
                    <p className="text-muted">You don't have any team documents yet.</p>
                  </div>
                )}
              </>
            )}
          </GoogleDriveAuthCheck>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete <strong>{documentToDelete?.title}</strong>?</p>
          <p className="text-danger">This action cannot be undone.</p>
          {deleteError && <div className="alert alert-danger mt-3">{deleteError}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Deleting...
              </>
            ) : (
              'Delete Document'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

/**
 * Maps Redux state to component props
 * Provides authentication status, user details, and document data
 */
const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
  user: state.auth.user,
  driveLoggedIn: state.googledrive.driveLoggedIn,
  documents: state.googledrive.documents,
});

/**
 * Connect component to Redux store
 */
export default connect(mapStateToProps, {
  setDocuments,
  setDriveLoggedIn,
})(ViewDocuments);
